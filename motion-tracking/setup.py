#!/usr/bin/env python3
"""
Setup script for Motion Tracking Service
"""

import subprocess
import sys
import os

def install_requirements():
    """Install Python requirements"""
    print("Installing Python requirements...")
    
    # Try different requirement files in order of preference
    requirements_files = [
        ("requirements-minimal.txt", "minimal (basic functionality)"),
        ("requirements-flexible.txt", "flexible (with MediaPipe)"), 
        ("requirements.txt", "standard")
    ]
    
    for req_file, description in requirements_files:
        if os.path.exists(req_file):
            print(f"Trying {req_file} ({description})...")
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", req_file])
                print(f"✅ Requirements installed successfully from {req_file}!")
                
                # Try to install MediaPipe separately if using minimal requirements
                if req_file == "requirements-minimal.txt":
                    print("Attempting to install MediaPipe for full functionality...")
                    try:
                        subprocess.check_call([sys.executable, "-m", "pip", "install", "mediapipe"])
                        print("✅ MediaPipe installed successfully!")
                    except subprocess.CalledProcessError:
                        print("⚠️  MediaPipe installation failed - will use demo mode")
                
                return True
            except subprocess.CalledProcessError as e:
                print(f"❌ Failed with {req_file}: {e}")
                continue
    
    # If all requirement files fail, try installing core packages individually
    print("Trying to install core packages individually...")
    core_packages = [
        "opencv-python",
        "numpy",
        "fastapi",
        "uvicorn",
        "python-multipart",
        "websockets",
        "pydantic"
    ]
    
    failed_packages = []
    for package in core_packages:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✅ Installed {package}")
        except subprocess.CalledProcessError:
            print(f"❌ Failed to install {package}")
            failed_packages.append(package)
    
    if failed_packages:
        print(f"❌ Failed to install: {', '.join(failed_packages)}")
        return False
    
    print("✅ Core packages installed successfully!")
    return True

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True

def test_imports():
    """Test if required packages can be imported"""
    print("Testing package imports...")
    
    # Test core packages
    core_packages = {
        'cv2': 'OpenCV',
        'numpy': 'NumPy', 
        'fastapi': 'FastAPI',
        'uvicorn': 'Uvicorn'
    }
    
    failed_imports = []
    
    for package, name in core_packages.items():
        try:
            __import__(package)
            print(f"✅ {name} imported successfully")
        except ImportError as e:
            print(f"❌ {name} import failed: {e}")
            failed_imports.append(name)
    
    # Test MediaPipe separately (optional)
    try:
        import mediapipe
        print("✅ MediaPipe imported successfully (full pose analysis available)")
    except ImportError:
        print("⚠️  MediaPipe not available (will use demo mode)")
    
    if failed_imports:
        print(f"❌ Critical imports failed: {', '.join(failed_imports)}")
        return False
    
    print("✅ All core packages imported successfully!")
    return True

def main():
    print("🚀 Setting up Motion Tracking Service...")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install requirements
    if not install_requirements():
        sys.exit(1)
    
    # Test imports
    if not test_imports():
        print("❌ Setup failed. Please check the error messages above.")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✅ Setup completed successfully!")
    print("\nTo start the motion tracking service, run:")
    print("  python server.py")
    print("\nThe service will be available at:")
    print("  HTTP API: http://localhost:8001")
    print("  WebSocket: ws://localhost:8001/ws/live-analysis")

if __name__ == "__main__":
    main()