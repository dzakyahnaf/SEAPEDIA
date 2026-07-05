from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_active_role
from ..models import ROLE_ADMIN, Promo, Voucher
from ..schemas.discount import (
    PromoCreate,
    PromoOut,
    VoucherCreate,
    VoucherOut,
)
from ..security import utcnow

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
