from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWTError

from backend.settings import settings

logger = logging.getLogger(__name__)

_security = HTTPBearer(auto_error=False)


def verify_supabase_token(token: str) -> Dict[str, Any]:
    """Verify a Supabase Auth access token (JWT, HS256) and return its payload."""
    if not settings.SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Supabase auth is not configured. Set SUPABASE_JWT_SECRET in backend/.env.",
        )
    try:
        return jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": True},
        )
    except PyJWTError as exc:
        logger.warning("Supabase token verification failed: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid or expired access token.") from exc


def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_security),
) -> Dict[str, Any]:
    """FastAPI dependency that resolves the authenticated Supabase user."""
    if request.url.path in ("/health", "/"):
        return {"sub": "anonymous", "email": None}
    if not settings.SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Supabase auth is not configured. Set SUPABASE_JWT_SECRET in backend/.env.",
        )
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    payload = verify_supabase_token(credentials.credentials)
    return {
        "sub": payload.get("sub", ""),
        "email": payload.get("email"),
    }


def verify_sse_token(access_token: str) -> Dict[str, Any]:
    """Verify a Supabase token passed via query string (for EventSource/SSE)."""
    if not access_token:
        raise HTTPException(status_code=401, detail="Missing access_token query parameter")
    payload = verify_supabase_token(access_token)
    return {
        "sub": payload.get("sub", ""),
        "email": payload.get("email"),
    }


def scope_session(user_sub: str, session_id: str) -> str:
    """Namespace a chat session id under a user so data never crosses accounts."""
    return f"u_{user_sub}:{session_id}"
