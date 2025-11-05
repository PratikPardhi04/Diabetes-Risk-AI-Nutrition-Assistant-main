# ================================================
# Environment Files Setup Script (PowerShell)
# ================================================
# This script creates .env files for backend and frontend
# ================================================

Write-Host "Creating environment files...`n" -ForegroundColor Blue

# Backend .env
$BACKEND_ENV = "backend\.env"
$createBackend = $false

if (Test-Path $BACKEND_ENV) {
    Write-Host "[WARNING] $BACKEND_ENV already exists" -ForegroundColor Yellow
    $response = Read-Host "Do you want to overwrite it? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        $createBackend = $true
    } else {
        Write-Host "Skipping backend .env" -ForegroundColor Yellow
    }
} else {
    $createBackend = $true
}

if ($createBackend) {
    $backendContent = @"
# ================================================
# Backend Environment Configuration
# Diabetes Risk & AI Nutrition Assistant
# ================================================

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Configuration (Docker MySQL)
# Format: mysql://username:password@host:port/database_name
DATABASE_URL="mysql://admin:admin123@localhost:3307/patient_db"

# JWT Authentication
# ⚠️ IMPORTANT: Change this to a strong random secret in production!
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345

# Gemini AI API Configuration
# API Key for Google Gemini Flash 2.0
GEMINI_API_KEY=AIzaSyDDI0BNK32jxtRCQIV_dUur0hM0iJTVYbY
"@
    Set-Content -Path $BACKEND_ENV -Value $backendContent
    Write-Host "[OK] Created $BACKEND_ENV" -ForegroundColor Green
}

# Frontend .env.local
$FRONTEND_ENV = "frontend\.env.local"
$createFrontend = $false

if (Test-Path $FRONTEND_ENV) {
    Write-Host "[WARNING] $FRONTEND_ENV already exists" -ForegroundColor Yellow
    $response = Read-Host "Do you want to overwrite it? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        $createFrontend = $true
    } else {
        Write-Host "Skipping frontend .env.local" -ForegroundColor Yellow
    }
} else {
    $createFrontend = $true
}

if ($createFrontend) {
    $frontendContent = @"
# ================================================
# Frontend Environment Configuration
# ================================================

# Backend API URL
# For local development, use localhost
# For production, use your deployed backend URL
VITE_API_URL=http://localhost:5000
"@
    Set-Content -Path $FRONTEND_ENV -Value $frontendContent
    Write-Host "[OK] Created $FRONTEND_ENV" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Environment files created successfully!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Backend .env: " -NoNewline -ForegroundColor Blue
Write-Host $BACKEND_ENV -ForegroundColor White
Write-Host "Frontend .env.local: " -NoNewline -ForegroundColor Blue
Write-Host $FRONTEND_ENV -ForegroundColor White
Write-Host ""

Write-Host "[WARNING] Security Note:" -ForegroundColor Yellow
Write-Host "  - Review and update JWT_SECRET in backend/.env"
Write-Host "  - Never commit .env files to version control"
Write-Host "  - Use different values for production`n"

