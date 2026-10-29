@echo off
rem Build the Windows download (dist\Trading Simulator Game\Trading Simulator Game.exe) with PyInstaller.
rem Run from the project folder after start.bat has created .venv once.
cd /d "%~dp0.."
".venv\Scripts\python" -m pip install pyinstaller || goto :error
".venv\Scripts\python" -m PyInstaller -y --noconsole --name "Trading Simulator Game" ^
  --distpath dist --workpath build --specpath build --paths . ^
  --add-data "%CD%\web;web" --add-data "%CD%\app\universe.json;app" ^
  --collect-submodules uvicorn --collect-submodules app --hidden-import webview ^
  --exclude-module pytest --exclude-module tkinter packaging\launcher.py || goto :error
copy /y packaging\READ_ME_FIRST.txt "dist\Trading Simulator Game\READ ME FIRST.txt" >nul
echo Built dist\Trading Simulator Game
exit /b 0

:error
echo Build failed.
pause
