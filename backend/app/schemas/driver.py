from datetime import datetime

from pydantic import BaseModel

from .order import OrderItemOut, StatusHistoryOut


class DeliveryJobOut(BaseModel):
    order_id: str
    code: str
    store_name: str
    status: str
    recipient_name: str
    phone: str
    full_address: str
    delivery_method: str
    delivery_method_label: str
    delivery_fee: int
    earning: int
    item_count: int
    created_at: datetime


class DeliveryJobDetailOut(DeliveryJobOut):
    items: list[OrderItemOut]
    history: list[StatusHistoryOut]


class DriverEarningsOut(BaseModel):
    active_job: DeliveryJobOut | None
    completed_jobs: int
    total_earning: int
    earning_rate_percent: int
    history: list[DeliveryJobOut]
