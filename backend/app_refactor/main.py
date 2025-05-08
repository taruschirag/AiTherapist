from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import supabase
from .dependencies import get_current_user
from .routers import auth, journals, chats, profiles

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# mount routers
app.include_router(auth.router,   prefix="/api")
app.include_router(journals.router, prefix="/api")
app.include_router(chats.router,  prefix="/api")
app.include_router(profiles.router, prefix="/api")

@app.get("/")
async def health_check():
    return {"message": "API is running!"}
