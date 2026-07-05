from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..deps import require_active_role
from ..models import (
    ROLE_ADMIN,
    STATUS_DIKIRIM,
    STATUS_MENUNGGU_PENGIRIM,
    Order,
    Product,
    Promo,
    Store,
    User,
    Voucher,
    Wallet,
)
from ..schemas.discount import (
    PromoCreate,
    PromoOut,
    VoucherCreate,
    VoucherOut,
)
from ..schemas.monitoring import (
    AdminDeliveryRow,
    AdminOrderRow,
    AdminProductRow,
    AdminStoreRow,
    AdminSummary,
    AdminUserRow,
    OverdueRunResult,
    SimClockOut,
)
from ..security import utcnow
from ..services.orders import DELIVERY_METHODS
from ..services.overdue import (
    effective_now,
    get_sim_clock,
    is_overdue,
    list_overdue_orders,
    order_deadline,
    run_overdue_processing,
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_active_role(ROLE_ADMIN))],
)


def voucher_out(v: Voucher) -> VoucherOut:
    return VoucherOut(
        id=v.id, code=v.code, description=v.description, percent=v.percent,
        max_discount=v.max_discount, min_spend=v.min_spend,
        remaining_usage=v.remaining_usage, expires_at=v.expires_at,
        created_at=v.created_at, is_expired=v.expires_at < utcnow(),
    )


def promo_out(p: Promo) -> PromoOut:
    return PromoOut(
        id=p.id, code=p.code, description=p.description, percent=p.percent,
        max_discount=p.max_discount, min_spend=p.min_spend,
        expires_at=p.expires_at, created_at=p.created_at,
        is_expired=p.expires_at < utcnow(),
    )


# ---------- Voucher ----------

@router.get("/vouchers", response_model=list[VoucherOut])
def list_vouchers(db: Session = Depends(get_db)):
    vouchers = db.scalars(select(Voucher).order_by(Voucher.created_at.desc())).all()
    return [voucher_out(v) for v in vouchers]


@router.get("/vouchers/{voucher_id}", response_model=VoucherOut)
def get_voucher(voucher_id: str, db: Session = Depends(get_db)):
    voucher = db.get(Voucher, voucher_id)
    if voucher is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Voucher tidak ditemukan.")
    return voucher_out(voucher)


@router.post("/vouchers", response_model=VoucherOut, status_code=status.HTTP_201_CREATED)
def create_voucher(payload: VoucherCreate, db: Session = Depends(get_db)):
    code = payload.code.strip().upper()
    if db.scalar(select(Voucher).where(func.upper(Voucher.code) == code)):
        raise HTTPException(status.HTTP_409_CONFLICT, f"Kode voucher '{code}' sudah ada.")
    voucher = Voucher(
        code=code, description=payload.description.strip(), percent=payload.percent,
        max_discount=payload.max_discount, min_spend=payload.min_spend,
        remaining_usage=payload.remaining_usage,
        expires_at=payload.expires_at.replace(tzinfo=None),
    )
    db.add(voucher)
    db.commit()
    db.refresh(voucher)
    return voucher_out(voucher)


# ---------- Promo ----------

@router.get("/promos", response_model=list[PromoOut])
def list_promos(db: Session = Depends(get_db)):
    promos = db.scalars(select(Promo).order_by(Promo.created_at.desc())).all()
    return [promo_out(p) for p in promos]


@router.get("/promos/{promo_id}", response_model=PromoOut)
def get_promo(promo_id: str, db: Session = Depends(get_db)):
    promo = db.get(Promo, promo_id)
    if promo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Promo tidak ditemukan.")
    return promo_out(promo)


@router.post("/promos", response_model=PromoOut, status_code=status.HTTP_201_CREATED)
def create_promo(payload: PromoCreate, db: Session = Depends(get_db)):
    code = payload.code.strip().upper()
    if db.scalar(select(Promo).where(func.upper(Promo.code) == code)):
        raise HTTPException(status.HTTP_409_CONFLICT, f"Kode promo '{code}' sudah ada.")
    promo = Promo(
        code=code, description=payload.description.strip(), percent=payload.percent,
        max_discount=payload.max_discount, min_spend=payload.min_spend,
        expires_at=payload.expires_at.replace(tzinfo=None),
    )
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo_out(promo)


# ---------- Monitoring ----------

def driver_username(order: Order) -> str | None:
    return order.driver.username if order.driver else None


def _order_row(order: Order, now) -> AdminOrderRow:
    return AdminOrderRow(
        id=order.id,
        code=order.code,
        buyer_username=order.buyer.username,
        store_name=order.store.name,
        status=order.status,
        total=order.total,
        delivery_method_label=DELIVERY_METHODS[order.delivery_method]["label"],
        driver_username=driver_username(order),
        is_overdue=is_overdue(order, now),
        deadline=order_deadline(order),
        created_at=order.created_at,
    )


@router.get("/summary", response_model=AdminSummary)
def summary(db: Session = Depends(get_db)):
    """Ringkasan angka-angka kunci marketplace untuk dashboard Admin."""
    orders = db.scalars(select(Order)).all()
    now = effective_now(db)
    by_status: dict[str, int] = {}
    for o in orders:
        by_status[o.status] = by_status.get(o.status, 0) + 1
    active_deliveries = sum(
        1 for o in orders if o.status in (STATUS_MENUNGGU_PENGIRIM, STATUS_DIKIRIM)
    )
    overdue_count = sum(1 for o in orders if is_overdue(o, now))
    total_balance = db.scalar(select(func.coalesce(func.sum(Wallet.balance), 0))) or 0
    return AdminSummary(
        total_users=db.scalar(select(func.count(User.id))) or 0,
        total_stores=db.scalar(select(func.count(Store.id))) or 0,
        total_products=db.scalar(select(func.count(Product.id))) or 0,
        total_orders=len(orders),
        orders_by_status=by_status,
        total_vouchers=db.scalar(select(func.count(Voucher.id))) or 0,
        total_promos=db.scalar(select(func.count(Promo.id))) or 0,
        active_deliveries=active_deliveries,
        overdue_orders=overdue_count,
        total_wallet_balance=total_balance,
    )


@router.get("/users", response_model=list[AdminUserRow])
def monitor_users(db: Session = Depends(get_db)):
    users = db.scalars(select(User).order_by(User.created_at)).all()
    return [
        AdminUserRow(
            id=u.id, username=u.username, email=u.email,
            roles=u.role_names, created_at=u.created_at,
        )
        for u in users
    ]


@router.get("/stores", response_model=list[AdminStoreRow])
def monitor_stores(db: Session = Depends(get_db)):
    stores = db.scalars(select(Store).order_by(Store.created_at)).all()
    return [
        AdminStoreRow(
            id=s.id, name=s.name, seller_username=s.seller.username,
            product_count=len(s.products), created_at=s.created_at,
        )
        for s in stores
    ]


@router.get("/products", response_model=list[AdminProductRow])
def monitor_products(db: Session = Depends(get_db)):
    products = db.scalars(
        select(Product).options(joinedload(Product.store)).order_by(Product.name)
    ).all()
    return [
        AdminProductRow(
            id=p.id, name=p.name, store_name=p.store.name,
            price=p.price, stock=p.stock,
        )
        for p in products
    ]


@router.get("/orders", response_model=list[AdminOrderRow])
def monitor_orders(
    order_status: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = select(Order).order_by(Order.created_at.desc())
    if order_status:
        query = query.where(Order.status == order_status)
    orders = db.scalars(query).all()
    now = effective_now(db)
    return [_order_row(o, now) for o in orders]


@router.get("/deliveries", response_model=list[AdminDeliveryRow])
def monitor_deliveries(db: Session = Depends(get_db)):
    """Job pengiriman: pesanan yang menunggu pengirim atau sedang dikirim."""
    orders = db.scalars(
        select(Order)
        .where(Order.status.in_([STATUS_MENUNGGU_PENGIRIM, STATUS_DIKIRIM]))
        .order_by(Order.created_at.desc())
    ).all()
    return [
        AdminDeliveryRow(
            order_id=o.id, code=o.code, store_name=o.store.name, status=o.status,
            driver_username=driver_username(o),
            delivery_method_label=DELIVERY_METHODS[o.delivery_method]["label"],
            recipient_name=o.recipient_name, created_at=o.created_at,
        )
        for o in orders
    ]


@router.get("/overdue", response_model=list[AdminOrderRow])
def monitor_overdue(db: Session = Depends(get_db)):
    """Pesanan yang saat ini terlambat (berdasar jam simulasi) namun belum
    diproses menjadi Dikembalikan."""
    now = effective_now(db)
    return [_order_row(o, now) for o in list_overdue_orders(db)]


# ---------- Simulasi waktu & pemrosesan overdue ----------

@router.get("/clock", response_model=SimClockOut)
def get_clock(db: Session = Depends(get_db)):
    clock = get_sim_clock(db)
    db.commit()
    return SimClockOut(
        offset_days=clock.offset_days,
        real_now=utcnow(),
        effective_now=effective_now(db),
    )


@router.post("/clock/advance", response_model=SimClockOut)
def advance_clock(
    days: int = Query(default=1, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """Majukan jam simulasi sejumlah hari (default 1). Memengaruhi evaluasi SLA
    keterlambatan, bukan kadaluarsa token."""
    clock = get_sim_clock(db)
    clock.offset_days += days
    db.add(clock)
    db.commit()
    return SimClockOut(
        offset_days=clock.offset_days, real_now=utcnow(), effective_now=effective_now(db),
    )


@router.post("/clock/reset", response_model=SimClockOut)
def reset_clock(db: Session = Depends(get_db)):
    clock = get_sim_clock(db)
    clock.offset_days = 0
    db.add(clock)
    db.commit()
    return SimClockOut(
        offset_days=0, real_now=utcnow(), effective_now=effective_now(db),
    )


@router.post("/overdue/run", response_model=OverdueRunResult)
def run_overdue(db: Session = Depends(get_db)):
    """Jalankan pemrosesan overdue: refund + return semua pesanan yang melewati
    SLA. Idempoten — pesanan yang sudah Dikembalikan tidak diproses ulang."""
    processed = run_overdue_processing(db)
    now = effective_now(db)
    return OverdueRunResult(
        processed_count=len(processed),
        total_refunded=sum(o.total for o in processed),
        orders=[_order_row(o, now) for o in processed],
    )
