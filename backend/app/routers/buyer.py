import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..deps import require_active_role
from ..models import (
    ROLE_BUYER,
    STATUS_DIKEMAS,
    STATUS_DIKEMBALIKAN,
    STATUS_SELESAI,
    TX_PAYMENT,
    TX_TOPUP,
    Address,
    AuthSession,
    CartItem,
    Order,
    OrderItem,
    Product,
    Wallet,
    WalletTransaction,
)
from ..schemas.auth import MessageResponse
from ..schemas.buyer import (
    AddressOut,
    AddressPayload,
    AppliedDiscountOut,
    CartItemAdd,
    CartItemOut,
    CartItemUpdate,
    CartOut,
    CheckoutPreviewOut,
    CheckoutPreviewRequest,
    CheckoutRequest,
    DeliveryMethodOut,
    TopupRequest,
    WalletOut,
    WalletTransactionOut,
)
from ..schemas.catalog import StoreSummary
from ..schemas.order import OrderDetailOut, OrderSummaryOut
from ..schemas.report import BuyerReport
from ..services.discounts import consume_voucher_usage, validate_discount
from ..services.orders import (
    DELIVERY_METHODS,
    TAX_RATE_PERCENT,
    add_status_history,
    calc_tax,
    calc_total,
    order_to_detail,
    order_to_summary,
)

router = APIRouter(prefix="/buyer", tags=["Buyer"])

buyer_session = require_active_role(ROLE_BUYER)


# ---------- Helper ----------

def get_or_create_wallet(db: Session, user_id: str) -> Wallet:
    wallet = db.get(Wallet, user_id)
    if wallet is None:
        wallet = Wallet(user_id=user_id, balance=0)
        db.add(wallet)
        db.flush()
    return wallet


def get_cart_items(db: Session, user_id: str) -> list[CartItem]:
    return db.scalars(
        select(CartItem)
        .options(joinedload(CartItem.product).joinedload(Product.store))
        .where(CartItem.user_id == user_id)
        .order_by(CartItem.created_at)
    ).all()


def cart_item_out(item: CartItem) -> CartItemOut:
    return CartItemOut(
        id=item.id,
        product_id=item.product_id,
        product_name=item.product.name,
        price=item.product.price,
        stock=item.product.stock,
        quantity=item.quantity,
        line_total=item.product.price * item.quantity,
    )


def require_delivery_method(code: str) -> dict:
    method = DELIVERY_METHODS.get(code)
    if method is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Metode pengiriman tidak dikenal: {code}. "
            f"Pilihan: {', '.join(DELIVERY_METHODS)}.",
        )
    return method


def new_order_code() -> str:
    return f"SEA-{uuid.uuid4().hex[:8].upper()}"


# ---------- Wallet ----------

@router.get("/wallet", response_model=WalletOut)
def my_wallet(
    session: AuthSession = Depends(buyer_session),
    db: Session = Depends(get_db),
):
    """Saldo dan riwayat transaksi wallet Buyer."""
    wallet = get_or_create_wallet(db, session.user_id)
    db.commit()
    transactions = db.scalars(
        select(WalletTransaction)
        .where(WalletTransaction.user_id == session.user_id)
        .order_by(WalletTransaction.created_at.desc())
    ).all()
    return WalletOut(
        balance=wallet.balance,
        transactions=[
            WalletTransactionOut(
                id=t.id, amount=t.amount, type=t.type,
                description=t.description, created_at=t.created_at,
            )
            for t in transactions
        ],
    )


@router.post("/wallet/topup", response_model=WalletOut)
def topup(
    payload: TopupRequest,
    session: AuthSession = Depends(buyer_session),
    db: Session = Depends(get_db),
):
    """Top-up saldo (simulasi/dummy — tanpa payment gateway sungguhan)."""
    wallet = get_or_create_wallet(db, session.user_id)
    wallet.balance += payload.amount
    db.add(wallet)
    db.add(WalletTransaction(
        user_id=session.user_id,
        amount=payload.amount,
        type=TX_TOPUP,
        description="Top-up saldo (simulasi)",
    ))
    db.commit()
    return my_wallet(session=session, db=db)


# ---------- Alamat ----------

@router.get("/addresses", response_model=list[AddressOut])
def list_addresses(
    session: AuthSession = Depends(buyer_session),
    db: Session = Depends(get_db),
):
    addresses = db.scalars(
        select(Address)
        .where(Address.user_id == session.user_id)
        .order_by(Address.is_default.desc(), Address.created_at)
    ).all()
    return [AddressOut.model_validate(a, from_attributes=True) for a in addresses]


def _unset_other_defaults(db: Session, user_id: str, keep_id: str | None = None):
    query = update(Address).where(Address.user_id == user_id, Address.is_default)
    if keep_id:
        query = query.where(Address.id != keep_id)
    db.execute(query.values(is_default=False))


@router.post("/addresses", response_model=AddressOut, status_code=status.HTTP_201_CREATED)
def create_address(
    payload: AddressPayload,
    session: AuthSession = Depends(buyer_session),
    db: Session = Depends(get_db),
):
    if payload.is_default:
        _unset_other_defaults(db, session.user_id)
    address = Address(user_id=session.user_id, **payload.model_dump())
    db.add(address)
    db.commit()
    db.refresh(address)
    return AddressOut.model_validate(address, from_attributes=True)


def require_own_address(address_id: str, session: AuthSession, db: Session) -> Address:
    address = db.get(Address, address_id)
    if address is None or address.user_id != session.user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Alamat tidak ditemukan.")
    return address


@router.put("/addresses/{address_id}", response_model=AddressOut)
def update_address(
    address_id: str,
    payload: AddressPayload,
    session: AuthSession = Depends(buyer_session),
    db: Session = Depends(get_db),
):
    address = require_own_address(address_id, session, db)
    if payload.is_default:
        _unset_other_defaults(db, session.user_id, keep_id=address.id)
    for field, value in payload.model_dump().items():
        setattr(address, field, value)
    db.add(address)
    db.commit()
    db.refresh(address)
    return AddressOut.model_validate(address, from_attributes=True)


@router.delete("/addresses/{address_id}", response_model=MessageResponse)
def delete_address(
    address_id: str,
    session: AuthSession = Depends(buyer_session),
    db: Session = Depends(get_db),
):
    address = require_own_address(address_id, session, db)
    db.delete(address)
    db.commit()
    return MessageResponse(message="Alamat telah dihapus.")


# ---------- Keranjang ----------

def build_cart(db: Session, user_id: str) -> CartOut:
    items = get_cart_items(db, user_id)
    store = items[0].product.store if items else None
    return CartOut(
        store=StoreSummary(
            id=store.id, name=store.name, description=store.description
        ) if store else None,
        items=[cart_item_out(i) for i in items],
        total_items=sum(i.quantity for i in items),
        subtotal=sum(i.product.price * i.quantity for i in items),
    )


@router.get("/cart", response_model=CartOut)
def my_cart(
    session: AuthSession = Depends(buyer_session),
    db: Session = Depends(get_db),
):
    """Isi keranjang. Sesuai aturan single-store checkout, semua item selalu
    berasal dari satu toko."""
    return build_cart(db, session.user_id)


@router.post("/cart/items", response_model=CartOut, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    payload: CartItemAdd,
    session: AuthSession = Depends(buyer_session),
    db: Session = Depends(get_db),
):
    """Menambah produk ke keranjang.

    Aturan single-store checkout: jika keranjang sudah berisi produk dari toko
    lain, permintaan ditolak dengan 409 dan Buyer diminta mengosongkan
    keranjang terlebih dahulu.
    """
    product = db.get(Product, payload.product_id)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produk tidak ditemukan.")

    existing_items = get_cart_items(db, session.user_id)
    if existing_items and existing_items[0].product.store_id != product.store_id:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Keranjang Anda berisi produk dari toko "
            f"'{existing_items[0].product.store.name}'. Satu keranjang hanya "
            f"boleh berisi produk dari satu toko — kosongkan keranjang untuk "
            f"berbelanja di '{product.store.name}'.",
        )

    existing = next(
        (i for i in existing_items if i.product_id == product.id), None
    )
    new_quantity = payload.quantity + (existing.quantity if existing else 0)
    if new_quantity > product.stock:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Stok '{product.name}' tersisa {product.stock}, tidak cukup untuk "
            f"kuantitas {new_quantity}.",
        )

    if existing:
        existing.quantity = new_quantity
        db.add(existing)
    else:
        db.add(CartItem(
            user_id=session.user_id,
            product_id=product.id,
            quantity=payload.quantity,
        ))
    db.commit()
    return build_cart(db, session.user_id)


def require_own_cart_item(item_id: str, session: AuthSession, db: Session) -> CartItem:
    item = db.get(CartItem, item_id)
    if item is None or item.user_id != session.user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item keranjang tidak ditemukan.")
    return item


@router.put("/cart/items/{item_id}", response_model=CartOut)
def update_cart_item(
    item_id: str,
    payload: CartItemUpdate,
    session: AuthSession = Depends(buyer_session),
    db: Session = Depends(get_db),
):
    item = require_own_cart_item(item_id, session, db)
    if payload.quantity > item.product.stock:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Stok '{item.product.name}' tersisa {item.product.stock}.",
        )
    item.quantity = payload.quantity
    db.add(item)
    db.commit()
    return build_cart(db, session.user_id)


@router.delete("/cart/items/{item_id}", response_model=CartOut)
def remove_cart_item(
    item_id: str,
    session: AuthSession = Depends(buyer_session),
    db: Session = Depends(get_db),
):
    item = require_own_cart_item(item_id, session, db)
    db.delete(item)
    db.commit()
    return build_cart(db, session.user_id)


@router.delete("/cart", response_model=CartOut)
def clear_cart(
    session: AuthSession = Depends(buyer_session),
    db: Session = Depends(get_db),
):
    """Mengosongkan keranjang — dipakai saat Buyer ingin pindah toko."""
    for item in get_cart_items(db, session.user_id):
        db.delete(item)
    db.commit()
    return build_cart(db, session.user_id)


# ---------- Checkout ----------

@router.get("/delivery-methods", response_model=list[DeliveryMethodOut])
def delivery_methods(_: AuthSession = Depends(buyer_session)):
    return [
        DeliveryMethodOut(code=code, label=m["label"], fee=m["fee"], description=m["description"])
        for code, m in DELIVERY_METHODS.items()
    ]


@router.post("/checkout/preview", response_model=CheckoutPreviewOut)
def checkout_preview(
    payload: CheckoutPreviewRequest,
    session: AuthSession = Depends(buyer_session),
    db: Session = Depends(get_db),
):
    """Ringkasan checkout (subtotal, diskon, ongkir, PPN 12%, total) untuk
    ditampilkan sebelum konfirmasi. Kode diskon opsional divalidasi di sini.
    Tidak mengubah data apa pun."""
    items = get_cart_items(db, session.user_id)
    if not items:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Keranjang masih kosong.")
    method = require_delivery_method(payload.delivery_method)

    subtotal = sum(i.product.price * i.quantity for i in items)

    applied = None
    discount = 0
    if payload.discount_code:
        result = validate_discount(db, payload.discount_code, subtotal)
        discount = result.amount
        applied = AppliedDiscountOut(
            code=result.code, type=result.type, percent=result.percent,
            amount=result.amount, description=result.description,
        )

    tax = calc_tax(subtotal, discount)
    total = calc_total(subtotal, discount, method["fee"], tax)
    wallet = get_or_create_wallet(db, session.user_id)
    db.commit()

    store = items[0].product.store
    return CheckoutPreviewOut(
        store=StoreSummary(id=store.id, name=store.name, description=store.description),
        items=[cart_item_out(i) for i in items],
        subtotal=subtotal,
        discount=discount,
        applied_discount=applied,
        delivery_method=payload.delivery_method,
        delivery_fee=method["fee"],
        tax_rate_percent=TAX_RATE_PERCENT,
        tax=tax,
        total=total,
        wallet_balance=wallet.balance,
        sufficient_balance=wallet.balance >= total,
    )


@router.post("/checkout", response_model=OrderDetailOut, status_code=status.HTTP_201_CREATED)
def checkout(
    payload: CheckoutRequest,
    session: AuthSession = Depends(buyer_session),
    db: Session = Depends(get_db),
):
    """Membuat pesanan dari keranjang dalam satu transaksi database:
    validasi stok, potong saldo wallet, kurangi stok (tanpa bisa negatif),
    buat pesanan berstatus 'Sedang Dikemas', lalu kosongkan keranjang."""
    items = get_cart_items(db, session.user_id)
    if not items:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Keranjang masih kosong.")
    method = require_delivery_method(payload.delivery_method)
    address = require_own_address(payload.address_id, session, db)

    subtotal = sum(i.product.price * i.quantity for i in items)

    # Validasi & terapkan kode diskon (opsional). Satu kode per checkout.
    discount = 0
    discount_code = None
    discount_type = None
    if payload.discount_code:
        result = validate_discount(db, payload.discount_code, subtotal)
        discount = result.amount
        discount_code = result.code
        discount_type = result.type

    tax = calc_tax(subtotal, discount)
    total = calc_total(subtotal, discount, method["fee"], tax)

    wallet = get_or_create_wallet(db, session.user_id)
    if wallet.balance < total:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Saldo wallet tidak cukup. Total belanja Rp{total:,} sedangkan "
            f"saldo Anda Rp{wallet.balance:,}. Silakan top-up terlebih dahulu.".replace(",", "."),
        )

    # Kurangi stok secara atomik: UPDATE bersyarat mencegah stok negatif
    # meskipun ada checkout bersamaan.
    for item in items:
        result = db.execute(
            update(Product)
            .where(Product.id == item.product_id, Product.stock >= item.quantity)
            .values(stock=Product.stock - item.quantity)
        )
        if result.rowcount == 0:
            db.rollback()
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Stok '{item.product.name}' tidak mencukupi. "
                "Perbarui keranjang Anda lalu coba lagi.",
            )

    wallet.balance -= total
    db.add(wallet)
    db.add(WalletTransaction(
        user_id=session.user_id,
        amount=-total,
        type=TX_PAYMENT,
        description=f"Pembayaran pesanan di {items[0].product.store.name}",
    ))

    order = Order(
        code=new_order_code(),
        buyer_id=session.user_id,
        store_id=items[0].product.store_id,
        recipient_name=address.recipient_name,
        phone=address.phone,
        full_address=address.full_address,
        delivery_method=payload.delivery_method,
        subtotal=subtotal,
        discount=discount,
        discount_code=discount_code,
        discount_type=discount_type,
        delivery_fee=method["fee"],
        tax=tax,
        total=total,
        status=STATUS_DIKEMAS,
    )
    db.add(order)
    db.flush()

    # Kurangi kuota voucher setelah checkout dipastikan berhasil.
    if discount_code:
        consume_voucher_usage(db, discount_code)

    for item in items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=item.product.name,
            price=item.product.price,
            quantity=item.quantity,
            line_total=item.product.price * item.quantity,
        ))
        db.delete(item)

    add_status_history(
        db, order, STATUS_DIKEMAS,
        note="Checkout berhasil, pembayaran diterima dari wallet.",
    )
    db.commit()
    db.refresh(order)
    return order_to_detail(order)


# ---------- Riwayat pesanan ----------

@router.get("/orders", response_model=list[OrderSummaryOut])
def my_orders(
    session: AuthSession = Depends(buyer_session),
    db: Session = Depends(get_db),
):
    orders = db.scalars(
        select(Order)
        .where(Order.buyer_id == session.user_id)
        .order_by(Order.created_at.desc())
    ).all()
    return [order_to_summary(o) for o in orders]


@router.get("/orders/{order_id}", response_model=OrderDetailOut)
def my_order_detail(
    order_id: str,
    session: AuthSession = Depends(buyer_session),
    db: Session = Depends(get_db),
):
    order = db.get(Order, order_id)
    if order is None or order.buyer_id != session.user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pesanan tidak ditemukan.")
    return order_to_detail(order)


# ---------- Laporan pengeluaran ----------

@router.get("/report", response_model=BuyerReport)
def spending_report(
    session: AuthSession = Depends(buyer_session),
    db: Session = Depends(get_db),
):
    """Ringkasan pengeluaran Buyer. Pesanan yang dikembalikan (refund) tidak
    dihitung sebagai pengeluaran."""
    orders = db.scalars(
        select(Order).where(Order.buyer_id == session.user_id)
    ).all()

    completed = [o for o in orders if o.status == STATUS_SELESAI]
    returned = [o for o in orders if o.status == STATUS_DIKEMBALIKAN]
    active = [o for o in orders if o.status not in (STATUS_SELESAI, STATUS_DIKEMBALIKAN)]
    # Pengeluaran = total pesanan yang tidak dikembalikan.
    counted = [o for o in orders if o.status != STATUS_DIKEMBALIKAN]

    return BuyerReport(
        total_orders=len(orders),
        completed_orders=len(completed),
        active_orders=len(active),
        returned_orders=len(returned),
        total_spent=sum(o.total for o in counted),
        total_discount_saved=sum(o.discount for o in counted),
        total_tax_paid=sum(o.tax for o in counted),
    )
