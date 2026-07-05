from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AppReview
from ..schemas.review import ReviewCreate, ReviewItem, ReviewListResponse
from ..services.sanitize import clean_text

router = APIRouter(prefix="/reviews", tags=["Review Aplikasi"])


@router.get("", response_model=ReviewListResponse)
def list_reviews(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Daftar review/testimoni aplikasi SEAPEDIA (publik)."""
    reviews = db.scalars(
        select(AppReview).order_by(AppReview.created_at.desc()).limit(limit)
    ).all()
    total = db.scalar(select(func.count(AppReview.id))) or 0
    average = db.scalar(select(func.avg(AppReview.rating)))
    return ReviewListResponse(
        items=[
            ReviewItem(
                id=r.id,
                reviewer_name=r.reviewer_name,
                rating=r.rating,
                comment=r.comment,
                created_at=r.created_at,
            )
            for r in reviews
        ],
        total=total,
        average_rating=round(average, 2) if average is not None else None,
    )


@router.post("", response_model=ReviewItem, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreate, db: Session = Depends(get_db)):
    """Kirim review tentang pengalaman menggunakan aplikasi SEAPEDIA.
    Terbuka untuk guest — tidak perlu login, checkout, atau transaksi.
    Komentar disimpan sebagai teks polos dan dirender sebagai teks di klien
    (tidak pernah dieksekusi sebagai HTML)."""
    review = AppReview(
        reviewer_name=clean_text(payload.reviewer_name),
        rating=payload.rating,
        comment=clean_text(payload.comment),
    )
    if not review.reviewer_name or not review.comment:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Nama dan komentar tidak boleh kosong.",
        )
    db.add(review)
    db.commit()
    db.refresh(review)
    return ReviewItem(
        id=review.id,
        reviewer_name=review.reviewer_name,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
    )
