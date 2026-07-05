from datetime import datetime

from pydantic import BaseModel, Field

from .catalog import StoreSummary


# ---------- Wallet ----------

class TopupRequest(BaseModel):
    amount: int = Field(
        ge=10_000, le=10_000_000,
        description="Nominal top-up dalam rupiah (10rb - 10jt).",
    )


class WalletTransactionOut(BaseModel):
    id: str
    amount: int
    type: str
    description: str
    created_at: datetime


class WalletOut(BaseModel):
    balance: int
    transactions: list[WalletTransactionOut]


# ---------- Alamat ----------

class AddressPayload(BaseModel):
    label: str = Field(min_length=1, max_length=30, description="contoh: Rumah, Kantor")
    recipient_name: str = Field(min_length=1, max_length=60)
    phone: str = Field(pattern=r"^\+?[0-9]{8,15}$")
    full_address: str = Field(min_length=10, max_length=500)
    is_default: bool = False


class AddressOut(AddressPayload):
    id: str
    created_at: datetime


# ---------- Keranjang ----------

class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=999)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1, le=999)


class CartItemOut(BaseModel):
    id: str
    product_id: str
    product_name: str
    price: int
    stock: int
    quantity: int
    line_total: int


class CartOut(BaseModel):
    store: StoreSummary | None
    items: list[CartItemOut]
    total_items: int
    subtotal: int


# ---------- Checkout ----------

class DeliveryMethodOut(BaseModel):
    code: str
    label: str
    fee: int
    description: str


class CheckoutPreviewRequest(BaseModel):
    delivery_method: str


class CheckoutRequest(BaseModel):
    address_id: str
    delivery_method: str


class CheckoutPreviewOut(BaseModel):
    store: StoreSummary
    items: list[CartItemOut]
    subtotal: int
    discount: int
    delivery_method: str
    delivery_fee: int
    tax_rate_percent: int
    tax: int
    total: int
    wallet_balance: int
    sufficient_balance: bool
