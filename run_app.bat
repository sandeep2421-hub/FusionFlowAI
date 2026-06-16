@echo off
title FusionFlowAI - Urban Traffic Predictor
color 0B

echo ===================================================
echo   🚦 Welcome to FusionFlowAI - Traffic Predictor 🚦
echo ===================================================
echo.

:: 1. Check Python installation
echo [1/5] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.13.
    pause
    exit /b 1
)

:: 2. Check and configure backend
echo [2/5] Setting up Backend Virtual Environment...
cd server
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        cd ..
        pause
        exit /b 1
    )
)

echo Installing backend dependencies...
call venv\Scripts\pip install -r requirements.txt >nul 2>&1
call venv\Scripts\pip install httpx >nul 2>&1

:: 3. Generate Data if missing
if not exist "app\data\traffic.csv" (
    echo Generating synthetic traffic and weather datasets...
    call venv\Scripts\python generate_data.py
)
if not exist "app\data\weather.csv" (
    echo Generating synthetic traffic and weather datasets...
    call venv\Scripts\python generate_data.py
)

:: 4. Train models if missing
if not exist "app\models\fused_model.pkl" (
    echo Training machine learning models...
    set PYTHONIOENCODING=utf-8
    call venv\Scripts\python app\models\train_models.py
)

cd ..

:: 5. Configure frontend
echo [3/5] Checking frontend dependencies...
cd client
if not exist "node_modules" (
    echo Node modules not found. Running npm install...
    call npm install
)
cd ..

:: 6. Launch Services
echo [4/5] Launching backend FastAPI server...
start "FusionFlowAI Backend Server" cmd /c "cd server && set PYTHONIOENCODING=utf-8 && venv\Scripts\python -m uvicorn app.main:app --port 8000"

echo [5/5] Launching frontend Next.js server...
echo Opening dashboard at http://localhost:3000...
timeout /t 3 /nobreak >nul
start http://localhost:3000

cd client
npm run dev
