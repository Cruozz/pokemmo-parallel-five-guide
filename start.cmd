@echo off
setlocal
cd /d "%~dp0"
set "PORT=8787"
start "" "http://127.0.0.1:%PORT%/index.html"
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server %PORT%
  exit /b
)
echo 未找到 Python，正在直接打开本地页面。
start "" "%~dp0index.html"
endlocal
