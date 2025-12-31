from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import base64
import json
import asyncio
import uvicorn
from typing import Dict, List
import logging

# Try to import the full squat analyzer, fall back to simple version
try:
    from squat_analyzer import SquatAnalyzer
    ANALYZER_TYPE = "full"
    print("✅ Using full MediaPipe squat analyzer")
except Exception as e:
    print(f"⚠️  MediaPipe not available ({e}), using simple analyzer")
    from simple_squat_analyzer import SimpleSquatAnalyzer as SquatAnalyzer
    ANALYZER_TYPE = "simple"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Motion Tracking API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.analyzers: Dict[WebSocket, SquatAnalyzer] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.analyzers[websocket] = SquatAnalyzer()
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.analyzers:
            del self.analyzers[websocket]
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

manager = ConnectionManager()

@app.get("/")
async def root():
    return {
        "message": "Motion Tracking API is running", 
        "status": "healthy",
        "analyzer_type": ANALYZER_TYPE,
        "note": "Using simple motion detection" if ANALYZER_TYPE == "simple" else "Using MediaPipe pose detection"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "motion-tracking"}

@app.websocket("/ws/live-analysis")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    analyzer = manager.analyzers[websocket]
    
    try:
        while True:
            # Receive frame data from client
            data = await websocket.receive_text()
            frame_data = json.loads(data)
            
            if frame_data.get("type") == "frame":
                # Decode base64 image
                image_data = base64.b64decode(frame_data["image"].split(",")[1])
                nparr = np.frombuffer(image_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if frame is not None:
                    # Process frame with squat analyzer
                    processed_frame, analysis = analyzer.process_frame(frame)
                    
                    # Encode processed frame back to base64
                    _, buffer = cv2.imencode('.jpg', processed_frame)
                    processed_image_b64 = base64.b64encode(buffer).decode('utf-8')
                    
                    # Send analysis results back to client
                    response = {
                        "type": "analysis",
                        "data": analysis,
                        "processed_frame": f"data:image/jpeg;base64,{processed_image_b64}"
                    }
                    
                    await manager.send_personal_message(json.dumps(response), websocket)
            
            elif frame_data.get("type") == "reset":
                # Reset analyzer
                analyzer.reset()
                await manager.send_personal_message(
                    json.dumps({"type": "reset_complete", "message": "Analyzer reset successfully"}), 
                    websocket
                )
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        manager.disconnect(websocket)

@app.post("/analyze-video")
async def analyze_video(file: UploadFile = File(...)):
    """Analyze uploaded video file - NO DATABASE STORAGE, LOCAL PROCESSING ONLY"""
    temp_filename = None
    try:
        # Create temporary file for processing (will be deleted immediately after)
        import tempfile
        import os
        
        # Create temporary file with proper cleanup
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as temp_file:
            contents = await file.read()
            temp_file.write(contents)
            temp_filename = temp_file.name
        
        logger.info(f"Processing video locally: {file.filename} (temp: {temp_filename})")
        
        # Process video locally - NO DATABASE STORAGE
        analyzer = SquatAnalyzer()
        cap = cv2.VideoCapture(temp_filename)
        
        if not cap.isOpened():
            raise Exception("Could not open video file")
        
        results = []
        processed_frames = []
        frame_count = 0
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        logger.info(f"Video properties: {total_frames} frames, {fps} FPS")
        
        # Process frames (limit to prevent memory issues)
        max_frames = min(total_frames, 300)  # Limit to 300 frames for performance
        
        while cap.isOpened() and frame_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Analyze frame locally
            processed_frame, analysis = analyzer.process_frame(frame)
            
            # Encode processed frame for immediate display (not stored)
            _, buffer = cv2.imencode('.jpg', processed_frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            frame_b64 = base64.b64encode(buffer).decode('utf-8')
            
            # Store analysis for immediate playback (temporary, not persisted)
            timestamp = frame_count / fps
            results.append({
                "frame": frame_count,
                "timestamp": round(timestamp, 2),
                "analysis": analysis,
                "processed_frame": f"data:image/jpeg;base64,{frame_b64}"
            })
            
            frame_count += 1
        
        cap.release()
        logger.info(f"Analysis complete: {frame_count} frames processed")
        
        # Generate summary (temporary analysis results)
        total_reps = analyzer.rep_count
        
        # Calculate average form score safely
        form_scores = []
        for r in results:
            if "analysis" in r and "form_score" in r["analysis"]:
                score = r["analysis"]["form_score"]
                if isinstance(score, (int, float)) and not np.isnan(score) and not np.isinf(score):
                    form_scores.append(score)
        
        avg_form_score = np.mean(form_scores) if form_scores else 0
        video_duration = frame_count / fps if fps > 0 else 0
        
        summary = {
            "total_frames": frame_count,
            "total_reps": total_reps,
            "average_form_score": round(float(avg_form_score), 1) if not np.isnan(avg_form_score) else 0.0,
            "video_duration": round(float(video_duration), 2) if not np.isnan(video_duration) else 0.0,
            "fps": round(float(fps), 1),
            "processed_frames": results,  # Temporary results for immediate playback
            "note": "Video processed locally - not stored anywhere"
        }
        
        return {
            "status": "success",
            "filename": file.filename,
            "summary": summary,
            "processing_note": "Video analyzed locally and temporarily. No data is stored permanently."
        }
        
    except Exception as e:
        logger.error(f"Video analysis error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }
    
    finally:
        # CRITICAL: Always clean up temporary file immediately
        if temp_filename and os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
                logger.info(f"Temporary file cleaned up: {temp_filename}")
            except Exception as e:
                logger.error(f"Failed to clean up temp file: {e}")

@app.get("/exercises")
async def get_available_exercises():
    """Get list of available exercises for motion tracking"""
    return {
        "exercises": [
            {
                "id": "squats",
                "name": "Squats",
                "muscle_group": "legs",
                "difficulty": "beginner",
                "available": True,
                "description": "AI-powered squat form analysis with real-time feedback"
            }
        ]
    }

@app.get("/exercises/squats/info")
async def get_squat_info():
    """Get detailed information about squat analysis"""
    if ANALYZER_TYPE == "full":
        features = [
            "Real-time rep counting",
            "Knee angle analysis",
            "Hip mobility tracking", 
            "Form score calculation",
            "Live feedback messages",
            "Posture correction alerts"
        ]
        key_points = [
            "Keep knees aligned with toes",
            "Maintain straight back posture",
            "Achieve 90-degree knee angle or deeper",
            "Drive through heels when standing up"
        ]
    else:
        features = [
            "Motion-based rep counting (demo)",
            "Simulated form analysis",
            "Basic feedback messages",
            "Demo mode visualization"
        ]
        key_points = [
            "This is a demonstration mode",
            "Install MediaPipe for full pose analysis",
            "Motion detection provides basic feedback",
            "Upgrade to full version for accurate analysis"
        ]
    
    return {
        "exercise": "squats",
        "analyzer_type": ANALYZER_TYPE,
        "features": features,
        "key_points": key_points,
        "common_mistakes": [
            "Knee cave (knees moving inward)",
            "Forward lean (chest dropping)",
            "Shallow depth (not going low enough)",
            "Weight on toes instead of heels"
        ]
    }

if __name__ == "__main__":
    uvicorn.run(
        "server:app", 
        host="0.0.0.0", 
        port=8001, 
        reload=True,
        log_level="info"
    )