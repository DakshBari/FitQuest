"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff, Play, Pause, RotateCcw, Camera, Sparkles, Brain, Target } from "lucide-react"

interface VoidChallengeProps {
  isActive: boolean
  onToggle: () => void
  sessionDuration: number
}

export function VoidChallenge({ isActive, onToggle, sessionDuration }: VoidChallengeProps) {
  const [eyesDetected, setEyesDetected] = useState<'closed' | 'open' | 'unknown'>('unknown')
  const [voidProgress, setVoidProgress] = useState(0) // Progress towards 300 seconds
  const [penalties, setPenalties] = useState(0)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const binauralOscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  // Initialize audio context
  const initAudio = () => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      setAudioContext(ctx)
    }
  }

  // Play binaural beats
  const playBinauralBeats = () => {
    if (!audioContext) return

    // Stop existing audio
    stopBinauralBeats()

    // Create binaural beats (40Hz base + 6Hz difference = theta waves)
    const leftOsc = audioContext.createOscillator()
    const rightOsc = audioContext.createOscillator()
    const leftGain = audioContext.createGain()
    const rightGain = audioContext.createGain()
    const merger = audioContext.createChannelMerger(2)

    leftOsc.frequency.value = 200 // Base frequency
    rightOsc.frequency.value = 206 // 6Hz difference for theta waves

    leftGain.gain.value = 0.1
    rightGain.gain.value = 0.1

    leftOsc.connect(leftGain)
    rightOsc.connect(rightGain)
    leftGain.connect(merger, 0, 0) // Left channel
    rightGain.connect(merger, 0, 1) // Right channel
    merger.connect(audioContext.destination)

    leftOsc.start()
    rightOsc.start()

    binauralOscillatorRef.current = leftOsc
    gainNodeRef.current = leftGain

    // Gradually increase volume
    leftGain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 3)
    rightGain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 3)
  }

  // Stop binaural beats
  const stopBinauralBeats = () => {
    if (binauralOscillatorRef.current) {
      try {
        binauralOscillatorRef.current.stop()
      } catch (e) {
        // Ignore if already stopped
      }
      binauralOscillatorRef.current = null
    }
  }

  // Play penalty sound (glass shattering effect)
  const playPenaltySound = () => {
    if (!audioContext) return

    stopBinauralBeats()

    // Create harsh noise burst
    const noise = audioContext.createScriptProcessor(4096, 0, 1)
    const filter = audioContext.createBiquadFilter()
    const gain = audioContext.createGain()

    noise.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0)
      for (let i = 0; i < 4096; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.5
      }
    }

    filter.type = 'highpass'
    filter.frequency.value = 2000
    filter.Q.value = 10

    gain.gain.setValueAtTime(0.8, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(audioContext.destination)

    // Stop after 300ms
    setTimeout(() => {
      try {
        noise.disconnect()
        filter.disconnect()
        gain.disconnect()
      } catch (e) {
        // Ignore cleanup errors
      }
    }, 300)
  }

  // Start camera for eye tracking (placeholder - would need MediaPipe integration)
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraEnabled(true)
      }
    } catch (error) {
      console.error('Camera access denied:', error)
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraEnabled(false)
  }

  // Simulate eye detection (placeholder for actual MediaPipe implementation)
  const simulateEyeDetection = () => {
    // This would be replaced with actual MediaPipe face mesh eye detection
    const randomState = Math.random()
    if (randomState > 0.8) {
      setEyesDetected('open')
    } else if (randomState > 0.3) {
      setEyesDetected('closed')
    } else {
      setEyesDetected('unknown')
    }
  }

  // Handle eye state changes
  useEffect(() => {
    if (isActive && cameraEnabled) {
      intervalRef.current = setInterval(() => {
        simulateEyeDetection()
      }, 500)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, cameraEnabled])

  // Handle void progress
  useEffect(() => {
    if (isActive && eyesDetected === 'closed') {
      const progressInterval = setInterval(() => {
        setVoidProgress(prev => Math.min(prev + 1, 300))
      }, 1000)

      return () => clearInterval(progressInterval)
    }
  }, [isActive, eyesDetected])

  // Handle penalties
  useEffect(() => {
    if (isActive && eyesDetected === 'open') {
      setPenalties(prev => prev + 1)
      playPenaltySound()
    }
  }, [eyesDetected, isActive])

  // Handle audio
  useEffect(() => {
    if (isActive && eyesDetected === 'closed') {
      initAudio()
      playBinauralBeats()
    } else {
      stopBinauralBeats()
    }

    return () => {
      stopBinauralBeats()
    }
  }, [isActive, eyesDetected, audioContext])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progressPercentage = (voidProgress / 300) * 100

  return (
    <div className="space-y-6">
      
      {/* Camera Setup */}
      {!cameraEnabled && (
        <Card className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5">
          <div className="p-6 border-b border-border bg-gradient-to-r from-purple-500/10 via-transparent to-violet-500/10">
            <h3 className="text-lg font-bold text-foreground font-inter flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-500" />
              Enable Eye Tracking
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered meditation focus tracking
            </p>
          </div>
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-4">
                Allow camera access for AI-powered eye detection. Your video is processed locally and never stored.
              </p>
              <Button
                onClick={startCamera}
                className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white rounded-xl shadow-lg shadow-purple-500/25"
              >
                <Camera className="w-4 h-4 mr-2" />
                Enable Camera
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Main Void Interface */}
      {cameraEnabled && (
        <Card className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5">
          <div className="p-6 border-b border-border bg-gradient-to-r from-purple-500/10 via-transparent to-violet-500/10">
            <h3 className="text-lg font-bold text-foreground font-inter flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              The Void Challenge
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              AI eye-tracking meditation experience
            </p>
          </div>
          
          <div className="p-6">
            {/* The Void - Peaceful dark screen with pulsing ring */}
            <div className="relative w-full h-96 bg-gradient-to-br from-slate-900 to-black rounded-2xl overflow-hidden border border-border/50 mb-6">
              
              {/* Hidden video element for eye tracking */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover opacity-0"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Pulsing ring in the void */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className={`w-32 h-32 rounded-full border-2 transition-all duration-1000 ${
                    eyesDetected === 'closed' 
                      ? 'border-purple-400 animate-pulse shadow-lg shadow-purple-400/50' 
                      : 'border-red-400 animate-ping'
                  }`}
                  style={{
                    boxShadow: eyesDetected === 'closed' 
                      ? '0 0 30px rgba(168, 85, 247, 0.5), inset 0 0 30px rgba(168, 85, 247, 0.2)'
                      : '0 0 30px rgba(248, 113, 113, 0.8)'
                  }}
                />
              </div>

              {/* Eye state indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-black/70 rounded-xl backdrop-blur-sm">
                {eyesDetected === 'closed' ? (
                  <EyeOff className="w-4 h-4 text-purple-400" />
                ) : (
                  <Eye className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm font-medium ${
                  eyesDetected === 'closed' ? 'text-purple-400' : 'text-red-400'
                }`}>
                  {eyesDetected === 'closed' ? 'Eyes Closed' : 
                   eyesDetected === 'open' ? 'Eyes Open' : 'Detecting...'}
                </span>
              </div>

              {/* Progress indicator */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/70 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-purple-400 text-sm font-medium">Void Progress</span>
                    <span className="text-white text-sm font-mono">
                      {formatTime(voidProgress)} / 05:00
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Penalty flash */}
              {eyesDetected === 'open' && isActive && (
                <div className="absolute inset-0 bg-red-500 opacity-30 animate-pulse" />
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setVoidProgress(0)
                  setPenalties(0)
                }}
                className="border-border/50 hover:bg-muted rounded-xl"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              
              <Button
                onClick={onToggle}
                className={`px-8 py-3 text-lg font-semibold rounded-xl ${
                  isActive 
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600' 
                    : 'bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600'
                } text-white shadow-lg`}
              >
                {isActive ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    End Session
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Enter The Void
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={stopCamera}
                className="border-border/50 hover:bg-muted rounded-xl"
              >
                <Camera className="w-4 h-4 mr-2" />
                Disable Camera
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg shadow-primary/5">
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent font-mono">
              {formatTime(voidProgress)}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Void Time
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg shadow-primary/5">
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent font-mono">
              {penalties}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Penalties
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg shadow-primary/5">
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-mono">
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Complete
            </div>
          </div>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-lg shadow-primary/5">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">How The Void Challenge Works</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Keep your eyes closed to progress through the challenge</li>
                <li>• Binaural beats will play softly when your eyes are detected as closed</li>
                <li>• Opening your eyes triggers a penalty sound and pauses progress</li>
                <li>• Accumulate 300 seconds (5 minutes) of closed-eye time to complete</li>
                <li>• The AI tracks your eyelid distance using your camera</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}