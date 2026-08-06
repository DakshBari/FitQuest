"use client"

import { useState, useEffect, useRef } from "react"
import { Eye, Wind, Volume2, ArrowLeft, Play, Clock } from "lucide-react"
import { VoidChallenge } from "./VoidChallenge"
import { BreathSyncer } from "./BreathSyncer"
import { SoundAlchemist } from "./SoundAlchemist"
import { MeditationAvatar } from "./MeditationAvatar"
import { cn } from "@/lib/utils"

type RitualMode = "selection" | "void" | "breath" | "sound"

const rituals = [
  {
    id: "void",
    name: "The Void Challenge",
    subtitle: "AI Eye-Tracking Meditation",
    description:
      "Keep your eyes closed to progress. AI tracks your eyelids for the ultimate focus challenge.",
    icon: Eye,
    accent: "#8b5cf6",
    tag: "Focus",
  },
  {
    id: "breath",
    name: "Breath Syncer",
    subtitle: "Visual & Audio Breathing Guide",
    description:
      "Synchronized breathing with a visual rhythm guide. Reduces anxiety and deepens relaxation.",
    icon: Wind,
    accent: "#06b6d4",
    tag: "Calm",
  },
  {
    id: "sound",
    name: "Sound Alchemist",
    subtitle: "Ambient Environment Mixer",
    description:
      "Craft your perfect soundscape with rain, fire, bowls, and theta waves.",
    icon: Volume2,
    accent: "#10b981",
    tag: "Immersive",
  },
]

// ─── Session status bar ───────────────────────────────────
function SessionBar({
  mode,
  duration,
  onBack,
}: {
  mode: RitualMode
  duration: number
  onBack: () => void
}) {
  const ritual = rituals.find((r) => r.id === mode)
  const m = String(Math.floor(duration / 60)).padStart(2, "0")
  const s = String(duration % 60).padStart(2, "0")

  return (
    <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl border border-border/40 bg-card/70 mb-5">
      <div className="flex items-center gap-3">
        {/* Live pulse dot */}
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ background: ritual?.accent }}
          />
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ background: ritual?.accent }}
          />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">
            {ritual?.name}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5 uppercase tracking-widest">
            Active Session
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-muted-foreground/50" />
          <span
            className="text-lg font-black tabular-nums font-mono"
            style={{ color: ritual?.accent }}
          >
            {m}:{s}
          </span>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      </div>
    </div>
  )
}

// ─── Ritual card ─────────────────────────────────────────
function RitualCard({
  ritual,
  onClick,
}: {
  ritual: (typeof rituals)[number]
  onClick: () => void
}) {
  const Icon = ritual.icon
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group w-full text-left relative rounded-2xl border border-border/40 bg-card/70 p-5 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        boxShadow: hovered ? `0 8px 32px ${ritual.accent}18` : undefined,
        borderColor: hovered ? `${ritual.accent}40` : undefined,
      }}
    >
      {/* Subtle accent line on left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 transition-opacity duration-200"
        style={{ background: ritual.accent, opacity: hovered ? 1 : 0.4 }}
      />

      {/* Content */}
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{ background: `${ritual.accent}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: ritual.accent }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-foreground">{ritual.name}</h3>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide"
              style={{
                color: ritual.accent,
                background: `${ritual.accent}15`,
              }}
            >
              {ritual.tag}
            </span>
          </div>
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5">
            {ritual.subtitle}
          </p>
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            {ritual.description}
          </p>
        </div>

        {/* Begin arrow */}
        <div
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all duration-200"
          style={{
            background: hovered ? ritual.accent : `${ritual.accent}15`,
            color: hovered ? "#fff" : ritual.accent,
          }}
        >
          <Play className="w-3 h-3" />
          Begin
        </div>
      </div>
    </button>
  )
}

// ─── Selection grid ───────────────────────────────────────
function SelectionView({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/70 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Practice
        </p>
        <h2 className="text-base font-bold text-foreground mt-0.5">
          Choose Your Ritual
        </h2>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          Select a technique aligned with your current state of mind
        </p>
      </div>

      {/* Cards */}
      <div className="p-4 space-y-3">
        {rituals.map((r) => (
          <RitualCard key={r.id} ritual={r} onClick={() => onSelect(r.id)} />
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-5 pb-4">
        <p className="text-[10px] text-muted-foreground/35 text-center">
          Each session is tracked · Progress is saved automatically
        </p>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────
export function MeditationSection() {
  const [currentMode, setCurrentMode] = useState<RitualMode>("selection")
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isSessionActive) {
      intervalRef.current = setInterval(
        () => setSessionDuration((p) => p + 1),
        1000
      )
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isSessionActive])

  const handleSelect = (id: string) => {
    setCurrentMode(id as RitualMode)
    setSessionDuration(0)
  }

  const handleBack = () => {
    setCurrentMode("selection")
    setIsSessionActive(false)
    setSessionDuration(0)
  }

  return (
    <div className="space-y-0">
      {/* Session status bar (only in active ritual) */}
      {currentMode !== "selection" && (
        <SessionBar
          mode={currentMode}
          duration={sessionDuration}
          onBack={handleBack}
        />
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Main content */}
        <div className="lg:col-span-3">
          {currentMode === "selection" && (
            <SelectionView onSelect={handleSelect} />
          )}
          {currentMode === "void" && (
            <VoidChallenge
              isActive={isSessionActive}
              onToggle={() => setIsSessionActive((p) => !p)}
              sessionDuration={sessionDuration}
            />
          )}
          {currentMode === "breath" && (
            <BreathSyncer
              isActive={isSessionActive}
              onToggle={() => setIsSessionActive((p) => !p)}
              sessionDuration={sessionDuration}
            />
          )}
          {currentMode === "sound" && (
            <SoundAlchemist
              isActive={isSessionActive}
              onToggle={() => setIsSessionActive((p) => !p)}
              sessionDuration={sessionDuration}
            />
          )}
        </div>

        {/* Avatar sidebar */}
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