# AI Agent Setup Guide

## Overview

Your AI PG Management SaaS now has a **full-featured AI Agent** with complete access to your property management system. The AI agent can:

✅ View all properties, tenants, rooms, and complaints
✅ Analyze occupancy rates, revenue, and trends
✅ Send notices and reminders to tenants
✅ Register new tenants and create complaints
✅ Update complaint statuses
✅ Provide intelligent insights and recommendations
✅ Execute bulk operations (send reminders to all overdue tenants, etc.)

## Features

### 1. **Full Data Access**
The AI agent has real-time access to:
- All properties with detailed information
- Tenant data (names, contact info, rent status)
- Complaint/maintenance requests
- Room occupancy details
- Rent collection records
- System notices

### 2. **Intelligent Actions**
The AI can perform:
- Send rent payment reminders to tenants
- Analyze occupancy rates per property
- Generate revenue reports
- Create maintenance complaints
- Send notices to specific properties
- Register new tenants
- Update complaint statuses

### 3. **Natural Language Understanding**
Simply ask the AI in plain English:
- "Send rent reminders to overdue tenants"
- "What's the occupancy rate?"
- "Show me all complaints in Sunshine PG"
- "How much revenue did we collect this month?"
- "Register a new tenant in Green Valley PG"
- "Mark the AC complaint as resolved"

## How to Use

### Starting the Backend
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### Starting the Frontend
```bash
npm install
npm run dev
```

### Using the AI Assistant
1. Navigate to the **AI Assistant** page
2. Type your request in the chat box
3. The AI will process your request and provide insights or execute actions
4. The AI has access to all your business data and can answer any management question

## API Endpoints

### Main AI Agent Endpoint
```
POST /ai/agent
```
Processes natural language queries with full system access.

**Request:**
```json
{
  "message": "Send rent reminders to overdue tenants"
}
```

**Response:**
```json
{
  "response": "I've sent payment reminders to 2 tenants with overdue rent...",
  "tools_used": [],
  "data": {
    "total_properties": 3,
    "total_tenants": 10,
    "occupancy_rate": 88,
    "monthly_revenue": 778000,
    "overdue_rents": 2,
    "open_complaints": 2
  }
}
```

### Helper Endpoints
```
POST /ai/send-rent-reminders - Send reminders to overdue tenants
POST /ai/property-analysis - Get property performance analysis
GET  /ai/tenant-search/{property_id} - Get tenants in specific property
```

## Example Queries

### Financial Management
- "How much total revenue did we collect?"
- "Which property is most profitable?"
- "Show me the occupancy rate for each property"
- "How many tenants have overdue rent?"

### Tenant Management
- "Register a new tenant in Sunshine PG"
- "Show all tenants in Green Valley"
- "What's the contact info for Rahul?"
- "Send a notice to all tenants"

### Complaint Management
- "Show all urgent complaints"
- "Mark complaint #5 as resolved"
- "How many maintenance issues are open?"
- "Create a new complaint for water leakage"

### Reports & Analysis
- "Generate an occupancy report"
- "Send payment reminders"
- "What's the current business status?"
- "Analyze revenue trends"

## Architecture

### Frontend (React)
- **AIAssistant.jsx** - Chat interface with real-time messaging
- **api.js** - API client with `postAIAgent()` method

### Backend (FastAPI + Python)
- **main.py** - API endpoints and helper functions
- **ai_service.py** - AI agent processing with Groq LLM
- **models.py** - Database models
- **database.py** - Database connection

### AI Engine
- Uses **Groq API** with Llama 3.3 70B model
- Context-aware responses based on real system data
- Intelligent action execution

## Environment Setup

Make sure you have a `.env` file in the backend directory:
```
GROQ_API_KEY=your_groq_api_key_here
```

Get your Groq API key from: https://console.groq.com

## Key Features Explained

### 1. Context-Aware Responses
The AI receives all current system data:
- Total properties, tenants, occupancy rates
- Overdue rent count, open complaints
- Property-specific information
- List of overdue tenants with contact info

### 2. Natural Language Processing
The AI understands various ways to ask for the same thing:
- "Send reminders" / "Remind tenants to pay" / "Payment notifications"
- "Occupancy?" / "How full are we?" / "Room utilization"

### 3. Real-time Data Access
Every request fetches current data from the database:
- No cached/stale information
- Always working with the latest tenant, complaint, and property data

### 4. Bulk Operations
The AI can perform actions across multiple records:
- Send reminders to all overdue tenants at once
- Analyze all properties together
- Generate system-wide reports

## Security Notes

- The AI agent has full read access to all data
- It can create notices, complaints, and update records
- In production, consider adding authentication and role-based access control
- Audit logging is recommended for compliance

## Troubleshooting

### "Groq API key not configured"
- Add `GROQ_API_KEY` to your `.env` file in the backend directory
- Restart the backend server

### "Connection refused"
- Make sure backend is running on port 8000
- Check that `API_BASE_URL` in `api.js` matches your backend URL

### Slow responses
- Check your internet connection (Groq API requires connectivity)
- Verify your Groq API key is valid
- Check rate limits on your Groq account

## Future Enhancements

Potential additions to the AI agent:
- Email/SMS notifications integration
- Scheduled tasks (e.g., auto-send reminders on specific dates)
- Predictive analytics (occupancy trends, revenue forecasting)
- Document generation (receipts, notices)
- Multi-language support
- Voice interface

## Support

For issues or questions about the AI agent setup, check:
- Groq documentation: https://console.groq.com/docs
- FastAPI docs: https://fastapi.tiangolo.com
- React docs: https://react.dev

---

**Your AI Agent is now ready to manage your properties!** 🚀
