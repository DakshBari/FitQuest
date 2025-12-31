"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Volume2, VolumeX, Play, Pause, RotateCcw, Save, Shuffle, Music, Sparkles } from "lucide-react"

interface SoundAlchemistProps {
  isActive: boolean
  onToggle: () => void
  sessionDuration: number
}

interface SoundChannel {
  id: string
  name: string
  icon: string
  color: string
  volume: number
  audioNode: AudioNode | null
  oscillator: OscillatorNode | null
  gainNode: GainNode | null
}

export function SoundAlchemist({ isActive, onToggle, sessionDuration }: SoundAlchemistProps) {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [masterVolume, setMasterVolume] = useState([70])
  const [isMuted, setIsMuted] = useState(false)
  const [currentPreset, setCurrentPreset] = useState<string>('custom')
  
  const [channels, setChannels] = useState<SoundChannel[]>([
    {
      id: 'rain',
      name: 'Rain / Thunder',
      icon: '🌧️',
      color: 'from-blue-600 to-blue-800',
      volume: 0,
      audioNode: null,
      oscillator: null,
      gainNode: null
    },
    {
      id: 'fire',
      name: 'Fire Crackle',
      icon: '🔥',
      color: 'from-orange-600 to-red-700',
      volume: 0,
      audioNode: null,
      oscillator: null,
      gainNode: null
    },
    {
      id: 'bowls',
      name: 'Tibetan Bowls',
      icon: '🎵',
      color: 'from-yellow-600 to-amber-700',
      volume: 0,
      audioNode: null,
      oscillator: null,
      gainNode: null
    },
    {
      id: 'theta',
      name: 'Theta Waves (6Hz)',
      icon: '🧠',
      color: 'from-purple-600 to-indigo-700',
      volume: 0,
      audioNode: null,
      oscillator: null,
      gainNode: null
    }
  ])

  const presets = {
    'forest': { rain: 60, fire: 0, bowls: 20, theta: 40, name: 'Forest Meditation' },
    'campfire': { rain: 0, fire: 80, bowls: 30, theta: 20, name: 'Campfire Calm' },
    'temple': { rain: 20, fire: 0, bowls: 70, theta: 60, name: 'Temple Serenity' },
    'storm': { rain: 90, fire: 0, bowls: 10, theta: 30, name: 'Storm Meditation' },
    'deep': { rain: 30, fire: 20, bowls: 40, theta: 80, name: 'Deep Focus' },
    'custom': { rain: 0, fire: 0, bowls: 0, theta: 0, name: 'Custom Mix' }
  }

  const intervalRefs = useRef<{ [key: string]: NodeJS.Timeout }>({})

  // Initialize audio context
  const initAudio = () => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      setAudioContext(ctx)
    }
  }

  // Generate rain sound
  const createRainSound = (ctx: AudioContext, volume: number) => {
    const bufferSize = 4096
    const noise = ctx.createScriptProcessor(bufferSize, 0, 1)
    const filter = ctx.createBiquadFilter()
    const gainNode = ctx.createGain()

    noise.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.3
      }
    }

    filter.type = 'lowpass'
    filter.frequency.value = 1000 + Math.random() * 500
    filter.Q.value = 1

    gainNode.gain.value = (volume / 100) * (masterVolume[0] / 100) * 0.4

    noise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    return { audioNode: noise, gainNode, oscillator: null }
  }

  // Generate fire crackle sound
  const createFireSound = (ctx: AudioContext, volume: number) => {
    const bufferSize = 2048
    const noise = ctx.createScriptProcessor(bufferSize, 0, 1)
    const filter = ctx.createBiquadFilter()
    const gainNode = ctx.createGain()

    noise.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        // Create crackling effect with random bursts
        const burst = Math.random() > 0.95 ? Math.random() * 0.8 : Math.random() * 0.1
        output[i] = (Math.random() * 2 - 1) * burst
      }
    }

    filter.type = 'bandpass'
    filter.frequency.value = 800
    filter.Q.value = 2

    gainNode.gain.value = (volume / 100) * (masterVolume[0] / 100) * 0.3

    noise.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    return { audioNode: noise, gainNode, oscillator: null }
  }

  // Generate Tibetan bowl sound
  const createBowlSound = (ctx: AudioContext, volume: number) => {
    const gainNode = ctx.createGain()
    gainNode.gain.value = (volume / 100) * (masterVolume[0] / 100) * 0.2
    gainNode.connect(ctx.destination)

    // Create periodic bowl strikes
    const strikeInterval = setInterval(() => {
      if (!ctx || ctx.state === 'closed') return

      const oscillator = ctx.createOscillator()
      const strikeGain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      // Fundamental frequency with harmonics
      oscillator.frequency.setValueAtTime(220, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 3)
      
      oscillator.type = 'sine'
      
      filter.type = 'lowpass'
      filter.frequency.value = 2000
      filter.Q.value = 5

      strikeGain.gain.setValueAtTime(0, ctx.currentTime)
      strikeGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1)
      strikeGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 4)

      oscillator.connect(filter)
      filter.connect(strikeGain)
      strikeGain.connect(gainNode)

      oscillator.start()
      oscillator.stop(ctx.currentTime + 4)
    }, 5000 + Math.random() * 3000) // Random interval between 5-8 seconds

    intervalRefs.current['bowls'] = strikeInterval

    return { audioNode: gainNode, gainNode, oscillator: null }
  }

  // Generate theta waves (binaural beats)
  const createThetaWaves = (ctx: AudioContext, volume: number) => {
    const leftOsc = ctx.createOscillator()
    const rightOsc = ctx.createOscillator()
    const leftGain = ctx.createGain()
    const rightGain = ctx.createGain()
    const merger = ctx.createChannelMerger(2)

    // 6Hz theta wave difference
    leftOsc.frequency.value = 200
    rightOsc.frequency.value = 206

    const gainValue = (volume / 100) * (masterVolume[0] / 100) * 0.15
    leftGain.gain.value = gainValue
    rightGain.gain.value = gainValue

    leftOsc.connect(leftGain)
    rightOsc.connect(rightGain)
    leftGain.connect(merger, 0, 0)
    rightGain.connect(merger, 0, 1)
    merger.connect(ctx.destination)

    leftOsc.start()
    rightOsc.start()

    return { audioNode: merger, gainNode: leftGain, oscillator: leftOsc }
  }

  // Update channel audio
  const updateChannelAudio = (channelId: string, volume: number) => {
    if (!audioContext || isMuted) return

    const channel = channels.find(c => c.id === channelId)
    if (!channel) return

    // Stop existing audio for this channel
    stopChannelAudio(channelId)

    if (volume === 0) return

    let audioNodes
    switch (channelId) {
      case 'rain':
        audioNodes = createRainSound(audioContext, volume)
        break
      case 'fire':
        audioNodes = createFireSound(audioContext, volume)
        break
      case 'bowls':
        audioNodes = createBowlSound(audioContext, volume)
        break
      case 'theta':
        audioNodes = createThetaWaves(audioContext, volume)
        break
      default:
        return
    }

    // Update channel state
    setChannels(prev => prev.map(c => 
      c.id === channelId 
        ? { ...c, ...audioNodes, volume }
        : c
    ))
  }

  // Stop channel audio
  const stopChannelAudio = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId)
    if (!channel) return

    try {
      if (channel.oscillator) {
        channel.oscillator.stop()
      }
      if (channel.audioNode && 'disconnect' in channel.audioNode) {
        channel.audioNode.disconnect()
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    // Clear intervals
    if (intervalRefs.current[channelId]) {
      clearInterval(intervalRefs.current[channelId])
      delete intervalRefs.current[channelId]
    }
  }

  // Handle volume changes
  const handleVolumeChange = (channelId: string, newVolume: number[]) => {
    const volume = newVolume[0]
    
    setChannels(prev => prev.map(c => 
      c.id === channelId ? { ...c, volume } : c
    ))

    if (isActive) {
      initAudio()
      updateChannelAudio(channelId, volume)
    }
  }

  // Apply preset
  const applyPreset = (presetName: string) => {
    const preset = presets[presetName as keyof typeof presets]
    if (!preset) return

    setCurrentPreset(presetName)
    
    setChannels(prev => prev.map(c => ({
      ...c,
      volume: preset[c.id as keyof typeof preset] || 0
    })))

    if (isActive) {
      channels.forEach(channel => {
        const volume = preset[channel.id as keyof typeof preset] || 0
        updateChannelAudio(channel.id, volume)
      })
    }
  }

  // Start/stop all audio
  useEffect(() => {
    if (isActive && !isMuted) {
      initAudio()
      channels.forEach(channel => {
        if (channel.volume > 0) {
          updateChannelAudio(channel.id, channel.volume)
        }
      })
    } else {
      channels.forEach(channel => {
        stopChannelAudio(channel.id)
      })
    }

    return () => {
      channels.forEach(channel => {
        stopChannelAudio(channel.id)
      })
    }
  }, [isActive, isMuted])

  // Update master volume
  useEffect(() => {
    if (isActive) {
      channels.forEach(channel => {
        if (channel.volume > 0) {
          updateChannelAudio(channel.id, channel.volume)
        }
      })
    }
  }, [masterVolume])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getTotalVolume = () => {
    return channels.reduce((sum, channel) => sum + channel.volume, 0)
  }

  return (
    <div className="space-y-6">
      
      {/* Preset Selector */}
      <Card className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-lg shadow-primary/5">
        <div className="p-6 border-b border-border bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/10">
          <h3 className="text-lg font-bold text-foreground font-inter flex items-center gap-2">
            <Music className="w-5 h-5 text-emerald-500" />
            Sound Presets
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a pre-configured soundscape or create your own
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center gap-4">
            <select
              value={currentPreset}
              onChange={(e) => applyPreset(e.target.value)}
              className="bg-card border border-border text-foreground rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {Object.entries(presets).map(([key, preset]) => (
                <option key={key} value={key} className="bg-card">
                  {preset.name}
                </option>
              ))}
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset('custom')}
              className="border-border/50 hover:bg-muted rounded-xl"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Random
            </Button>
          </div>
        </div>
      </Card>

      {/* Mixing Board */}
      <Card className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5">
        <div className="p-6 border-b border-border bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/10">
          <h3 className="text-lg font-bold text-foreground font-inter flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-emerald-500" />
            Sound Alchemist
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Mix ambient sounds to create your perfect meditation environment
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          
          {/* Master Controls */}
          <div className="flex items-center justify-between pb-6 border-b border-border/50">
            <div className="flex items-center gap-4">
              <Button
                onClick={onToggle}
                className={`px-6 py-3 text-lg font-semibold rounded-xl ${
                  isActive 
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                } text-white shadow-lg`}
              >
                {isActive ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Stop Mix
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Play Mix
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setIsMuted(!isMuted)}
                className="border-border/50 hover:bg-muted rounded-xl"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>

            <div className="text-right">
              <div className="text-2xl font-mono bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {formatTime(sessionDuration)}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Mix Time
              </div>
            </div>
          </div>

          {/* Channel Mixers */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {channels.map((channel) => (
              <div key={channel.id} className="space-y-4">
                
                {/* Channel Header */}
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${channel.color} 
                                 flex items-center justify-center text-2xl mb-3 shadow-lg`}>
                    {channel.icon}
                  </div>
                  <h3 className="text-foreground font-semibold text-sm mb-1">
                    {channel.name}
                  </h3>
                  <div className="text-xs text-muted-foreground">
                    {channel.volume}%
                  </div>
                </div>

                {/* Vertical Slider */}
                <div className="flex justify-center">
                  <div className="h-48 w-8 relative">
                    <div className="absolute inset-0 bg-muted rounded-full">
                      <div 
                        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${channel.color} rounded-full transition-all duration-200`}
                        style={{ height: `${channel.volume}%` }}
                      />
                    </div>
                    
                    {/* Slider Input (rotated) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={channel.volume}
                        onChange={(e) => handleVolumeChange(channel.id, [parseInt(e.target.value)])}
                        className="h-44 w-2 bg-transparent appearance-none cursor-pointer slider-vertical"
                        style={{
                          writingMode: 'bt-lr',
                          WebkitAppearance: 'slider-vertical'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Channel Controls */}
                <div className="text-center space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVolumeChange(channel.id, [channel.volume > 0 ? 0 : 50])}
                    className="w-full border-border/50 hover:bg-muted rounded-xl"
                  >
                    {channel.volume > 0 ? 'Mute' : 'Unmute'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Master Volume */}
          <div className="pt-6 border-t border-border/50">
            <div className="flex items-center gap-4">
              <Volume2 className="w-5 h-5 text-emerald-600" />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Master Volume</span>
                  <span className="text-sm text-foreground font-mono">{masterVolume[0]}%</span>
                </div>
                <Slider
                  value={masterVolume}
                  onValueChange={setMasterVolume}
                  max={100}
                  step={1}
                  className="w-full"
                  disabled={isMuted}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Mix Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg shadow-primary/5">
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-mono">
              {getTotalVolume()}%
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Total Mix Level
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg shadow-primary/5">
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-mono">
              {channels.filter(c => c.volume > 0).length}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Active Channels
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg shadow-primary/5">
          <div className="text-center">
            <div className="text-lg font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent capitalize">
              {presets[currentPreset as keyof typeof presets]?.name || 'Custom'}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Current Preset
            </div>
          </div>
        </Card>
      </div>

      {/* Sound Descriptions */}
      <Card className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-lg shadow-primary/5">
        <div className="p-6">
          <div className="space-y-3 mb-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Sound Library
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">🌧️</span>
                <div>
                  <div className="text-foreground font-semibold">Rain / Thunder</div>
                  <div className="text-muted-foreground">Calming white noise with natural ambience</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">🔥</span>
                <div>
                  <div className="text-foreground font-semibold">Fire Crackle</div>
                  <div className="text-muted-foreground">Warm crackling sounds for cozy meditation</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">🎵</span>
                <div>
                  <div className="text-foreground font-semibold">Tibetan Bowls</div>
                  <div className="text-muted-foreground">Sacred tones for spiritual practice</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">🧠</span>
                <div>
                  <div className="text-foreground font-semibold">Theta Waves (6Hz)</div>
                  <div className="text-muted-foreground">Binaural beats for deep meditation states</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}