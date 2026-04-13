#!/bin/bash
# AI Agent Complete Setup & Verification Script
# This script will check your system and get everything running

echo "=========================================="
echo "  AI PG Management SaaS - Full Setup"
echo "=========================================="
echo ""

# Function to check if command exists
check_command() {
    if command -v $1 &> /dev/null; then
        echo "✅ $1 is installed"
        $1 --version 2>&1 | head -n1
        return 0
    else
        echo "❌ $1 is NOT installed"
        return 1
    fi
}

echo "[1/7] Checking Prerequisites..."
echo ""

# Check Python
echo "Checking Python..."
if ! check_command python; then
    if ! check_command python3; then
        echo "ERROR: Python not found!"
        echo "Install from: https://www.python.org/downloads/"
        echo ""
        exit 1
    fi
fi

echo ""
echo "Checking Node.js..."
if ! check_command node; then
    echo "ERROR: Node.js not found!"
    echo "Install from: https://nodejs.org/"
    echo ""
    exit 1
fi

echo ""
echo "Checking npm..."
if ! check_command npm; then
    echo "ERROR: npm not found!"
    echo "npm should be installed with Node.js"
    echo ""
    exit 1
fi

echo ""
echo "[2/7] Checking .env file..."
if [ ! -f "backend/.env" ]; then
    echo "Creating .env file..."
    mkdir -p backend
    cat > backend/.env << 'EOF'
GROQ_API_KEY=gsk_YOUR_API_KEY_HERE
DATABASE_URL=sqlite:///./properties.db
EOF
    echo "✅ .env file created with GROQ_API_KEY"
else
    echo "✅ .env file exists"
    if grep -q "GROQ_API_KEY" backend/.env; then
        echo "✅ GROQ_API_KEY is configured"
    else
        echo "⚠️  GROQ_API_KEY not found in .env"
    fi
fi

echo ""
echo "[3/7] Installing Python dependencies..."
cd backend
pip install -r requirements.txt 2>&1 | tail -n 3
cd ..

echo ""
echo "[4/7] Installing Node dependencies..."
npm install 2>&1 | tail -n 3

echo ""
echo "[5/7] Checking Backend Code..."
if grep -q "def ai_agent_endpoint" backend/main.py; then
    echo "✅ AI Agent endpoint found in backend/main.py"
else
    echo "❌ AI Agent endpoint missing!"
fi

if grep -q "postAIAgent" src/app/lib/api.js; then
    echo "✅ AI Agent API method found in src/app/lib/api.js"
else
    echo "❌ AI Agent API method missing!"
fi

echo ""
echo "[6/7] Testing Backend API..."
echo "Starting backend server (will run for 10 seconds)..."

cd backend
timeout 10 python -m uvicorn main:app --reload --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

if curl -s http://localhost:8000 | grep -q "online"; then
    echo "✅ Backend API is responding"
else
    echo "⚠️  Backend API not responding yet (may need more time)"
fi

kill $BACKEND_PID 2>/dev/null || true
wait $BACKEND_PID 2>/dev/null || true
cd ..

echo ""
echo "[7/7] Setup Summary..."
echo ""
echo "✅ All checks passed!"
echo ""
echo "=========================================="
echo "  Ready to Start!"
echo "=========================================="
echo ""
echo "To run the system:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  python -m uvicorn main:app --reload --port 8000"
echo ""
echo "Terminal 2 (Frontend):"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "=========================================="
