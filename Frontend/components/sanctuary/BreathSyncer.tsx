"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Wind, Play, Pause, RotateCcw, Settings, Heart, Sparkles } from "lucide-react"

interface BreathSyncerProps {
  isActive: boolean
  onToggle: () => void
  sessionDuration: number
}

type BreathPhase = 'inhale' | 'hold' | 'exhale'
type BreathTechnique = '4-7-8' | 'box' | 'triangle' | 'custom'

const breathTechniques = {
  '4-7-8': { inhale: 4, hold: 7, exhale: 8, name: '4-7-8 Relaxation' },
  'box': { inhale: 4, hold: 4, exhale: 4, name: 'Box Breathing' },
  'triangle': { inhale: 4, hold: 0, exhale: 4, name: 'Triangle Breathing' },
  'custom': { inhale: 6, hold: 2, exhale: 6, name: 'Custom Pattern' }
}

export function BreathSyncer({ isActive, onToggle, sessionDuration }: BreathSyncerProps) {
  const [currentPhase, setCurrentPhase] = useState<BreathPhase>('inhale')
  const [phaseProgress, setPhaseProgress] = useState(0)
  const [breathCount, setBreathCount] = useState(0)
  const [technique, setTechnique] = useState<BreathTechnique>('4-7-8')
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  const currentTechnique = breathTechniques[technique]
  const phaseDuration = currentTechnique[currentPhase === 'inhale' ? 'inhale' : 
                                       currentPhase === 'hold' ? 'hold' :
                                       'exhale']

  // Initialize audio context
  const initAudio = () => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      setAudioContext(ctx)
    }
  }

  // Play breath tone
  const playBreathTone = (phase: BreathPhase) => {
    if (!audioContext) return

    // Stop existing tone
    stopBreathTone()

    if (phase === 'hold') return // No sound during hold

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    // Different frequencies for inhale/exhale
    const frequency = phase === 'inhale' ? 220 : 110 // A3 for inhale, A2 for exhale
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
    
    if (phase === 'inhale') {
      // Rising tone for inhale
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * 1.5, 
        audioContext.currentTime + phaseDuration
      )
    } else {
      // Falling tone for exhale
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * 0.7, 
        audioContext.currentTime + phaseDuration
      )
    }

    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1)
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + phaseDuration - 0.1)
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + phaseDuration)

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + phaseDuration)

    oscillatorRef.current = oscillator
    gainNodeRef.current = gainNode
  }

  // Stop breath tone
  const stopBreathTone = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop()
      } catch (e) {
        // Ignore if already stopped
      }
      oscillatorRef.current = null
    }
  }

  // Breath cycle logic
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setPhaseProgress(prev => {
          const newProgress = prev + 0.1
          
          if (newProgress >= phaseDuration) {
            // Move to next phase
            setCurrentPhase(currentPhase => {
              let nextPhase: BreathPhase
              
              switch (currentPhase) {
                case 'inhale':
                  nextPhase = currentTechnique.hold > 0 ? 'hold' : 'exhale'
                  break
                case 'hold':
                  nextPhase = 'exhale'
                  break
                case 'exhale':
                  nextPhase = 'inhale'
                  setBreathCount(prev => prev + 1) // Complete breath cycle
                  break
                default:
                  nextPhase = 'inhale'
              }
              
              return nextPhase
            })
            return 0
          }
          
          return newProgress
        })
      }, 100)
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
  }, [isActive, phaseDuration, currentTechnique])

  // Handle audio for phase changes
  useEffect(() => {
    if (isActive && phaseProgress === 0) {
      initAudio()
      playBreathTone(currentPhase)
    }
  }, [currentPhase, isActive])

  // Cleanup audio on stop
  useEffect(() => {
    if (!isActive) {
      stopBreathTone()
    }
    
    return () => {
      stopBreathTone()
    }
  }, [isActive])

  const getOrbStyle = () => {
    const progress = phaseProgress / phaseDuration
    let scale = 1
    let color = 'rgb(59, 130, 246)' // Default blue
    
    switch (currentPhase) {
      case 'inhale':
        // Start small (1x) and expand to large (2.8x) during inhale
        scale = 1 + (progress * 1.8)
        // Blue to cyan gradient
        color = `rgb(${Math.floor(59 + progress * 100)}, ${Math.floor(130 + progress * 55)}, 246)`
        break
      case 'hold':
        // Stay large (2.8x) during hold
        scale = 2.8
        color = 'rgb(255, 255, 255)' // Pure white
        break
      case 'exhale':
        // Start large (2.8x) and contract to small (1x) during exhale
        scale = 2.8 - (progress * 1.8)
        // White to purple gradient
        color = `rgb(${Math.floor(255 - progress * 105)}, ${Math.floor(255 - progress * 105)}, ${Math.floor(255 - progress * 21)})`
        break
    }
    
    return {
      transform: `scale(${scale})`,
      backgroundColor: color,
      boxShadow: `
        0 0 ${30 + scale * 50}px ${color}, 
        0 0 ${60 + scale * 80}px ${color}40,
        inset 0 0 ${20 + scale * 25}px rgba(255, 255, 255, 0.4)
      `,
      transition: 'all 0.1s ease-out',
      filter: `brightness(${1.2 + scale * 0.3}) saturate(${1.5 + scale * 0.5})`
    }
  }

  const getPhaseInstruction = () => {
    switch (currentPhase) {
      case 'inhale':
        return 'Breathe In'
      case 'hold':
        return 'Hold'
      case 'exhale':
        return 'Breathe Out'
      default:
        return 'Breathe'
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      
      {/* Technique Selector */}
      <Card className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-lg shadow-primary/5">
        <div className="p-6 border-b border-border bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10">
          <h3 className="text-lg font-bold text-foreground font-inter flex items-center gap-2">
            <Wind className="w-5 h-5 text-blue-500" />
            Breathing Technique
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose your preferred breathing pattern
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <select
              value={technique}
              onChange={(e) => setTechnique(e.target.value as BreathTechnique)}
              className="bg-card border border-border text-foreground rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isActive}
            >
              {Object.entries(breathTechniques).map(([key, tech]) => (
                <option key={key} value={key} className="bg-card">
                  {tech.name}
                </option>
              ))}
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="border-border/50 hover:bg-muted rounded-xl"
              disabled={isActive}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="grid grid-cols-3 gap-4 text-center p-4 bg-muted/50 rounded-xl">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Inhale</label>
                <div className="text-lg font-mono text-foreground">{currentTechnique.inhale}s</div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Hold</label>
                <div className="text-lg font-mono text-foreground">{currentTechnique.hold}s</div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Exhale</label>
                <div className="text-lg font-mono text-foreground">{currentTechnique.exhale}s</div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Main Breathing Interface */}
      <Card className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5">
        <div className="p-6 border-b border-border bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10">
          <h3 className="text-lg font-bold text-foreground font-inter flex items-center gap-2">
            <Heart className="w-5 h-5 text-blue-500" />
            Breath Syncer
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Follow the breathing orb for guided meditation
          </p>
        </div>
        
        <div className="p-6">
          {/* Breathing Orb */}
          <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-slate-900 dark:to-blue-950 rounded-2xl overflow-hidden border border-border/50 flex items-center justify-center mb-6">
            
            {/* The Glowing Orb */}
            <div
              className="w-32 h-32 rounded-full"
              style={getOrbStyle()}
            />
            
            {/* Phase Instruction */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="text-center">
                <div className="text-2xl font-light text-foreground mb-2 font-inter">
                  {getPhaseInstruction()}
                </div>
                <div className="text-sm text-muted-foreground opacity-80">
                  {Math.ceil(phaseDuration - phaseProgress)}s remaining
                </div>
              </div>
            </div>

            {/* Progress Ring */}
            <div className="absolute inset-8">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth="3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={
                    currentPhase === 'inhale' ? 'rgb(59, 130, 246)' :
                    currentPhase === 'hold' ? 'rgb(255, 255, 255)' :
                    'rgb(147, 51, 234)'
                  }
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - phaseProgress / phaseDuration)}`}
                  className="transition-all duration-100 ease-linear"
                  style={{
                    filter: 'drop-shadow(0 0 8px currentColor)',
                  }}
                />
              </svg>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentPhase('inhale')
                setPhaseProgress(0)
                setBreathCount(0)
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
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
              } text-white shadow-lg`}
            >
              {isActive ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Stop Session
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start Breathing
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg shadow-primary/5">
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-mono">
              {breathCount}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Breath Cycles
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg shadow-primary/5">
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent font-mono">
              {formatTime(sessionDuration)}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Session Time
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg shadow-primary/5">
          <div className="text-center">
            <div className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent capitalize">
              {currentPhase}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Current Phase
            </div>
          </div>
        </Card>
      </div>

      {/* Technique Info */}
      <Card className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-lg shadow-primary/5">
        <div className="p-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              {currentTechnique.name}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-800/30 dark:to-cyan-800/30 rounded-xl border border-blue-200/50 dark:border-blue-400/30">
                <div className="text-blue-700 dark:text-blue-300 font-semibold">Inhale</div>
                <div className="text-blue-800 dark:text-white font-mono">{currentTechnique.inhale}s</div>
              </div>
              {currentTechnique.hold > 0 && (
                <div className="text-center p-3 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700/30 dark:to-gray-600/30 rounded-xl border border-gray-200/50 dark:border-gray-400/30">
                  <div className="text-gray-700 dark:text-white font-semibold">Hold</div>
                  <div className="text-gray-800 dark:text-gray-100 font-mono">{currentTechnique.hold}s</div>
                </div>
              )}
              <div className="text-center p-3 bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-800/30 dark:to-violet-800/30 rounded-xl border border-purple-200/50 dark:border-purple-400/30">
                <div className="text-purple-700 dark:text-purple-300 font-semibold">Exhale</div>
                <div className="text-purple-800 dark:text-white font-mono">{currentTechnique.exhale}s</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}