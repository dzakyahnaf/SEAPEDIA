import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import AuthSession, User
from .security import decode_access_token, utcnow

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_session(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> AuthSession:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autentikasi diperlukan. Sertakan header Authorization: Bearer <token>.",
        )
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token sudah kedaluwarsa. Silakan login ulang.")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token tidak valid.")

    session = db.get(AuthSession, payload.get("jti"))
    if session is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Sesi tidak ditemukan atau sudah logout. Silakan login ulang.",
        )
    if session.expires_at < utcnow():
        db.delete(session)
        db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sesi sudah kedaluwarsa. Silakan login ulang.")
    return session


def get_current_user(
    session: AuthSession = Depends(get_current_session),
    db: Session = Depends(get_db),
) -> User:
    user = db.get(User, session.user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Akun tidak ditemukan.")
    return user


def require_active_role(*allowed_roles: str):
    """Dependency factory: otorisasi berdasarkan ROLE AKTIF pada sesi,
    bukan sekadar daftar role yang dimiliki user."""

    def dependency(
        session: AuthSession = Depends(get_current_session),
    ) -> AuthSession:
        if session.active_role is None:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "Pilih role aktif terlebih dahulu sebelum mengakses fitur ini.",
            )
        if session.active_role not in allowed_roles:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Fitur ini hanya untuk role aktif: {', '.join(allowed_roles)}. "
                f"Role aktif Anda saat ini: {session.active_role}.",
            )
        return session

    return dependency
