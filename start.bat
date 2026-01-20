@echo off
cd /d "C:\Users\Abdullah.Khan\airflow_frontend"
echo ========================================
echo   Starting RAD AI Frontend Dev Server
echo ========================================
echo.
echo Directory: %CD%
echo Node Version:
node --version
echo.
echo Starting Vite...
echo Frontend will be at: http://localhost:5173
echo CRS Multi-Revision: http://localhost:5173/crs/multiple-revision
echo.
npm run dev
