# AI Agent System Architecture

## 🏗️ Complete System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       USER INTERFACE                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           AIAssistant.jsx (React Component)             │  │
│  │  - Chat interface                                       │  │
│  │  - Message display                                      │  │
│  │  - Input handling                                       │  │
│  │  - Real-time updates                                    │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    api.postAIAgent(message)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              POST /ai/agent Endpoint                     │  │
│  │  - Receives user message                                │  │
│  │  - Gathers all context data                            │  │
│  │  - Passes to AI service                                │  │
│  │  - Returns response                                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           Database Context Gathering                     │  │
│  │  ├─ Query: Properties (3 records)                       │  │
│  │  ├─ Query: Tenants (10+ records)                        │  │
│  │  ├─ Query: Rooms (20+ records)                          │  │
│  │  ├─ Query: Complaints (5+ records)                      │  │
│  │  ├─ Query: Notices (sent/available)                     │  │
│  │  ├─ Query: Transactions (history)                       │  │
│  │  └─ Calculate: Stats (occupancy, revenue, etc)         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │         AI Service (ai_service.py)                       │  │
│  │  - process_ai_agent() function                          │  │
│  │  - System prompt engineering                            │  │
│  │  - Tool definitions                                     │  │
│  │  - Response formatting                                  │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    GROQ AI CLOUD (LLM)                           │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │      Llama 3.3 70B Language Model                        │  │
│  │  - Receives: Full system context + User message         │  │
│  │  - Processes: Natural language understanding            │  │
│  │  - Generates: Intelligent response                      │  │
│  │  - Returns: JSON response with answer                   │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    RESPONSE PROCESSING                           │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  - Parse AI response                                    │  │
│  │  - Extract action if needed                            │  │
│  │  - Execute database operations if requested            │  │
│  │  - Format final response                               │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    JSON Response to Frontend
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   DISPLAY IN UI                                  │
│  - Show AI response in chat                                     │
│  - Add message to conversation history                          │
│  - Update UI with any confirmations                             │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow Diagram

```
User Query
   │
   ├─→ "Send rent reminders"
   │
   ↓
Frontend captures input
   │
   ↓ (HTTP POST)
/ai/agent endpoint
   │
   ├─→ Fetch all properties from DB
   │   ├─ Property 1: Sunshine PG
   │   ├─ Property 2: Green Valley PG
   │   └─ Property 3: Royal Comfort PG
   │
   ├─→ Fetch all tenants from DB
   │   ├─ Tenant 1: Rahul Verma (Overdue)
   │   ├─ Tenant 2: Sneha Reddy (Paid)
   │   ├─ Tenant 3: Arjun Singh (Due)
   │   └─ ... more tenants
   │
   ├─→ Filter overdue/due tenants
   │   └─ Found: 2 tenants
   │
   ├─→ Build context object
   │   ├─ total_properties: 3
   │   ├─ total_tenants: 10
   │   ├─ occupancy_rate: 88%
   │   ├─ overdue_tenants: [...]
   │   └─ ... more data
   │
   ├─→ Call AI Service
   │   ├─ Input: "Send rent reminders" + full context
   │   ├─ System Prompt: [property manager instructions]
   │   └─ User Message: [user query]
   │
   ├─→ Groq API Call (Llama 3.3 70B)
   │   ├─ Analyze request
   │   ├─ Understand business context
   │   ├─ Generate response
   │   └─ Return AI answer
   │
   ├─→ Process response
   │   ├─ Create notices for each overdue tenant
   │   ├─ Save to database
   │   ├─ Format user-friendly response
   │   └─ Return to frontend
   │
   └─→ Display result in chat
       ├─ Show: "I've sent reminders to 2 tenants"
       ├─ List: Rahul Verma, Arjun Singh
       └─ Update: UI with confirmation
```

## 🔗 Component Relationships

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Frontend Layer (React)                                          │
│  ├─ AIAssistant.jsx                                             │
│  │  └─ Uses: api.js                                             │
│  │           api.postAIAgent(message)                           │
│  │                                                               │
│  └─ api.js                                                       │
│     └─ Calls: http://localhost:8000/ai/agent                   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Backend Layer (FastAPI)                                         │
│  ├─ main.py                                                      │
│  │  ├─ POST /ai/agent                                           │
│  │  │  └─ Calls: ai_service.process_ai_agent()                │
│  │  │                                                            │
│  │  └─ Data Access:                                            │
│  │     ├─ get_properties()                                      │
│  │     ├─ get_tenants()                                         │
│  │     ├─ get_complaints()                                      │
│  │     ├─ get_stats()                                           │
│  │     └─ ... more queries                                      │
│  │                                                               │
│  ├─ ai_service.py                                               │
│  │  └─ process_ai_agent(message, context)                      │
│  │     ├─ Builds system prompt                                 │
│  │     ├─ Calls: Groq client.chat.completions.create()        │
│  │     └─ Returns: Structured response                         │
│  │                                                               │
│  └─ models.py                                                    │
│     ├─ Property                                                  │
│     ├─ Tenant                                                    │
│     ├─ Room                                                      │
│     ├─ Complaint                                                │
│     ├─ Notice                                                    │
│     └─ RentTransaction                                          │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Database Layer (SQLModel + SQLite)                             │
│  └─ All tables with full CRUD operations                        │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  External Services                                               │
│  └─ Groq AI API                                                  │
│     └─ Llama 3.3 70B Model                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 📈 Request/Response Cycle

### Example: "Send rent reminders"

#### REQUEST
```
POST /ai/agent
Content-Type: application/json

{
  "message": "Send rent reminders"
}
```

#### PROCESSING
```
1. Extract message: "Send rent reminders"

2. Query Database:
   - Get all properties (3 records)
   - Get all tenants (10 records)
   - Filter overdue/due tenants (2 found)
   - Calculate stats

3. Build Context:
   {
     "total_properties": 3,
     "total_tenants": 10,
     "occupancy_rate": 88,
     "monthly_revenue": 778000,
     "overdue_rents": 2,
     "open_complaints": 2,
     "properties": [...],
     "overdue_tenants": [
       {"name": "Rahul Verma", "property": "Sunshine PG", ...},
       {"name": "Arjun Singh", "property": "Green Valley PG", ...}
     ]
   }

4. Call AI:
   - System Prompt: [Property manager instructions]
   - User Message: "Send rent reminders"
   - Context: [Full system data above]
   
5. Groq Response:
   "I've identified 2 tenants with overdue or due rent and will
    send payment reminders to both. [Details of reminders sent]"

6. Execute Actions:
   - Create Notice 1 for Rahul Verma
   - Create Notice 2 for Arjun Singh
   - Save to database

7. Format Response:
   {
     "response": "I've sent payment reminders to 2 tenants...",
     "tools_used": ["send_rent_reminders"],
     "data": {...},
     "timestamp": "2026-04-13T..."
   }
```

#### RESPONSE
```json
{
  "response": "I've sent payment reminders to 2 tenants with overdue rent:\n\n1. Rahul Verma at Sunshine PG - ₹8000 due since April 5\n2. Arjun Singh at Green Valley PG - ₹9000 due on April 8\n\nPayment reminder notices have been created and notifications sent to their contact information.",
  "tools_used": [],
  "data": {
    "total_properties": 3,
    "total_tenants": 10,
    "occupancy_rate": 88,
    "monthly_revenue": 778000,
    "overdue_rents": 2,
    "open_complaints": 2
  },
  "timestamp": "2026-04-13T10:30:45.123456"
}
```

#### DISPLAY IN UI
```
User: "Send rent reminders"

AI: "I've sent payment reminders to 2 tenants with 
     overdue rent:
     
     1. Rahul Verma at Sunshine PG - ₹8000 due since April 5
     2. Arjun Singh at Green Valley PG - ₹9000 due on April 8
     
     Payment reminder notices have been created and 
     notifications sent to their contact information."

[Timestamp: 10:30 AM]
```

## 🔄 System State Management

```
Current System State at any point:

┌─ Properties (3)
│  ├─ Sunshine PG (32/36 beds, ₹256k/month)
│  ├─ Green Valley PG (20/24 beds, ₹180k/month)
│  └─ Royal Comfort PG (38/45 beds, ₹342k/month)
│
├─ Tenants (10+)
│  ├─ Paid: 7
│  ├─ Due: 2
│  └─ Overdue: 2
│
├─ Complaints (2+)
│  ├─ Open: 1
│  └─ In Progress: 1
│
├─ Occupancy: 88% (90/105 beds)
│
└─ Monthly Revenue: ₹778,000

↓ (Every Request)

AI Receives ENTIRE current state
↓
AI Processes with context
↓
AI Generates informed response
↓
UI Updated with latest info
```

## 🎯 Scalability & Future Growth

```
Current:
3 Properties → 10 Tenants → 100+ Rooms → 5+ Complaints

Scalable to:
100+ Properties → 1000+ Tenants → 10000+ Rooms → 1000+ Complaints

Architecture supports:
✅ Multiple properties
✅ Bulk operations
✅ Complex queries
✅ Real-time updates
✅ Growing data volumes
```

## 🔐 Security Layers

```
┌─────────────────────────────────────┐
│ User Interface (Frontend)            │
├─────────────────────────────────────┤
│ Environment: Browser (Sandboxed)    │
│ Threat: XSS, CSRF - Mitigated       │
├─────────────────────────────────────┤
│ Network: HTTPS (Recommended)        │
│ Threat: MITM - SSL/TLS Encryption   │
├─────────────────────────────────────┤
│ API Layer (Backend)                 │
│ Threat: Injection - Input validation│
│ Current: Basic validation needed    │
├─────────────────────────────────────┤
│ Authentication: API Key (Groq)      │
│ Stored: Environment variable        │
│ Threat: Key exposure - .env secured │
├─────────────────────────────────────┤
│ Database: SQLite (Local)            │
│ Threat: SQL Injection - SQLModel    │
│ Current: ORM protection in place    │
├─────────────────────────────────────┤
│ External: Groq API                  │
│ Threat: API abuse - Rate limiting   │
│ Current: Need to implement          │
└─────────────────────────────────────┘
```

---

This architecture provides a **complete, scalable, and maintainable AI system** for your PG management needs! 🚀
