#!/bin/bash

echo "Starting Motion Tracking Service..."
echo "====================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

# Check Python version
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "Error: Python $required_version or higher is required (found $python_version)"
    exit 1
fi

# Check if requirements are installed
python3 -c "import cv2, mediapipe, fastapi" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing requirements..."
    python3 -m pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install requirements"
        exit 1
    fi
fi

echo "Starting server on http://localhost:8001"
echo "WebSocket available at ws://localhost:8001/ws/live-analysis"
echo ""
echo "Press Ctrl+C to stop the server"
echo "====================================="

python3 server.py