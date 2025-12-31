import cv2
import numpy as np
import math
import json
from typing import Dict, List, Tuple, Optional

class SquatAnalyzer:
    def __init__(self):
        # Initialize MediaPipe Pose with better error handling
        self.pose = None
        self.mp_pose = None
        self.mp_drawing = None
        self.use_new_api = False
        
        try:
            # Try to import MediaPipe
            import mediapipe as mp
            
            # Try old API first (more stable)
            if hasattr(mp, 'solutions'):
                self.mp_pose = mp.solutions.pose
                self.mp_drawing = mp.solutions.drawing_utils
                self.pose = self.mp_pose.Pose(
                    static_image_mode=False,
                    model_complexity=1,
                    enable_segmentation=False,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5
                )
                self.use_new_api = False
                print("✅ MediaPipe old API initialized successfully")
            else:
                print("❌ MediaPipe solutions not available")
                self.pose = None
                
        except Exception as e:
            print(f"❌ MediaPipe initialization failed: {e}")
            self.pose = None
        
        # Squat analysis parameters
        self.rep_count = 0
        self.stage = "up"  # "up" or "down"
        self.knee_angle_threshold_down = 90  # degrees
        self.knee_angle_threshold_up = 160   # degrees
        self.hip_angle_threshold = 90        # degrees
        
        # Form analysis
        self.form_score = 100
        self.feedback_messages = []
        
        # Tracking variables
        self.previous_knee_angle = None
        self.previous_hip_angle = None
        self.frame_count = 0
        
    def calculate_angle(self, a: Tuple[float, float], b: Tuple[float, float], c: Tuple[float, float]) -> float:
        """Calculate angle between three points"""
        a = np.array(a)
        b = np.array(b)
        c = np.array(c)
        
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        
        if angle > 180.0:
            angle = 360 - angle
            
        return angle
    
    def get_landmark_coords(self, landmarks, landmark_id: int, width: int, height: int) -> Tuple[float, float]:
        """Get normalized landmark coordinates - compatible with both old and new API"""
        try:
            # Try old API format first
            if hasattr(landmarks, 'landmark'):
                landmark = landmarks.landmark[landmark_id]
                return (landmark.x * width, landmark.y * height)
            
            # Try new API format (list-like)
            elif hasattr(landmarks, '__getitem__'):
                landmark = landmarks[landmark_id]
                return (landmark.x * width, landmark.y * height)
            
            # Fallback - return center of frame
            else:
                return (width // 2, height // 2)
                
        except (IndexError, AttributeError) as e:
            print(f"Landmark access failed: {e}")
            return (width // 2, height // 2)
    
    def analyze_squat_form(self, landmarks, width: int, height: int) -> Dict:
        """Analyze squat form and provide feedback"""
        try:
            # Define landmark indices (MediaPipe Pose landmarks)
            # These are consistent across API versions
            LEFT_SHOULDER = 11
            RIGHT_SHOULDER = 12
            LEFT_HIP = 23
            RIGHT_HIP = 24
            LEFT_KNEE = 25
            RIGHT_KNEE = 26
            LEFT_ANKLE = 27
            RIGHT_ANKLE = 28
            
            # Get key landmarks
            left_hip = self.get_landmark_coords(landmarks, LEFT_HIP, width, height)
            left_knee = self.get_landmark_coords(landmarks, LEFT_KNEE, width, height)
            left_ankle = self.get_landmark_coords(landmarks, LEFT_ANKLE, width, height)
            left_shoulder = self.get_landmark_coords(landmarks, LEFT_SHOULDER, width, height)
            
            right_hip = self.get_landmark_coords(landmarks, RIGHT_HIP, width, height)
            right_knee = self.get_landmark_coords(landmarks, RIGHT_KNEE, width, height)
            right_ankle = self.get_landmark_coords(landmarks, RIGHT_ANKLE, width, height)
            right_shoulder = self.get_landmark_coords(landmarks, RIGHT_SHOULDER, width, height)
            
            # Calculate angles
            left_knee_angle = self.calculate_angle(left_hip, left_knee, left_ankle)
            right_knee_angle = self.calculate_angle(right_hip, right_knee, right_ankle)
            knee_angle = (left_knee_angle + right_knee_angle) / 2
            
            # Hip angle (torso to thigh)
            left_hip_angle = self.calculate_angle(left_shoulder, left_hip, left_knee)
            right_hip_angle = self.calculate_angle(right_shoulder, right_hip, right_knee)
            hip_angle = (left_hip_angle + right_hip_angle) / 2
            
            # Ensure angles are valid numbers
            knee_angle = knee_angle if not np.isnan(knee_angle) and not np.isinf(knee_angle) else 90.0
            hip_angle = hip_angle if not np.isnan(hip_angle) and not np.isinf(hip_angle) else 90.0
            
            # Analyze squat phase and count reps
            self.analyze_rep_counting(knee_angle)
            
            # Analyze form
            form_feedback = self.analyze_form_quality(knee_angle, hip_angle, landmarks, width, height)
            
            # Ensure form_score is valid
            self.form_score = max(0, min(100, self.form_score))
            if np.isnan(self.form_score) or np.isinf(self.form_score):
                self.form_score = 50.0
            
            return {
                "rep_count": int(self.rep_count),
                "stage": str(self.stage),
                "knee_angle": round(float(knee_angle), 1),
                "hip_angle": round(float(hip_angle), 1),
                "form_score": round(float(self.form_score), 1),
                "feedback": form_feedback,
                "landmarks": {
                    "left_knee": [float(left_knee[0]), float(left_knee[1])],
                    "right_knee": [float(right_knee[0]), float(right_knee[1])],
                    "left_hip": [float(left_hip[0]), float(left_hip[1])],
                    "right_hip": [float(right_hip[0]), float(right_hip[1])],
                    "left_ankle": [float(left_ankle[0]), float(left_ankle[1])],
                    "right_ankle": [float(right_ankle[0]), float(right_ankle[1])]
                }
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "rep_count": self.rep_count,
                "stage": self.stage,
                "form_score": self.form_score
            }
    
    def analyze_rep_counting(self, knee_angle: float):
        """Count reps based on knee angle"""
        if self.stage == "up" and knee_angle < self.knee_angle_threshold_down:
            self.stage = "down"
        
        if self.stage == "down" and knee_angle > self.knee_angle_threshold_up:
            self.stage = "up"
            self.rep_count += 1
    
    def analyze_form_quality(self, knee_angle: float, hip_angle: float, landmarks, width: int, height: int) -> List[str]:
        """Analyze form quality and provide feedback"""
        feedback = []
        form_deductions = 0
        
        # Define landmark indices
        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12
        LEFT_HIP = 23
        RIGHT_HIP = 24
        LEFT_KNEE = 25
        RIGHT_KNEE = 26
        LEFT_ANKLE = 27
        RIGHT_ANKLE = 28
        
        # Check knee alignment
        left_knee = self.get_landmark_coords(landmarks, LEFT_KNEE, width, height)
        right_knee = self.get_landmark_coords(landmarks, RIGHT_KNEE, width, height)
        left_ankle = self.get_landmark_coords(landmarks, LEFT_ANKLE, width, height)
        right_ankle = self.get_landmark_coords(landmarks, RIGHT_ANKLE, width, height)
        
        # Check if knees are caving in
        knee_width = abs(left_knee[0] - right_knee[0])
        ankle_width = abs(left_ankle[0] - right_ankle[0])
        
        if knee_width < ankle_width * 0.8:
            feedback.append("Keep knees aligned with toes - avoid knee cave")
            form_deductions += 10
        
        # Check squat depth
        if self.stage == "down":
            if knee_angle > 100:
                feedback.append("Go deeper - aim for 90 degrees or below")
                form_deductions += 5
            elif knee_angle < 70:
                feedback.append("Perfect depth! Great squat!")
        
        # Check back posture
        left_shoulder = self.get_landmark_coords(landmarks, LEFT_SHOULDER, width, height)
        right_shoulder = self.get_landmark_coords(landmarks, RIGHT_SHOULDER, width, height)
        left_hip = self.get_landmark_coords(landmarks, LEFT_HIP, width, height)
        right_hip = self.get_landmark_coords(landmarks, RIGHT_HIP, width, height)
        
        # Calculate torso angle
        shoulder_center = ((left_shoulder[0] + right_shoulder[0]) / 2, (left_shoulder[1] + right_shoulder[1]) / 2)
        hip_center = ((left_hip[0] + right_hip[0]) / 2, (left_hip[1] + right_hip[1]) / 2)
        
        torso_angle = math.degrees(math.atan2(abs(shoulder_center[0] - hip_center[0]), abs(shoulder_center[1] - hip_center[1])))
        
        if torso_angle > 30:
            feedback.append("Keep chest up and back straight")
            form_deductions += 8
        
        # Update form score
        self.form_score = max(0, 100 - form_deductions)
        
        if not feedback:
            feedback.append("Excellent form!")
        
        return feedback
    
    def process_frame(self, frame) -> Tuple[np.ndarray, Dict]:
        """Process a single frame and return annotated frame with analysis"""
        self.frame_count += 1
        height, width, _ = frame.shape
        
        # If MediaPipe is not available, return error
        if self.pose is None:
            return frame, {
                "error": "MediaPipe not available", 
                "rep_count": self.rep_count,
                "stage": self.stage,
                "form_score": self.form_score,
                "feedback": ["MediaPipe pose detection not available"]
            }
        
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        try:
            # Process the frame with MediaPipe
            results = self.pose.process(rgb_frame)
            
            # Draw pose landmarks if available
            if results.pose_landmarks:
                # Draw landmarks
                if self.mp_drawing and self.mp_pose:
                    self.mp_drawing.draw_landmarks(
                        frame, results.pose_landmarks, self.mp_pose.POSE_CONNECTIONS)
                
                # Analyze squat
                analysis = self.analyze_squat_form(results.pose_landmarks, width, height)
                
                # Draw analysis info on frame
                self.draw_analysis_overlay(frame, analysis)
                
                return frame, analysis
            else:
                return frame, {
                    "error": "No pose detected", 
                    "rep_count": self.rep_count,
                    "stage": self.stage,
                    "form_score": self.form_score,
                    "feedback": ["No person detected in frame"]
                }
                
        except Exception as e:
            print(f"Frame processing error: {e}")
            return frame, {
                "error": f"Processing failed: {str(e)}", 
                "rep_count": self.rep_count,
                "stage": self.stage,
                "form_score": self.form_score,
                "feedback": ["Analysis temporarily unavailable"]
            }
    
    def draw_simple_landmarks(self, frame, landmarks, width: int, height: int):
        """Simple landmark drawing for new API"""
        try:
            # Draw key points for squat analysis
            key_points = [
                11, 12,  # shoulders
                23, 24,  # hips  
                25, 26,  # knees
                27, 28   # ankles
            ]
            
            for idx in key_points:
                if hasattr(landmarks, 'landmark') and idx < len(landmarks.landmark):
                    landmark = landmarks.landmark[idx]
                    x = int(landmark.x * width)
                    y = int(landmark.y * height)
                    cv2.circle(frame, (x, y), 5, (0, 255, 0), -1)
                elif hasattr(landmarks, '__getitem__') and idx < len(landmarks):
                    landmark = landmarks[idx]
                    x = int(landmark.x * width)
                    y = int(landmark.y * height)
                    cv2.circle(frame, (x, y), 5, (0, 255, 0), -1)
        except Exception as e:
            print(f"Simple drawing failed: {e}")
    
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
        
        # Draw knee angle
        if 'knee_angle' in analysis:
            cv2.putText(frame, f"Knee Angle: {analysis['knee_angle']}°", 
                       (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 255), 2)
        
        # Draw feedback
        feedback = analysis.get('feedback', [])
        for i, message in enumerate(feedback[:2]):  # Show max 2 feedback messages
            y_pos = height - 100 + (i * 40)
            cv2.putText(frame, message, (50, y_pos), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    
    def reset(self):
        """Reset the analyzer state"""
        self.rep_count = 0
        self.stage = "up"
        self.form_score = 100
        self.feedback_messages = []
        self.frame_count = 0