@echo off
echo Starting Motion Tracking Service...
echo =====================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Check if requirements are installed
python -c "import cv2, mediapipe, fastapi" >nul 2>&1
if errorlevel 1 (
    echo Installing requirements...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo Error: Failed to install requirements
        pause
        exit /b 1
    )
)

echo Starting server on http://localhost:8001
echo WebSocket available at ws://localhost:8001/ws/live-analysis
echo.
echo Press Ctrl+C to stop the server
echo =====================================

python server.py

pause