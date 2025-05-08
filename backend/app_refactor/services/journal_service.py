import os
import logging
from datetime import date
from typing import Optional
from openai import OpenAI
from ..db import supabase
from ..schemas import JournalSummaryCreate

logger = logging.getLogger(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def create_journal_summary(user_id: str, payload: JournalSummaryCreate) -> dict:
    """Summarize journals for a given user and date range, persist, and return the summary record."""
    # 1) fetch raw journals
    journals_resp = (
        supabase.table("Journals")
                 .select("content")
                 .eq("user_id", user_id)
                 .gte("journal_date", payload.start_date.isoformat())
                 .lte("journal_date", payload.end_date.isoformat())
                 .order("journal_date")
                 .execute()
    )
    journals = journals_resp.data or []

    # 2) build prompt
    entries = "\n".join(f"- {entry['content']}" for entry in journals)
    prompt = (
        f"As an AI therapist, please summarize the user's journal entries "
        f"from {payload.start_date} to {payload.end_date}:\n\n{entries}"
    )

    # 3) call OpenAI
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an empathetic summarizer."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=500
    )
    ai_reply = resp.choices[0].message.content

    # 4) persist summary and return
    insert_resp = (
        supabase.table("JournalSummaries")
                 .insert([{
                     "user_id": user_id,
                     "start_date": payload.start_date.isoformat(),
                     "end_date": payload.end_date.isoformat(),
                     "summary_text": ai_reply
                 }])
                 .execute()
    )
    return insert_resp.data[0]

async def get_journal_summary(user_id: str, start_date: date, end_date: date) -> Optional[dict]:
    """Retrieve a single journal summary for a given user and date range."""
    resp = (
        supabase.table("JournalSummaries")
                 .select("*")
                 .eq("user_id", user_id)
                 .eq("start_date", start_date.isoformat())
                 .eq("end_date", end_date.isoformat())
                 .single()
                 .execute()
    )
    return resp.data
