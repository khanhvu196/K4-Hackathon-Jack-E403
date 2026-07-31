@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo [ERROR] Khong tim thay .venv\Scripts\python.exe
  echo Hay tao virtual environment va cai codebase\requirements.txt.
  exit /b 1
)

".venv\Scripts\python.exe" "codebase\server.py"
