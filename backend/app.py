import logging.config
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Request, Header, Depends, status
from pydantic import BaseModel, Field
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import logging
import openai
from openai import OpenAI
from fastapi.responses import JSONResponse
from datetime import date
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from datetime import date
from typing import List, Optional
from datetime import datetime

# Load environment variables from .env file
load_dotenv()


# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))




supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# FastAPI App
app = FastAPI()

# CORS Middleware Configuration
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models




class Message(BaseModel):
    role: str
    content: str

class ChatMessage(BaseModel):
    message: str
    context: Optional[str] = None

class UserSignup(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class SessionMessageCreate(BaseModel):
    message: str

class RefreshRequest(BaseModel):
    refresh_token: str

class RefreshResponse(BaseModel):
    access_token: str
    refresh_token: str

# ─── Pydantic Schemas ─────────────────────────────────────────────────────

class JournalSummaryCreate(BaseModel):
    start_date: date
    end_date: date

class JournalSummaryOut(BaseModel):
    id: int
    user_id: UUID
    start_date: date
    end_date: date
    summary_text: str
    inserted_at: Optional[datetime] = None

    class Config:
         model_config = ConfigDict(from_attributes=True)

class ChatSummaryCreate(BaseModel):
    session_id: UUID

class ChatSummaryOut(BaseModel):
    id: UUID
    user_id: UUID
    session_id: UUID
    summary_text: str
    inserted_at: datetime

    class Config:
         model_config = ConfigDict(from_attributes=True)

class UserProfilePayload(BaseModel):
    profile_data: dict = Field(..., description="AI-generated user profile blob")

class UserProfileOut(BaseModel):
    user_id: UUID
    profile_data: dict
    updated_at: datetime

    class Config:
         model_config = ConfigDict(from_attributes=True)


# Helper Functions





async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing. Please log in.")

    token = authorization.replace("Bearer ", "").strip()

    # Validate the token with Supabase
    response = supabase.auth.get_user(token)

    if response.user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token. Please log in again.")

    print("✅ User Object Type:", type(response.user))  # ✅ Debugging
    

    return response.user  # ✅ Ensure this is an object, not a string


@app.post("/api/refresh", response_model=RefreshResponse)
async def refresh_token(req: RefreshRequest):
    # Call supabase to rotate the session
    result = supabase.auth.refresh_session(req.refresh_token)

    # supabase-py returns a dict with 'data' and 'error'
    err = result.get("error")
    if err:
        # Something went wrong on the Supabase side
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Refresh failed: {err}"
        )

    data = result.get("data") or {}
    session = data.get("session")
    if not session:
        # No session in the payload means refresh failed
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token or session expired."
        )

    # Optionally, set the new refresh token in an HttpOnly cookie:
    resp = JSONResponse(content={
        "access_token": session["access_token"],
        "refresh_token": session["refresh_token"],
    })
    resp.set_cookie(
        key="refresh_token",
        value=session["refresh_token"],
        httponly=True,
        secure=True,       # False on localhost/http
        samesite="strict"  # or "lax"
    )
    return resp

# **User Signup Route**
@app.post("/api/signup")
async def signup(user: UserSignup):
    try:
        # First, check if the user already exists
        print(f"Attempting to sign up user with email: {user.email}")
        
        # Sign up the user with Supabase
        response = supabase.auth.sign_up({"email": user.email, "password": user.password})
        
        # Log the response
        print("Supabase Signup Response:", response)

        if response.user is None:
            print("Signup failed: User is None")
            raise HTTPException(status_code=400, detail="Signup failed. Check email/password validity.")

        try:
            # Try to save user email to database
            print(f"Attempting to save user to database with ID: {response.user.id}")
            supabase.table("users").insert({
                "id": response.user.id,  # Use the Supabase user ID as the primary key
                "email": user.email,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            print("Successfully saved user to database")
        except Exception as db_error:
            # If database save fails, continue with auth flow but log the error
            print(f"Warning: Failed to save user to database: {str(db_error)}")
            # This shouldn't stop the signup process

        try:
            # Try to sign in the user immediately after signup
            print("Attempting to sign in the user after signup")
            signin_response = supabase.auth.sign_in_with_password({"email": user.email, "password": user.password})
            print("Signin response after signup:", signin_response)
            
            if signin_response.user is None:
                print("Warning: Auto-login failed after signup")
                # If sign-in fails after signup, still return success but without tokens
                return {
                    "message": "User signed up successfully but auto-login failed. Please log in manually.",
                    "user_id": response.user.id,
                    "email": response.user.email
                }

            # Return both user info and tokens
            print("Successfully signed up and logged in user")
            return {
                "message": "User signed up successfully!",
                "user_id": response.user.id,
                "email": response.user.email,
                "access_token": signin_response.session.access_token,
                "refresh_token": signin_response.session.refresh_token
            }
        except Exception as signin_error:
            # If auto-login fails, still consider signup successful
            print(f"Auto-login failed after signup: {str(signin_error)}")
            return {
                "message": "User signed up successfully but auto-login failed. Please log in manually.",
                "user_id": response.user.id,
                "email": response.user.email
            }
    except Exception as e:
        print("Error during signup:", str(e))
        print("Error details:", e)
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")



# **User Login Route**
@app.post("/api/login")
async def login(user: UserLogin):
    response = supabase.auth.sign_in_with_password({"email": user.email, "password": user.password})
    
    if response.user is None:
        raise HTTPException(status_code=400, detail=response.error.message)

    return {"access_token": response.session.access_token, "refresh_token": response.session.refresh_token}


# 🚀 3️⃣ **Protected Route (Requires Authentication)**
@app.get("/api/protected")
async def protected_route(user=Depends(get_current_user)):
    return {"message": "You have accessed a protected route!", "user": user}


# Routes
@app.get("/api/chat-history")
async def get_chat_history(user =Depends(get_current_user)):
    user_id = user.id
    try:
        logger.info(f"Fetching chat history for user {user_id}")
        
        response = supabase.table("ChatHistory") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at") \
            .execute()
        
        if not response.data:
            logger.info(f"No chat history found for user {user_id}")
            return {"messages": []}
            
        logger.info(f"Retrieved {len(response.data)} chat messages for user {user_id}")
        return {"messages": response.data}
    except Exception as e:
        logger.exception(f"Error retrieving chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve chat history: {str(e)}")

@app.post("/api/chat")
async def chat(message: ChatMessage, user =Depends(get_current_user)):
    user_id = user.id
    try:
        logger.info(f"Received chat message from user {user_id}: {message.message[:30]}...")
        
        # Get recent chat history
        chat_history = supabase.table("ChatHistory") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(10) \
            .execute()
        
        # Format chat history for OpenAI
        messages = [
            {"role": "system", "content": """You are an empathetic AI therapist named Therapost. 
            You help users process their thoughts and emotions through thoughtful conversation.
            Use the provided context about the user's journal entries and previous chat
            to give thoughtful, therapeutic responses. Focus on being supportive while
            maintaining professional boundaries. Avoid giving medical advice.
            Keep responses concise (2-3 paragraphs maximum) and focused on the user's immediate concerns.
            Ask thoughtful follow-up questions to deepen the conversation.
            """}
        ]
        
        # Add context if provided
        if message.context:
            messages.append({"role": "system", "content": f"Context from user's journal entries and previous chats: {message.context}"})
        
        # Add chat history
        if chat_history.data and len(chat_history.data) > 0:
            # Reverse to get chronological order and limit to last 5 messages
            relevant_history = list(reversed(chat_history.data))[:10]
            for chat in relevant_history:
                messages.append({"role": chat['role'], "content": chat['content']})
        
        # Add user's new message
        messages.append({"role": "user", "content": message.message})
        
        logger.info(f"Sending {len(messages)} messages to OpenAI")
        
        # Get response from OpenAI
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=1000,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        logger.info(f"Received response from OpenAI: {ai_response[:30]}...")
        
        # Save user message to database
        user_msg_response = supabase.table("ChatHistory").insert({
            "user_id": user_id,
            "role": "user",
            "content": message.message,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        if not user_msg_response.data:
            logger.warning(f"Failed to save user message to database: {user_msg_response}")
        
        # Save AI response to database
        ai_msg_response = supabase.table("ChatHistory").insert({
            "user_id": user_id,
            "role": "assistant",
            "content": ai_response,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        if not ai_msg_response.data:
            logger.warning(f"Failed to save AI response to database: {ai_msg_response}")
        
        return {"response": ai_response}
        
    except Exception as e:
        logger.exception(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/journal-dates")
async def get_journal_dates(user =Depends(get_current_user)):
    user_id = user.id
    try:
        response = supabase.table("Journals") \
            .select("created_at") \
            .eq("user_id", user_id) \
            .execute()
        
        # Extract dates from the response
        dates = [entry['created_at'] for entry in response.data]
        return {"dates": dates}
        
    except Exception as e:
        logger.exception("Error retrieving journal dates")
        raise HTTPException(status_code=500, detail=str(e))
        
@app.get("/")
def health_check():
    logger.info("Health check endpoint hit")
    return {"message": "API is running!"}

@app.get("/api/chat-sessions")
async def get_user_chat_sessions(user = Depends(get_current_user)):
    """
    Retrieves all chat sessions for the currently authenticated user.
    """
    user_id = user.id
    try:
        logger.info(f"Fetching chat sessions for user {user_id}")

        # Query the ChatSessions table in Supabase
        response = (
    supabase.table("ChatSessions")
    .select("session_id, created_at, notes")
    .eq("user_id", user_id)
    .order("created_at", desc=True)
    .execute()
)

        # Log the raw response from Supabase for debugging if needed
        # logger.debug(f"Supabase response for chat sessions: {response}")

        if not response.data:
            logger.info(f"No chat sessions found for user {user_id}")
            return {"sessions": []}

        logger.info(f"Retrieved {len(response.data)} chat sessions for user {user_id}")
        # Return the sessions in the format expected by the frontend
        return {"sessions": response.data}

    except Exception as e:
        logger.exception(f"Error retrieving chat sessions for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve chat sessions: {str(e)}")
    

    # Add this somewhere with your other route definitions in app.py

@app.post("/api/chat-sessions")
async def create_chat_session_endpoint(user = Depends(get_current_user)):
    """
    Creates a new chat session for the currently authenticated user for the current day,
    if one doesn't already exist.
    NOTE: Assumes the unique constraint on (user_id, session_date) is handled
          by the database or doesn't need explicit handling here if the frontend
          logic already prevents duplicate calls on the same day.
          A more robust version might handle unique constraint violations.
    """
    user_id = user.id
    try:
        logger.info(f"Attempting to create a new chat session for user {user_id}")

        # Insert a new session record.
        # The unique index unique_user_session_utc_date_idx will prevent duplicates
        # for the same user on the same UTC day if called multiple times.
        # We only need to insert the user_id; created_at defaults to now().
        # response = supabase.table("ChatSessions").insert({
        #     "user_id": user_id,
        #     # "notes": "New Session Started" # Optional: Add default notes if desired
        # }).select("session_id, created_at, notes").execute() # Select the columns needed

        response = supabase.table("ChatSessions").insert({
    "user_id": user_id,
    # "notes": "New Session Started" # Optional
}).execute() # Execute immediately after insert

        # Log the raw response for debugging
        # logger.debug(f"Supabase response for creating chat session: {response}")

        # Check if data was returned (successful insert)
        if response.data and len(response.data) > 0:
            new_session = response.data[0]
            logger.info(f"Successfully created new chat session {new_session['session_id']} for user {user_id}")
            # Return the session in the format expected by the frontend
            return {"session": new_session}
        else:
            # This case might happen if the insert failed silently or due to RLS/policy issues
            # not caught as exceptions, or if the unique constraint was violated but didn't error out cleanly (less likely)
            logger.error(f"Failed to create or retrieve session data after insert attempt for user {user_id}. Response: {response}")
            raise HTTPException(status_code=500, detail="Failed to create chat session.")

    except Exception as e:
        # Catch potential errors, including unique constraint violations if they raise exceptions
        # You could specifically check for PostgreSQL error codes (e.g., '23505' for unique_violation)
        # from e.pgcode if using psycopg2 exceptions directly, or parse the error message.
        logger.exception(f"Error creating chat session for user {user_id}: {str(e)}")
        # Improve error message if possible, e.g., detect unique violation
        if "unique constraint" in str(e).lower():
             raise HTTPException(status_code=409, detail="Chat session for today already exists.") # 409 Conflict
        raise HTTPException(status_code=500, detail=f"Failed to create chat session: {str(e)}")
    
@app.get("/api/chat-sessions/{session_id}/messages")
async def get_session_messages(session_id: str, user = Depends(get_current_user)):
    """
    Retrieves all messages for a specific chat session belonging to the user.
    """
    user_id = user.id

    
    
    # —— DEBUG BLOCK ——
    all_resp = supabase.table("ChatMessages").select("*").execute()
    logger.info(f"[DEBUG] total ChatMessages rows via supabase-py: {len(all_resp.data)}")
    logger.debug(f"[DEBUG] sample rows: {all_resp.data[:3] if all_resp.data else []}")
    
    filtered = supabase.table("ChatMessages") \
        .select("*") \
        .eq("session_id", session_id) \
        .execute()
    logger.info(f"[DEBUG] filtered rows for session={session_id}: {len(filtered.data)}")
    logger.debug(f"[DEBUG] filtered data: {filtered.data}")
    # —— END DEBUG ——
    
    try:
        # First, verify the session belongs to the user
        session_check = supabase.table("ChatSessions") \
            .select("session_id, user_id") \
            .eq("session_id", session_id) \
            .execute()
        
        logger.info(f"Session check returned {len(session_check.data)} rows: {session_check.data}")
        
        # Check if session exists and belongs to user
        user_session = [s for s in session_check.data if s['user_id'] == user_id]
        if not user_session:
            if session_check.data:
                logger.warning(f"Session {session_id} exists but doesn't belong to user {user_id}")
            else:
                logger.warning(f"Session {session_id} not found")
            return {"messages": []}
        
        logger.info(f"Session verified. Found session {session_id} for user {user_id}")
        
        # Use the filtered result directly instead of running another query
        response = filtered

        # Format the response data if needed
        formatted_messages = []
        for msg in response.data:
            formatted_messages.append({
                "content": msg.get("content"),
                "role": msg.get("role"),
                "created_at": msg.get("created_at"),
                "session_id": msg.get("session_id")
            })
        
        logger.info(f"Retrieved {len(formatted_messages)} messages for session {session_id}")
        return {"messages": formatted_messages or []}

    except Exception as e:
        logger.exception(f"Error retrieving messages for session {session_id}: {str(e)}")
        # Return empty array instead of error for better UX
        return {"messages": []}
    
@app.post("/api/chat-sessions/{session_id}/messages")
async def send_message_to_session(session_id: str, message_data: SessionMessageCreate, user = Depends(get_current_user)):
    """
    Adds a user message to a specific chat session and gets an AI response.
    """
    user_id = user.id
    user_message_content = message_data.message
    try:
        logger.info(f"Received message for session {session_id} from user {user_id}: {user_message_content[:30]}...")

        # --- 1. Verify session ownership (important!) ---
        # (Keep this check as is)
        session_check = supabase.table("ChatSessions") \
            .select("session_id") \
            .eq("session_id", session_id) \
            .eq("user_id", user_id) \
            .limit(1) \
            .execute()
        if not session_check.data:
            logger.warning(f"Attempt to send message to session {session_id} not owned by user {user_id}")
            raise HTTPException(status_code=403, detail="Access denied to this chat session.")

        # --- 2. Save User Message ---
        # REMOVE .select("*") here
        user_msg_response = supabase.table("ChatMessages").insert({
            "session_id": session_id,
            "user_id": user_id,
            "role": "user",
            "content": user_message_content,
            "created_at": datetime.utcnow().isoformat()
        }).execute() # Execute immediately after insert

        # Check response.data for inserted row
        if not user_msg_response.data or len(user_msg_response.data) == 0:
             logger.error(f"Failed to save user message or get data back for session {session_id}. Response: {user_msg_response}")
             raise HTTPException(status_code=500, detail="Could not save user message.")
        saved_user_message = user_msg_response.data[0]
        logger.info(f"Saved user message {saved_user_message.get('chat_id', 'UNKNOWN')} to session {session_id}")


        # --- 3. Prepare context for AI ---
        # (Keep this section as is)
        history_response = supabase.table("ChatMessages") \
            .select("role, content") \
            .eq("session_id", session_id) \
            .order("created_at", desc=True) \
            .limit(10) \
            .execute()

        openai_messages = [
             {"role": "system", "content": """You are an empathetic AI therapist named Therapost.
             Focus on reflective listening, asking clarifying questions, and helping the user explore their feelings.
             Keep responses supportive and concise (1-2 paragraphs). Avoid giving direct advice."""}
        ]
        if history_response.data:
             for msg in reversed(history_response.data):
                 openai_messages.append({"role": msg['role'], "content": msg['content']})


        # --- 4. Call OpenAI ---
        # (Keep this section as is)
        logger.info(f"Sending {len(openai_messages)} messages to OpenAI for session {session_id}")
        ai_completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=openai_messages,
            max_tokens=300,
            temperature=0.7
        )
        ai_response_content = ai_completion.choices[0].message.content
        logger.info(f"Received AI response for session {session_id}: {ai_response_content[:30]}...")

        # --- 5. Save AI Message ---
        # REMOVE .select("*") here
        ai_msg_response = supabase.table("ChatMessages").insert({
            "session_id": session_id,
            "user_id": user_id,
            "role": "assistant",
            "content": ai_response_content,
            "created_at": datetime.utcnow().isoformat()
        }).execute() # Execute immediately after insert

        # Check response.data for inserted row
        if not ai_msg_response.data or len(ai_msg_response.data) == 0:
             logger.error(f"Failed to save AI message or get data back for session {session_id}. Response: {ai_msg_response}")
             raise HTTPException(status_code=500, detail="Could not save AI response.")
        saved_ai_message = ai_msg_response.data[0]
        logger.info(f"Saved AI message {saved_ai_message.get('chat_id', 'UNKNOWN')} to session {session_id}")


        # --- 6. Return saved messages ---
        # (Keep this section as is)
        return {
            "userMessage": saved_user_message,
            "aiMessage": saved_ai_message
        }

    # (Keep except blocks as is)
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.exception(f"Error processing message for session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")
    

@app.post("/api/journal-summaries", response_model=JournalSummaryOut)
async def create_journal_summary(
    payload: JournalSummaryCreate,
    user=Depends(get_current_user)
):
    # 1) fetch raw journals
    journals = supabase.table("Journals") \
        .select("content") \
        .eq("user_id", user.id) \
        .gte("journal_date", payload.start_date.isoformat()) \
        .lte("journal_date", payload.end_date.isoformat()) \
        .order("journal_date") \
        .execute().data

    # 2) build prompt
    entries = "\n".join(f"- {j['content']}" for j in journals)
    prompt = (
        f"As an AI therapist, please summarize the user's journal entries. Focus on the users highs, lows, and emotinal changes "
        f"from {payload.start_date} to {payload.end_date}:\n\n{entries}"
    )

    # 3) call OpenAI
    ai_resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an empathetic summarizer."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=500
    ).choices[0].message.content

    # 4) persist summary
    try:
        result = supabase.table("JournalSummaries") \
            .insert([{
                "user_id":       user.id,
                "start_date":    payload.start_date.isoformat(),
                "end_date":      payload.end_date.isoformat(),
                "summary_text":  ai_resp
            }]) \
            .execute()
        
        # The insert returns a list of created records; return the first record to match JournalSummaryOut
        return result.data[0]
    except Exception as e:
        # Catch any errors and return as HTTP 500
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/journal-summaries", response_model=JournalSummaryOut)
async def get_journal_summary(
    start_date: date,
    end_date: date,
    user=Depends(get_current_user)
):
    # Query up to one matching summary
    res = supabase.table("JournalSummaries") \
        .select("*") \
        .eq("user_id", user.id) \
        .eq("start_date", start_date.isoformat()) \
        .eq("end_date", end_date.isoformat()) \
        .limit(1) \
        .execute()
    records = res.data or []
    if len(records) == 0:
        raise HTTPException(status_code=404, detail="Summary not found")
    return records[0]

@app.post("/api/chat-summaries", response_model=ChatSummaryOut)
async def create_chat_summary(
    payload: ChatSummaryCreate,
    user=Depends(get_current_user)
):
    # turn the UUID into a plain string
    session_id_str = str(payload.session_id)

    # fetch messages
    msgs = supabase.table("ChatMessages") \
        .select("role,content") \
        .eq("session_id", session_id_str) \
        .order("created_at") \
        .execute().data

    # build your conversation text…
    convo = "\n".join(f"{m['role']}: {m['content']}" for m in msgs)
    prompt = f"Please summarize this conversation:\n\n{convo}"

    ai_resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a concise summarizer."},
            {"role": "user",   "content": prompt}
        ],
        max_tokens=300
    ).choices[0].message.content

    # now insert using the string ID
    try:
        res = supabase.table("ChatSummaries") \
            .insert([{
                "user_id":      str(user.id),       # also ensure it's a string
                "session_id":   session_id_str,
                "summary_text": ai_resp
            }]) \
            .execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/chat-summaries", response_model=List[ChatSummaryOut])
async def list_chat_summaries(user=Depends(get_current_user)):
    result = supabase.table("ChatSummaries") \
        .select("*") \
        .eq("user_id", user.id) \
        .order("inserted_at", desc=True) \
        .execute()

    return result.data or []


@app.get("/api/user-profile", response_model=UserProfileOut)
async def get_user_profile(user=Depends(get_current_user)):
    res = supabase.table("UserProfiles") \
        .select("*") \
        .eq("user_id", user.id) \
        .single() \
        .execute()
    if res.data is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data

@app.put("/api/user-profile", response_model=UserProfileOut)
async def upsert_user_profile(
    payload: UserProfilePayload,
    user=Depends(get_current_user)
):
    res = supabase.table("UserProfiles") \
        .upsert([{
            "user_id":      user.id,
            "profile_data": payload.profile_data
        }], on_conflict=["user_id"]) \
        .select("*") \
        .single() \
        .execute()

    if res.data is None:
        raise HTTPException(status_code=500, detail="Failed to upsert user profile")
    return res.data
