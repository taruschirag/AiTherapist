from fastapi import APIRouter, Depends, HTTPException
from ..schemas import UserProfileOut, UserProfilePayload
from ..services.profile_service import get_or_generate_profile, upsert_profile
from ..dependencies import get_current_user
router = APIRouter()

@router.get("/user-profile", response_model=UserProfileOut)
async def get_profile(user=Depends(get_current_user)):
    return await get_or_generate_profile(user.id)

@router.put("/user-profile", response_model=UserProfileOut)
async def put_profile(payload: UserProfilePayload, user=Depends(get_current_user)):
    return await upsert_profile(user.id, payload.profile_data)
