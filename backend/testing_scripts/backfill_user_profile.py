#!/usr/bin/env python3
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import requests
from datetime import datetime, timedelta

# ─── Load .env ─────────────────────────────────────────────────────────────
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

# ─── Config ────────────────────────────────────────────────────────────────
BASE_URL     = os.getenv("BASE_URL", "http://localhost:8000")
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
if not ACCESS_TOKEN:
    print("❌ ACCESS_TOKEN not set in .env, aborting.")
    sys.exit(1)

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type":  "application/json",
}

# ─── 1) Backfill ChatSummaries via HTTP ────────────────────────────────────
print("Backfilling ChatSummaries…")
resp = requests.get(f"{BASE_URL}/api/chat-sessions", headers=headers)
if not resp.ok:
    print(f"Failed to fetch chat sessions: {resp.status_code} {resp.text}")
    sys.exit(1)

sessions = resp.json().get("sessions", [])
for sess in sessions:
    session_id = sess["session_id"]
    r = requests.post(
        f"{BASE_URL}/api/chat-summaries",
        headers=headers,
        json={"session_id": session_id}
    )
    status = "[OK]" if r.ok else "[ERROR]"
    print(f"{status} session {session_id}: {r.status_code}")

# ─── 2) Backfill JournalSummaries via HTTP ─────────────────────────────────
print("\nBackfilling JournalSummaries…")
r = requests.get(f"{BASE_URL}/api/journal-dates", headers=headers)
if not r.ok:
    print(f"Failed to fetch journal dates: {r.status_code} {r.text}")
    sys.exit(1)

dates = sorted({d[:10] for d in r.json().get("dates", [])})
if not dates:
    print("No journal dates found; skipping.")
else:
    window_size = 7
    for i in range(0, len(dates), window_size):
        start = dates[i]
        end = dates[min(i + window_size - 1, len(dates) - 1)]
        payload = {"start_date": start, "end_date": end}
        r2 = requests.post(
            f"{BASE_URL}/api/journal-summaries",
            headers=headers,
            json=payload
        )
        status = "[OK]" if r2.ok else "[ERROR]"
        print(f"{status} {start} → {end}: {r2.status_code}")

# ─── 3) Trigger profile generation via HTTP ────────────────────────────────
print("\nTriggering UserProfile generation…")
r = requests.get(f"{BASE_URL}/api/user-profile", headers=headers)
if r.ok:
    profile = r.json()
    print("UserProfile:", profile)
else:
    print(f"Failed to generate/get user profile: {r.status_code} {r.text}")