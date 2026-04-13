from groq import Groq
import os
from dotenv import load_dotenv
from typing import List, Dict

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if GROQ_API_KEY:
    client = Groq(api_key=GROQ_API_KEY)
else:
    client = None

def get_ai_insight(context: Dict) -> str:
    if not client:
        return "Groq API key not configured. Please add GROQ_API_KEY to your .env file."
    
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
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Error generating AI insight: {str(e)}"

def process_chat(user_message: str, chat_history: List[Dict]) -> str:
    if not client:
        return "Groq API key not configured. Please add GROQ_API_KEY to your .env file."
    
    system_prompt = "You are a helpful AI Assistant for a PG Indian management system. Be concise and friendly."
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=2048,
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"I encountered an error while processing your request: {str(e)}"
