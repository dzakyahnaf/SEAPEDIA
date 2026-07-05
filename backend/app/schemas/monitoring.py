from datetime import datetime

from pydantic import BaseModel


class AdminSummary(BaseModel):
    total_users: int
    total_stores: int
    total_products: int
    total_orders: int
    orders_by_status: dict[str, int]
    total_vouchers: int
    total_promos: int
    active_deliveries: int  # Menunggu Pengirim + Sedang Dikirim
    overdue_orders: int
    total_wallet_balance: int


class AdminUserRow(BaseModel):
    id: str
    username: str
    email: str
    roles: list[str]
    created_at: datetime


class AdminStoreRow(BaseModel):
    id: str
    name: str
    seller_username: str
    product_count: int
    created_at: datetime


class AdminProductRow(BaseModel):
    id: str
    name: str
    store_name: str
    price: int
    stock: int


class AdminOrderRow(BaseModel):
    id: str
    code: str
    buyer_username: str
    store_name: str
    status: str
    total: int
    delivery_method_label: str
    driver_username: str | None
    is_overdue: bool
    deadline: datetime
    created_at: datetime


class AdminDeliveryRow(BaseModel):
    order_id: str
    code: str
    store_name: str
    status: str
    driver_username: str | None
    delivery_method_label: str
    recipient_name: str
    created_at: datetime


class SimClockOut(BaseModel):
    offset_days: int
    real_now: datetime
    effective_now: datetime


class OverdueRunResult(BaseModel):
    processed_count: int
    total_refunded: int
    orders: list[AdminOrderRow]
