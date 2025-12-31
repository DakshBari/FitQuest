@echo off
echo Installing Motion Tracking Dependencies for Windows...
echo =====================================================

REM Upgrade pip first
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install packages individually with latest versions
echo Installing OpenCV...
python -m pip install opencv-python

echo Installing MediaPipe...
python -m pip install mediapipe

echo Installing NumPy...
python -m pip install numpy

echo Installing FastAPI...
python -m pip install fastapi

echo Installing Uvicorn...
python -m pip install uvicorn

echo Installing additional dependencies...
python -m pip install python-multipart websockets pydantic python-socketio

echo.
echo Testing imports...
python -c "import cv2; print('✅ OpenCV imported successfully')"
python -c "import mediapipe; print('✅ MediaPipe imported successfully')"
python -c "import numpy; print('✅ NumPy imported successfully')"
python -c "import fastapi; print('✅ FastAPI imported successfully')"

echo.
echo =====================================================
echo ✅ Installation complete!
echo.
echo To start the motion tracking service:
echo   python server.py
echo.
echo The service will be available at:
echo   HTTP: http://localhost:8001
echo   WebSocket: ws://localhost:8001/ws/live-analysis
echo =====================================================

pause