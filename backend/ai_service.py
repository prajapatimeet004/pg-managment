from groq import Groq
import os
import json
from dotenv import load_dotenv
from typing import List, Dict, Any
from datetime import datetime

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

def process_ai_agent(user_message: str, data_context: Dict, chat_history: List[Dict] = None) -> Dict[str, Any]:
    """
    Process user message as an AI Agent with tool-calling capabilities.
    Supports multi-turn conversation via chat_history.
    chat_history: list of {"role": "user"|"assistant", "content": str}
    """
    if not client:
        return {
            "response": "Groq API key not configured. Please add GROQ_API_KEY to your .env file.",
            "tools_used": [],
            "data": {}
        }

    system_prompt = f"""
You are an AI Property Manager Agent for a PG (Paying Guest) management SaaS platform called "AI PG Management".
You have full access to all property data and can perform any management task.
- Register new tenants
- Send rent payment reminders (Real WhatsApp & SMS)
- Broadcast notices to all tenants of a property (Real WhatsApp & SMS)
- Generate reports and insights

Current System Data:
- Total Properties: {data_context.get('total_properties', 0)}
- Total Tenants: {data_context.get('total_tenants', 0)}
- Occupancy Rate: {data_context.get('occupancy_rate', 0)}%
- Monthly Revenue: ₹{data_context.get('monthly_revenue', 0):,}
- Overdue Rents: {data_context.get('overdue_rents', 0)} tenants
- Open Complaints: {data_context.get('open_complaints', 0)}

Properties: {json.dumps(data_context.get('properties', []), indent=None)}
Tenants Summary: {json.dumps(data_context.get('tenants_summary', []), indent=None)}
Overdue Tenants: {json.dumps(data_context.get('overdue_tenants', []), indent=None)}
Open Complaints: {json.dumps(data_context.get('open_complaints_list', []), indent=None)}

Your role:
1. Understand what the user needs from the conversation context
2. Provide helpful, actionable insights based on the live data
3. Answer questions about specific tenants, properties, rooms, complaints
4. Proactively suggest improvements
5. Be professional, friendly, speak like a property management expert
6. **MESSAGING CAPABILITY**: You can now send real WhatsApp and SMS messages. 
   - When a user asks to "send reminders", confirm they want to trigger real SMS/WhatsApp messages.
   - When a user asks to "broadcast a notice" or "notify all tenants", understand which property they mean and what the message is.
   - Always refer to the actual data — names, amounts, statuses — not generic placeholders.
"""

    # Build messages array with full history
    messages = [{"role": "system", "content": system_prompt}]
    
    if chat_history:
        # only include last 20 turns to stay within token limits
        for turn in chat_history[-20:]:
            role = turn.get("role", "user")
            content = turn.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
    
    # Add the current user message
    messages.append({"role": "user", "content": user_message})

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=2048,
        )
        response_text = completion.choices[0].message.content
        
        return {
            "response": response_text,
            "tools_used": [],
            "data": data_context,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "response": f"I encountered an error: {str(e)}",
            "tools_used": [],
            "data": {},
            "error": str(e)
        }
