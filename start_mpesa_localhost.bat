@echo off
echo ========================================
echo AquaVolt M-Pesa Localhost Setup
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env and add your production passkey
    pause
    exit /b 1
)

echo Step 1: Starting proxy server...
echo.
start "AquaVolt Proxy" cmd /k "npm run proxy"

timeout /t 3 /nobreak >nul

echo Step 2: Starting localtunnel...
echo.
echo This will create a public URL for M-Pesa callbacks
echo.
start "Localtunnel" cmd /k "npx localtunnel --port 3001"

echo.
echo ========================================
echo IMPORTANT: Next Steps
echo ========================================
echo.
echo 1. Wait for localtunnel to show your URL (e.g., https://funny-cat-12.loca.lt)
echo 2. Copy that URL
echo 3. Add it to your .env file as:
echo    MPESA_CALLBACK_URL=https://your-url.loca.lt/api/mpesa/callback
echo 4. Restart the proxy server (close and run this script again)
echo.
echo ========================================
pause
