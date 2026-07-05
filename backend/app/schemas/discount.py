from datetime import datetime

from pydantic import BaseModel, Field


class VoucherCreate(BaseModel):
    code: str = Field(min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_-]+$")
    description: str = Field(default="", max_length=255)
    percent: int = Field(ge=1, le=100)
    max_discount: int = Field(default=0, ge=0, description="0 = tanpa batas nominal")
    min_spend: int = Field(default=0, ge=0)
    remaining_usage: int = Field(ge=1, description="Kuota total pemakaian")
    expires_at: datetime


class PromoCreate(BaseModel):
    code: str = Field(min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_-]+$")
    description: str = Field(default="", max_length=255)
    percent: int = Field(ge=1, le=100)
    max_discount: int = Field(default=0, ge=0)
    min_spend: int = Field(default=0, ge=0)
    expires_at: datetime


class VoucherOut(BaseModel):
    id: str
    code: str
    description: str
    percent: int
    max_discount: int
    min_spend: int
    remaining_usage: int
    expires_at: datetime
    created_at: datetime
    is_expired: bool


class PromoOut(BaseModel):
    id: str
    code: str
    description: str
    percent: int
    max_discount: int
    min_spend: int
    expires_at: datetime
    created_at: datetime
    is_expired: bool


class DiscountValidationOut(BaseModel):
    code: str
    type: str
    percent: int
    amount: int
    description: str
