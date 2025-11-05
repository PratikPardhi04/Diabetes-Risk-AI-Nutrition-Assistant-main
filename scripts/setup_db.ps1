# ================================================
# Database Setup Script (PowerShell)
# ================================================
# This script:
# 1. Starts the MySQL Docker container
# 2. Waits for MySQL to be ready
# 3. Connects to the container and executes SQL files
# 4. Verifies the setup
# ================================================

# Database configuration
$DB_NAME = "patient_db"
$DB_USER = "admin"
$DB_PASSWORD = "admin123"
$DB_CONTAINER = "patient_mysql_db"
$DB_PORT = "3307"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Patient Database Setup Script" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
}

Write-Host "✓ Docker found" -ForegroundColor Green

# Check if Docker Compose is available
$dockerComposeCmd = $null
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    $dockerComposeCmd = "docker-compose"
} elseif (docker compose version 2>&1 | Out-Null) {
    $dockerComposeCmd = "docker compose"
} else {
    Write-Host "✗ Docker Compose is not available" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker Compose found" -ForegroundColor Green
Write-Host ""

# Step 1: Start MySQL container
Write-Host "[Step 1/5] Starting MySQL container..." -ForegroundColor Yellow
if ($dockerComposeCmd -eq "docker-compose") {
    docker-compose up -d mysql
} else {
    docker compose up -d mysql
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start MySQL container" -ForegroundColor Red
    exit 1
}

Write-Host "✓ MySQL container started" -ForegroundColor Green
Write-Host ""

# Step 2: Wait for MySQL to be ready
Write-Host "[Step 2/5] Waiting for MySQL to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    $result = docker exec $DB_CONTAINER mysqladmin ping -h localhost 2>&1
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
    } else {
        $attempt++
        Write-Host "  Waiting... ($attempt/$maxAttempts)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $ready) {
    Write-Host "✗ MySQL failed to start within timeout period" -ForegroundColor Red
    Write-Host "Check logs with: docker-compose logs mysql" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ MySQL is ready" -ForegroundColor Green
Write-Host ""

# Step 3: Verify database initialization
Write-Host "[Step 3/5] Verifying database initialization..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Verify database exists
$dbCheck = docker exec $DB_CONTAINER mysql -u$DB_USER -p$DB_PASSWORD -e "SHOW DATABASES LIKE '$DB_NAME';" 2>&1

if ($LASTEXITCODE -ne 0 -or $dbCheck -notmatch $DB_NAME) {
    Write-Host "  Database not found, creating..." -ForegroundColor Yellow
    Get-Content db\init.sql | docker exec -i $DB_CONTAINER mysql -uroot -prootpassword
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to initialize database" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ Database '$DB_NAME' is ready" -ForegroundColor Green
Write-Host ""

# Step 4: Execute create_tables.sql
Write-Host "[Step 4/5] Creating tables..." -ForegroundColor Yellow

if (Test-Path "db\create_tables.sql") {
    Get-Content db\create_tables.sql | docker exec -i $DB_CONTAINER mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to create tables" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Tables created successfully" -ForegroundColor Green
} else {
    Write-Host "✗ File db\create_tables.sql not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Verify setup
Write-Host "[Step 5/5] Verifying setup..." -ForegroundColor Yellow

# Get table count
$tables = docker exec $DB_CONTAINER mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES;" 2>&1
$tableCount = ($tables | Select-Object -Skip 1 | Where-Object { $_ -ne "" }).Count

if ($tableCount -ge 4) {
    Write-Host "✓ Found $tableCount tables" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tables in database:" -ForegroundColor Blue
    docker exec $DB_CONTAINER mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES;" 2>&1 | Select-Object -Skip 1
    Write-Host ""
} else {
    Write-Host "✗ Expected at least 4 tables, found $tableCount" -ForegroundColor Red
    exit 1
}

# Final success message
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Database setup completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Connection Details:" -ForegroundColor Blue
Write-Host "  Host: localhost"
Write-Host "  Port: $DB_PORT"
Write-Host "  Database: $DB_NAME"
Write-Host "  Username: $DB_USER"
Write-Host "  Password: $DB_PASSWORD"
Write-Host ""

Write-Host "Useful Commands:" -ForegroundColor Blue
Write-Host "  View logs: " -NoNewline
Write-Host "docker-compose logs -f mysql" -ForegroundColor Yellow
Write-Host "  Stop container: " -NoNewline
Write-Host "docker-compose stop mysql" -ForegroundColor Yellow
Write-Host "  Start container: " -NoNewline
Write-Host "docker-compose start mysql" -ForegroundColor Yellow
Write-Host "  Remove container: " -NoNewline
Write-Host "docker-compose down" -ForegroundColor Yellow
Write-Host "  Access MySQL CLI: " -NoNewline
Write-Host "docker exec -it $DB_CONTAINER mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME" -ForegroundColor Yellow
Write-Host ""

Write-Host "Backend .env Configuration:" -ForegroundColor Blue
Write-Host "  " -NoNewline
Write-Host "DATABASE_URL=`"mysql://$DB_USER`:$DB_PASSWORD@localhost`:$DB_PORT/$DB_NAME`"" -ForegroundColor Yellow
Write-Host ""

