import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .security import utcnow

# Role yang dikenal sistem. Non-admin boleh dimiliki bersamaan oleh satu username.
ROLE_ADMIN = "ADMIN"
ROLE_SELLER = "SELLER"
ROLE_BUYER = "BUYER"
ROLE_DRIVER = "DRIVER"
NON_ADMIN_ROLES = (ROLE_SELLER, ROLE_BUYER, ROLE_DRIVER)
ALL_ROLES = (ROLE_ADMIN, *NON_ADMIN_ROLES)

# Status utama siklus pesanan — string tampilan langsung sesuai ketentuan soal.
STATUS_DIKEMAS = "Sedang Dikemas"
STATUS_MENUNGGU_PENGIRIM = "Menunggu Pengirim"
STATUS_DIKIRIM = "Sedang Dikirim"
STATUS_SELESAI = "Pesanan Selesai"
STATUS_DIKEMBALIKAN = "Dikembalikan"

# Jenis transaksi wallet.
TX_TOPUP = "TOPUP"
TX_PAYMENT = "PAYMENT"
TX_REFUND = "REFUND"


def new_id() -> str:
    return uuid.uuid4().hex


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    username: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    roles: Mapped[list["UserRole"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    store: Mapped["Store | None"] = relationship(back_populates="seller", uselist=False)

    @property
    def role_names(self) -> list[str]:
        return [r.role for r in self.roles]


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role", name="uq_user_role"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(10))

    user: Mapped[User] = relationship(back_populates="roles")


class AuthSession(Base):
    """Sesi login server-side. id dipakai sebagai jti di JWT sehingga logout
    (menghapus baris ini) langsung menginvalidasi token."""

    __tablename__ = "auth_sessions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    active_role: Mapped[str | None] = mapped_column(String(10), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime)

    user: Mapped[User] = relationship()


class Store(Base):
    __tablename__ = "stores"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    seller_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True)
    name: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    seller: Mapped[User] = relationship(back_populates="store")
    products: Mapped[list["Product"]] = relationship(
        back_populates="store", cascade="all, delete-orphan"
    )


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    store_id: Mapped[str] = mapped_column(ForeignKey("stores.id"), index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    price: Mapped[int] = mapped_column(Integer)  # rupiah utuh, tanpa desimal
    stock: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    store: Mapped[Store] = relationship(back_populates="products")


class AppReview(Base):
    """Review/testimoni tentang aplikasi SEAPEDIA (bukan review produk).
    Boleh dikirim oleh guest tanpa login."""

    __tablename__ = "app_reviews"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    reviewer_name: Mapped[str] = mapped_column(String(60))
    rating: Mapped[int] = mapped_column(Integer)  # 1..5
    comment: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Wallet(Base):
    """Saldo wallet Buyer. Dibuat otomatis saat pertama kali diakses."""

    __tablename__ = "wallets"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    balance: Mapped[int] = mapped_column(Integer, default=0)  # rupiah utuh


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[int] = mapped_column(Integer)  # positif = masuk, negatif = keluar
    type: Mapped[str] = mapped_column(String(10))  # TOPUP / PAYMENT / REFUND
    description: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Address(Base):
    __tablename__ = "addresses"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    label: Mapped[str] = mapped_column(String(30))
    recipient_name: Mapped[str] = mapped_column(String(60))
    phone: Mapped[str] = mapped_column(String(20))
    full_address: Mapped[str] = mapped_column(Text)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class CartItem(Base):
    """Item keranjang Buyer. Aturan satu-toko ditegakkan di layer router:
    semua item milik seorang Buyer harus berasal dari toko yang sama."""

    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_cart_user_product"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    product: Mapped[Product] = relationship()


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    code: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    buyer_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    store_id: Mapped[str] = mapped_column(ForeignKey("stores.id"), index=True)

    # Snapshot alamat saat checkout (alamat asli boleh diubah/dihapus kemudian).
    recipient_name: Mapped[str] = mapped_column(String(60))
    phone: Mapped[str] = mapped_column(String(20))
    full_address: Mapped[str] = mapped_column(Text)

    delivery_method: Mapped[str] = mapped_column(String(10))  # INSTANT/NEXT_DAY/REGULAR
    subtotal: Mapped[int] = mapped_column(Integer)
    discount: Mapped[int] = mapped_column(Integer, default=0)  # dipakai Level 4
    delivery_fee: Mapped[int] = mapped_column(Integer)
    tax: Mapped[int] = mapped_column(Integer)  # PPN 12%
    total: Mapped[int] = mapped_column(Integer)

    status: Mapped[str] = mapped_column(String(30), default=STATUS_DIKEMAS, index=True)
    driver_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )  # dipakai Level 5
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    buyer: Mapped[User] = relationship(foreign_keys=[buyer_id])
    store: Mapped[Store] = relationship()
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    history: Mapped[list["OrderStatusHistory"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderStatusHistory.created_at",
    )


class OrderItem(Base):
    """Item pesanan dengan snapshot nama & harga produk saat checkout."""

    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), index=True)
    product_id: Mapped[str | None] = mapped_column(
        ForeignKey("products.id"), nullable=True
    )
    product_name: Mapped[str] = mapped_column(String(120))
    price: Mapped[int] = mapped_column(Integer)
    quantity: Mapped[int] = mapped_column(Integer)
    line_total: Mapped[int] = mapped_column(Integer)

    order: Mapped[Order] = relationship(back_populates="items")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), index=True)
    status: Mapped[str] = mapped_column(String(30))
    note: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    order: Mapped[Order] = relationship(back_populates="history")
