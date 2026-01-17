@echo off
echo ==========================================
echo       MENTORA AI - AUTO LAUNCHER
echo ==========================================

echo [1/3] Checking for Local AI (Ollama)...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [INFO] Ollama is already running.
) else (
    echo [INFO] Starting Ollama server...
    start "Mentora AI Brain" /min ollama serve
    timeout /t 5 >nul
)

echo [2/3] Verifying Llama 3 Model...
ollama list | findstr "llama3" >nul
if "%ERRORLEVEL%"=="0" (
    echo [OK] Llama 3 model found.
) else (
    echo [WARN] Llama 3 model missing! Attempting download...
    ollama pull llama3
)

echo [3/3] Starting App...
echo - Opening http://localhost:9002
start http://localhost:9002

echo - Starting Server...
npm run dev
