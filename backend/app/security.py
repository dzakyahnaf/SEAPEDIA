from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from .config import settings


def utcnow() -> datetime:
    """Waktu UTC naive, konsisten untuk semua kolom timestamp."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(session_id: str, user_id: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(hours=settings.token_expire_hours)
    payload = {"jti": session_id, "sub": user_id, "exp": expires}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Mengembalikan payload token. Raise jwt.PyJWTError jika tidak valid/kedaluwarsa."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
