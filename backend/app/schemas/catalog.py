from datetime import datetime

from pydantic import BaseModel


class StoreSummary(BaseModel):
    id: str
    name: str
    description: str


class ProductListItem(BaseModel):
    id: str
    name: str
    price: int
    stock: int
    store: StoreSummary


class ProductDetail(BaseModel):
    id: str
    name: str
    description: str
    price: int
    stock: int
    created_at: datetime
    store: StoreSummary


class ProductListResponse(BaseModel):
    items: list[ProductListItem]
    total: int
    page: int
    page_size: int


class StoreDetail(BaseModel):
    id: str
    name: str
    description: str
    created_at: datetime
    product_count: int
    products: list[ProductListItem]
