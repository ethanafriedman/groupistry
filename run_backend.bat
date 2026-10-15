@echo off
if not exist .venv\Scripts\python.exe (
  echo Python environment not found. Run setup_windows.bat first.
  exit /b 1
)
.venv\Scripts\python.exe -m uvicorn api.main:app --reload
