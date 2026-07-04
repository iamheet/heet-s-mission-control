"""
JWT authentication for jarvis-core-api.

Single admin user (you). A short-lived bearer token is issued at
POST /api/auth/login and required on every REST endpoint and WebSocket.

- REST: send `Authorization: Bearer <token>`.
- WebSocket: browsers can't set headers on WS, so pass `?token=<token>` in the
  query string; `authenticate_ws` validates it before the socket is accepted.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from config import settings

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return _pwd.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _pwd.verify(plain, hashed)
    except Exception:
        return False


def authenticate_user(username: str, password: str) -> bool:
    """Validate the single admin credential set from config."""
    if username != settings.jarvis_admin_user:
        return False
    if settings.jarvis_admin_password_hash:
        return verify_password(password, settings.jarvis_admin_password_hash)
    # dev fallback: plaintext compare (documented as dev-only in .env.example)
    return password == settings.jarvis_admin_password


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": subject, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Optional[str]:
    """Return the subject if the token is valid, else None."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload.get("sub")
    except JWTError:
        return None


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> str:
    """FastAPI dependency — rejects any request without a valid bearer token."""
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    subject = decode_token(creds.credentials)
    if subject is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return subject


def authenticate_ws(token: Optional[str]) -> Optional[str]:
    """Validate a token passed as a WS query param. Returns subject or None."""
    if not token:
        return None
    return decode_token(token)


# ── Login route ─────────────────────────────────────────────────────────────
router = APIRouter(prefix="/api/auth", tags=["auth"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int


@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    """Exchange username/password for a JWT. Uses the standard OAuth2 form so
    Swagger's Authorize button works out of the box."""
    if not authenticate_user(form.username, form.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token(form.username)
    return TokenResponse(access_token=token, expires_in_minutes=settings.jwt_expire_minutes)
