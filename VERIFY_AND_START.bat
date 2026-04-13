@echo off
REM AI Agent Complete Setup & Verification Script for Windows
REM This script will check your system and get everything running

echo.
echo ==========================================
echo   AI PG Management SaaS - Full Setup
echo ==========================================
echo.

REM Check Python
echo [1/6] Checking Python...
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found!
    echo Please install Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)
python --version
echo OK - Python found
echo.

REM Check Node.js
echo [2/6] Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo OK - Node.js found
echo.

REM Check npm
echo [3/6] Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm not found!
    echo npm should be installed with Node.js
    pause
    exit /b 1
)
npm --version
echo OK - npm found
echo.

REM Create .env if needed
echo [4/6] Checking .env configuration...
if not exist "backend\.env" (
    echo Creating .env file...
    (
        echo GROQ_API_KEY=gsk_YOUR_API_KEY_HERE
        echo DATABASE_URL=sqlite:///./properties.db
    ) > backend\.env
    echo Created backend/.env
) else (
    echo .env file already exists
)
echo.

REM Install Python dependencies
echo [5/6] Installing Python dependencies...
cd backend
pip install -q -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo Error installing Python dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo OK - Python dependencies installed
echo.

REM Install Node dependencies
echo [6/6] Installing Node dependencies...
call npm install --silent
if %ERRORLEVEL% NEQ 0 (
    echo Error installing Node dependencies
    pause
    exit /b 1
)
echo OK - Node dependencies installed
echo.

REM All done
echo.
echo ==========================================
echo   ✓ Setup Complete!
echo ==========================================
echo.
echo Ready to start the AI Agent system:
echo.
echo STEP 1: Start Backend (Run in Terminal 1)
echo -------
echo   cd backend
echo   python -m uvicorn main:app --reload --port 8000
echo.
echo STEP 2: Start Frontend (Run in Terminal 2)
echo -------
echo   npm run dev
echo.
echo STEP 3: Open in Browser
echo -------
echo   http://localhost:5173
echo.
echo Then go to "AI Assistant" tab and start asking questions!
echo.
echo ==========================================
echo.
pause
