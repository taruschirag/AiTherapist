import os, logging
from datetime import datetime
from typing import List, Optional
from openai import OpenAI
from ..db import supabase

logger = logging.getLogger(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def chat_conversation(
    user_id: str,
    message: str,
    context: Optional[str] = None
) -> str:
    # 1) pull last 10 chat messages
    history = (
        supabase.table("ChatHistory")
                 .select("*")
                 .eq("user_id", user_id)
                 .order("created_at")
                 .limit(10)
                 .execute()
                 .data
    )

    # 2) build OpenAI payload
    messages = [
        {"role": "system", "content": "You are an empathetic AI therapist named Therapost. ..."}
    ]
    if context:
        messages.append({"role": "system", "content": context})
    for msg in reversed(history):
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": message})

    # 3) call GPT
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=1000,
        temperature=0.7
    )
    ai_reply = resp.choices[0].message.content

    # 4) persist both user & assistant messages
    now = datetime.utcnow().isoformat()
    supabase.table("ChatHistory").insert([
        {"user_id": user_id, "role": "user",      "content": message,  "created_at": now},
        {"user_id": user_id, "role": "assistant", "content": ai_reply,  "created_at": now},
    ]).execute()

    return ai_reply

async def list_chat_summaries(user_id: str) -> List[dict]:
    data = (
        supabase.table("ChatSummaries")
                 .select("*")
                 .eq("user_id", user_id)
                 .order("inserted_at", ascending=False)
                 .execute()
                 .data
    )
    return data or []

async def create_chat_summary(user_id: str, session_id: str) -> dict:
    msgs = (
        supabase.table("ChatMessages")
                 .select("role, content")
                 .eq("session_id", session_id)
                 .order("created_at", ascending=True)
                 .execute()
                 .data
    )
    convo = "\n".join(f"{m['role']}: {m['content']}" for m in msgs)
    prompt = f"Please summarize this conversation:\n\n{convo}"

    ai_resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system",  "content": "You are a concise summarizer."},
            {"role": "user",    "content": prompt}
        ],
        max_tokens=300
    ).choices[0].message.content

    res = (
        supabase.table("ChatSummaries")
                 .insert([{
                     "user_id":      user_id,
                     "session_id":   session_id,
                     "summary_text": ai_resp
                 }])
                 .execute()
    )
    return res.data[0]


async def get_user_chat_sessions(user_id: str) -> List[dict]:
    """Retrieve all chat sessions for the given user."""
    resp = (
        supabase.table("ChatSessions")
                 .select("session_id, created_at, notes")
                 .eq("user_id", user_id)
                 .order("created_at", ascending=False)
                 .execute()
    )
    return resp.data or []


async def create_chat_session(user_id: str) -> dict:
    """Create a new chat session for the user and return it."""
    resp = (
        supabase.table("ChatSessions")
                 .insert({"user_id": user_id})
                 .execute()
    )
    data = resp.data or []
    return data[0] if data else {}


async def get_session_messages(user_id: str, session_id: str) -> List[dict]:
    """Verify ownership, then fetch all messages in the specified session."""
    # Verify session belongs to user
    check = (
        supabase.table("ChatSessions")
                 .select("user_id")
                 .eq("session_id", session_id)
                 .execute()
    )
    if not check.data or check.data[0]["user_id"] != user_id:
        return []

    # Fetch messages
    resp = (
        supabase.table("ChatMessages")
                 .select("*")
                 .eq("session_id", session_id)
                 .order("created_at", ascending=True)
                 .execute()
    )
    return resp.data or []


async def send_message_to_session(
    user_id: str,
    session_id: str,
    message: str
) -> dict:
    """
    Save a user message in a session, call GPT for a reply,
    save the AI response, and return both saved records.
    """
    # Verify session ownership
    check = (
        supabase.table("ChatSessions")
                 .select("user_id")
                 .eq("session_id", session_id)
                 .execute()
    )
    if not check.data or check.data[0]["user_id"] != user_id:
        raise Exception("Access denied to this chat session.")

    now = datetime.utcnow().isoformat()

    # 1) Save user message
    user_resp = supabase.table("ChatMessages").insert({
        "session_id": session_id,
        "user_id":    user_id,
        "role":       "user",
        "content":    message,
        "created_at": now
    }).execute()
    saved_user = (user_resp.data or [None])[0]

    # 2) Build context for GPT: last 10 messages
    history = (
        supabase.table("ChatMessages")
                 .select("role, content")
                 .eq("session_id", session_id)
                 .order("created_at", ascending=False)
                 .limit(10)
                 .execute()
                 .data
    )
    messages = [
        {"role": "system", "content": "You are an empathetic AI therapist named Therapost."}
    ]
    for msg in reversed(history):
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": message})

    # 3) Call OpenAI
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=300,
        temperature=0.7
    )
    ai_reply = resp.choices[0].message.content

    # 4) Save AI response
    ai_resp = supabase.table("ChatMessages").insert({
        "session_id": session_id,
        "user_id":    user_id,
        "role":       "assistant",
        "content":    ai_reply,
        "created_at": now
    }).execute()
    saved_ai = (ai_resp.data or [None])[0]

    return {
        "userMessage": saved_user,
        "aiMessage":   saved_ai
    }