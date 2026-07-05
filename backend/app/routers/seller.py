from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_active_role
from ..models import (
    ROLE_SELLER,
    STATUS_DIKEMAS,
    STATUS_DIKEMBALIKAN,
    STATUS_DIKIRIM,
    STATUS_MENUNGGU_PENGIRIM,
    STATUS_SELESAI,
    AuthSession,
    Order,
    Product,
    Store,
)
from ..schemas.auth import MessageResponse
from ..schemas.order import OrderDetailOut, OrderSummaryOut
from ..schemas.report import SellerReport
from ..schemas.seller import ProductPayload, SellerProduct, StorePayload, StoreResponse
from ..services.orders import add_status_history, order_to_detail, order_to_summary

router = APIRouter(
    prefix="/seller",
    tags=["Seller"],
    dependencies=[Depends(require_active_role(ROLE_SELLER))],
)


def get_own_store(session: AuthSession, db: Session) -> Store | None:
    return db.scalar(select(Store).where(Store.seller_id == session.user_id))


def require_own_store(session: AuthSession, db: Session) -> Store:
    store = get_own_store(session, db)
    if store is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Anda belum memiliki toko. Buat toko terlebih dahulu.",
        )
    return store


def assert_store_name_available(db: Session, name: str, exclude_id: str | None = None):
    """Nama toko harus unik (case-insensitive). Ditegakkan ganda: validasi di
    sini dan unique constraint di kolom database."""
    query = select(Store).where(func.lower(Store.name) == name.lower())
    existing = db.scalar(query)
    if existing is not None and existing.id != exclude_id:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Nama toko '{name}' sudah digunakan. Silakan pilih nama lain.",
        )


def store_response(store: Store) -> StoreResponse:
    return StoreResponse(
        id=store.id,
        name=store.name,
        description=store.description,
        created_at=store.created_at,
        product_count=len(store.products),
    )


def product_response(product: Product) -> SellerProduct:
    return SellerProduct(
        id=product.id,
        name=product.name,
        description=product.description,
        price=product.price,
        stock=product.stock,
        created_at=product.created_at,
    )


def require_own_product(product_id: str, session: AuthSession, db: Session) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produk tidak ditemukan.")
    if product.store.seller_id != session.user_id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Produk ini bukan milik toko Anda dan tidak dapat Anda ubah.",
        )
    return product


# ---------- Toko ----------

@router.get("/store", response_model=StoreResponse | None)
def my_store(
    session: AuthSession = Depends(require_active_role(ROLE_SELLER)),
    db: Session = Depends(get_db),
):
    """Profil toko milik Seller yang sedang login. Null jika belum punya toko."""
    store = get_own_store(session, db)
    return store_response(store) if store else None


@router.post("/store", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
def create_store(
    payload: StorePayload,
    session: AuthSession = Depends(require_active_role(ROLE_SELLER)),
    db: Session = Depends(get_db),
):
    """Membuat toko. Satu Seller hanya boleh memiliki satu toko dan nama toko
    harus unik di seluruh marketplace."""
    if get_own_store(session, db) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Anda sudah memiliki toko.")
    name = payload.name.strip()
    assert_store_name_available(db, name)
    store = Store(
        seller_id=session.user_id,
        name=name,
        description=payload.description.strip(),
    )
    db.add(store)
    db.commit()
    db.refresh(store)
    return store_response(store)


@router.put("/store", response_model=StoreResponse)
def update_store(
    payload: StorePayload,
    session: AuthSession = Depends(require_active_role(ROLE_SELLER)),
    db: Session = Depends(get_db),
):
    """Memperbarui profil toko milik sendiri."""
    store = require_own_store(session, db)
    name = payload.name.strip()
    assert_store_name_available(db, name, exclude_id=store.id)
    store.name = name
    store.description = payload.description.strip()
    db.add(store)
    db.commit()
    db.refresh(store)
    return store_response(store)


# ---------- Produk ----------

@router.get("/products", response_model=list[SellerProduct])
def my_products(
    session: AuthSession = Depends(require_active_role(ROLE_SELLER)),
    db: Session = Depends(get_db),
):
    """Daftar produk milik toko Seller yang sedang login."""
    store = require_own_store(session, db)
    products = db.scalars(
        select(Product)
        .where(Product.store_id == store.id)
        .order_by(Product.created_at.desc())
    ).all()
    return [product_response(p) for p in products]


@router.post("/products", response_model=SellerProduct, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductPayload,
    session: AuthSession = Depends(require_active_role(ROLE_SELLER)),
    db: Session = Depends(get_db),
):
    """Menambahkan produk baru ke toko milik sendiri. Stok disimpan karena
    akan dipakai saat checkout di level berikutnya."""
    store = require_own_store(session, db)
    product = Product(
        store_id=store.id,
        name=payload.name.strip(),
        description=payload.description.strip(),
        price=payload.price,
        stock=payload.stock,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product_response(product)


@router.put("/products/{product_id}", response_model=SellerProduct)
def update_product(
    product_id: str,
    payload: ProductPayload,
    session: AuthSession = Depends(require_active_role(ROLE_SELLER)),
    db: Session = Depends(get_db),
):
    """Memperbarui produk. Hanya produk milik toko sendiri yang bisa diubah."""
    product = require_own_product(product_id, session, db)
    product.name = payload.name.strip()
    product.description = payload.description.strip()
    product.price = payload.price
    product.stock = payload.stock
    db.add(product)
    db.commit()
    db.refresh(product)
    return product_response(product)


@router.delete("/products/{product_id}", response_model=MessageResponse)
def delete_product(
    product_id: str,
    session: AuthSession = Depends(require_active_role(ROLE_SELLER)),
    db: Session = Depends(get_db),
):
    """Menghapus produk milik toko sendiri."""
    product = require_own_product(product_id, session, db)
    db.delete(product)
    db.commit()
    return MessageResponse(message=f"Produk '{product.name}' telah dihapus.")


# ---------- Pesanan masuk ----------

@router.get("/orders", response_model=list[OrderSummaryOut])
def incoming_orders(
    session: AuthSession = Depends(require_active_role(ROLE_SELLER)),
    db: Session = Depends(get_db),
):
    """Daftar pesanan yang masuk ke toko milik Seller yang sedang login."""
    store = require_own_store(session, db)
    orders = db.scalars(
        select(Order)
        .where(Order.store_id == store.id)
        .order_by(Order.created_at.desc())
    ).all()
    return [order_to_summary(o) for o in orders]


@router.get("/orders/{order_id}", response_model=OrderDetailOut)
def incoming_order_detail(
    order_id: str,
    session: AuthSession = Depends(require_active_role(ROLE_SELLER)),
    db: Session = Depends(get_db),
):
    """Detail pesanan. Hanya pesanan milik toko sendiri yang bisa dilihat."""
    store = require_own_store(session, db)
    order = db.get(Order, order_id)
    if order is None or order.store_id != store.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pesanan tidak ditemukan.")
    return order_to_detail(order)


@router.post("/orders/{order_id}/process", response_model=OrderDetailOut)
def process_order(
    order_id: str,
    session: AuthSession = Depends(require_active_role(ROLE_SELLER)),
    db: Session = Depends(get_db),
):
    """Seller memproses pesanan: memindahkan status dari 'Sedang Dikemas' ke
    'Menunggu Pengirim' sehingga job pengiriman tersedia bagi Driver (Level 5).
    Hanya pemilik toko yang boleh memproses pesanannya sendiri."""
    store = require_own_store(session, db)
    order = db.get(Order, order_id)
    if order is None or order.store_id != store.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pesanan tidak ditemukan.")
    if order.status != STATUS_DIKEMAS:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Pesanan hanya bisa diproses saat berstatus '{STATUS_DIKEMAS}'. "
            f"Status saat ini: '{order.status}'.",
        )
    add_status_history(
        db, order, STATUS_MENUNGGU_PENGIRIM,
        note="Pesanan telah diproses penjual dan siap diambil pengirim.",
    )
    db.commit()
    db.refresh(order)
    return order_to_detail(order)


# ---------- Laporan pendapatan ----------

@router.get("/report", response_model=SellerReport)
def income_report(
    session: AuthSession = Depends(require_active_role(ROLE_SELLER)),
    db: Session = Depends(get_db),
):
    """Ringkasan pendapatan Seller. Pendapatan dihitung dari nilai barang
    (subtotal - diskon) pesanan yang sudah selesai; ongkir milik Driver dan
    PPN milik negara, sehingga tidak dihitung sebagai pendapatan Seller.
    Pesanan yang dikembalikan tidak dihitung."""
    store = require_own_store(session, db)
    orders = db.scalars(
        select(Order).where(Order.store_id == store.id)
    ).all()

    total_orders = len(orders)
    completed = [o for o in orders if o.status == STATUS_SELESAI]
    returned = [o for o in orders if o.status == STATUS_DIKEMBALIKAN]
    in_process = [
        o for o in orders
        if o.status in (STATUS_DIKEMAS, STATUS_MENUNGGU_PENGIRIM, STATUS_DIKIRIM)
    ]
    # Pendapatan bersih = nilai barang (subtotal - diskon) dari pesanan selesai.
    net_income = sum(o.subtotal - o.discount for o in completed)
    gross_sales = sum(o.subtotal for o in completed)

    return SellerReport(
        store_name=store.name,
        total_orders=total_orders,
        completed_orders=len(completed),
        in_process_orders=len(in_process),
        returned_orders=len(returned),
        gross_sales=gross_sales,
        total_discount_given=sum(o.discount for o in completed),
        net_income=net_income,
    )
