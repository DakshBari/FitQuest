"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Brain, Heart, Sparkles } from "lucide-react"

interface MeditationAvatarProps {
  isActive: boolean
  currentMode: string
  sessionDuration: number
}

export function MeditationAvatar({ isActive, currentMode, sessionDuration }: MeditationAvatarProps) {
  const [levitationHeight, setLevitationHeight] = useState(0)
  const [particleIntensity, setParticleIntensity] = useState(0)
  const [auraGlow, setAuraGlow] = useState(0)

  // Calculate meditation effects based on session duration
  useEffect(() => {
    if (isActive && sessionDuration > 0) {
      // Gradual levitation (max 20px after 5 minutes)
      const maxLevitation = Math.min(sessionDuration / 300 * 20, 20)
      setLevitationHeight(maxLevitation)
      
      // Particle intensity increases with time
      const maxParticles = Math.min(sessionDuration / 60 * 10, 30)
      setParticleIntensity(maxParticles)
      
      // Aura glow intensity
      const maxGlow = Math.min(sessionDuration / 180 * 100, 100)
      setAuraGlow(maxGlow)
    } else {
      setLevitationHeight(0)
      setParticleIntensity(0)
      setAuraGlow(0)
    }
  }, [isActive, sessionDuration])

  const getModeColor = () => {
    switch (currentMode) {
      case 'void':
        return 'from-purple-500 to-violet-600'
      case 'breath':
        return 'from-blue-400 to-cyan-500'
      case 'sound':
        return 'from-emerald-500 to-teal-500'
      default:
        return 'from-gray-400 to-gray-600'
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 h-full">
      <div className="p-6 border-b border-border bg-gradient-to-r from-purple-500/10 via-transparent to-violet-500/10">
        <h3 className="text-lg font-bold text-foreground font-inter flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          Meditation Guide
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Your mindful companion</p>
      </div>
      
      <div className="p-6 space-y-6">
        
        {/* Avatar Container */}
        <div className="relative h-64 flex items-end justify-center overflow-hidden">
          
          {/* Floating Particles */}
          {isActive && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(Math.floor(particleIntensity))].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-60"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 3}s`,
                    boxShadow: '0 0 4px rgba(168, 85, 247, 0.8)'
                  }}
                />
              ))}
            </div>
          )}

          {/* Avatar Aura */}
          {isActive && auraGlow > 0 && (
            <div 
              className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 w-32 h-32 rounded-full 
                         bg-gradient-radial ${getModeColor()} opacity-30 blur-xl animate-pulse`}
              style={{
                transform: `translateX(-50%) translateY(${levitationHeight}px)`,
                opacity: auraGlow / 200
              }}
            />
          )}

          {/* Avatar Figure */}
          <div 
            className="relative transition-all duration-1000 ease-out"
            style={{
              transform: `translateY(-${levitationHeight}px)`,
            }}
          >
            {/* Shadow */}
            <div 
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-black/20 rounded-full blur-sm"
              style={{
                opacity: Math.max(0.3 - levitationHeight / 100, 0.1),
                transform: `translateX(-50%) scale(${1 + levitationHeight / 40})`
              }}
            />
            
            {/* Avatar Body */}
            <div className="relative">
              {/* Head */}
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-purple-200 to-purple-300 
                             border-2 border-purple-400/50 mx-auto mb-2 ${isActive ? 'animate-pulse' : ''}`}>
                {/* Eyes (closed during meditation) */}
                {isActive && (
                  <div className="flex justify-center items-center h-full">
                    <div className="flex gap-2">
                      <div className="w-1 h-0.5 bg-purple-800 rounded-full"></div>
                      <div className="w-1 h-0.5 bg-purple-800 rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Body in Lotus Position */}
              <div className="relative">
                {/* Torso */}
                <div className={`w-8 h-12 bg-gradient-to-br from-purple-300 to-purple-400 rounded-t-lg mx-auto
                               ${isActive ? 'animate-pulse' : ''}`} />
                
                {/* Arms in meditation pose */}
                <div className="absolute top-2 -left-2 w-3 h-8 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full transform rotate-45" />
                <div className="absolute top-2 -right-2 w-3 h-8 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full transform -rotate-45" />
                
                {/* Legs crossed */}
                <div className="absolute -bottom-2 left-0 w-6 h-4 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full transform rotate-12" />
                <div className="absolute -bottom-2 right-0 w-6 h-4 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full transform -rotate-12" />
              </div>
            </div>
          </div>
        </div>

        {/* Meditation Status */}
        <div className="text-center space-y-3">
          <div className="space-y-1">
            <div className={`text-lg font-semibold ${isActive ? 'text-purple-600' : 'text-muted-foreground'}`}>
              {isActive ? 'Meditating' : 'At Rest'}
            </div>
            {isActive && (
              <div className="text-sm text-muted-foreground">
                {currentMode === 'void' && 'Embracing the Void'}
                {currentMode === 'breath' && 'Syncing Breath'}
                {currentMode === 'sound' && 'Mixing Sounds'}
                {currentMode === 'selection' && 'Preparing...'}
              </div>
            )}
          </div>

          {/* Session Timer */}
          {isActive && (
            <div className="space-y-2">
              <div className="text-2xl font-mono bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                {formatTime(sessionDuration)}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Session Duration
              </div>
            </div>
          )}
        </div>

        {/* Meditation Effects */}
        {isActive && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wider text-center flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3" />
              Meditation Effects
            </div>
            
            <div className="space-y-2">
              {/* Levitation Progress */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Levitation</span>
                <span className="text-purple-600">{Math.round((levitationHeight / 20) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-violet-500 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${(levitationHeight / 20) * 100}%` }}
                />
              </div>

              {/* Aura Intensity */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Aura Glow</span>
                <span className="text-blue-600">{Math.round(auraGlow)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1">
                <div 
                  className={`bg-gradient-to-r ${getModeColor()} h-1 rounded-full transition-all duration-1000`}
                  style={{ width: `${auraGlow}%` }}
                />
              </div>

              {/* Particle Field */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Energy Field</span>
                <span className="text-emerald-600">{Math.round((particleIntensity / 30) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${(particleIntensity / 30) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Meditation Milestones */}
        {isActive && sessionDuration > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider text-center flex items-center justify-center gap-2">
              <Heart className="w-3 h-3" />
              Milestones
            </div>
            <div className="space-y-1 text-xs">
              <div className={`flex justify-between ${sessionDuration >= 60 ? 'text-green-600' : 'text-muted-foreground'}`}>
                <span>First Minute</span>
                <span>{sessionDuration >= 60 ? '✓' : '○'}</span>
              </div>
              <div className={`flex justify-between ${sessionDuration >= 300 ? 'text-green-600' : 'text-muted-foreground'}`}>
                <span>Deep State (5min)</span>
                <span>{sessionDuration >= 300 ? '✓' : '○'}</span>
              </div>
              <div className={`flex justify-between ${sessionDuration >= 600 ? 'text-green-600' : 'text-muted-foreground'}`}>
                <span>Flow State (10min)</span>
                <span>{sessionDuration >= 600 ? '✓' : '○'}</span>
              </div>
              <div className={`flex justify-between ${sessionDuration >= 1200 ? 'text-green-600' : 'text-muted-foreground'}`}>
                <span>Master Level (20min)</span>
                <span>{sessionDuration >= 1200 ? '✓' : '○'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}