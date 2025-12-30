@echo off
echo ========================================
echo AI Gateway Installation Script
echo ========================================
echo.

echo Step 1: Installing Python dependencies...
cd /d "%~dp0"
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Creating .env file...
if not exist .env (
    echo Please create .env file manually with:
    echo   SUPABASE_URL=^<from frontend/.env^>
    echo   SUPABASE_KEY=^<from frontend/.env^>
    echo   OLLAMA_HOST=http://localhost:11434
    echo   SLM_MODEL=llama3.2:3b-instruct-q4_K_M
    echo   LLM_MODEL=llama3.1:8b-instruct-q4_K_M
    echo   EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
    echo   CHROMA_PERSIST_DIR=./chroma_db
    echo   MIN_CONFIDENCE=0.80
) else (
    echo .env file already exists
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Ensure .env file has Supabase credentials
echo 2. Install Ollama: https://ollama.com/download/windows
echo 3. Pull models: ollama pull llama3.2:3b-instruct-q4_K_M
echo 4. Pull models: ollama pull llama3.1:8b-instruct-q4_K_M
echo 5. Run: python main.py
echo.
pause
