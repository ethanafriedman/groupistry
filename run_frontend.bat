@echo off
if not exist frontend\node_modules (
  echo Frontend dependencies not found. Run setup_windows.bat first.
  exit /b 1
)
cd frontend
call npm run dev
