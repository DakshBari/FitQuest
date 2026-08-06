"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface Props {
  isActive: boolean
  currentMode: string
  sessionDuration: number
}

const MODE_ACCENT: Record<string, string> = {
  void:      "#8b5cf6",
  breath:    "#06b6d4",
  sound:     "#10b981",
  selection: "#6b7280",
}

const MODE_LABEL: Record<string, string> = {
  void:      "Embracing the Void",
  breath:    "Syncing Breath",
  sound:     "Crafting Soundscape",
  selection: "At Rest",
}

const MILESTONES = [
  { secs: 60,   label: "1 min",   key: "1m"  },
  { secs: 300,  label: "5 min",   key: "5m"  },
  { secs: 600,  label: "10 min",  key: "10m" },
  { secs: 1200, label: "20 min",  key: "20m" },
]

// ─── SVG Meditation figure ────────────────────────────────
function MeditationFigure({ isActive, accent }: { isActive: boolean; accent: string }) {
  return (
    <svg
      viewBox="0 0 120 160"
      className="w-full max-w-[140px] mx-auto"
      style={{ filter: isActive ? `drop-shadow(0 0 8px ${accent}50)` : "none", transition: "filter 1s ease" }}
    >
      {/* ── Aura rings (only when active) ── */}
      {isActive && [30, 42, 54].map((r, i) => (
        <circle
          key={r}
          cx="60" cy="110"
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={0.8}
          opacity={0.12 - i * 0.03}
          style={{
            animation: `pulse ${2.5 + i * 0.8}s ease-in-out ${i * 0.5}s infinite alternate`,
          }}
        />
      ))}

      {/* ── Ground shadow ── */}
      <ellipse
        cx="60" cy="142"
        rx={isActive ? 14 : 18}
        ry="3"
        fill="rgba(0,0,0,0.12)"
        style={{ transition: "rx 2s ease" }}
      />

      {/* ── Crossed legs (lotus) ── */}
      {/* left leg */}
      <path
        d="M 40 130 Q 50 128 60 130 Q 55 138 45 140 Q 38 138 40 130 Z"
        fill={accent}
        opacity={0.7}
      />
      {/* right leg */}
      <path
        d="M 80 130 Q 70 128 60 130 Q 65 138 75 140 Q 82 138 80 130 Z"
        fill={accent}
        opacity={0.7}
      />

      {/* ── Torso ── */}
      <path
        d="M 50 105 Q 52 98 60 96 Q 68 98 70 105 L 68 128 L 52 128 Z"
        fill={accent}
        opacity={0.75}
      />

      {/* ── Left arm (resting on knee) ── */}
      <path
        d="M 51 110 Q 44 118 42 128"
        stroke={accent}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
      {/* left hand circle */}
      <circle cx="42" cy="130" r="3" fill={accent} opacity={0.6} />

      {/* ── Right arm ── */}
      <path
        d="M 69 110 Q 76 118 78 128"
        stroke={accent}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
      <circle cx="78" cy="130" r="3" fill={accent} opacity={0.6} />

      {/* ── Neck ── */}
      <rect x="57" y="90" width="6" height="8" rx="3" fill={accent} opacity={0.65} />

      {/* ── Head ── */}
      <circle cx="60" cy="82" r="13" fill={accent} opacity={0.8} />

      {/* ── Face: closed eyes ── */}
      <path
        d="M 54 81 Q 56 80 58 81"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 62 81 Q 64 80 66 81"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Slight serene smile ── */}
      <path
        d="M 56 86 Q 60 88 64 86"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Third eye dot (active only) ── */}
      {isActive && (
        <circle cx="60" cy="76" r="1.5" fill="white" opacity={0.7}>
          <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
        </circle>
      )}

      {/* ── Breath ring (active) ── */}
      {isActive && (
        <circle cx="60" cy="82" r="16" fill="none" stroke={accent} strokeWidth="1" opacity={0.2}>
          <animate attributeName="r" values="16;20;16" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0;0.2" dur="4s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  )
}

// ─── Animated bar ─────────────────────────────────────────
function StatBar({ label, pct, accent }: { label: string; pct: number; accent: string }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(pct), 200); return () => clearTimeout(t) }, [pct])
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground/70">{label}</span>
        <span className="text-[10px] font-bold tabular-nums" style={{ color: accent }}>{Math.round(pct)}%</span>
      </div>
      <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${w}%`, background: accent }}
        />
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────
export function MeditationAvatar({ isActive, currentMode, sessionDuration }: Props) {
  const accent = MODE_ACCENT[currentMode] || MODE_ACCENT.selection

  const levPct   = Math.min((sessionDuration / 300) * 100, 100)
  const auraPct  = Math.min((sessionDuration / 180) * 100, 100)
  const focusPct = Math.min((sessionDuration / 60)  * 100 / 30 * 100, 100)

  const m = String(Math.floor(sessionDuration / 60)).padStart(2, "0")
  const s = String(sessionDuration % 60).padStart(2, "0")

  return (
    <div className="rounded-2xl border border-border/40 bg-card/70 overflow-hidden h-full flex flex-col">

      {/* Header */}
      <div className="px-4 py-3.5 border-b border-border/30">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Guide</p>
        <h3 className="text-sm font-bold text-foreground mt-0.5">Meditation Guide</h3>
        <p className="text-[10px] text-muted-foreground/50 mt-0.5">Your mindful companion</p>
      </div>

      <div className="p-4 flex flex-col gap-5 flex-1">

        {/* Figure */}
        <div
          className="relative py-4 flex items-center justify-center"
          style={{
            transition: "transform 2s ease",
            transform: isActive ? `translateY(-${Math.min(levPct * 0.08, 8)}px)` : "translateY(0)",
          }}
        >
          <MeditationFigure isActive={isActive} accent={accent} />
        </div>

        {/* Status */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            {isActive && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: accent }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: accent }} />
              </span>
            )}
            <span
              className="text-xs font-semibold"
              style={{ color: isActive ? accent : undefined }}
            >
              {isActive ? MODE_LABEL[currentMode] : "At Rest"}
            </span>
          </div>
          {isActive && (
            <p className="text-2xl font-black tabular-nums font-mono" style={{ color: accent }}>
              {m}:{s}
            </p>
          )}
        </div>

        {/* Stats (only when active) */}
        {isActive && (
          <div className="space-y-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Session Progress
            </p>
            <StatBar label="Presence"   pct={auraPct}  accent={accent} />
            <StatBar label="Flow State" pct={levPct}   accent={accent} />
            <StatBar label="Focus"      pct={focusPct} accent={accent} />
          </div>
        )}

        {/* Milestones */}
        {isActive && sessionDuration > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Milestones
            </p>
            <div className="space-y-1.5">
              {MILESTONES.map(ms => {
                const reached = sessionDuration >= ms.secs
                return (
                  <div key={ms.key} className="flex items-center justify-between">
                    <span className={cn("text-[11px]", reached ? "text-foreground font-medium" : "text-muted-foreground/50")}>
                      {ms.label}
                    </span>
                    <div
                      className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-500"
                      style={reached
                        ? { background: accent, borderColor: accent }
                        : { borderColor: "hsl(var(--border))" }
                      }
                    >
                      {reached && (
                        <svg viewBox="0 0 8 8" className="w-2.5 h-2.5">
                          <path d="M1.5 4 L3 5.5 L6.5 2" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Idle hint */}
        {!isActive && (
          <p className="text-[10px] text-muted-foreground/40 text-center leading-relaxed mt-auto">
            Begin a session to see your guide come to life
          </p>
        )}
      </div>
    </div>
  )
}