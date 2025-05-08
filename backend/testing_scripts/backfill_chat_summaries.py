#!/usr/bin/env python3
import os
import sys
import requests
from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client

# ─── Load .env ─────────────────────────────────────────────────────────────
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

# ─── Config ────────────────────────────────────────────────────────────────
BASE_URL     = "http://localhost:8000"
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")    # must be set in your .env
if not ACCESS_TOKEN:
    print("❌ ACCESS_TOKEN not set in your .env, aborting.")
    sys.exit(1)

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type":  "application/json",
}

SUPABASE_URL         = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ SUPABASE_URL or SUPABASE_SERVICE_KEY not set, aborting.")
    sys.exit(1)

# ─── Supabase client ───────────────────────────────────────────────────────
sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ─── Fetch user ID ─────────────────────────────────────────────────────────
USER_ID = os.getenv("USER_ID")  # set your user_id in .env
if not USER_ID:
    print("❌ USER_ID not set in your .env, aborting.")
    sys.exit(1)

# ─── 1) Fetch all chat session IDs ─────────────────────────────────────────
sessions = (
    sb.table("ChatSessions")
      .select("session_id")
      .eq("user_id", USER_ID)
      .order("created_at")
      .execute()
      .data
)

if not sessions:
    print("No chat sessions found; nothing to backfill.")
    sys.exit(0)

uniq_sessions = sorted({s["session_id"] for s in sessions})

# ─── 2) Backfill each session ──────────────────────────────────────────────
for session_id in uniq_sessions:
    payload = {"session_id": session_id}
    resp = requests.post(
        f"{BASE_URL}/api/chat-summaries",
        headers=headers,
        json=payload
    )

    if resp.ok:
        print(f"[OK]  Summarized session {session_id}")
    else:
        print(f"[ERROR] session {session_id}: {resp.status_code} {resp.text}")
