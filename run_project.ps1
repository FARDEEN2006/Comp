# This script starts both the frontend and backend of the Second-Hand Marketplace

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Starting Second-Hand Marketplace Project" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Start Frontend in the background
Write-Host "`n[1/2] Starting Frontend on http://localhost:5500..." -ForegroundColor Yellow
# Make sure we are in the base directory
Set-Location $PSScriptRoot
# Start the server without the "front-end" word at the end
Start-Process -NoNewWindow -FilePath "npx.cmd" -ArgumentList "--yes serve@14 -l 5500"

# Wait a second for it to start
Start-Sleep -Seconds 2

# 2. Start Backend
Write-Host "`n[2/2] Starting Backend on http://localhost:8080..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"
$env:DB_HOST="localhost"
$env:DB_PORT="3306"
$env:DB_NAME="secondhand_marketplace"
$env:DB_USER="root"
$env:DB_PASSWORD="fardeen"

Write-Host "Running Spring Boot (this will stay open)..." -ForegroundColor Green
mvn spring-boot:run
