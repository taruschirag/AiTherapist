import logging.config
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import logging
import openai
from typing import List, Optional
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
openai.api_key = os.getenv("OPENAI_API_KEY")


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
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models


class Goals(BaseModel):
    yearly: str
    monthly: str
    weekly: str


class GoalsJournalsRequest(BaseModel):
    goals: Goals
    journal: str

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


# Helper Functions


# Helper function to validate JWT token
async def get_current_user(authorization: Optional[str] = Header(None)):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    token = authorization.replace("Bearer ", "")
    response = supabase.auth.get_user(token)
    if response.data is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return response.data  # Returns user details

# 🚀 1️⃣ **User Signup Route**
@app.post("/api/signup")
async def signup(user: UserSignup):
    response = supabase.auth.sign_up({"email": user.email, "password": user.password})
    
    if response.data is None:
        raise HTTPException(status_code=400, detail=response.error.message)
    
    return {"message": "User signed up successfully!", "user": response.data}


# 🚀 2️⃣ **User Login Route**
@app.post("/api/login")
async def login(user: UserLogin):
    response = supabase.auth.sign_in_with_password({"email": user.email, "password": user.password})
    
    if response.data is None:
        raise HTTPException(status_code=400, detail=response.error.message)

    return {"access_token": response.session.access_token, "refresh_token": response.session.refresh_token}


# 🚀 3️⃣ **Protected Route (Requires Authentication)**
@app.get("/api/protected")
async def protected_route(user=Depends(get_current_user)):
    return {"message": "You have accessed a protected route!", "user": user}


async def get_latest_therapist_insight_date(user_id: str) -> Optional[str]:
    response = supabase.table("TherapistInsights") \
        .select("created_at") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()

    if response.data and len(response.data) > 0:
        return response.data[0]['created_at']
    return None


async def get_goals_and_journals(user_id: str, last_insight_date: Optional[str] = None) -> dict:
    query_goals = supabase.table("Goals").select("*").eq("user_id", user_id)
    query_journals = supabase.table(
        "Journals").select("*").eq("user_id", user_id)

    # Only filter by date if last_insight_date is provided
    if last_insight_date:
        query_goals = query_goals.gte("created_at", last_insight_date)
        query_journals = query_journals.gte("created_at", last_insight_date)

    goals_response = query_goals.execute()
    journals_response = query_journals.execute()

    return {
        "goals": goals_response.data,
        "journals": journals_response.data
    }


async def generate_therapist_insights(data: dict) -> str:
    try:
        logger.info("Formatting data for OpenAI prompt")

        # Format goals and journals for the prompt
        formatted_goals = "\n".join(
            [f"- {goal['type']}: {goal['content']}" for goal in data['goals']])
        formatted_journals = "\n".join(
            [f"- {journal['content']}" for journal in data['journals']])

        logger.info("Creating prompt for OpenAI")
        prompt = f"""As an AI therapist, analyze the following goals and journal entries:

Goals:
{formatted_goals}

Journal Entries:
{formatted_journals}

Please provide therapeutic insights, patterns observed, and suggestions for personal growth. 
Focus on emotional patterns, behavioral trends, and potential areas for development."""

        logger.info("Sending request to OpenAI")
        client = openai.OpenAI()  # Create client instance
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an empathetic AI therapist."},
                {"role": "user", "content": prompt}
            ],
            
            max_tokens=1000
        )
        logger.info("Received response from OpenAI")

        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error in generate_therapist_insights: {str(e)}")
        raise Exception(f"Failed to generate insights: {str(e)}")

# Routes


@app.post("/api/goals-journals")
async def save_goals_and_journal(data: GoalsJournalsRequest):
    user_id = 'ea86ffe8-b184-4dc5-b8fa-0ad52768c913'
    try:
        logger.info(f"Processing data: {data}")

        for goal_type, content in data.goals.model_dump().items():
            response = supabase.table("Goals").insert(
                {"user_id": user_id, "type": goal_type, "content": content}).execute()

            if response.data is None and response.error is not None:
                logger.error(
                    f"Error saving goal ({goal_type}): {response.error}")
                raise HTTPException(
                    status_code=500, detail=f"Error saving goal ({goal_type}): {response.error}")

        response = supabase.table("Journals").insert(
            {"user_id": user_id, "content": data.journal}).execute()

        if response.data is None and response.error is not None:
            logger.error(f"Error saving journal: {response.error}")
            raise HTTPException(
                status_code=500, detail=f"Error saving journal: {response.error}")

        return {"message": "Data saved successfully!"}

    except Exception as e:
        logger.exception("Unexpected error occurred")
        raise HTTPException(
            status_code=500, detail=f"Unexpected error occurred: {str(e)}")


@app.post("/api/generate-insights")
async def generate_insights():
    user_id = 'ea86ffe8-b184-4dc5-b8fa-0ad52768c913'
    try:
        # Get the date of the last insight
        last_insight_date = await get_latest_therapist_insight_date(user_id)

        # Get data - if no last_insight_date, it will get all goals and journals
        data = await get_goals_and_journals(user_id, last_insight_date)

        # Check if there's any data to analyze
        if not data['goals'] and not data['journals']:
            return {"insights": "No new data available for analysis."}

        # Generate insights using OpenAI
        insights = await generate_therapist_insights(data)

        # Save insights to Supabase
        response = supabase.table("TherapistInsights").insert({
            "user_id": user_id,
            "content": insights,
            "created_at": datetime.utcnow().isoformat()
        }).execute()

        if response.data is None and response.error is not None:
            raise HTTPException(
                status_code=500, detail="Failed to save insights")

        return {"insights": insights}

    except Exception as e:
        logger.exception("Error generating insights")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/insights")
async def get_insights():
    user_id = 'ea86ffe8-b184-4dc5-b8fa-0ad52768c913'
    try:
        response = supabase.table("TherapistInsights") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()

        if response.data and len(response.data) > 0:
            return {"insights": response.data[0]['content']}
        return {"insights": "No insights available yet."}

    except Exception as e:
        logger.exception("Error retrieving insights")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat-history")
async def get_chat_history():
    user_id = 'ea86ffe8-b184-4dc5-b8fa-0ad52768c913'
    try:
        response = supabase.table("ChatHistory") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", asc=True) \
            .execute()
        
        return {"messages": response.data}
    except Exception as e:
        logger.exception("Error retrieving chat history")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(message: ChatMessage):
    user_id = 'ea86ffe8-b184-4dc5-b8fa-0ad52768c913'
    try:
        # Get recent chat history
        chat_history = supabase.table("ChatHistory") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(10) \
            .execute()
        
        # Format chat history for OpenAI
        messages = [
            {"role": "system", "content": """You are an empathetic AI therapist. 
            Use the provided context about the user's journal entries and previous chat
            to give thoughtful, therapeutic responses. Focus on being supportive while
            maintaining professional boundaries. Avoid giving medical advice."""}
        ]
        
        # Add context if provided
        if message.context:
            messages.append({"role": "system", "content": f"Context from user's journal entries and goals: {message.context}"})
        
        # Add chat history
        for chat in reversed(chat_history.data):
            messages.append({"role": chat['role'], "content": chat['content']})
        
        # Add user's new message
        messages.append({"role": "user", "content": message.message})
        
        # Get response from OpenAI
        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            max_tokens=1000
        )
        
        ai_response = response.choices[0].message.content
        
        # Save user message to database
        supabase.table("ChatHistory").insert({
            "user_id": user_id,
            "role": "user",
            "content": message.message,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        # Save AI response to database
        supabase.table("ChatHistory").insert({
            "user_id": user_id,
            "role": "assistant",
            "content": ai_response,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        return {"response": ai_response}
        
    except Exception as e:
        logger.exception("Error in chat endpoint")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/journal-dates")
async def get_journal_dates():
    user_id = 'ea86ffe8-b184-4dc5-b8fa-0ad52768c913'
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
