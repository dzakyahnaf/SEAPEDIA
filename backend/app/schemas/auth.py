from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

NonAdminRole = Literal["SELLER", "BUYER", "DRIVER"]


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    roles: list[NonAdminRole] = Field(min_length=1)


class LoginRequest(BaseModel):
    username: str
    password: str


class SelectRoleRequest(BaseModel):
    role: str


class FinancialSummary(BaseModel):
    """Placeholder ringkasan finansial lintas role (Level 1).
    Nilai riil diisi mulai Level 3 (wallet Buyer), Level 4 (income Seller),
    dan Level 5 (earnings Driver)."""

    buyer_wallet_balance: int | None = None
    seller_income: int | None = None
    driver_earnings: int | None = None
    note: str = ""


class UserProfile(BaseModel):
    id: str
    username: str
    email: str
    roles: list[str]
    active_role: str | None
    store_name: str | None = None
    created_at: datetime
    financial_summary: FinancialSummary


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    needs_role_selection: bool
    user: UserProfile


class MessageResponse(BaseModel):
    message: str
