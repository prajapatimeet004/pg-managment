# AI PG Management SaaS

A full-stack, AI-powered Paying Guest (PG) accommodation management platform. Property owners can manage multiple properties, tenants, rooms, rent collection, complaints, notices, and staff — all from a single dashboard with an integrated AI assistant.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite 6, React Router 7, Tailwind CSS 4, MUI 7, Radix UI + shadcn-style components, Recharts, Motion (Framer) |
| **Backend** | Python FastAPI, SQLModel ORM, PostgreSQL (Supabase) / SQLite (dev), JWT auth (bcrypt + python-jose) |
| **Auth Service** | Node.js + Express, Supabase JS, Nodemailer, PDFKit (receipts), rate limiting |
| **AI** | Groq API (Llama 3.3 70B) — insights, chat, agent with multi-turn memory, property analysis |
| **Messaging** | Twilio (WhatsApp + SMS) for rent reminders and broadcast notices |
| **Real-time** | FastAPI WebSocket for live notifications |
| **Deployment** | Netlify (frontend), Railway (backend + auth-backend) |

---

## Architecture

The system runs as **3 independent services**:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Frontend    │────▶│  FastAPI     │     │  Express     │
│  (React/Vite)│     │  Backend     │     │  Auth Service│
│  Netlify     │     │  Railway     │     │  Railway     │
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                            │                     │
                     ┌──────┴───────┐      ┌──────┴───────┐
                     │  PostgreSQL  │      │  Supabase    │
                     │  (Supabase)  │      │  (OTP store) │
                     └──────────────┘      └──────────────┘
```

- **Frontend** — React SPA with all UI components, charts, and pages
- **FastAPI Backend** — REST API + WebSocket, all business logic, AI integration, database access
- **Express Auth Service** — OTP generation/verification, PDF receipt generation

---

## Features

### Owner / Admin Portal
- **Dashboard** — Real-time stats (occupancy, revenue, overdue, complaints) with area charts and AI-powered business insights
- **Property Management** — CRUD for PG properties with room/bed tracking
- **Tenant Management** — Add, edit, transfer, or deactivate tenants with full rent history
- **Room & Bed Management** — Manage rooms per property, track occupancy, amenities, and bed-wise rent
- **Staff Management** — Manage staff (Admin, Manager, Housekeeping, Security) across properties with shifts
- **Rent Collection** — Record payments, auto-generate receipt numbers, track due/overdue
- **Complaint Tracking** — Log, categorize, prioritize, and resolve complaints with status workflow
- **Notice Board** — Create and broadcast notices with urgency flags
- **Reports & Analytics** — Revenue reports, occupancy trends, property-wise analysis
- **AI Rent Reminders** — One-click WhatsApp + SMS reminders to overdue tenants via Twilio
- **AI Broadcast Notices** — Broadcast notices to all tenants in a property via WhatsApp + SMS
- **AI Property Analysis** — Per-property occupancy and revenue analysis via Groq LLM
- **AI Assistant** — Multi-turn conversational AI with full data context; answers questions and suggests actions

### Tenant Self-Service Portal
- Dashboard with personal info, property/room details, rent status
- View rent history and download PDF receipts
- Raise, track, and close complaints
- View property-wide notices

### Real-Time
- WebSocket-based live notifications on rent payments, complaints, and data updates
- In-app notification panel with toast alerts

---

## Project Structure

```
├── frontend/                    # React + Vite SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.jsx                          # Root with RouterProvider
│   │   │   ├── routes.jsx                       # All routes (owner + tenant)
│   │   │   ├── components/
│   │   │   │   ├── layouts/                     # MainLayout, TenantLayout
│   │   │   │   ├── pages/                       # All page components
│   │   │   │   └── ui/                          # 50+ reusable UI components
│   │   │   └── lib/                             # API client, config, events, mock data
│   │   └── styles/                              # CSS entry, tailwind, theme, fonts
│   ├── vite.config.js
│   └── package.json
│
├── backend/                     # Python FastAPI backend
│   ├── main.py                  # App entry, router registration
│   ├── database.py              # SQLModel engine (Supabase/SQLite)
│   ├── models.py                # 8 SQLModel models
│   ├── security.py              # JWT auth, bcrypt hashing
│   ├── ai_service.py            # Groq AI client
│   ├── messaging_service.py     # Twilio integration
│   ├── email_service.py         # SMTP email
│   ├── routers/                 # auth, properties, tenants, rooms, complaints,
│   │                            # notices, rent, staff, ai, stats, websocket
│   ├── services/                # Business logic layer
│   ├── repositories/            # Data access layer
│   └── schemas/                 # Pydantic request/response schemas
│
├── auth-backend/                # Node.js Express auth service
│   ├── index.js                 # Server entry
│   ├── routes/                  # authRoutes, pdfRoutes
│   ├── controllers/             # authController, pdfController
│   ├── models/                  # OTP model (Supabase)
│   ├── middleware/               # errorHandler, rateLimiter
│   └── config/                  # Supabase client
│
├── docs/                        # Extensive documentation
├── supabase_setup.sql           # Full PostgreSQL schema
├── netlify.toml                  # Netlify deploy config
└── package.json                  # Root orchestrator (concurrently runs all 3 services)
```

---

## Database Schema

8 core tables defined in `backend/models.py` and `supabase_setup.sql`:

| Table | Purpose |
|---|---|
| **Owner** | Master user (email, password, OTP, verification) |
| **Property** | PG properties (address, rooms, beds, occupancy, revenue, manager) |
| **Tenant** | Tenants (personal info, property/room assignment, rent details, Aadhar) |
| **Room** | Rooms per property (number, floor, beds, rent, amenities, status) |
| **Complaint** | Complaints (category, priority, status, timestamps) |
| **Notice** | Notices (title, content, urgency) |
| **RentTransaction** | Rent payments (tenant, amount, month, mode, receipt) |
| **Staff** | Staff members (role, shift, property assignment) |

---

## API Endpoints

### Backend (FastAPI — port 8000)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/owner/signup`, `/owner/login`, `/owner/verify-otp` | Owner auth |
| `POST` | `/tenant/login` | Tenant login (ID + phone) |
| `GET` | `/tenant/dashboard/{id}` | Tenant dashboard data |
| `GET/POST/PUT/DELETE` | `/properties`, `/tenants`, `/rooms`, `/complaints`, `/notices`, `/rent-collection`, `/staff` | Full CRUD for all entities |
| `GET` | `/stats` | Dashboard statistics |
| `GET` | `/ai/insight` | AI business insights |
| `POST` | `/ai/chat`, `/ai/agent` | AI chat and agent |
| `POST` | `/ai/send-rent-reminders` | Send WhatsApp/SMS reminders |
| `POST` | `/ai/property-analysis` | Property analysis via LLM |
| `POST` | `/ai/broadcast-notice` | Broadcast notice to tenants |
| `WS` | `/ws` | WebSocket connection |

### Auth Backend (Express — port 3000)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/send-otp`, `/verify-otp`, `/resend-otp` | OTP flow |
| `POST` | `/api/pdf/generate-receipt` | PDF receipt generation |

---

## Deployment

- **Frontend** → Netlify (static SPA build from `frontend/`)
- **Backend** → Railway (uvicorn on `backend/main.py`)
- **Auth Backend** → Railway (node on `auth-backend/index.js`)

---

## Local Development

```bash
# Install root dependencies (orchestrator)
npm install

# Install frontend dependencies
cd frontend && npm install

# Install auth-backend dependencies
cd auth-backend && npm install

# Install backend Python dependencies
cd backend && pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
cp frontend/.env.example frontend/.env

# Run all 3 services concurrently
npm run dev
```

---

## Environment Variables

Key variables required (see `.env.example` for full list):
- `GROQ_API_KEY` — For AI features
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — For OTP emails
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` — For WhatsApp/SMS
- `JWT_SECRET` — For token signing
