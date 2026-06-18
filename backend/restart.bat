@echo off
echo [*] Stopping existing backend on port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo [+] Port 8000 cleared.
echo [*] Starting JARVIS backend...
cd /d "%~dp0"
call ..\.venv\Scripts\activate.bat 2>nul
python main.py
