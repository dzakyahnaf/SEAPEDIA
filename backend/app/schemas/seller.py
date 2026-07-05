from datetime import datetime

from pydantic import BaseModel, Field


class StorePayload(BaseModel):
    name: str = Field(min_length=3, max_length=60)
    description: str = Field(default="", max_length=500)


class StoreResponse(BaseModel):
    id: str
    name: str
    description: str
    created_at: datetime
    product_count: int


class ProductPayload(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    description: str = Field(default="", max_length=2000)
    price: int = Field(gt=0, le=1_000_000_000, description="Harga dalam rupiah utuh")
    stock: int = Field(ge=0, le=1_000_000)


class SellerProduct(BaseModel):
    id: str
    name: str
    description: str
    price: int
    stock: int
    created_at: datetime
