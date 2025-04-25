import openai
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Get the API key
api_key = os.getenv("OPENAI_API_KEY")
print("Loaded key:", api_key)

# Initialize the OpenAI client
client = openai.OpenAI(api_key=api_key)

# Send a test message
try:
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",  # or "gpt-4"
        messages=[{"role": "user", "content": "Hello, what is 2 +2 = ?"}]
    )
    print("✅ API key is working. Response:")
    print(response.choices[0].message.content)

except openai.AuthenticationError:
    print("❌ Invalid API key.")
except Exception as e:
    print(f"⚠️ Error: {e}")
