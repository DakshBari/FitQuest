# Motion Tracking Service

AI-powered motion tracking and form analysis service for fitness exercises, starting with squats.

## 🔒 Privacy & Data Handling

**IMPORTANT: NO DATA STORAGE OR UPLOAD**
- Videos are processed **locally on your device only**
- **No videos are uploaded to servers or databases**
- **No personal data is stored permanently**
- Temporary files are immediately deleted after processing
- All analysis happens in real-time on your machine

## Features

- **Real-time Pose Detection**: Uses MediaPipe for accurate human pose estimation
- **Squat Analysis**: Comprehensive squat form analysis including:
  - Automatic rep counting
  - Knee angle measurement
  - Hip mobility tracking
  - Form score calculation (0-100%)
  - Real-time feedback messages
  - Posture correction alerts

- **Multiple Input Modes**:
  - Live camera feed with WebSocket streaming
  - Video file upload and analysis

- **REST API & WebSocket**: 
  - HTTP endpoints for video analysis
  - WebSocket for real-time live analysis

## Setup

### Prerequisites
- Python 3.8 or higher
- Webcam (for live analysis)

### Installation

1. **Run the setup script**:
   ```bash
   python setup.py
   ```

2. **Or install manually**:
   ```bash
   pip install -r requirements.txt
   ```

### Start the Service

```bash
python server.py
```

The service will start on:
- **HTTP API**: `http://localhost:8001`
- **WebSocket**: `ws://localhost:8001/ws/live-analysis`

## API Endpoints

### Health Check
```
GET /health
```

### Get Available Exercises
```
GET /exercises
```

### Get Squat Information
```
GET /exercises/squats/info
```

### Analyze Video File
```
POST /analyze-video
Content-Type: multipart/form-data
Body: video file
```

### WebSocket Live Analysis
```
WebSocket: ws://localhost:8001/ws/live-analysis

Send: {
  "type": "frame",
  "image": "data:image/jpeg;base64,..."
}

Receive: {
  "type": "analysis",
  "data": {
    "rep_count": 5,
    "stage": "up",
    "knee_angle": 165.2,
    "hip_angle": 145.8,
    "form_score": 92,
    "feedback": ["Excellent form!", "Keep chest up"]
  },
  "processed_frame": "data:image/jpeg;base64,..."
}
```

## Squat Analysis Details

### Key Measurements
- **Knee Angle**: Angle between hip-knee-ankle joints
- **Hip Angle**: Angle between shoulder-hip-knee joints
- **Rep Counting**: Automatic detection of squat phases (up/down)

### Form Analysis
- **Knee Alignment**: Detects knee cave (knees moving inward)
- **Squat Depth**: Ensures proper depth (90 degrees or below)
- **Back Posture**: Monitors torso angle and chest position
- **Weight Distribution**: Checks for proper heel drive

### Feedback Messages
- Real-time coaching cues
- Form correction suggestions
- Positive reinforcement for good form
- Injury prevention alerts

## Integration with Frontend

The service is designed to work with the React frontend components:
- `LearnGameMode.tsx`: Main interface for exercise selection
- `MotionTracker.tsx`: Live camera and analysis interface

## Data Handling & Privacy

### Local Processing Only
- **Video Upload**: Files are temporarily processed on your local machine
- **No Cloud Storage**: Videos never leave your device
- **Immediate Cleanup**: Temporary files are deleted within seconds
- **No Database**: No workout videos or personal data stored anywhere

### What Happens When You Upload a Video:
1. Video file is temporarily saved to local temp directory
2. AI analyzes each frame for pose detection and form analysis
3. Analysis results (angles, rep counts, feedback) are generated
4. Processed frames with overlays are created for playback
5. **Original video file is immediately deleted**
6. Only analysis data (numbers, not video) is shown in the interface
7. When you close the app, all analysis data is cleared

### Security Features:
- No network transmission of video content
- No permanent file storage
- No user data collection
- Processing happens entirely offline (except for the local API calls)

## Technical Stack

- **Computer Vision**: OpenCV + MediaPipe
- **Backend**: FastAPI + WebSockets
- **Real-time Processing**: 10 FPS frame analysis
- **Pose Estimation**: MediaPipe Pose solution

## Future Exercises

The system is designed to be extensible. Future exercises can be added by:
1. Creating new analyzer classes (similar to `SquatAnalyzer`)
2. Adding exercise-specific form analysis logic
3. Updating the API endpoints and frontend components

## Troubleshooting

### Common Issues

1. **Camera Access Denied**
   - Ensure browser permissions allow camera access
   - Check if another application is using the camera

2. **WebSocket Connection Failed**
   - Verify the service is running on port 8001
   - Check firewall settings

3. **Poor Pose Detection**
   - Ensure good lighting
   - Position yourself fully in frame
   - Avoid busy backgrounds

4. **High CPU Usage**
   - Reduce frame rate in the frontend
   - Lower video resolution
   - Close other applications

### Performance Tips

- Use good lighting for better pose detection
- Position camera at chest height, 6-8 feet away
- Wear contrasting clothing against background
- Ensure stable internet connection for WebSocket

## Development

To extend the system with new exercises:

1. Create a new analyzer class in the pattern of `SquatAnalyzer`
2. Implement exercise-specific angle calculations and form rules
3. Add the exercise to the API endpoints
4. Update frontend components to support the new exercise

## License

This motion tracking service is part of the fitness application and follows the same licensing terms.