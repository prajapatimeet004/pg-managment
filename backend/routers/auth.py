from __future__ import annotations

from fastapi import APIRouter, Depends

from backend.auth import get_current_user

router = APIRouter()


@router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {
        "sub": user.get("sub"),
        "email": user.get("email"),
    }
