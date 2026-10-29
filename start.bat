@echo off
rem Start TradingGame in its own window. The first run sets up a local Python environment (.venv).
cd /d "%~dp0"
if not exist ".venv\Scripts\pythonw.exe" (
  echo Setting up TradingGame for the first time, this takes a minute...
  python -m venv .venv || goto :error
  ".venv\Scripts\python" -m pip install -r requirements.txt || goto :error
)
start "" ".venv\Scripts\pythonw.exe" -m app
exit /b 0

:error
echo Setup failed. Make sure Python 3.11 or newer is installed and on PATH.
pause
