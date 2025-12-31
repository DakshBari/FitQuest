"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { 
  Eye, 
  EyeOff, 
  Wind, 
  Volume2, 
  ArrowLeft, 
  Play, 
  Pause,
  RotateCcw,
  Sparkles,
  Heart,
  Brain
} from "lucide-react"
import { VoidChallenge } from "./VoidChallenge"
import { BreathSyncer } from "./BreathSyncer"
import { SoundAlchemist } from "./SoundAlchemist"
import { MeditationAvatar } from "./MeditationAvatar"

type RitualMode = 'selection' | 'void' | 'breath' | 'sound'

const rituals = [
  {
    id: 'void',
    name: 'The Void Challenge',
    subtitle: 'AI Eye-Tracking Meditation',
    description: 'Keep your eyes closed to progress through the void. AI tracks your eyelids for the ultimate focus challenge.',
    icon: Eye,
    color: 'from-purple-500 to-violet-600',
    bgColor: 'from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20',
    textColor: 'text-purple-700 dark:text-purple-300',
    glowColor: 'shadow-purple-500/30 dark:shadow-purple-500/20'
  },
  {
    id: 'breath',
    name: 'Breath Syncer',
    subtitle: 'Visual & Audio Breathing Guide',
    description: 'Synchronized breathing with a glowing orb. Perfect for anxiety reduction and deep relaxation.',
    icon: Wind,
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    glowColor: 'shadow-blue-500/30 dark:shadow-blue-500/20'
  },
  {
    id: 'sound',
    name: 'Sound Alchemist',
    subtitle: 'Ambient Environment Mixer',
    description: 'Craft your perfect meditation soundscape with rain, fire, bowls, and theta waves.',
    icon: Volume2,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    glowColor: 'shadow-emerald-500/30 dark:shadow-emerald-500/20'
  }
]

export function MeditationSection() {
  const [currentMode, setCurrentMode] = useState<RitualMode>('selection')
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Session timer
  useEffect(() => {
    if (isSessionActive) {
      intervalRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1)
      }, 1000)
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
  }, [isSessionActive])

  const handleRitualSelect = (ritualId: string) => {
    setCurrentMode(ritualId as RitualMode)
    setSessionDuration(0)
  }

  const handleBackToSelection = () => {
    setCurrentMode('selection')
    setIsSessionActive(false)
    setSessionDuration(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      
      {/* Header with Session Info */}
      {currentMode !== 'selection' && (
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5">
          <div className="p-6 border-b border-border bg-gradient-to-r from-purple-500/10 via-transparent to-violet-500/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground font-inter">Active Session</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {rituals.find(r => r.id === currentMode)?.name || 'Meditation Session'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-mono bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                    {formatTime(sessionDuration)}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    Session Time
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleBackToSelection}
                  className="border-border/50 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-violet-500/20 hover:border-purple-500/30 bg-background/30 backdrop-blur-sm font-medium rounded-xl transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          
          {/* Ritual Selection */}
          {currentMode === 'selection' && (
            <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5">
              <div className="p-6 border-b border-border bg-gradient-to-r from-purple-500/10 via-transparent to-violet-500/10">
                <h2 className="text-xl font-bold text-foreground font-inter">Choose Your Practice</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a meditation technique that resonates with your current state of mind
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {rituals.map((ritual) => {
                    const IconComponent = ritual.icon
                    return (
                      <Card
                        key={ritual.id}
                        className={`relative p-6 bg-gradient-to-br ${ritual.bgColor} border border-border/50 cursor-pointer 
                                   hover:scale-105 transition-all duration-300 ${ritual.glowColor} hover:shadow-2xl
                                   group overflow-hidden backdrop-blur-sm rounded-2xl`}
                        onClick={() => handleRitualSelect(ritual.id)}
                      >
                        {/* Soft glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="relative z-10 text-center space-y-4">
                          <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${ritual.color} 
                                         flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                            <IconComponent className="w-8 h-8" />
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-1 font-inter">
                              {ritual.name}
                            </h3>
                            <p className={`text-sm ${ritual.textColor} opacity-80 mb-3`}>
                              {ritual.subtitle}
                            </p>
                            <p className="text-sm text-muted-foreground opacity-70 leading-relaxed">
                              {ritual.description}
                            </p>
                          </div>
                          
                          <div className="pt-4">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl 
                                           bg-gradient-to-r ${ritual.color} text-white text-sm font-medium
                                           group-hover:shadow-lg transition-all duration-300`}>
                              <Play className="w-4 h-4" />
                              Begin Practice
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* The Void Challenge */}
          {currentMode === 'void' && (
            <VoidChallenge
              isActive={isSessionActive}
              onToggle={() => setIsSessionActive(!isSessionActive)}
              sessionDuration={sessionDuration}
            />
          )}

          {/* Breath Syncer */}
          {currentMode === 'breath' && (
            <BreathSyncer
              isActive={isSessionActive}
              onToggle={() => setIsSessionActive(!isSessionActive)}
              sessionDuration={sessionDuration}
            />
          )}

          {/* Sound Alchemist */}
          {currentMode === 'sound' && (
            <SoundAlchemist
              isActive={isSessionActive}
              onToggle={() => setIsSessionActive(!isSessionActive)}
              sessionDuration={sessionDuration}
            />
          )}
        </div>

        {/* Avatar Section */}
        <div className="lg:col-span-1">
          <MeditationAvatar
            isActive={isSessionActive}
            currentMode={currentMode}
            sessionDuration={sessionDuration}
          />
        </div>
      </div>
    </div>
  )
}