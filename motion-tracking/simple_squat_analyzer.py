import cv2
import numpy as np
import math
import json
from typing import Dict, List, Tuple, Optional

class SimpleSquatAnalyzer:
    """
    Simplified squat analyzer that works without MediaPipe pose detection.
    Uses basic computer vision techniques for demonstration purposes.
    """
    
    def __init__(self):
        # Squat analysis parameters
        self.rep_count = 0
        self.stage = "up"  # "up" or "down"
        self.form_score = 100
        self.feedback_messages = []
        self.frame_count = 0
        
        # Simple motion detection
        self.previous_frame = None
        self.motion_threshold = 1000
        self.motion_history = []
        
    def detect_motion(self, frame) -> float:
        """Simple motion detection based on frame difference"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        if self.previous_frame is None:
            self.previous_frame = gray
            return 0
        
        # Calculate frame difference
        diff = cv2.absdiff(self.previous_frame, gray)
        motion_score = np.sum(diff)
        
        self.previous_frame = gray
        return motion_score
    
    def analyze_squat_simulation(self) -> Dict:
        """Simulate squat analysis for demonstration"""
        # Simulate rep counting based on motion patterns
        motion_intensity = len(self.motion_history)
        
        # Simple state machine for squat phases
        if motion_intensity > 5:  # Significant motion detected
            if self.stage == "up":
                self.stage = "down"
            else:
                self.stage = "up"
                self.rep_count += 1
        
        # Simulate form feedback
        feedback = []
        if self.rep_count > 0:
            feedback_options = [
                "Keep your back straight",
                "Go deeper for better range",
                "Great form! Keep it up",
                "Drive through your heels",
                "Keep knees aligned with toes"
            ]
            feedback.append(feedback_options[self.rep_count % len(feedback_options)])
        
        # Simulate form score (gradually decreasing with fatigue)
        self.form_score = max(70, 100 - (self.rep_count * 2))
        
        return {
            "rep_count": self.rep_count,
            "stage": self.stage,
            "knee_angle": 90 + (self.rep_count * 5),  # Simulated angle
            "hip_angle": 85 + (self.rep_count * 3),   # Simulated angle
            "form_score": self.form_score,
            "feedback": feedback,
            "simulation": True
        }
    
    def process_frame(self, frame) -> Tuple[np.ndarray, Dict]:
        """Process frame with simple motion detection"""
        self.frame_count += 1
        
        # Detect motion
        motion_score = self.detect_motion(frame)
        self.motion_history.append(motion_score)
        
        # Keep only recent motion history
        if len(self.motion_history) > 10:
            self.motion_history.pop(0)
        
        # Analyze squat (simulated)
        analysis = self.analyze_squat_simulation()
        
        # Draw analysis overlay
        self.draw_analysis_overlay(frame, analysis)
        
        # Draw motion detection visualization
        self.draw_motion_visualization(frame, motion_score)
        
        return frame, analysis
    
    def draw_motion_visualization(self, frame, motion_score: float):
        """Draw simple motion detection visualization"""
        height, width, _ = frame.shape
        
        # Draw motion indicator
        motion_level = min(100, motion_score / 100)
        bar_height = int((motion_level / 100) * 200)
        
        # Motion bar
        cv2.rectangle(frame, (width - 50, height - 220), 
                     (width - 20, height - 20), (50, 50, 50), -1)
        cv2.rectangle(frame, (width - 50, height - 20 - bar_height), 
                     (width - 20, height - 20), (0, 255, 0), -1)
        
        # Motion label
        cv2.putText(frame, "Motion", (width - 80, height - 230), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    
    def draw_analysis_overlay(self, frame, analysis: Dict):
        """Draw analysis information on the frame"""
        height, width, _ = frame.shape
        
        # Draw rep count
        cv2.putText(frame, f"Reps: {analysis.get('rep_count', 0)}", 
                   (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)
        
        # Draw stage
        cv2.putText(frame, f"Stage: {analysis.get('stage', 'unknown')}", 
                   (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 0), 2)
        
        # Draw form score
        form_score = analysis.get('form_score', 0)
        color = (0, 255, 0) if form_score > 80 else (0, 255, 255) if form_score > 60 else (0, 0, 255)
        cv2.putText(frame, f"Form: {form_score}%", 
                   (50, 150), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
        
        # Draw simulation notice
        cv2.putText(frame, "DEMO MODE - Simulated Analysis", 
                   (50, height - 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        
        # Draw feedback
        feedback = analysis.get('feedback', [])
        for i, message in enumerate(feedback[:2]):
            y_pos = height - 100 + (i * 30)
            cv2.putText(frame, message, (50, y_pos), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    def reset(self):
        """Reset the analyzer state"""
        self.rep_count = 0
        self.stage = "up"
        self.form_score = 100
        self.feedback_messages = []
        self.frame_count = 0
        self.motion_history = []
        self.previous_frame = None