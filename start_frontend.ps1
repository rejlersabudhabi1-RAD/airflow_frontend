# Start Frontend Dev Server Script
Write-Host "=== Starting RAD AI Frontend ===" -ForegroundColor Cyan
Write-Host "Directory: $(Get-Location)" -ForegroundColor Yellow

# Kill any existing Node processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Verify we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found!" -ForegroundColor Red
    Write-Host "Changing to airflow_frontend directory..." -ForegroundColor Yellow
    Set-Location "C:\Users\Abdullah.Khan\airflow_frontend"
}

Write-Host "`nStarting Vite dev server..." -ForegroundColor Green
Write-Host "Frontend will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "CRS Multi-Revision: http://localhost:5173/crs/multiple-revision`n" -ForegroundColor Cyan

npm run dev
