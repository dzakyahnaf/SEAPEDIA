from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Product, Store
from ..schemas.catalog import (
    ProductDetail,
    ProductListItem,
    ProductListResponse,
    StoreDetail,
    StoreSummary,
)

router = APIRouter(tags=["Katalog Publik"])


def to_list_item(product: Product) -> ProductListItem:
    return ProductListItem(
        id=product.id,
        name=product.name,
        price=product.price,
        stock=product.stock,
        store=StoreSummary(
            id=product.store.id,
            name=product.store.name,
            description=product.store.description,
        ),
    )


@router.get("/products", response_model=ProductListResponse)
def list_products(
    search: str | None = Query(default=None, max_length=120),
    store_id: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=48),
    db: Session = Depends(get_db),
):
    """Katalog produk publik — bisa diakses guest tanpa login."""
    query = select(Product).options(joinedload(Product.store))
    if search:
        # Parameterized lewat SQLAlchemy — aman dari SQL Injection.
        query = query.where(Product.name.ilike(f"%{search}%"))
    if store_id:
        query = query.where(Product.store_id == store_id)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    products = db.scalars(
        query.order_by(Product.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return ProductListResponse(
        items=[to_list_item(p) for p in products],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/products/{product_id}", response_model=ProductDetail)
def product_detail(product_id: str, db: Session = Depends(get_db)):
    """Detail produk publik (read-only untuk guest)."""
    product = db.get(Product, product_id, options=[joinedload(Product.store)])
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produk tidak ditemukan.")
    return ProductDetail(
        id=product.id,
        name=product.name,
        description=product.description,
        price=product.price,
        stock=product.stock,
        created_at=product.created_at,
        store=StoreSummary(
            id=product.store.id,
            name=product.store.name,
            description=product.store.description,
        ),
    )


@router.get("/stores/{store_id}", response_model=StoreDetail)
def store_detail(store_id: str, db: Session = Depends(get_db)):
    """Ringkasan toko publik beserta produk-produknya."""
    store = db.get(Store, store_id)
    if store is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Toko tidak ditemukan.")
    return StoreDetail(
        id=store.id,
        name=store.name,
        description=store.description,
        created_at=store.created_at,
        product_count=len(store.products),
        products=[to_list_item(p) for p in store.products],
    )
