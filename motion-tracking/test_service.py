#!/usr/bin/env python3
"""
Test script for Motion Tracking Service
"""

import requests
import json
import time

def test_health_endpoint():
    """Test the health check endpoint"""
    try:
        response = requests.get("http://localhost:8001/health")
        if response.status_code == 200:
            print("✅ Health endpoint working")
            return True
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to service. Is it running?")
        return False

def test_exercises_endpoint():
    """Test the exercises endpoint"""
    try:
        response = requests.get("http://localhost:8001/exercises")
        if response.status_code == 200:
            data = response.json()
            print("✅ Exercises endpoint working")
            print(f"   Available exercises: {len(data.get('exercises', []))}")
            return True
        else:
            print(f"❌ Exercises endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Exercises endpoint error: {e}")
        return False

def test_squat_info_endpoint():
    """Test the squat info endpoint"""
    try:
        response = requests.get("http://localhost:8001/exercises/squats/info")
        if response.status_code == 200:
            data = response.json()
            print("✅ Squat info endpoint working")
            print(f"   Features: {len(data.get('features', []))}")
            return True
        else:
            print(f"❌ Squat info endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Squat info endpoint error: {e}")
        return False

def main():
    print("🧪 Testing Motion Tracking Service")
    print("=" * 40)
    
    # Test all endpoints
    tests = [
        ("Health Check", test_health_endpoint),
        ("Exercises List", test_exercises_endpoint),
        ("Squat Info", test_squat_info_endpoint),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\nTesting {test_name}...")
        if test_func():
            passed += 1
        time.sleep(0.5)
    
    print("\n" + "=" * 40)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! Service is working correctly.")
        print("\nYou can now:")
        print("1. Open the frontend application")
        print("2. Navigate to Arena > Training")
        print("3. Switch to Learn/Game mode")
        print("4. Select Legs > Squats")
        print("5. Choose Live Camera or Upload Video")
    else:
        print("❌ Some tests failed. Please check the service.")
        print("\nMake sure the service is running:")
        print("  python server.py")

if __name__ == "__main__":
    main()