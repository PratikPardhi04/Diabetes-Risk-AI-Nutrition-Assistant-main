# Appends SHADOW_DATABASE_URL to backend/.env if not present
$envPath = "backend/.env"
$line = 'SHADOW_DATABASE_URL="mysql://root:rootpassword@localhost:3307/mysql"'
if (-Not (Test-Path $envPath)) {
  Write-Host "[ERROR] $envPath not found" -ForegroundColor Red
  exit 1
}
$content = Get-Content $envPath -Raw
if ($content -notmatch "SHADOW_DATABASE_URL") {
  Add-Content -Path $envPath -Value $line
  Write-Host "[OK] Added SHADOW_DATABASE_URL to $envPath" -ForegroundColor Green
} else {
  Write-Host "[SKIP] SHADOW_DATABASE_URL already present in $envPath" -ForegroundColor Yellow
}
