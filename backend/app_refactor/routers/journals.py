from fastapi import APIRouter, HTTPException, Depends
from ..schemas import JournalSummaryCreate, JournalSummaryOut
from ..services.journal_service import create_journal_summary, get_journal_summary
from ..dependencies import get_current_user
from datetime import date

router = APIRouter()

@router.post("/journal-summaries", response_model=JournalSummaryOut)
async def create_journal_summary(payload: JournalSummaryCreate, user=Depends(get_current_user)):
    return await create_journal_summary(user.id, payload)

@router.get("/journal-summaries", response_model=JournalSummaryOut)
async def get_journal_summary(start_date: date, end_date: date, user=Depends(get_current_user)):
    return await get_journal_summary(user.id, start_date, end_date)
