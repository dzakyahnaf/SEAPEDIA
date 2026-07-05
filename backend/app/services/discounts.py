"""Validasi & perhitungan diskon (Voucher dan Promo).

Aturan (didokumentasikan juga di README):
- Voucher DAN Promo tidak boleh digabung. Satu checkout menerima maksimal
  SATU kode diskon. Sistem otomatis mendeteksi apakah kode adalah Voucher
  atau Promo.
- Voucher: dibatasi tanggal kadaluarsa DAN sisa kuota pemakaian.
- Promo: dibatasi tanggal kadaluarsa saja (tanpa kuota).
- Diskon berupa persentase dari subtotal, opsional dibatasi max_discount,
  dan opsional mensyaratkan subtotal minimum (min_spend).
- Diskon dihitung terhadap SUBTOTAL, lalu PPN 12% dihitung dari
  (subtotal - diskon). Jadi urutannya: subtotal -> diskon -> PPN.
"""

from dataclasses import dataclass

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import DISCOUNT_PROMO, DISCOUNT_VOUCHER, Promo, Voucher
from ..security import utcnow


@dataclass
class DiscountResult:
    code: str
    type: str  # VOUCHER / PROMO
    percent: int
    amount: int  # nominal potongan rupiah untuk subtotal ini
    description: str


def _compute_amount(subtotal: int, percent: int, max_discount: int) -> int:
    amount = round(subtotal * percent / 100)
    if max_discount and amount > max_discount:
        amount = max_discount
    return min(amount, subtotal)  # diskon tak boleh melebihi subtotal


def find_discount(db: Session, code: str) -> tuple[str, Voucher | Promo] | None:
    """Cari kode di Voucher lalu Promo (case-insensitive). Mengembalikan
    (tipe, objek) atau None bila tidak ada."""
    normalized = code.strip().upper()
    voucher = db.scalar(select(Voucher).where(func.upper(Voucher.code) == normalized))
    if voucher:
        return DISCOUNT_VOUCHER, voucher
    promo = db.scalar(select(Promo).where(func.upper(Promo.code) == normalized))
    if promo:
        return DISCOUNT_PROMO, promo
    return None


def validate_discount(db: Session, code: str, subtotal: int) -> DiscountResult:
    """Validasi kode diskon untuk sebuah subtotal. Raise HTTPException 400/404
    dengan pesan jelas bila tidak valid, kadaluarsa, kuota habis, atau
    subtotal belum memenuhi minimum."""
    found = find_discount(db, code)
    if found is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            f"Kode diskon '{code}' tidak ditemukan.",
        )
    disc_type, obj = found
    now = utcnow()

    if obj.expires_at < now:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"{disc_type.capitalize()} '{obj.code}' sudah kadaluarsa.",
        )
    if disc_type == DISCOUNT_VOUCHER and obj.remaining_usage <= 0:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Voucher '{obj.code}' sudah habis kuota pemakaiannya.",
        )
    if obj.min_spend and subtotal < obj.min_spend:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"{disc_type.capitalize()} '{obj.code}' memerlukan minimum belanja "
            f"Rp{obj.min_spend:,}.".replace(",", "."),
        )

    amount = _compute_amount(subtotal, obj.percent, obj.max_discount)
    return DiscountResult(
        code=obj.code,
        type=disc_type,
        percent=obj.percent,
        amount=amount,
        description=obj.description,
    )


def consume_voucher_usage(db: Session, code: str) -> None:
    """Kurangi kuota voucher sebesar 1 (dipanggil setelah checkout sukses).
    Aman untuk kode yang ternyata Promo (tidak melakukan apa-apa)."""
    voucher = db.scalar(
        select(Voucher).where(func.upper(Voucher.code) == code.strip().upper())
    )
    if voucher and voucher.remaining_usage > 0:
        voucher.remaining_usage -= 1
        db.add(voucher)
