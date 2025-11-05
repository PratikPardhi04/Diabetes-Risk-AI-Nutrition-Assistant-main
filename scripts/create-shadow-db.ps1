# Creates the prisma_shadow database inside the MySQL Docker container
Write-Host "Creating prisma_shadow database in container..." -ForegroundColor Blue
$cmd = 'docker exec patient_mysql_db mysql -uroot -prootpassword -e "CREATE DATABASE IF NOT EXISTS prisma_shadow;"'
cmd /c $cmd
if ($LASTEXITCODE -eq 0) {
  Write-Host "[OK] prisma_shadow database ensured" -ForegroundColor Green
} else {
  Write-Host "[ERROR] Failed to create prisma_shadow" -ForegroundColor Red
  exit 1
}
