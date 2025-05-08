import logging
import os
from dotenv import load_dotenv
from typing import List
from pydantic import BaseModel
from openai import OpenAI, OpenAIError

# Load environment variables
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
print("Loaded key:", api_key)

# Initialize the OpenAI client
client = OpenAI(api_key=api_key)

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class TherapistInsights(BaseModel):
    insights: str
    reflections: List[str]
    suggested_actions: List[str]

class AITherapist:
    @staticmethod
    def generate_insights(journal: str, goals: dict) -> TherapistInsights:
        try:
            prompt = f"""
            You are a compassionate AI therapist analyzing a user's journal entry and goals.

            Journal Entry:
            {journal}

            Personal Goals:
            Yearly Goal: {goals.get('yearly', 'Not specified')}
            Monthly Goal: {goals.get('monthly', 'Not specified')}
            Weekly Goal: {goals.get('weekly', 'Not specified')}

            Please provide:
            1. Emotional insights from the journal entry
            2. Reflections on the user's progress towards their goals
            3. Constructive suggestions for personal growth
            4. Specific, actionable steps the user can take

            Respond with empathy, focusing on support and positive growth.
            """.strip()

            response = client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a compassionate, professional AI therapist focused on supportive, constructive dialogue."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=500,
                temperature=0.7
            )

            ai_response = response.choices[0].message.content
            return AITherapist._parse_therapist_response(ai_response)

        except OpenAIError as e:
            logger.error(f"OpenAI API error during insights generation: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise

    @staticmethod
    def _parse_therapist_response(response_text: str) -> TherapistInsights:
        insights = response_text.split('\n\n')[0]

        reflections = [
            line.strip() for line in response_text.split('\n')
            if line.strip().startswith(('Reflection:', 'Note:', 'Observation:'))
        ]

        suggested_actions = [
            line.strip() for line in response_text.split('\n')
            if line.strip().startswith(('Suggestion:', 'Action:', 'Step:'))
        ]

        return TherapistInsights(
            insights=insights,
            reflections=reflections[:3],
            suggested_actions=suggested_actions[:3]
        )

    @staticmethod    
    def continue_conversation(message: str) -> str:
        try:
            response = client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a compassionate, professional AI therapist. Respond with empathy and support."
                    },
                    {
                        "role": "user",
                        "content": message
                    }
                ],
                max_tokens=300,
                temperature=0.7
            )

            return response.choices[0].message.content

        except OpenAIError as e:
            logger.error(f"OpenAI API error during conversation: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise
