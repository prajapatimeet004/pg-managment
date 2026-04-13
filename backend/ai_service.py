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

# Tool definitions for AI Agent
TOOLS = [
    {
        "name": "get_properties",
        "description": "Get all properties with their details",
        "parameters": {}
    },
    {
        "name": "get_tenants",
        "description": "Get all tenants information",
        "parameters": {}
    },
    {
        "name": "get_complaints",
        "description": "Get all complaints/maintenance requests",
        "parameters": {}
    },
    {
        "name": "get_stats",
        "description": "Get overall business statistics like occupancy rate, revenue, overdue rents",
        "parameters": {}
    },
    {
        "name": "get_rooms",
        "description": "Get all rooms information",
        "parameters": {}
    },
    {
        "name": "get_notices",
        "description": "Get all notices sent to tenants",
        "parameters": {}
    },
    {
        "name": "get_rent_transactions",
        "description": "Get rent collection history",
        "parameters": {}
    },
    {
        "name": "create_notice",
        "description": "Send a notice/message to tenants",
        "parameters": {
            "title": "str - Title of notice",
            "content": "str - Content/message",
            "property_id": "int - Property ID",
            "created_by": "str - Who is creating this"
        }
    },
    {
        "name": "create_complaint",
        "description": "Register a new complaint or maintenance request",
        "parameters": {
            "tenant_id": "int - Tenant ID",
            "tenant_name": "str - Tenant name",
            "property_id": "int - Property ID",
            "property_name": "str - Property name",
            "category": "str - Category (Maintenance/Electrical/Plumbing etc)",
            "title": "str - Complaint title",
            "description": "str - Detailed description",
            "priority": "str - Priority (low/medium/high)"
        }
    },
    {
        "name": "update_complaint_status",
        "description": "Update status of a complaint (open/in-progress/resolved/closed)",
        "parameters": {
            "complaint_id": "int - Complaint ID",
            "status": "str - New status"
        }
    },
    {
        "name": "create_tenant",
        "description": "Add a new tenant to a property",
        "parameters": {
            "name": "str - Tenant name",
            "phone": "str - Phone number",
            "email": "str - Email address",
            "property_id": "int - Property ID",
            "room_number": "str - Room number",
            "bed_number": "str - Bed number",
            "rent_amount": "float - Monthly rent",
            "rent_due_date": "str - Due date (YYYY-MM-DD)",
            "join_date": "str - Join date (YYYY-MM-DD)",
            "advance": "float - Advance amount"
        }
    },
    {
        "name": "send_rent_reminders",
        "description": "Send payment reminders to tenants with overdue or due rent",
        "parameters": {}
    },
    {
        "name": "analyze_occupancy",
        "description": "Analyze occupancy rate and vacancy analysis",
        "parameters": {}
    },
    {
        "name": "get_revenue_report",
        "description": "Get revenue analysis and trends",
        "parameters": {}
    },
    {
        "name": "search_tenants_by_property",
        "description": "Get all tenants in a specific property",
        "parameters": {
            "property_id": "int - Property ID"
        }
    }
]

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

def get_required_fields(entity_type: str) -> Dict[str, str]:
    """Get required fields for adding different entity types"""
    fields = {
        "tenant": {
            "name": "Tenant's full name",
            "phone": "Phone number (e.g., +91 98765 43210)",
            "email": "Email address",
            "property_id": "Property ID (numeric)",
            "room_number": "Room number (e.g., 101, 202)",
            "bed_number": "Bed number (A, B, C, etc.)",
            "rent_amount": "Monthly rent amount (numeric)",
            "join_date": "Join date (YYYY-MM-DD)",
            "rent_due_date": "Rent due date (YYYY-MM-DD)",
            "advance": "Advance amount (numeric)"
        },
        "complaint": {
            "tenant_name": "Tenant's name",
            "property_id": "Property ID",
            "category": "Category (Maintenance/Electrical/Plumbing/Cleaning/Other)",
            "title": "Complaint title (brief)",
            "description": "Detailed description",
            "priority": "Priority (low/medium/high)"
        },
        "notice": {
            "title": "Notice title",
            "content": "Notice content/message",
            "property_id": "Property ID (numeric)",
        }
    }
    return fields.get(entity_type.lower(), {})

def should_ask_for_fields(user_message: str) -> tuple:
    """
    Check if user is asking to add/create something
    Returns (should_ask, entity_type)
    """
    message_lower = user_message.lower()
    
    if any(word in message_lower for word in ["add tenant", "register tenant", "new tenant", "add new tenant"]):
        return True, "tenant"
    elif any(word in message_lower for word in ["add complaint", "register complaint", "new complaint", "report complaint"]):
        return True, "complaint"
    elif any(word in message_lower for word in ["add notice", "send notice", "create notice", "new notice"]):
        return True, "notice"
    
    return False, ""

def format_field_request(entity_type: str, fields: Dict[str, str]) -> str:
    """Format a message asking for required fields"""
    field_list = "\n".join([f"• {field}: {description}" for field, description in fields.items()])
    return f"""I'll help you add a new {entity_type}. Please provide the following information:

{field_list}

You can provide all the information at once or one item at a time."""

def process_ai_agent(user_message: str, data_context: Dict) -> Dict[str, Any]:
    """
    Process user message as an AI Agent with tool-calling capabilities.
    The AI can access all data and perform operations.
    When user asks to add something, ask for required fields first.
    """
    if not client:
        return {
            "response": "Groq API key not configured. Please add GROQ_API_KEY to your .env file.",
            "tools_used": [],
            "data": {}
        }
    
    # Check if user is asking to add something
    should_ask, entity_type = should_ask_for_fields(user_message)
    if should_ask:
        required_fields = get_required_fields(entity_type)
        field_request = format_field_request(entity_type, required_fields)
        return {
            "response": field_request,
            "asking_for_fields": True,
            "entity_type": entity_type,
            "required_fields": required_fields,
            "timestamp": datetime.now().isoformat()
        }
    
    system_prompt = f"""
You are an AI Property Manager Agent for a PG (Paying Guest) management SaaS platform called "AI PG Management".
You have full access to all property data and can perform any management task.

Available actions:
- View all properties, tenants, rooms, complaints, notices, and transactions
- Analyze occupancy rates, revenue, and trends
- Send notices/messages to tenants
- Create and update complaints/maintenance requests
- Register new tenants
- Send rent payment reminders
- Generate reports and insights

Current System Data:
- Total Properties: {data_context.get('total_properties', 0)}
- Total Tenants: {data_context.get('total_tenants', 0)}
- Occupancy Rate: {data_context.get('occupancy_rate', 0)}%
- Monthly Revenue: ₹{data_context.get('monthly_revenue', 0)}
- Overdue Rents: {data_context.get('overdue_rents', 0)} tenants
- Open Complaints: {data_context.get('open_complaints', 0)}

Your role is to:
1. Understand what the user needs
2. Explain what data you're accessing or actions you're taking
3. Provide helpful, actionable insights
4. Execute tasks that the user requests
5. When user provides data to add/create something, acknowledge what they're providing
6. Proactively suggest improvements based on data

Be professional, friendly, and speak like a property management expert. Always acknowledge the user's request and explain what you're doing.
When users provide information, confirm what you understood and ask if they want to save it.
"""

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
