# FusionFlowAI - Urban Traffic Predictor Startup Script
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  🚦 Welcome to FusionFlowAI - Traffic Predictor 🚦" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Python
Write-Host "[1/5] Checking Python installation..." -ForegroundColor Green
try {
    python --version | Out-Null
} catch {
    Write-Error "Python is not installed or not in PATH. Please install Python 3.13."
    exit 1
}

# 2. Setup Backend Environment
Write-Host "[2/5] Setting up Backend Virtual Environment..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot/server"
if (!(Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
& "./venv/Scripts/pip" install -r requirements.txt | Out-Null
& "./venv/Scripts/pip" install httpx | Out-Null

# 3. Generate Data if missing
if (!(Test-Path "app/data/traffic.csv") -or !(Test-Path "app/data/weather.csv")) {
    Write-Host "Generating synthetic traffic and weather datasets..." -ForegroundColor Yellow
    & "./venv/Scripts/python" generate_data.py
}

# 4. Train models if missing
if (!(Test-Path "app/models/fused_model.pkl")) {
    Write-Host "Training machine learning models..." -ForegroundColor Yellow
    $env:PYTHONIOENCODING = "utf-8"
    & "./venv/Scripts/python" app/models/train_models.py
}

Set-Location -Path "$PSScriptRoot"

# 5. Frontend Check
Write-Host "[3/5] Checking frontend dependencies..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot/client"
if (!(Test-Path "node_modules")) {
    Write-Host "Node modules not found. Running npm install..." -ForegroundColor Yellow
    npm install
}
Set-Location -Path "$PSScriptRoot"

# 6. Launch Services
Write-Host "[4/5] Launching backend FastAPI server..." -ForegroundColor Green
$env:PYTHONIOENCODING = "utf-8"
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd server; `$env:PYTHONIOENCODING='utf-8'; ./venv/Scripts/python -m uvicorn app.main:app --port 8000"

Write-Host "[5/5] Launching frontend Next.js server..." -ForegroundColor Green
Write-Host "Opening dashboard at http://localhost:3000..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"

Set-Location -Path "$PSScriptRoot/client"
npm run dev
