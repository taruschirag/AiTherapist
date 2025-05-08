import os
import logging
import json
from openai import OpenAI
from ..db import supabase

logger = logging.getLogger(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def _generate_profile_for_user(user_id: str) -> str:
    """Helper: generate a JSON-formatted profile string from chat and journal summaries."""
    # 1) fetch up to 5 most recent chat summaries
    chat_rows = (
        supabase.table("ChatSummaries")
                .select("summary_text")
                .eq("user_id", user_id)
                .order("inserted_at", ascending=False)
                .limit(5)
                .execute()
    ).data or []
    chat_texts = [r["summary_text"] for r in chat_rows]

    # 2) fetch up to 5 most recent journal summaries
    journal_rows = (
        supabase.table("JournalSummaries")
                .select("summary_text")
                .eq("user_id", user_id)
                .order("inserted_at", ascending=False)
                .limit(5)
                .execute()
    ).data or []
    journal_texts = [r["summary_text"] for r in journal_rows]

    # 3) build prompt
    prompt = (
        "You are an AI therapist building a concise, JSON-formatted user profile. "
        "Given the following chat and journal summaries, output ONLY valid JSON with keys: "
        "name (string), strengths (array of {area,description}), "
        "weaknesses (array of {area,description}), "
        "socialSkills ({score:int,description:string}).\n\n"
        "ChatSummaries:\n" + "\n".join(f"- {t}" for t in chat_texts) +
        "\n\nJournalSummaries:\n" + "\n".join(f"- {t}" for t in journal_texts)
    )

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an empathetic summarizer."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=800
    )
    return resp.choices[0].message.content

async def get_or_generate_profile(user_id: str) -> dict:
    """Fetch existing profile; if none exists, generate on-the-fly and upsert."""
    # Try to fetch existing profile
    res = (
        supabase.table("UserProfiles")
                .select("*")
                .eq("user_id", user_id)
                .single()
                .execute()
    )
    if res.data:
        return res.data

    # Generate on-the-fly
    raw = await _generate_profile_for_user(user_id)
    try:
        profile_data = json.loads(raw)
    except Exception as e:
        logger.error(f"Error parsing profile JSON for user {user_id}: {e}")
        raise

    # Upsert and return
    return await upsert_profile(user_id, profile_data)

async def upsert_profile(user_id: str, profile_data: dict) -> dict:
    """Upsert the user profile data and return the record."""
    res = (
        supabase.table("UserProfiles")
                .upsert([{"user_id": user_id, "profile_data": profile_data}], on_conflict=["user_id"])
                .select("*")
                .single()
                .execute()
    )
    return res.data
