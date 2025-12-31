"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ArrowLeft,
  Activity,
  Target,
  Zap,
  CheckCircle,
  AlertTriangle,
  SkipBack,
  SkipForward
} from "lucide-react"

interface VideoFrame {
  frame: number
  timestamp: number
  analysis: {
    rep_count: number
    stage: string
    knee_angle?: number
    hip_angle?: number
    form_score: number
    feedback: string[]
  }
  processed_frame: string
}

interface VideoAnalysisPlayerProps {
  videoData: {
    filename: string
    summary: {
      total_frames: number
      total_reps: number
      average_form_score: number
      video_duration: number
      fps: number
      processed_frames: VideoFrame[]
    }
  }
  onBack: () => void
}

export function VideoAnalysisPlayer({ videoData, onBack }: VideoAnalysisPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const { summary } = videoData
  const frames = summary.processed_frames || []
  const currentFrame = frames[currentFrameIndex]
  
  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      const frameDelay = (1000 / summary.fps) / playbackSpeed
      
      intervalRef.current = setInterval(() => {
        setCurrentFrameIndex(prev => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, frameDelay)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, playbackSpeed, frames.length, summary.fps])
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }
  
  const handleReset = () => {
    setIsPlaying(false)
    setCurrentFrameIndex(0)
  }
  
  const handleFrameSeek = (frameIndex: number) => {
    setCurrentFrameIndex(Math.max(0, Math.min(frameIndex, frames.length - 1)))
  }
  
  const handleTimeSeek = (value: number[]) => {
    const targetTime = value[0]
    const frameIndex = Math.floor((targetTime / summary.video_duration) * frames.length)
    handleFrameSeek(frameIndex)
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const getFormScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }
  
  const getFormScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  }

  if (!frames.length) {
    return (
      <div className="w-full h-full bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No Analysis Data Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            The video analysis did not produce any frames to display.
          </p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Upload
          </Button>
        </div>
      </div>
    )
  }

  return (
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
                  Video Analysis Results
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {videoData.filename} • {formatTime(summary.video_duration)} • {summary.total_reps} reps detected
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {frames.length} frames analyzed
            </Badge>
            <Badge className={getFormScoreBadge(summary.average_form_score)}>
              Avg: {summary.average_form_score}%
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-120px)]">
        
        {/* Video Player Section */}
        <div className="lg:col-span-3">
          <Card className="p-4 h-full">
            <div className="relative w-full h-full bg-black rounded-lg overflow-hidden min-h-[400px]">
              
              {/* Video Frame */}
              {currentFrame && (
                <img
                  src={currentFrame.processed_frame}
                  alt={`Frame ${currentFrame.frame}`}
                  className="w-full h-full object-contain"
                />
              )}
              
              {/* Frame Info Overlay */}
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md rounded-lg p-3 text-white">
                <div className="text-sm space-y-1">
                  <div>Frame: {currentFrame?.frame + 1 || 0} / {frames.length}</div>
                  <div>Time: {formatTime(currentFrame?.timestamp || 0)}</div>
                  <div>Rep: {currentFrame?.analysis.rep_count || 0}</div>
                  <div>Stage: {currentFrame?.analysis.stage || 'unknown'}</div>
                </div>
              </div>
              
              {/* Form Score Overlay */}
              {currentFrame && (
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md rounded-lg p-3">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getFormScoreColor(currentFrame.analysis.form_score)}`}>
                      {currentFrame.analysis.form_score}%
                    </div>
                    <div className="text-xs text-gray-300">Form Score</div>
                  </div>
                </div>
              )}
              
              {/* Feedback Overlay */}
              {currentFrame && currentFrame.analysis.feedback.length > 0 && (
                <div className="absolute bottom-20 left-4 right-4">
                  <div className="bg-black/70 backdrop-blur-md rounded-lg p-3 text-white">
                    {currentFrame.analysis.feedback.map((message, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {message.includes('Perfect') || message.includes('Excellent') ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        )}
                        <span>{message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Video Controls */}
            <div className="mt-4 space-y-4">
              {/* Timeline Slider */}
              <div className="space-y-2">
                <Slider
                  value={[currentFrame?.timestamp || 0]}
                  max={summary.video_duration}
                  step={0.1}
                  onValueChange={handleTimeSeek}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatTime(currentFrame?.timestamp || 0)}</span>
                  <span>{formatTime(summary.video_duration)}</span>
                </div>
              </div>
              
              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFrameSeek(currentFrameIndex - 10)}
                  disabled={currentFrameIndex === 0}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFrameSeek(currentFrameIndex - 1)}
                  disabled={currentFrameIndex === 0}
                >
                  -1
                </Button>
                
                <Button
                  onClick={handlePlayPause}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFrameSeek(currentFrameIndex + 1)}
                  disabled={currentFrameIndex >= frames.length - 1}
                >
                  +1
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFrameSeek(currentFrameIndex + 10)}
                  disabled={currentFrameIndex >= frames.length - 1}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Playback Speed */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-gray-500">Speed:</span>
                {[0.5, 1, 1.5, 2].map(speed => (
                  <Button
                    key={speed}
                    variant={playbackSpeed === speed ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlaybackSpeed(speed)}
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Analysis Panel */}
        <div className="space-y-4">
          
          {/* Current Frame Analysis */}
          {currentFrame && (
            <>
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary font-orbitron mb-2">
                    {currentFrame.analysis.rep_count}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Reps at this point
                  </div>
                  <div className="mt-2">
                    <Badge className={currentFrame.analysis.stage === 'down' ? 'bg-blue-500' : 'bg-green-500'}>
                      {currentFrame.analysis.stage === 'down' ? 'Going Down' : 'Standing Up'}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Technical Data */}
              {(currentFrame.analysis.knee_angle || currentFrame.analysis.hip_angle) && (
                <Card className="p-4">
                  <div className="text-sm space-y-2">
                    <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Technical Analysis</div>
                    {currentFrame.analysis.knee_angle && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Knee Angle:</span>
                        <span className="font-mono">{currentFrame.analysis.knee_angle}°</span>
                      </div>
                    )}
                    {currentFrame.analysis.hip_angle && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Hip Angle:</span>
                        <span className="font-mono">{currentFrame.analysis.hip_angle}°</span>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </>
          )}
          
          {/* Video Summary */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Video Summary</span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Reps:</span>
                <span className="font-bold text-primary">{summary.total_reps}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Form:</span>
                <span className={`font-bold ${getFormScoreColor(summary.average_form_score)}`}>
                  {summary.average_form_score}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration:</span>
                <span className="font-mono">{formatTime(summary.video_duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Frames:</span>
                <span className="font-mono">{summary.total_frames}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}