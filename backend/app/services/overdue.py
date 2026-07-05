"""Penanganan pesanan terlambat (overdue) — auto refund + auto return.

Aturan (didokumentasikan di README):
- Setiap metode pengiriman punya SLA (batas waktu penyelesaian) dalam jam:
  Instant 24 jam, Next Day 48 jam, Regular 96 jam.
- Sebuah pesanan dianggap OVERDUE jika belum mencapai status terminal
  (Pesanan Selesai / Dikembalikan) dan waktu efektif sudah melewati
  created_at + SLA.
- Saat diproses: pesanan dipindah ke status 'Dikembalikan', total dana
  dikembalikan ke wallet Buyer (tercatat sebagai transaksi REFUND), stok
  produk dipulihkan sesuai kuantitas item, dan perubahan status dicatat di
  riwayat dengan timestamp.
- Pendapatan Seller: karena laporan pendapatan hanya menghitung pesanan
  berstatus 'Pesanan Selesai', pesanan 'Dikembalikan' otomatis tidak masuk
  hitungan (penyesuaian yang jelas, bukan perubahan diam-diam).
- IDEMPOTEN: hanya pesanan non-terminal yang diproses, sehingga tidak mungkin
  terjadi double refund / double restore stok untuk pesanan yang sama.
"""

from datetime import timedelta

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from ..models import (
    STATUS_DIKEMAS,
    STATUS_DIKEMBALIKAN,
    STATUS_DIKIRIM,
    STATUS_MENUNGGU_PENGIRIM,
    TX_REFUND,
    Order,
    Product,
    SimClock,
    Wallet,
    WalletTransaction,
)
from ..security import utcnow
from .orders import DELIVERY_METHODS, add_status_history

NON_TERMINAL_STATUSES = (STATUS_DIKEMAS, STATUS_MENUNGGU_PENGIRIM, STATUS_DIKIRIM)


def get_sim_clock(db: Session) -> SimClock:
    clock = db.get(SimClock, 1)
    if clock is None:
        clock = SimClock(id=1, offset_days=0)
        db.add(clock)
        db.flush()
    return clock


def effective_now(db: Session):
    """Waktu efektif = waktu nyata + offset simulasi. Hanya untuk evaluasi SLA."""
    return utcnow() + timedelta(days=get_sim_clock(db).offset_days)


def order_deadline(order: Order):
    sla_hours = DELIVERY_METHODS[order.delivery_method]["sla_hours"]
    return order.created_at + timedelta(hours=sla_hours)


def is_overdue(order: Order, now) -> bool:
    return order.status in NON_TERMINAL_STATUSES and now > order_deadline(order)


def list_overdue_orders(db: Session) -> list[Order]:
    """Pesanan yang saat ini terlambat namun belum diproses (masih non-terminal)."""
    now = effective_now(db)
    candidates = db.scalars(
        select(Order).where(Order.status.in_(NON_TERMINAL_STATUSES))
    ).all()
    return [o for o in candidates if is_overdue(o, now)]


def refund_and_return_order(db: Session, order: Order) -> None:
    """Kembalikan dana ke wallet Buyer, pulihkan stok, dan tandai Dikembalikan.
    Asumsi dipanggil hanya untuk pesanan non-terminal (dijamin idempoten oleh
    pemanggil)."""
    # 1) Refund total ke wallet Buyer + catat transaksi.
    wallet = db.get(Wallet, order.buyer_id)
    if wallet is None:
        wallet = Wallet(user_id=order.buyer_id, balance=0)
        db.add(wallet)
        db.flush()
    wallet.balance += order.total
    db.add(wallet)
    db.add(WalletTransaction(
        user_id=order.buyer_id,
        amount=order.total,
        type=TX_REFUND,
        description=f"Refund otomatis pesanan {order.code} (melebihi SLA pengiriman)",
    ))

    # 2) Pulihkan stok produk (penambahan atomik; lewati produk yang telah dihapus).
    for item in order.items:
        if item.product_id is not None:
            db.execute(
                update(Product)
                .where(Product.id == item.product_id)
                .values(stock=Product.stock + item.quantity)
            )

    # 3) Pindahkan status ke Dikembalikan + catat jejak yang terlihat.
    add_status_history(
        db, order, STATUS_DIKEMBALIKAN,
        note=(
            f"Pesanan melewati batas waktu pengiriman ({order.delivery_method}). "
            f"Dana Rp{order.total:,} dikembalikan ke wallet, stok dipulihkan."
        ).replace(",", "."),
    )


def run_overdue_processing(db: Session) -> list[Order]:
    """Proses semua pesanan overdue sekarang. Mengembalikan daftar pesanan yang
    di-refund. Idempoten: memproses ulang tidak menghasilkan refund ganda."""
    overdue = list_overdue_orders(db)
    for order in overdue:
        refund_and_return_order(db, order)
    db.commit()
    for order in overdue:
        db.refresh(order)
    return overdue
