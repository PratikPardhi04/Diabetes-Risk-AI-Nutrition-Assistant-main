# Updates SHADOW_DATABASE_URL in backend/.env to a safe, non-system DB for Prisma shadow
$envPath = "backend/.env"
if (-Not (Test-Path $envPath)) {
  Write-Host "[ERROR] $envPath not found" -ForegroundColor Red
  exit 1
}
$content = Get-Content $envPath -Raw
$newLine = 'SHADOW_DATABASE_URL="mysql://root:rootpassword@localhost:3307/prisma_shadow"'
if ($content -match 'SHADOW_DATABASE_URL\s*=') {
  $updated = [System.Text.RegularExpressions.Regex]::Replace($content, 'SHADOW_DATABASE_URL\s*=.*', $newLine)
} else {
  $updated = $content + "`n" + $newLine + "`n"
}
Set-Content -Path $envPath -Value $updated -Encoding UTF8
Write-Host "[OK] SHADOW_DATABASE_URL set to prisma_shadow" -ForegroundColor Green
