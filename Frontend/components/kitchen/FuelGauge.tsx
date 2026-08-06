"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Target, Flame, Activity } from "lucide-react"
import { GoalType } from "./GoalSettings"
import { cn } from "@/lib/utils"

interface FuelGaugeProps {
  current: { calories: number; protein: number; carbs: number; fats: number }
  target: { calories: number; protein: number; carbs: number; fats: number }
  goal: GoalType
  viewMode: "daily" | "weekly"
  weeklyData?: {
    pct: number
    date: string
    calories: number
    protein: number
    carbs: number
    fats: number
  }[]
}

function useAnimatedPct(target: number) {
  const [pct, setPct] = useState(0)
  const prevRef = useRef(0)
  const frame = useRef<number>(0)
  useEffect(() => {
    const start = prevRef.current
    const diff = target - start
    const duration = 1200
    const startTime = performance.now()
    const step = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      const next = start + diff * ease
      setPct(next)
      prevRef.current = next
      if (t < 1) frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
    return () => { cancelAnimationFrame(frame.current) }
  }, [target])
  return pct
}

// ── Thin Tube Vial (lab-style) ──────────────────────────────────────────────
function ThinVial({
  label, val, max, rawPct, color, glowHex,
}: {
  label: string; val: number; max: number; rawPct: number; color: string; glowHex: string
}) {
  const animPct = useAnimatedPct(rawPct)
  const isOver = rawPct >= 100

  return (
    <div className="flex flex-col items-center gap-2 h-full">
      {/* Tube */}
      <div className="relative flex-1 w-full min-h-[200px]">
        {/* Glass tube */}
        <div
          className={cn(
            "absolute inset-0 rounded-t-3xl rounded-b-lg border-2 overflow-hidden",
            "bg-black/30 dark:bg-black/50 backdrop-blur-sm transition-all duration-300",
            isOver ? "border-white/30 shadow-lg" : "border-white/10"
          )}
          style={isOver ? { boxShadow: `0 0 20px ${glowHex}40, inset 0 0 16px ${glowHex}10` } : { boxShadow: "inset 0 0 12px rgba(0,0,0,0.5)" }}
        >
          {/* Liquid */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-75 rounded-b-sm"
            style={{
              height: `${animPct}%`,
              background: `linear-gradient(to top, ${glowHex}ee, ${glowHex}99)`,
              boxShadow: `0 -2px 12px ${glowHex}60`,
            }}
          >
            {/* Surface shimmer */}
            <div className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
              style={{ background: `linear-gradient(to right, transparent, white 40%, white 60%, transparent)` }} />
            {/* Bubble 1 */}
            {animPct > 12 && (
              <div className="absolute w-1.5 h-1.5 rounded-full bg-white/35 animate-bounce"
                style={{ left: "30%", bottom: `${Math.min(animPct * 0.4, 80)}%`, animationDuration: "2.5s" }} />
            )}
            {/* Bubble 2 */}
            {animPct > 30 && (
              <div className="absolute w-1 h-1 rounded-full bg-white/25 animate-bounce"
                style={{ right: "25%", bottom: `${Math.min(animPct * 0.25, 60)}%`, animationDuration: "3.3s", animationDelay: "0.9s" }} />
            )}
          </div>

          {/* Tick marks */}
          {[25, 50, 75].map((t) => (
            <div key={t} className="absolute left-0 right-0 border-t border-white/8 pointer-events-none" style={{ bottom: `${t}%` }} />
          ))}

          {/* Glass highlight */}
          <div className="absolute top-3 bottom-3 left-1 w-[3px] rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* % badge */}
        <div
          className="absolute -right-0.5 top-1.5 text-[9px] font-bold tabular-nums leading-none"
          style={{ color: glowHex, textShadow: `0 0 6px ${glowHex}` }}
        >
          {Math.round(animPct)}%
        </div>
      </div>

      {/* Label & grams */}
      <div className="text-center w-full">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-base font-black tabular-nums leading-tight" style={{ color: glowHex }}>
          {Math.round(val)}<span className="text-[10px] font-normal text-muted-foreground">g</span>
        </p>
        <p className="text-[9px] text-muted-foreground/50 tabular-nums">/{max}g</p>
      </div>
    </div>
  )
}

export function FuelGauge({ current, target, goal, viewMode, weeklyData = [] }: FuelGaugeProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)

  const { calories = 0, protein = 0, carbs = 0, fats = 0 } = current || {}
  const {
    calories: targetCal = 2000,
    protein: targetProt = 150,
    carbs: targetCarb = 200,
    fats: targetFat = 65,
  } = target || {}

  const calPct  = Math.min((calories / (targetCal  || 1)) * 100, 100)
  const protPct = Math.min((protein  / (targetProt || 1)) * 100, 100)
  const carbPct = Math.min((carbs    / (targetCarb  || 1)) * 100, 100)
  const fatPct  = Math.min((fats     / (targetFat   || 1)) * 100, 100)
  const animCalPct = useAnimatedPct(calPct)

  const isGoalMet = calPct >= 100
  const flameClass = isGoalMet
    ? "text-amber-400 drop-shadow-[0_0_18px_rgba(251,191,36,0.8)]"
    : calPct > 50
    ? "text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.4)]"
    : "text-muted-foreground/30"

  const macros = [
    { label: "Protein", val: protein, max: targetProt, rawPct: protPct, glowHex: "#ef4444" },
    { label: "Carbs",   val: carbs,   max: targetCarb, rawPct: carbPct, glowHex: "#06b6d4" },
    { label: "Fats",    val: fats,    max: targetFat,  rawPct: fatPct,  glowHex: "#f59e0b" },
  ]

  return (
    <Card className="bg-card/70 backdrop-blur-xl border-border/50 rounded-3xl shadow-lg shadow-black/5 p-5 flex flex-col gap-4 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300">
      {/* Background glow blobs */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-500/6 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-500/15">
            <Target className="h-4 w-4 text-violet-500" />
          </div>
          <span className="font-semibold text-foreground text-sm">Fuel Gauge</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/30 border border-border/40">
          <Activity className="h-3 w-3 text-violet-400" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            {viewMode === "daily" ? "Today" : "Weekly"}
          </span>
        </div>
      </div>

      {viewMode === "weekly" ? (
        /* ── Weekly stacked bar chart ── */
        <div className="flex flex-col gap-3 flex-1 relative">
          {/* Summary row */}
          <div className="flex justify-between items-center px-1 py-2.5 rounded-2xl bg-violet-500/8 border border-violet-500/15">
            <div className="flex items-center gap-2.5">
              <Flame className={cn("h-7 w-7 transition-all duration-700", isGoalMet ? "text-amber-400" : "text-violet-400")} />
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Weekly kcal</p>
                <p className="text-lg font-black text-foreground tabular-nums leading-none">{Math.round(calories).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-3 pr-1">
              {[{ l: "P", v: protein, c: "#ef4444" }, { l: "C", v: carbs, c: "#06b6d4" }, { l: "F", v: fats, c: "#f59e0b" }].map(m => (
                <div key={m.l} className="text-center">
                  <p className="text-xs font-black tabular-nums" style={{ color: m.c }}>{Math.round(m.v)}g</p>
                  <p className="text-[9px] text-muted-foreground">{m.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bars */}
          <div className="flex items-end gap-1.5 flex-1" style={{ minHeight: 180 }}>
            {(weeklyData.length > 0 ? weeklyData : Array(7).fill(null)).map((day, i) => {
              const d = day || { calories: 0, protein: 0, carbs: 0, fats: 0, date: "" }
              const dailyT = targetCal / 7
              const h = Math.min((d.calories / (dailyT || 1)) * 100, 100)
              const total = d.protein * 4 + d.carbs * 4 + d.fats * 9 || 1
              const pH = d.calories > 0 ? (d.protein * 4 / total) * h : 0
              const cH = d.calories > 0 ? (d.carbs * 4 / total) * h : 0
              const fH = d.calories > 0 ? (d.fats * 9 / total) * h : 0
              const isHov = hoveredBar === i
              const isOth = hoveredBar !== null && hoveredBar !== i

              return (
                <div
                  key={i}
                  className={cn("flex flex-col items-center gap-1 h-full justify-end cursor-pointer transition-all duration-250",
                    isHov ? "flex-[1.7]" : isOth ? "flex-[0.75] opacity-45" : "flex-1")}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <p className={cn("text-[9px] font-bold tabular-nums transition-all", isHov ? "text-white" : "text-muted-foreground/60")}>
                    {d.calories > 0 ? Math.round(d.calories) : "—"}
                  </p>
                  <div
                    className={cn("w-full relative rounded-lg overflow-hidden border transition-all duration-250",
                      isHov ? "border-violet-500/50 shadow-md shadow-violet-500/20" : "border-white/6")}
                    style={{ height: 150 }}
                  >
                    <div className="absolute inset-0 bg-white/3" />
                    {d.calories > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 flex flex-col" style={{ height: `${h}%` }}>
                        <div style={{ height: `${fH / h * 100}%`, background: "linear-gradient(to top, #d97706, #f59e0b)" }} />
                        <div style={{ height: `${cH / h * 100}%`, background: "linear-gradient(to top, #0891b2, #06b6d4)" }} />
                        <div style={{ height: `${pH / h * 100}%`, background: "linear-gradient(to top, #dc2626, #ef4444)" }} />
                      </div>
                    )}
                    {isHov && d.calories > 0 && (
                      <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 backdrop-blur-sm rounded-lg gap-0.5">
                        <p className="text-white font-bold text-[10px] tabular-nums">{Math.round(d.calories)} kcal</p>
                        <p className="text-violet-300 text-[9px] font-semibold">{Math.round((d.calories / dailyT) * 100)}%</p>
                        <div className="space-y-0.5 mt-1 text-[9px]">
                          <p className="text-red-400 tabular-nums">{Math.round(d.protein)}g P</p>
                          <p className="text-cyan-400 tabular-nums">{Math.round(d.carbs)}g C</p>
                          <p className="text-amber-400 tabular-nums">{Math.round(d.fats)}g F</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={cn("text-[9px] transition-all", isHov ? "text-violet-400 font-bold" : "text-muted-foreground/60")}>
                    {day ? new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1) : ["M","T","W","T","F","S","S"][i]}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4">
            {[["Protein", "#ef4444"], ["Carbs", "#06b6d4"], ["Fats", "#f59e0b"]].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ background: c }} />
                <span className="text-[9px] text-muted-foreground">{l}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Daily view: thin tubes + calorie panel ── */
        <div className="flex items-stretch gap-5 flex-1 relative">
          {/* Macro vials */}
          <div className="flex-1 grid grid-cols-3 gap-2.5 h-full">
            {macros.map((m) => (
              <ThinVial key={m.label} {...m} color="" />
            ))}
          </div>

          {/* Calorie panel */}
          <div className="w-[130px] flex-shrink-0 flex flex-col items-center justify-center rounded-2xl border relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.08), transparent)",
              borderColor: isGoalMet ? "rgba(251,191,36,0.3)" : "rgba(139,92,246,0.2)",
            }}
          >
            {/* Glow blob */}
            <div className="absolute inset-0 bg-violet-500/5 blur-xl pointer-events-none" />

            {/* Flame */}
            <Flame className={cn("h-12 w-12 mb-3 transition-all duration-700 relative z-10", flameClass)} />
            {isGoalMet && <div className="absolute top-1/2 -translate-y-12 w-16 h-16 rounded-full animate-ping bg-amber-400/10" style={{ animationDuration: "2s" }} />}

            <div className="text-center z-10 px-2">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5">Energy</p>
              <p className="text-3xl font-black text-foreground tabular-nums leading-none">{Math.round(calories).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">kcal</p>

              {/* Progress bar */}
              <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-75"
                  style={{
                    width: `${animCalPct}%`,
                    background: isGoalMet
                      ? "linear-gradient(to right, #f59e0b, #f97316)"
                      : "linear-gradient(to right, #8b5cf6, #a855f7)",
                    boxShadow: `0 0 6px ${isGoalMet ? "rgba(251,191,36,0.6)" : "rgba(139,92,246,0.6)"}`,
                  }}
                />
              </div>
              <p className="text-[9px] text-muted-foreground mt-1 tabular-nums">{Math.round(animCalPct)}%</p>
              <p className="text-[9px] text-muted-foreground/50 tabular-nums">/{targetCal.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}