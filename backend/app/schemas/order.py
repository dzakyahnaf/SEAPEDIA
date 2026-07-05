from datetime import datetime

from pydantic import BaseModel

from .catalog import StoreSummary


class OrderItemOut(BaseModel):
    product_name: str
    price: int
    quantity: int
    line_total: int


class StatusHistoryOut(BaseModel):
    status: str
    note: str
    created_at: datetime


class OrderSummaryOut(BaseModel):
    id: str
    code: str
    store_name: str
    buyer_username: str
    status: str
    total: int
    item_count: int
    delivery_method: str
    delivery_method_label: str
    created_at: datetime


class OrderDetailOut(OrderSummaryOut):
    store: StoreSummary
    items: list[OrderItemOut]
    recipient_name: str
    phone: str
    full_address: str
    subtotal: int
    discount: int
    discount_code: str | None = None
    discount_type: str | None = None
    delivery_fee: int
    tax_rate_percent: int
    tax: int
    history: list[StatusHistoryOut]
