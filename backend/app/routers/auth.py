from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..deps import get_current_session, get_current_user
from ..models import ROLE_ADMIN, AuthSession, User, UserRole
from ..schemas.auth import (
    AuthResponse,
    FinancialSummary,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    SelectRoleRequest,
    UserProfile,
)
from ..security import create_access_token, hash_password, utcnow, verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])


def build_profile(user: User, active_role: str | None) -> UserProfile:
    roles = user.role_names
    summary = FinancialSummary(
        buyer_wallet_balance=0 if "BUYER" in roles else None,
        seller_income=0 if "SELLER" in roles else None,
        driver_earnings=0 if "DRIVER" in roles else None,
        note=(
            "Placeholder Level 1 — saldo wallet Buyer hadir di Level 3, "
            "income Seller di Level 4, earnings Driver di Level 5."
        ),
    )
    return UserProfile(
        id=user.id,
        username=user.username,
        email=user.email,
        roles=roles,
        active_role=active_role,
        store_name=user.store.name if user.store else None,
        created_at=user.created_at,
        financial_summary=summary,
    )


@router.post("/register", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Registrasi akun baru. Satu username boleh memiliki lebih dari satu
    role non-admin (SELLER, BUYER, DRIVER) sekaligus. Akun Admin tidak dibuat
    lewat endpoint ini — Admin disiapkan melalui seed data (lihat README)."""
    username_lower = payload.username.lower()
    exists = db.scalar(
        select(User).where(func.lower(User.username) == username_lower)
    )
    if exists:
        raise HTTPException(status.HTTP_409_CONFLICT, "Username sudah digunakan.")
    email_exists = db.scalar(
        select(User).where(func.lower(User.email) == payload.email.lower())
    )
    if email_exists:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email sudah terdaftar.")

    user = User(
        username=payload.username,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
    )
    for role in sorted(set(payload.roles)):
        user.roles.append(UserRole(role=role))
    db.add(user)
    db.commit()
    db.refresh(user)
    return build_profile(user, active_role=None)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Login dengan username + password. Jika user punya lebih dari satu role
    non-admin, active_role dibiarkan kosong dan klien wajib memanggil
    /auth/select-role sebelum masuk dashboard privat."""
    user = db.scalar(
        select(User).where(func.lower(User.username) == payload.username.lower())
    )
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Username atau password salah.")

    roles = user.role_names
    if ROLE_ADMIN in roles:
        active_role = ROLE_ADMIN  # akun admin bersifat admin-only (lihat README)
    elif len(roles) == 1:
        active_role = roles[0]
    else:
        active_role = None  # multi-role: wajib pilih role aktif dulu

    session = AuthSession(
        user_id=user.id,
        active_role=active_role,
        expires_at=utcnow() + timedelta(hours=settings.token_expire_hours),
    )
    db.add(session)
    db.commit()

    token = create_access_token(session_id=session.id, user_id=user.id)
    return AuthResponse(
        access_token=token,
        needs_role_selection=active_role is None,
        user=build_profile(user, active_role),
    )


@router.post("/select-role", response_model=UserProfile)
def select_role(
    payload: SelectRoleRequest,
    session: AuthSession = Depends(get_current_session),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Memilih atau mengganti role aktif untuk sesi berjalan. Role harus
    termasuk dalam daftar role yang dimiliki user."""
    role = payload.role.upper()
    if role not in user.role_names:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            f"Anda tidak memiliki role {role}. Role Anda: {', '.join(user.role_names)}.",
        )
    session.active_role = role
    db.add(session)
    db.commit()
    return build_profile(user, active_role=role)


@router.post("/logout", response_model=MessageResponse)
def logout(
    session: AuthSession = Depends(get_current_session),
    db: Session = Depends(get_db),
):
    """Menghapus sesi server-side sehingga token yang sama tidak bisa
    dipakai lagi (bukan sekadar menghapus token di sisi klien)."""
    db.delete(session)
    db.commit()
    return MessageResponse(message="Logout berhasil. Sesi telah dihapus.")


@router.get("/me", response_model=UserProfile)
def me(
    session: AuthSession = Depends(get_current_session),
    user: User = Depends(get_current_user),
):
    """Profil user yang sedang login: daftar role yang dimiliki, role aktif
    sesi ini, dan placeholder ringkasan finansial lintas role."""
    return build_profile(user, active_role=session.active_role)
