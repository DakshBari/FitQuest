"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, RotateCcw, Volume2, VolumeX, Moon, Sun, Waves } from "lucide-react"
import { Slider } from "@/components/ui/slider"

interface GuidedSession {
  id: string
  title: string
  duration: number // in minutes
  description: string
  type: "breathing" | "mindfulness" | "sleep" | "focus"
}

const guidedSessions: GuidedSession[] = [
  {
    id: "1",
    title: "Deep Breathing",
    duration: 5,
    description: "Calm your mind with controlled breathing exercises",
    type: "breathing"
  },
  {
    id: "2",
    title: "Body Scan",
    duration: 10,
    description: "Progressive relaxation through body awareness",
    type: "mindfulness"
  },
  {
    id: "3",
    title: "Sleep Meditation",
    duration: 15,
    description: "Gentle guidance for restful sleep",
    type: "sleep"
  },
  {
    id: "4",
    title: "Focus & Clarity",
    duration: 10,
    description: "Enhance concentration and mental clarity",
    type: "focus"
  },
]

export function MeditationSection() {
  const [isActive, setIsActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes default in seconds
  const [selectedSession, setSelectedSession] = useState<GuidedSession | null>(null)
  const [volume, setVolume] = useState([50])
  const [isMuted, setIsMuted] = useState(false)
  const [ambientSound, setAmbientSound] = useState<"none" | "rain" | "ocean" | "forest">("none")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioNodesRef = useRef<(AudioNode | { interval?: NodeJS.Timeout })[]>([])
  const chirpIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Audio Context on user interaction
  const initAudioContext = () => {
    if (typeof window !== "undefined" && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (e) {
        console.error("Failed to initialize audio context:", e)
      }
    }
    // Resume context if suspended (browser autoplay policy)
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume()
    }
  }

  // Stop ambient sound
  const stopAmbientSound = () => {
    audioNodesRef.current.forEach((node: any) => {
      try {
        if (node.stop) node.stop()
        if (node.disconnect) node.disconnect()
      } catch (e) {
        // Ignore errors when stopping nodes
      }
    })
    audioNodesRef.current = []
    if (chirpIntervalRef.current) {
      clearInterval(chirpIntervalRef.current)
      chirpIntervalRef.current = null
    }
  }

  // Handle ambient sound changes
  useEffect(() => {
    if (ambientSound !== "none" && !isMuted) {
      initAudioContext()
      playAmbientSound(ambientSound)
    } else {
      stopAmbientSound()
    }
    return () => {
      stopAmbientSound()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambientSound, isMuted, volume])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound()
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [])

  // Timer effect
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false)
            return 0
          }
          return prev - 1
        })
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
  }, [isActive, timeRemaining])

  // Generate ambient sounds using Web Audio API
  const playAmbientSound = (soundType: "rain" | "ocean" | "forest") => {
    if (!audioContextRef.current || isMuted) return

    stopAmbientSound()
    const ctx = audioContextRef.current
    const nodes: (AudioNode | { interval?: NodeJS.Timeout })[] = []

    try {
      if (soundType === "rain") {
        // Rain sound: white noise with low-pass filter
        const bufferSize = 4096
        const noise = ctx.createScriptProcessor(bufferSize, 0, 1)
        noise.onaudioprocess = (e) => {
          const output = e.outputBuffer.getChannelData(0)
          for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.1
          }
        }

        const filter = ctx.createBiquadFilter()
        filter.type = "lowpass"
        filter.frequency.value = 1000
        filter.Q.value = 1

        const gain = ctx.createGain()
        gain.gain.value = (volume[0] / 100) * 0.3

        noise.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)

        nodes.push(noise, filter, gain)
      } else if (soundType === "ocean") {
        // Ocean waves: multiple oscillators with slow LFO
        for (let i = 0; i < 3; i++) {
          const oscillator = ctx.createOscillator()
          const gain = ctx.createGain()
          const lfo = ctx.createOscillator()
          const lfoGain = ctx.createGain()

          oscillator.type = "sawtooth"
          oscillator.frequency.value = 60 + i * 20

          lfo.type = "sine"
          lfo.frequency.value = 0.1 + i * 0.05
          lfoGain.gain.value = 20

          lfo.connect(lfoGain)
          lfoGain.connect(oscillator.frequency)

          gain.gain.value = (volume[0] / 100) * 0.15

          oscillator.connect(gain)
          gain.connect(ctx.destination)

          oscillator.start()
          lfo.start()

          nodes.push(oscillator, gain, lfo, lfoGain)
        }
      } else if (soundType === "forest") {
        // Forest: combination of low-frequency noise and bird-like chirps
        // White noise for wind
        const bufferSize = 4096
        const noise = ctx.createScriptProcessor(bufferSize, 0, 1)
        noise.onaudioprocess = (e) => {
          const output = e.outputBuffer.getChannelData(0)
          for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.05
          }
        }

        const filter = ctx.createBiquadFilter()
        filter.type = "lowpass"
        filter.frequency.value = 500
        filter.Q.value = 2

        const gain = ctx.createGain()
        gain.gain.value = (volume[0] / 100) * 0.2

        noise.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)

        nodes.push(noise, filter, gain)

        // Bird chirps (simplified)
        chirpIntervalRef.current = setInterval(() => {
          if (!audioContextRef.current || isMuted || ambientSound !== "forest") return
          try {
            const osc = ctx.createOscillator()
            const chirpGain = ctx.createGain()

            osc.type = "sine"
            osc.frequency.setValueAtTime(800, ctx.currentTime)
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1)
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2)

            chirpGain.gain.setValueAtTime(0, ctx.currentTime)
            chirpGain.gain.linearRampToValueAtTime((volume[0] / 100) * 0.1, ctx.currentTime + 0.05)
            chirpGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25)

            osc.connect(chirpGain)
            chirpGain.connect(ctx.destination)

            osc.start()
            osc.stop(ctx.currentTime + 0.25)
          } catch (e) {
            // Ignore chirp errors
          }
        }, 2000)
      }

      audioNodesRef.current = nodes
    } catch (error) {
      console.error("Error playing ambient sound:", error)
      stopAmbientSound()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStartSession = (session: GuidedSession) => {
    setSelectedSession(session)
    setTimeRemaining(session.duration * 60)
    setIsActive(true)
  }

  const handleReset = () => {
    setIsActive(false)
    setTimeRemaining(selectedSession ? selectedSession.duration * 60 : 300)
  }

  const handleToggle = () => {
    setIsActive(!isActive)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-orbitron flex items-center gap-2">
          <Moon className="w-6 h-6 text-purple-500" />
          Meditation
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Find peace and clarity through guided meditation sessions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Card */}
        <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 border-purple-200 dark:border-purple-500/30">
          <div className="text-center space-y-6">
            <div>
              <div className="text-6xl font-bold text-purple-600 dark:text-purple-400 font-mono mb-2">
                {formatTime(timeRemaining)}
              </div>
              {selectedSession && (
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {selectedSession.title}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                className="h-12 w-12 border-gray-300 dark:border-white/10"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleToggle}
                className="h-16 w-16 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/50"
              >
                {isActive ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="h-12 w-12 border-gray-300 dark:border-white/10"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Volume Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Volume</span>
                <span className="text-gray-900 dark:text-white font-medium">{volume[0]}%</span>
              </div>
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="w-full"
                disabled={isMuted}
              />
            </div>

            {/* Ambient Sounds */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ambient Sound</label>
              <div className="flex gap-2 flex-wrap">
                {(["none", "rain", "ocean", "forest"] as const).map((sound) => (
                  <Button
                    key={sound}
                    variant={ambientSound === sound ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (ambientSound === sound) {
                        setAmbientSound("none")
                      } else {
                        setAmbientSound(sound)
                      }
                    }}
                    className={
                      ambientSound === sound
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : ""
                    }
                  >
                    {sound === "none" ? "Off" : sound.charAt(0).toUpperCase() + sound.slice(1)}
                    {sound !== "none" && ambientSound === sound && (
                      <Waves className="w-3 h-3 ml-1 animate-pulse" />
                    )}
                  </Button>
                ))}
              </div>
              {ambientSound !== "none" && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  🎵 Playing {ambientSound} sounds...
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Guided Sessions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Guided Sessions</h3>
          <div className="space-y-3">
            {guidedSessions.map((session) => (
              <Card
                key={session.id}
                className="p-4 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleStartSession(session)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{session.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {session.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full">
                        {session.duration} min
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="ml-2">
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">24</p>
            </div>
            <Moon className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">12h</p>
            </div>
            <Waves className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">7 days</p>
            </div>
            <Sun className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>
    </div>
  )
}

