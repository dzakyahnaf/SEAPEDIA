from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_active_role
from ..models import (
    ROLE_DRIVER,
    STATUS_DIKIRIM,
    STATUS_MENUNGGU_PENGIRIM,
    STATUS_SELESAI,
    AuthSession,
    Order,
    OrderStatusHistory,
)
from ..schemas.driver import (
    DeliveryJobDetailOut,
    DeliveryJobOut,
    DriverEarningsOut,
)
from ..services.orders import (
    DRIVER_EARNING_RATE,
    add_status_history,
    calc_driver_earning,
    order_to_job,
    order_to_job_detail,
)

router = APIRouter(
    prefix="/driver",
    tags=["Driver"],
    dependencies=[Depends(require_active_role(ROLE_DRIVER))],
)

driver_session = require_active_role(ROLE_DRIVER)


@router.get("/jobs", response_model=list[DeliveryJobOut])
def available_jobs(
    _: AuthSession = Depends(driver_session),
    db: Session = Depends(get_db),
):
    """Job pengiriman yang siap diambil: hanya pesanan berstatus
    'Menunggu Pengirim' yang belum diambil Driver lain. Pesanan yang masih
    'Sedang Dikemas' tidak akan muncul di sini."""
    orders = db.scalars(
        select(Order)
        .where(Order.status == STATUS_MENUNGGU_PENGIRIM, Order.driver_id.is_(None))
        .order_by(Order.created_at)
    ).all()
    return [order_to_job(o) for o in orders]


@router.get("/jobs/{order_id}", response_model=DeliveryJobDetailOut)
def job_detail(
    order_id: str,
    session: AuthSession = Depends(driver_session),
    db: Session = Depends(get_db),
):
    """Detail sebuah job. Boleh dilihat jika job masih tersedia (Menunggu
    Pengirim & belum diambil) ATAU merupakan job milik Driver ini."""
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job tidak ditemukan.")
    is_available = (
        order.status == STATUS_MENUNGGU_PENGIRIM and order.driver_id is None
    )
    is_mine = order.driver_id == session.user_id
    if not (is_available or is_mine):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job tidak ditemukan.")
    return order_to_job_detail(order)


@router.post("/jobs/{order_id}/take", response_model=DeliveryJobDetailOut)
def take_job(
    order_id: str,
    session: AuthSession = Depends(driver_session),
    db: Session = Depends(get_db),
):
    """Mengambil job. Menggunakan UPDATE bersyarat atomik sehingga hanya satu
    Driver yang bisa mengambil sebuah pesanan (mencegah balapan dua Driver).
    Setelah diambil, status pesanan menjadi 'Sedang Dikirim'."""
    # Klaim atomik: hanya berhasil bila masih Menunggu Pengirim & belum diambil.
    result = db.execute(
        update(Order)
        .where(
            Order.id == order_id,
            Order.status == STATUS_MENUNGGU_PENGIRIM,
            Order.driver_id.is_(None),
        )
        .values(driver_id=session.user_id, status=STATUS_DIKIRIM)
    )
    if result.rowcount == 0:
        order = db.get(Order, order_id)
        if order is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Job tidak ditemukan.")
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Job ini sudah diambil Driver lain atau belum siap diambil.",
        )

    order = db.get(Order, order_id)
    # Catat riwayat status (status sudah di-set oleh UPDATE atomik di atas).
    db.add(OrderStatusHistory(
        order_id=order.id, status=STATUS_DIKIRIM,
        note="Job diambil driver, pesanan sedang dikirim.",
    ))
    db.commit()
    db.refresh(order)
    return order_to_job_detail(order)


@router.post("/jobs/{order_id}/complete", response_model=DeliveryJobDetailOut)
def complete_job(
    order_id: str,
    session: AuthSession = Depends(driver_session),
    db: Session = Depends(get_db),
):
    """Konfirmasi job selesai. Hanya Driver yang mengambil job (dan status
    'Sedang Dikirim') yang boleh menyelesaikan. Status menjadi 'Pesanan
    Selesai' dan earning Driver terhitung dari job ini."""
    order = db.get(Order, order_id)
    if order is None or order.driver_id != session.user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job tidak ditemukan.")
    if order.status != STATUS_DIKIRIM:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Job hanya bisa diselesaikan saat berstatus '{STATUS_DIKIRIM}'. "
            f"Status saat ini: '{order.status}'.",
        )
    earning = calc_driver_earning(order.delivery_fee)
    add_status_history(
        db, order, STATUS_SELESAI,
        note=f"Pesanan tiba di tujuan. Earning driver Rp{earning:,}.".replace(",", "."),
    )
    db.commit()
    db.refresh(order)
    return order_to_job_detail(order)


@router.get("/earnings", response_model=DriverEarningsOut)
def earnings(
    session: AuthSession = Depends(driver_session),
    db: Session = Depends(get_db),
):
    """Dashboard penghasilan Driver: job aktif, riwayat job, dan total earning
    dari job yang sudah selesai."""
    my_orders = db.scalars(
        select(Order)
        .where(Order.driver_id == session.user_id)
        .order_by(Order.created_at.desc())
    ).all()

    active = next((o for o in my_orders if o.status == STATUS_DIKIRIM), None)
    completed = [o for o in my_orders if o.status == STATUS_SELESAI]
    total_earning = sum(calc_driver_earning(o.delivery_fee) for o in completed)

    return DriverEarningsOut(
        active_job=order_to_job(active) if active else None,
        completed_jobs=len(completed),
        total_earning=total_earning,
        earning_rate_percent=round(DRIVER_EARNING_RATE * 100),
        history=[order_to_job(o) for o in my_orders],
    )
