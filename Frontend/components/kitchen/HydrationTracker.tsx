"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Droplets, Plus, Waves } from "lucide-react"
import { cn } from "@/lib/utils"

interface HydrationTrackerProps {
  current: number
  target: number
  onAdd: (amount: number) => void
  viewMode?: "daily" | "weekly"
  weeklyData?: Array<{ date: string; amount: number; dayName: string }>
  weeklyTotal?: number
}

// ── Animated wave SVG path generator ──────────────────────────────────────────
function getWavePath(offset: number, width = 200, waveH = 8): string {
  const y = 0
  return `M -${width} ${y}
    C -${width * 0.75} ${y - waveH}, -${width * 0.25} ${y + waveH}, 0 ${y}
    C ${width * 0.25} ${y - waveH}, ${width * 0.75} ${y + waveH}, ${width} ${y}
    C ${width * 1.25} ${y - waveH}, ${width * 1.75} ${y + waveH}, ${width * 2} ${y}
    L ${width * 2} 400 L -${width} 400 Z`
}

export function HydrationTracker({
  current,
  target,
  onAdd,
  viewMode = "daily",
  weeklyData = [],
  weeklyTotal = 0,
}: HydrationTrackerProps) {
  const safeCurrent = typeof current === "number" && !isNaN(current) ? current : 0
  const safeTarget = typeof target === "number" && !isNaN(target) && target > 0 ? target : 3000

  const displayCurrent = viewMode === "weekly" ? weeklyTotal : safeCurrent
  const displayTarget = viewMode === "weekly" ? safeTarget * 7 : safeTarget
  const pct = Math.min((displayCurrent / displayTarget) * 100, 100)

  const [customAmount, setCustomAmount] = useState("")
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const [waveOffset, setWaveOffset] = useState(0)
  const [animPct, setAnimPct] = useState(0)
  const rippleId = useRef(0)
  const animFrame = useRef<number>(0)
  const animPrevRef = useRef(0)

  // Smooth animated fill
  useEffect(() => {
    const duration = 1200
    const start = animPrevRef.current
    const diff = pct - start
    const startTime = performance.now()
    const step = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      const next = start + diff * ease
      setAnimPct(next)
      animPrevRef.current = next
      if (t < 1) animFrame.current = requestAnimationFrame(step)
    }
    animFrame.current = requestAnimationFrame(step)
    return () => { cancelAnimationFrame(animFrame.current) }
  }, [pct])

  // Continuous wave animation
  useEffect(() => {
    let frame: number
    let offset = 0
    const animate = () => {
      offset = (offset + 1.2) % 200
      setWaveOffset(offset)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  const triggerRipple = (e?: React.MouseEvent) => {
    const id = rippleId.current++
    const x = e ? e.nativeEvent.offsetX : 50
    const y = e ? e.nativeEvent.offsetY : 50
    setRipples((prev) => [...prev, { id, x, y }])
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700)
  }

  const handleAdd = (amount: number, e?: React.MouseEvent) => {
    onAdd(amount)
    triggerRipple(e)
  }

  const handleCustomAdd = () => {
    const amount = parseInt(customAmount)
    if (amount && amount > 0) {
      handleAdd(amount)
      setCustomAmount("")
    }
  }

  // Bottle dimensions
  const BW = 100   // bottle body width
  const BH = 220   // bottle body height
  const NW = 38    // neck width
  const NH = 30    // neck height
  const CAP = 14   // cap height

  // Water fill level (inside bottle body area: y from 60 to 280 in viewBox)
  const bodyTop = NH + CAP + 10
  const bodyBottom = bodyTop + BH
  const fillY = bodyBottom - (animPct / 100) * BH
  const waterColor1 = animPct >= 100 ? "#0ea5e9" : "#38bdf8"
  const waterColor2 = animPct >= 100 ? "#0369a1" : "#0284c7"

  return (
    <Card className="bg-card/70 backdrop-blur-xl border-border/50 rounded-3xl shadow-lg shadow-black/5 p-5 flex flex-col gap-4 overflow-hidden relative group hover:-translate-y-0.5 transition-all duration-300">
      {/* Background glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

      {/* Header */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/15">
            <Droplets className="h-4 w-4 text-cyan-500" />
          </div>
          <span className="font-semibold text-foreground text-sm">Hydration</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
            {viewMode === "weekly" ? "Weekly" : "Daily"}
          </span>
          <span className="text-xs font-bold text-cyan-500 tabular-nums">
            {Math.round(pct)}%
          </span>
        </div>
      </div>

      {/* Main content */}
      {viewMode === "daily" ? (
        <div className="flex gap-5 items-stretch relative">
          {/* ── Bottle ── */}
          <div className="flex-shrink-0 relative" style={{ width: 90 }}>
            <svg viewBox="0 0 140 330" className="w-full drop-shadow-2xl" style={{ filter: "drop-shadow(0 8px 24px rgba(56,189,248,0.25))" }}>
              <defs>
                {/* Bottle glass gradient */}
                <linearGradient id="bottleGlass" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#e2f8ff" stopOpacity="0.35" />
                  <stop offset="40%" stopColor="#bae6fd" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#e2f8ff" stopOpacity="0.2" />
                </linearGradient>
                {/* Water gradient */}
                <linearGradient id="waterFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={waterColor1} stopOpacity="0.95" />
                  <stop offset="100%" stopColor={waterColor2} stopOpacity="1" />
                </linearGradient>
                {/* Wave gradient darker */}
                <linearGradient id="waveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={waterColor1} stopOpacity="0.7" />
                  <stop offset="100%" stopColor={waterColor2} stopOpacity="0.9" />
                </linearGradient>
                {/* Clip to bottle shape */}
                <clipPath id="bottleBodyClip">
                  <rect x="10" y={bodyTop} width={BW + 20} height={BH + 2} rx="14" />
                </clipPath>
                <clipPath id="fullBottleClip">
                  {/* neck */}
                  <rect x={10 + (BW - NW) / 2 + 10} y={CAP} width={NW} height={NH + 4} rx="4" />
                </clipPath>
              </defs>

              {/* ── Cap ── */}
              <rect x={10 + (BW - NW) / 2 + 10} y={4} width={NW} height={CAP} rx="5"
                fill="#334155" />
              <rect x={10 + (BW - NW) / 2 + 10 + 4} y={8} width={NW - 8} height={3} rx="1.5"
                fill="#475569" opacity="0.8" />

              {/* ── Neck ── */}
              <rect x={10 + (BW - NW) / 2 + 10} y={CAP} width={NW} height={NH + 2} rx="4"
                fill="url(#bottleGlass)" stroke="rgba(186,230,253,0.4)" strokeWidth="1.5" />

              {/* ── Body (glass shell) ── */}
              <rect x="10" y={bodyTop} width={BW + 20} height={BH} rx="14"
                fill="url(#bottleGlass)" stroke="rgba(186,230,253,0.35)" strokeWidth="1.5" />

              {/* ── Water fill ── */}
              <g clipPath="url(#bottleBodyClip)">
                {/* Static fill */}
                <rect x="10" y={fillY} width={BW + 20} height={bodyBottom - fillY + 2}
                  fill="url(#waterFill)"
                  style={{ transition: "y 1.2s cubic-bezier(0.4,0,0.2,1), height 1.2s cubic-bezier(0.4,0,0.2,1)" }}
                />
                {/* Animated wave surface */}
                {animPct > 1 && (
                  <g style={{ transform: `translateY(${fillY}px)` }}>
                    <path
                      d={getWavePath(waveOffset, 70, 4)}
                      fill="url(#waveFill)"
                      style={{ transform: `translateX(${-waveOffset * 0.5}px)` }}
                    />
                  </g>
                )}
                {/* Bubble 1 */}
                {animPct > 10 && (
                  <circle cx="30" cy={bodyBottom - animPct / 100 * BH * 0.4} r="2.5"
                    fill="white" opacity="0.25" className="animate-bounce" style={{ animationDuration: "2.4s" }} />
                )}
                {/* Bubble 2 */}
                {animPct > 25 && (
                  <circle cx="90" cy={bodyBottom - animPct / 100 * BH * 0.6} r="1.8"
                    fill="white" opacity="0.2" className="animate-bounce" style={{ animationDuration: "3.1s", animationDelay: "0.7s" }} />
                )}
                {/* Surface shimmer */}
                <rect x="10" y={fillY - 1} width={BW + 20} height="2"
                  fill="white" opacity="0.18"
                  style={{ transition: "y 1.2s cubic-bezier(0.4,0,0.2,1)" }}
                />
              </g>

              {/* ── Tick marks ── */}
              {[25, 50, 75].map((tick) => {
                const tickY = bodyBottom - (tick / 100) * BH
                return (
                  <g key={tick}>
                    <line x1="10" y1={tickY} x2="22" y2={tickY} stroke="rgba(186,230,253,0.3)" strokeWidth="1" />
                    <line x1={BW + 18} y1={tickY} x2={BW + 30} y2={tickY} stroke="rgba(186,230,253,0.3)" strokeWidth="1" />
                    <text x="0" y={tickY + 3} fill="rgba(148,163,184,0.5)" fontSize="6" textAnchor="middle">{tick}%</text>
                  </g>
                )
              })}

              {/* ── Highlight on glass ── */}
              <rect x="15" y={bodyTop + 8} width="8" height={BH - 16} rx="4"
                fill="white" opacity="0.08" />
            </svg>

            {/* Ripples on bottle */}
            {ripples.map((r) => (
              <span key={r.id}
                className="absolute rounded-full border-2 border-cyan-400/50 animate-ping pointer-events-none"
                style={{ width: 40, height: 40, left: r.x - 20, top: r.y - 20, animationDuration: "0.7s" }}
              />
            ))}
          </div>

          {/* ── Right side ── */}
          <div className="flex-1 flex flex-col gap-3 justify-between">
            {/* Stats */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-cyan-500 tabular-nums leading-none">{displayCurrent}</span>
                <span className="text-sm text-muted-foreground">ml</span>
              </div>
              <div className="text-xs text-muted-foreground">
                of <span className="font-semibold text-foreground">{displayTarget}ml</span> goal
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden mt-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000"
                  style={{ width: `${animPct}%`, boxShadow: animPct > 0 ? "0 0 8px rgba(56,189,248,0.5)" : "none" }}
                />
              </div>
            </div>

            {/* Quick presets */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { val: 125, label: "125" },
                { val: 250, label: "250" },
                { val: 500, label: "500" },
              ].map((btn) => (
                <button
                  key={btn.val}
                  onClick={(e) => handleAdd(btn.val, e)}
                  className={cn(
                    "h-9 text-xs font-semibold rounded-xl border transition-all duration-200",
                    "bg-cyan-500/5 border-cyan-500/20 text-cyan-600 dark:text-cyan-400",
                    "hover:bg-cyan-500/15 hover:border-cyan-500/40 hover:scale-105 active:scale-95"
                  )}
                >
                  +{btn.label}ml
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Custom ml"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomAdd()}
                className="h-9 text-xs bg-muted/30 border-border/50 focus-visible:ring-cyan-500/30 placeholder:text-muted-foreground/40"
              />
              <Button
                onClick={handleCustomAdd}
                className="h-9 w-9 p-0 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white border-0 shadow-lg shadow-cyan-500/25 flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Weekly hydration breakdown */
        <div className="flex flex-col gap-3 relative">
          {/* Weekly total */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-cyan-500/8 border border-cyan-500/15">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Weekly Total</p>
              <p className="text-xl font-black text-cyan-500 tabular-nums leading-none mt-0.5">
                {(weeklyTotal / 1000).toFixed(1)}<span className="text-xs font-normal text-muted-foreground ml-1">L</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Target</p>
              <p className="text-sm font-bold text-foreground tabular-nums">{(safeTarget * 7 / 1000).toFixed(1)}L</p>
            </div>
          </div>

          {/* Daily bars */}
          <div className="grid grid-cols-7 gap-1">
            {weeklyData.map((day) => {
              const dayPct = Math.min((day.amount / safeTarget) * 100, 100)
              const isGood = dayPct >= 80
              return (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <div className="text-[9px] text-muted-foreground uppercase font-medium">{day.dayName.slice(0, 1)}</div>
                  <div className="relative h-16 w-full rounded-lg bg-muted/20 overflow-hidden">
                    <div
                      className={cn(
                        "absolute bottom-0 left-0 right-0 rounded-lg transition-all duration-700",
                        isGood ? "bg-gradient-to-t from-cyan-600 to-cyan-400" : "bg-gradient-to-t from-blue-700 to-blue-500"
                      )}
                      style={{ height: `${dayPct}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-muted-foreground tabular-nums">
                    {(day.amount / 1000).toFixed(1)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}