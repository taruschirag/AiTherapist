from fastapi import Header, HTTPException, Depends
from .db import supabase
from typing import Optional

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing. Please log in.")
    token = authorization.replace("Bearer ", "").strip()
    resp = supabase.auth.get_user(token)
    if not resp.user:
        raise HTTPException(401, "Invalid or expired token.")
    return resp.user
