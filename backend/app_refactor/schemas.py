from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime
from uuid import UUID
from typing import List, Optional, Literal

# --- Auth ---
class UserSignup(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class RefreshResponse(BaseModel):
    access_token: str
    refresh_token: str

# --- Journals ---
class JournalSummaryCreate(BaseModel):
    start_date: date
    end_date: date

class JournalSummaryOut(BaseModel):
    id: UUID
    user_id: UUID
    start_date: date
    end_date: date
    summary_text: str
    inserted_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Chats ---
class ChatSummaryCreate(BaseModel):
    session_id: UUID

class ChatSummaryOut(BaseModel):
    id: UUID
    user_id: UUID
    session_id: UUID
    summary_text: str
    inserted_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ChatMessageIn(BaseModel):
    message: str
    context: Optional[str] = None

class SessionMessageCreate(BaseModel):
    message: str = Field(..., description="The user's new chat message")

class SessionMessageOut(BaseModel):
    chat_id: UUID        = Field(..., description="Primary key of the chat message")
    session_id: UUID     = Field(..., description="The session this message belongs to")
    user_id: UUID        = Field(..., description="Who sent this message")
    role: Literal["user","assistant"] = Field(..., description="Either 'user' or 'assistant'")
    content: str         = Field(..., description="The text of the message")
    created_at: datetime = Field(..., description="When the message was created")

    model_config = ConfigDict(from_attributes=True)

# --- Profiles ---
class UserProfilePayload(BaseModel):
    profile_data: dict = Field(...)

class UserProfileOut(BaseModel):
    user_id: UUID
    profile_data: dict
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
