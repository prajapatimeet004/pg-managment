from google import genai
import os
from dotenv import load_dotenv
from typing import List, Dict

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
else:
    client = None

def get_ai_insight(context: Dict) -> str:
    if not client:
        return "Gemini API key not configured. Please add GEMINI_API_KEY to your .env file."
    
    prompt = f"""
    You are an AI Property Manager for a PG (Paying Guest) management SaaS.
    Based on the following property data, provide 3 short, actionable insights or recommendations for the owner.
    Keep the tone professional and helpful.
    
    Data Context:
    - Total Properties: {context.get('total_properties')}
    - Occupancy Rate: {context.get('occupancy_rate')}%
    - Overdue Rents: {context.get('overdue_rents')} tenants
    - Open Complaints: {context.get('open_complaints')}
    
    Example Insights:
    1. Send payment reminders to the 2 tenants with overdue rent.
    2. Review the maintenance schedule for 'Sunshine PG' given the high number of complaints.
    3. Consider a referral program to fill the 12% vacancy in 'Green Valley PG'.
    
    Provide exactly 3 bullet points.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"Error generating AI insight: {str(e)}"

def process_chat(user_message: str, chat_history: List[Dict]) -> str:
    if not client:
        return "Gemini API key not configured. I'm currently in offline mode using mock responses."
    
    system_prompt = "You are a helpful AI Assistant for a PG Indian management system. Be concise and friendly."
    
    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=f"{system_prompt}\n\nUser: {user_message}"
        )
        return response.text
    except Exception as e:
        return f"I encountered an error while processing your request: {str(e)}"
