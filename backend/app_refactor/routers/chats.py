from fastapi import APIRouter, Depends
from typing import List
from ..dependencies import get_current_user
from ..services.chat_service import (
    chat_conversation,
    list_chat_summaries,
    create_chat_summary,
    get_user_chat_sessions,
    create_chat_session,
    get_session_messages,
    send_message_to_session
)
from ..schemas import (
    ChatMessageIn,
    ChatSummaryCreate,
    ChatSummaryOut,
    SessionMessageCreate,
    SessionMessageOut  # define this in schemas for your message endpoints
)

router = APIRouter()

@router.post("/chat", response_model=dict)
async def chat_endpoint(
    msg: ChatMessageIn,
    user = Depends(get_current_user)
):
    # msg.message: str, msg.context: Optional[str]
    ai_reply = await chat_conversation(user.id, msg.message, msg.context)
    return {"response": ai_reply}

@router.post("/chat-summaries", response_model=ChatSummaryOut)
async def post_chat_summary(
    payload: ChatSummaryCreate,
    user    = Depends(get_current_user)
):
    return await create_chat_summary(user.id, str(payload.session_id))

@router.get("/chat-summaries", response_model=List[ChatSummaryOut])
async def get_chat_summaries(user = Depends(get_current_user)):
    return await list_chat_summaries(user.id)


# --- new chat‑sessions endpoints ---
@router.get("/chat-sessions")
async def list_sessions(user=Depends(get_current_user)):
    return await get_user_chat_sessions(user.id)

@router.post("/chat-sessions")
async def new_session(user=Depends(get_current_user)):
    return await create_chat_session(user.id)

@router.get("/chat-sessions/{session_id}/messages")
async def read_session_messages(session_id: str, user=Depends(get_current_user)):
    return await get_session_messages(user.id, session_id)

@router.post("/chat-sessions/{session_id}/messages", response_model=SessionMessageOut)
async def post_session_message(
    session_id: str,
    msg: SessionMessageCreate,
    user=Depends(get_current_user)
):
    return await send_message_to_session(user.id, session_id, msg.message)