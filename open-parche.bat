@echo off
cd /d "%~dp0apps\web"
start "" cmd /c "npm run dev"
timeout /t 3 /nobreak >nul
start http://localhost:5180
