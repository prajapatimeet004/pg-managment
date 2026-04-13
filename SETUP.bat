@echo off
REM ============================================
REM AI PG Management SaaS - Complete Setup
REM ============================================

echo.
echo =========================================
echo  AI PG Management SaaS - Setup Script
echo =========================================
echo.

REM Check if we're in the right directory
if not exist "backend" (
    echo ERROR: backend folder not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

echo [1/5] Creating backend environment...
cd backend

REM Check if Python exists
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH!
    echo Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

echo [2/5] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo [3/5] Checking .env file...
if not exist ".env" (
    echo Creating .env file...
    (
        echo GROQ_API_KEY=your_api_key_here
        echo DATABASE_URL=sqlite:///./properties.db
    ) > .env
    echo .env file created! Please add your GROQ_API_KEY
    echo Get it from: https://console.groq.com
)

cd ..

echo [4/5] Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install npm dependencies
    pause
    exit /b 1
)

echo [5/5] Setup complete!
echo.
echo =========================================
echo  Next Steps:
echo =========================================
echo.
echo 1. Edit backend/.env and add your GROQ_API_KEY
echo    Get it from: https://console.groq.com
echo.
echo 2. Start the backend:
echo    cd backend
echo    python -m uvicorn main:app --reload --port 8000
echo.
echo 3. In a new terminal, start the frontend:
echo    npm run dev
echo.
echo 4. Open http://localhost:5173 in your browser
echo.
echo =========================================
echo.
pause
