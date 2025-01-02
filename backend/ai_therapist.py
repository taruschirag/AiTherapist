import openai
import logging
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Configure OpenAI API
openai.api_key = os.getenv("OPENAI_API_KEY")


class TherapistInsights(BaseModel):
    insights: str
    reflections: List[str]
    suggested_actions: List[str]


class AITherapist:
    @staticmethod
    def generate_insights(journal: str, goals: dict) -> TherapistInsights:
        try:
            # Construct a comprehensive prompt for the AI therapist
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

            # Use OpenAI's Chat Completion API
            response = openai.ChatCompletion.create(
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
                temperature=0.7  # Balanced between creativity and focus
            )

            # Extract the AI's response
            ai_response = response.choices[0].message.content

            # Process the response into structured insights
            return AITherapist._parse_therapist_response(ai_response)

        except Exception as e:
            logger.error(f"Error generating AI therapeutic insights: {e}")
            raise

    @staticmethod
    def _parse_therapist_response(response_text: str) -> TherapistInsights:
        """
        Parse the AI's response into structured insights
        """
        # Simple parsing strategy - can be made more sophisticated
        # First paragraph as main insights
        insights = response_text.split('\n\n')[0]

        # Extract reflections and suggested actions
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
            reflections=reflections[:3],  # Limit to top 3
            suggested_actions=suggested_actions[:3]  # Limit to top 3
        )

    @staticmethod
    def continue_conversation(message: str) -> str:
        """
        Continue a therapeutic conversation
        """
        try:
            response = openai.ChatCompletion.create(
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

        except Exception as e:
            logger.error(f"Conversation error: {e}")
            raise
