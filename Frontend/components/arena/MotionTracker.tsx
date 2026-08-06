"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Camera, 
  Square, 
  RotateCcw, 
  Upload, 
  ArrowLeft,
  Activity,
  Target,
  Zap,
  CheckCircle,
  AlertTriangle,
  Trophy,
  Play
} from "lucide-react"
import { toast } from "@/components/ui/sonner"
import { VideoAnalysisPlayer } from "./VideoAnalysisPlayer"

interface MotionTrackerProps {
  exercise: {
    id: string
    name: string
    difficulty: string
  }
  mode: 'live' | 'upload'
  onBack: () => void
}

interface AnalysisData {
  rep_count: number
  stage: string
  knee_angle?: number
  hip_angle?: number
  form_score: number
  feedback: string[]
  landmarks?: any
}

export function MotionTracker({ exercise, mode, onBack }: MotionTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const [isActive, setIsActive] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisData>({
    rep_count: 0,
    stage: "up",
    form_score: 100,
    feedback: []
  })
  const [processedFrame, setProcessedFrame] = useState<string | null>(null)
  const [sessionStats, setSessionStats] = useState({
    duration: 0,
    maxReps: 0,
    avgFormScore: 100,
    bestFormScore: 100
  })
  const [videoAnalysisResult, setVideoAnalysisResult] = useState<any>(null)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:8001/ws/live-analysis')
      
      ws.onopen = () => {
        console.log('Connected to motion tracking service')
        setIsConnected(true)
        toast.success('Connected to AI motion tracking')
      }
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        if (data.type === 'analysis') {
          setAnalysis(data.data)
          if (data.processed_frame) {
            setProcessedFrame(data.processed_frame)
          }
          
          // Update session stats
          setSessionStats(prev => ({
            ...prev,
            maxReps: Math.max(prev.maxReps, data.data.rep_count || 0),
            avgFormScore: (prev.avgFormScore + (data.data.form_score || 0)) / 2,
            bestFormScore: Math.max(prev.bestFormScore, data.data.form_score || 0)
          }))
        }
      }
      
      ws.onclose = () => {
        console.log('Disconnected from motion tracking service')
        setIsConnected(false)
        toast.error('Disconnected from motion tracking service')
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast.error('Failed to connect to motion tracking service')
      }
      
      wsRef.current = ws
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      toast.error('Failed to connect to motion tracking service')
    }
  }, [])

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
      
      setIsActive(true)
      toast.success('Camera started successfully')
      
      // Start sending frames
      startFrameCapture()
      
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast.error('Failed to access camera')
    }
  }

  // Start frame capture and analysis
  const startFrameCapture = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    intervalRef.current = setInterval(() => {
      captureAndSendFrame()
    }, 100) // Send frame every 100ms (10 FPS)
  }

  // Capture frame and send to WebSocket
  const captureAndSendFrame = () => {
    if (!videoRef.current || !canvasRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return
    
    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert to base64 and send
    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    
    wsRef.current.send(JSON.stringify({
      type: 'frame',
      image: imageData
    }))
  }

  // Stop camera and analysis
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    setIsActive(false)
    setProcessedFrame(null)
    toast.info('Camera stopped')
  }

  // Reset analysis
  const resetAnalysis = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'reset' }))
    }
    
    setAnalysis({
      rep_count: 0,
      stage: "up",
      form_score: 100,
      feedback: []
    })
    
    setSessionStats({
      duration: 0,
      maxReps: 0,
      avgFormScore: 100,
      bestFormScore: 100
    })
    
    toast.success('Analysis reset')
  }

  // Handle file upload for video analysis
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      toast.info('Analyzing video... This may take a moment')
      
      const response = await fetch('http://localhost:8001/analyze-video', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.status === 'success') {
        toast.success('Video analysis complete!')
        setVideoAnalysisResult(result)
        setShowVideoPlayer(true)
        
        // Update analysis display
        setAnalysis({
          rep_count: result.summary.total_reps,
          stage: "complete",
          form_score: result.summary.average_form_score,
          feedback: [`Analysis complete! ${result.summary.total_reps} reps detected`]
        })
      } else {
        toast.error('Video analysis failed: ' + result.message)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload video')
    }
  }

  // Initialize WebSocket connection
  useEffect(() => {
    if (mode === 'live') {
      connectWebSocket()
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      stopCamera()
    }
  }, [mode, connectWebSocket])

  // Update session duration
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isActive) {
      timer = setInterval(() => {
        setSessionStats(prev => ({
          ...prev,
          duration: prev.duration + 1
        }))
      }, 1000)
    }
    
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isActive])

  const getFormScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 70) return 'text-yellow-500'
    return 'text-violet-500'
  }

  const getFormScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'Advanced': return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  return (
    <>
      {/* Show Video Player if analysis is complete */}
      {showVideoPlayer && videoAnalysisResult ? (
        <VideoAnalysisPlayer
          videoData={videoAnalysisResult}
          onBack={() => {
            setShowVideoPlayer(false)
            setVideoAnalysisResult(null)
          }}
        />
      ) : (
        /* Main Motion Tracker Interface */
        <div className="w-full h-full bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-white/10 bg-gradient-to-r from-primary/5 to-cyan-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-orbitron">
                  {exercise.name} Analysis
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {mode === 'live' ? 'Live motion tracking' : 'Video analysis'}
                  {isConnected && mode === 'live' && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Connected
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <Badge className={getDifficultyColor(exercise.difficulty)}>
            {exercise.difficulty}
          </Badge>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-120px)]">
        
        {/* Video/Camera Section */}
        <div className="lg:col-span-2">
          <Card className="p-4 h-full">
            <div className="relative w-full h-full bg-black rounded-lg overflow-hidden min-h-[400px]">
              
              {mode === 'live' && (
                <>
                  {/* Live camera feed */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ display: processedFrame ? 'none' : 'block' }}
                  />
                  
                  {/* Processed frame overlay */}
                  {processedFrame && (
                    <img
                      src={processedFrame}
                      alt="Processed frame"
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Hidden canvas for frame capture */}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  
                  {/* Controls overlay */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {!isActive ? (
                      <Button
                        onClick={startCamera}
                        disabled={!isConnected}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>
                    ) : (
                      <Button
                        onClick={stopCamera}
                        variant="destructive"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    )}
                    
                    <Button
                      onClick={resetAnalysis}
                      variant="outline"
                      className="bg-black/50 border-white/20 text-white hover:bg-black/70"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
              
              {mode === 'upload' && (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <Upload className="w-16 h-16 mb-4 text-gray-400" />
                  <h3 className="text-xl font-bold mb-2">Upload Video for Analysis</h3>
                  <p className="text-gray-400 mb-2 text-center">
                    Select a video file to analyze your squat form
                  </p>
                  <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 mb-6 max-w-md">
                    <div className="flex items-center gap-2 text-blue-300 text-sm">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="font-medium">Privacy Notice:</span>
                    </div>
                    <p className="text-blue-200 text-xs mt-1">
                      Videos are processed locally on your device. No data is uploaded to servers or stored permanently.
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload">
                    <Button className="bg-purple-500 hover:bg-purple-600" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Video File
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-3">
                    Supported formats: MP4, AVI, MOV • Max duration: 10 minutes
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Analysis Panel */}
        <div className="space-y-4">
          
          {/* Rep Counter */}
          <Card className="p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary font-orbitron mb-2">
                {analysis.rep_count}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Reps Completed
              </div>
              <div className="mt-2">
                <Badge className={analysis.stage === 'down' ? 'bg-blue-500' : 'bg-green-500'}>
                  {analysis.stage === 'down' ? 'Going Down' : 'Standing Up'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Form Score */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Form Score</span>
              <Badge className={getFormScoreBadge(analysis.form_score)}>
                {analysis.form_score}%
              </Badge>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  analysis.form_score >= 90 ? 'bg-green-500' :
                  analysis.form_score >= 70 ? 'bg-yellow-500' : 'bg-violet-500'
                }`}
                style={{ width: `${analysis.form_score}%` }}
              />
            </div>
          </Card>

          {/* Live Feedback */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Feedback</span>
            </div>
            <div className="space-y-2">
              {analysis.feedback.length > 0 ? (
                analysis.feedback.map((message, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    {message.includes('Perfect') || message.includes('Excellent') ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-300">{message}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {isActive ? 'Analyzing your form...' : 'Start camera to get feedback'}
                </div>
              )}
            </div>
          </Card>

          {/* Session Stats */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Session Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-bold text-primary">{Math.floor(sessionStats.duration / 60)}:{(sessionStats.duration % 60).toString().padStart(2, '0')}</div>
                <div className="text-gray-500">Duration</div>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-bold text-primary">{sessionStats.maxReps}</div>
                <div className="text-gray-500">Max Reps</div>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-bold text-primary">{Math.round(sessionStats.avgFormScore)}%</div>
                <div className="text-gray-500">Avg Form</div>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-bold text-primary">{sessionStats.bestFormScore}%</div>
                <div className="text-gray-500">Best Form</div>
              </div>
            </div>
          </Card>

          {/* Technical Info */}
          {(analysis.knee_angle || analysis.hip_angle) && (
            <Card className="p-4">
              <div className="text-sm space-y-2">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Technical Analysis</div>
                {analysis.knee_angle && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Knee Angle:</span>
                    <span className="font-mono">{analysis.knee_angle}°</span>
                  </div>
                )}
                {analysis.hip_angle && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hip Angle:</span>
                    <span className="font-mono">{analysis.hip_angle}°</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
        </div>
      )}
    </>
  )
}