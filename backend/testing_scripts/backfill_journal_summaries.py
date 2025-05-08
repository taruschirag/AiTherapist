import os, requests
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timedelta
from supabase import create_client

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

BASE_URL     = "http://localhost:8000"
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")    # grab from your env

headers = {
  "Authorization": f"Bearer {ACCESS_TOKEN}",
  "Content-Type": "application/json"
}

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
dates = sb.table("Journals") \
  .select("journal_date") \
  .eq("user_id", "523d2ee6-e242-44b6-9331-36cb51938c01") \
  .order("journal_date") \
  .execute().data

# Extract unique date objects
uniq_dates = sorted({d["journal_date"][:10] for d in dates})

# 2) Slide a 7‑day window (change window_size if you like)
window_size = 7
for i in range(0, len(uniq_dates), window_size):
    start = uniq_dates[i]
    end_idx = min(i + window_size - 1, len(uniq_dates) - 1)
    end   = uniq_dates[end_idx]

    payload = {"start_date": start, "end_date": end}
    resp = requests.post(f"{BASE_URL}/api/journal-summaries",
                         headers=headers, json=payload)
    if resp.ok:
        print(f"[OK] Summarized {start}→{end}")
    else:
        print(f"[ERROR] {start}→{end}: ", resp.status_code, resp.text)
