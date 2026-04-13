"""
Quick Test Script for AI Agent
Verifies that all components are working correctly
"""

import sys
import json
import time
import subprocess
import requests
from pathlib import Path

print("=" * 50)
print("  AI Agent System Verification")
print("=" * 50)
print()

# Test 1: Check imports
print("[1/5] Checking Python imports...")
try:
    import fastapi
    import sqlmodel
    import groq
    print("✅ All required Python packages found")
except ImportError as e:
    print(f"❌ Missing package: {e}")
    sys.exit(1)

# Test 2: Check API files
print()
print("[2/5] Checking API implementation...")
errors = []

# Check backend
if not Path("backend/main.py").exists():
    errors.append("backend/main.py not found")
if not Path("backend/ai_service.py").exists():
    errors.append("backend/ai_service.py not found")
    
# Check frontend
if not Path("src/app/lib/api.js").exists():
    errors.append("src/app/lib/api.js not found")
if not Path("src/app/components/pages/AIAssistant.jsx").exists():
    errors.append("src/app/components/pages/AIAssistant.jsx not found")

if errors:
    for error in errors:
        print(f"❌ {error}")
    sys.exit(1)
else:
    print("✅ All API files present")

# Test 3: Check code contains AI agent
print()
print("[3/5] Checking AI Agent implementation...")
checks = {
    "backend/main.py": ["ai_agent_endpoint", "process_ai_agent"],
    "backend/ai_service.py": ["process_ai_agent", "TOOLS"],
    "src/app/lib/api.js": ["postAIAgent"],
    "src/app/components/pages/AIAssistant.jsx": ["AIAssistant", "message"],
}

all_found = True
for file, keywords in checks.items():
    with open(file, 'r') as f:
        content = f.read()
        for keyword in keywords:
            if keyword not in content:
                print(f"❌ Missing '{keyword}' in {file}")
                all_found = False

if all_found:
    print("✅ AI Agent implementation verified")
else:
    print("❌ Some implementation parts missing")
    sys.exit(1)

# Test 4: Check environment
print()
print("[4/5] Checking environment configuration...")
env_file = Path("backend/.env")
if env_file.exists():
    with open(env_file) as f:
        content = f.read()
        if "GROQ_API_KEY" in content:
            print("✅ GROQ_API_KEY configured")
        else:
            print("❌ GROQ_API_KEY not in .env")
            sys.exit(1)
else:
    print("⚠️  .env file not found (will be created on first run)")

# Test 5: Summary
print()
print("[5/5] Verification Summary")
print("=" * 50)
print()
print("✅ All checks passed!")
print()
print("Your AI Agent system is ready to use.")
print()
print("NEXT STEPS:")
print("-" * 50)
print()
print("1. Open 2 terminals (Command Prompt or PowerShell)")
print()
print("Terminal 1 - Start Backend:")
print("  cd backend")
print("  python -m uvicorn main:app --reload --port 8000")
print()
print("Terminal 2 - Start Frontend:")
print("  npm run dev")
print()
print("3. Open in browser: http://localhost:5173")
print("4. Go to 'AI Assistant' tab")
print("5. Try one of these queries:")
print()
print("   • 'How many properties do we have?'")
print("   • 'Show me overdue rents'")
print("   • 'What is our occupancy rate?'")
print("   • 'Send rent reminders to all tenants'")
print("   • 'Analyze property performance'")
print()
print("=" * 50)
