@echo off
setlocal

echo [1/3] Creating Python virtual environment...
if not exist .venv\Scripts\python.exe (
  python -m venv .venv
  if errorlevel 1 goto :error
)

echo [2/3] Installing Python dependencies...
.venv\Scripts\python.exe -m pip install --upgrade pip
if errorlevel 1 goto :error
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto :error

echo [3/3] Installing frontend dependencies...
pushd frontend
call npm install
if errorlevel 1 (
  popd
  goto :error
)
popd

echo.
echo Setup complete.
echo Run run_backend.bat and run_frontend.bat in separate terminals.
exit /b 0

:error
echo.
echo Setup failed. Review the error above.
exit /b 1
