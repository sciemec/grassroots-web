@echo off
REM GRS AI Server — start script (Windows)
REM Usage: double-click or run from Command Prompt

cd /d "%~dp0"

REM Create venv if it doesn't exist
if not exist "venv\" (
    echo [GRS] Creating Python virtual environment...
    python -m venv venv
)

REM Activate venv
call venv\Scripts\activate.bat

REM Install / update dependencies
echo [GRS] Installing dependencies...
pip install --quiet -r requirements.txt

REM Start server
echo [GRS] Starting server on http://localhost:8765
uvicorn main:app --host 0.0.0.0 --port 8765 --reload --log-level info

pause
