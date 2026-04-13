# 🚀 Complete Getting Started Guide - AI PG Management SaaS

## ✅ Prerequisites Checklist

Before you begin, make sure you have:

- [ ] Python 3.8+ installed ([Download](https://www.python.org/downloads/))
- [ ] Node.js 16+ installed ([Download](https://nodejs.org/))
- [ ] GROQ_API_KEY configured in `.env` (✅ Already done!)
- [ ] Git installed (optional, for version control)

---

## 🎯 Step-by-Step Setup

### Option A: Automatic Setup (Recommended)

#### For Windows:
```bash
# 1. Double-click SETUP.bat in the project root
# OR run from PowerShell:
.\SETUP.bat
```

This will automatically:
- ✅ Install Python dependencies
- ✅ Install Node.js dependencies
- ✅ Create/verify .env file
- ✅ Provide next steps

---

### Option B: Manual Setup

#### Step 1: Install Backend Dependencies

```bash
# Open PowerShell and navigate to project root
cd "c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS"

# Go to backend folder
cd backend

# Install Python packages
pip install -r requirements.txt
```

**Expected output:**
```
Successfully installed fastapi uvicorn sqlmodel groq python-dotenv...
```

#### Step 2: Verify .env File

Check that `.env` has the GROQ_API_KEY:
```bash
type .env
```

You should see:
```
GROQ_API_KEY=gsk_YOUR_API_KEY_HERE
```

✅ If present, you're good!

#### Step 3: Start Backend Server

```bash
# Make sure you're in the backend folder
cd backend

# Start the FastAPI server
python -m uvicorn main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

✅ Backend is running!

#### Step 4: Install Frontend Dependencies

In a **NEW PowerShell terminal**:

```bash
# Navigate to project root (NOT backend folder!)
cd "c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS"

# Install Node.js packages
npm install
```

**Expected output:**
```
added X packages in Ys
```

✅ Dependencies installed!

#### Step 5: Start Frontend Server

```bash
# Still in project root
npm run dev
```

**Expected output:**
```
VITE v4.X.X  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Press q to quit
```

✅ Frontend is running!

#### Step 6: Open in Browser

Open http://localhost:5173 in your browser

You should see your AI PG Management SaaS application!

---

## 🧪 Testing the AI Agent

### Step 1: Navigate to AI Assistant
- Click the **"AI Assistant"** menu item in the app
- You should see the chat interface

### Step 2: Ask a Question
Try one of these:

```
"What properties do I have?"
```

**Expected Response:** AI lists all your properties

```
"What's my occupancy rate?"
```

**Expected Response:** AI shows occupancy percentage

```
"Send rent reminders"
```

**Expected Response:** AI sends reminders to overdue tenants

✅ If you get responses, the AI agent is working!

---

## 🆘 Troubleshooting

### Issue 1: "Python not found"

**Solution:**
```bash
# Check Python is installed
python --version

# If not working, try:
python3 --version

# If neither works, install Python from:
https://www.python.org/downloads/
```

### Issue 2: "Cannot find module fastapi"

**Solution:**
```bash
# Make sure you're in the backend folder
cd backend

# Reinstall requirements
pip install -r requirements.txt

# Try again
python -m uvicorn main:app --reload --port 8000
```

### Issue 3: "Cannot find module react"

**Solution:**
```bash
# Make sure you're in the PROJECT ROOT (not backend!)
cd "c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS"

# Clear npm cache and reinstall
npm cache clean --force
rm -r node_modules
npm install

# Try again
npm run dev
```

### Issue 4: "Port 8000 already in use"

**Solution:**
```bash
# Use a different port
python -m uvicorn main:app --reload --port 8001

# Update frontend API_BASE_URL in src/app/lib/api.js
# Change: http://localhost:8000 to http://localhost:8001
```

### Issue 5: "Connection refused" in browser

**Check:** Is backend running?
```bash
# Open http://localhost:8000 in browser
# You should see: {"status":"online","message":"API is running"}
```

If not, start backend first:
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### Issue 6: "GROQ_API_KEY not configured"

**Solution:** Check `.env` file:
```bash
# View .env
type backend\.env

# Should show GROQ_API_KEY=gsk_...
```

If empty or missing:
```bash
# Edit the file and add:
GROQ_API_KEY=gsk_YOUR_API_KEY_HERE
```

---

## 📊 Verify Everything is Working

### Terminal 1: Backend Check
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

**Should show:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Terminal 2: Frontend Check
```bash
npm run dev
```

**Should show:**
```
➜  Local:   http://localhost:5173/
```

### Browser: Application Check
Open http://localhost:5173

**Should show:**
```
✅ Login page or Dashboard
✅ Navigation menu visible
✅ AI Assistant page accessible
```

### Browser Console: API Check
Open Developer Tools (F12) → Console

Go to AI Assistant page and ask a question.

**Should show:**
```
✅ No red error messages
✅ Network requests to localhost:8000
✅ AI response received
```

---

## 🎯 First Query Checklist

Before asking your first question:

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Browser opened to http://localhost:5173
- [ ] Logged in to application
- [ ] Navigated to AI Assistant page
- [ ] GROQ_API_KEY set in .env

### Try This First Query:

```
"Give me a business overview"
```

This will:
1. ✅ Fetch all properties from database
2. ✅ Calculate occupancy rates
3. ✅ Sum revenue totals
4. ✅ Count complaints and overdue rents
5. ✅ Generate comprehensive response

**Expected Response:**
```
"You have 3 properties with X total tenants. Your occupancy 
rate is YY% with $ZZZ monthly revenue. You have X overdue rents 
and X open complaints that need attention."
```

---

## 🚀 You're Ready!

Once you see:
- ✅ Backend running
- ✅ Frontend running
- ✅ AI Assistant page loads
- ✅ First query works

**You're all set!** Start exploring all the AI capabilities from [AI_AGENT_EXAMPLES.md](AI_AGENT_EXAMPLES.md)

---

## 💡 Common Commands Reference

### Backend Commands
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Start server
python -m uvicorn main:app --reload --port 8000

# Stop server (in terminal)
Ctrl + C
```

### Frontend Commands
```bash
# Navigate to project root
cd "c:\Users\Admin\OneDrive\Desktop\bas time pass\AI PG Management SaaS"

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Stop server (in terminal)
Ctrl + C
```

### Database Reset
```bash
# Delete old database
rm backend/properties.db

# Restart backend - it will recreate with seed data
python -m uvicorn main:app --reload --port 8000
```

---

## 📚 Need More Help?

- **Setup Issues:** Check [AI_AGENT_SETUP.md](AI_AGENT_SETUP.md)
- **Examples:** See [AI_AGENT_EXAMPLES.md](AI_AGENT_EXAMPLES.md)
- **Architecture:** Read [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)
- **All Docs:** Browse [AI_AGENT_DOCUMENTATION_INDEX.md](AI_AGENT_DOCUMENTATION_INDEX.md)

---

## ✅ Setup Checklist

Complete these in order:

- [ ] Install Python 3.8+
- [ ] Install Node.js 16+
- [ ] Run SETUP.bat OR follow manual steps
- [ ] Verify .env has GROQ_API_KEY
- [ ] Start backend (port 8000)
- [ ] Start frontend (port 5173)
- [ ] Open http://localhost:5173 in browser
- [ ] Navigate to AI Assistant page
- [ ] Ask a test question
- [ ] See AI response
- [ ] 🎉 You're done!

---

**Last Updated:** April 13, 2026  
**Status:** ✅ Ready to Use  
**Version:** 1.0
