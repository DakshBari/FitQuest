"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import {
  TrendingUp, TrendingDown, Calendar, Flame,
  BarChart3, Activity, Target, Zap
} from "lucide-react"
import { mealsApi } from "@/lib/api"
import { cn } from "@/lib/utils"

interface MealAnalyticsProps {
  goals: { calories: number; protein: number; carbs: number; fats: number; water: number }
  profile: { weight: number; height: number; bodyType: "ectomorph" | "mesomorph" | "endomorph"; goal: string }
}

type View = "weekly" | "monthly"

// ─── Animated number ─────────────────────────────────────────────────────
function useAnimNum(target: number, dur = 800) {
  const [val, setVal] = useState(0)
  const prev = useRef(0)
  const raf  = useRef<number>(0)
  useEffect(() => {
    const s = prev.current, d = target - s, t0 = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - t0) / dur, 1)
      const e = 1 - Math.pow(1 - t, 3)
      const n = s + d * e
      setVal(n); prev.current = n
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, dur])
  return val
}

// ─── Animated arc ────────────────────────────────────────────────────────
function useAnimPct(target: number, dur = 1100) {
  const [val, setVal] = useState(0)
  const prev = useRef(0)
  const raf  = useRef<number>(0)
  useEffect(() => {
    const s = prev.current, d = Math.min(target, 100) - s, t0 = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - t0) / dur, 1)
      const e = 1 - Math.pow(1 - t, 3)
      const n = s + d * e
      setVal(n); prev.current = n
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, dur])
  return val
}

// ─── Score arc ───────────────────────────────────────────────────────────
function ScoreArc({ score }: { score: number }) {
  const size = 120, stroke = 8
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const anim = useAnimPct(score, 1200)
  const dash = (anim / 100) * circ

  // Single accent color — no multi-color grade system
  const accent = "#8b5cf6"

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            strokeWidth={stroke} stroke="currentColor" className="text-border/30" />
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            strokeWidth={stroke} stroke={accent} strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 0.04s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black tabular-nums text-foreground">{Math.round(anim)}</span>
          <span className="text-[9px] text-muted-foreground font-medium tracking-widest uppercase">/100</span>
        </div>
      </div>
    </div>
  )
}

// ─── Bar chart — clean, axis labels, no bounce ────────────────────────────
function WeeklyBarChart({ 
  data, 
  goal 
}: { 
  data: { day: string; cal: number; protein: number; carbs: number; fats: number; date: string }[]; 
  goal: number 
}) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)

  const totalCal = data.reduce((acc, d) => acc + d.cal, 0)
  const totalProt = data.reduce((acc, d) => acc + d.protein, 0)
  const totalCarb = data.reduce((acc, d) => acc + d.carbs, 0)
  const totalFat = data.reduce((acc, d) => acc + d.fats, 0)

  const isGoalMet = totalCal >= goal * 7

  return (
    <div className="flex flex-col gap-4">
      {/* Summary row */}
      <div className="flex justify-between items-center px-4 py-2.5 rounded-2xl bg-violet-500/8 border border-violet-500/15">
        <div className="flex items-center gap-2.5">
          <Flame className={cn("h-7 w-7 transition-all duration-700", isGoalMet ? "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" : "text-violet-400")} />
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Weekly kcal</p>
            <p className="text-lg font-black text-foreground tabular-nums leading-none">{Math.round(totalCal).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex gap-3 pr-1">
          {[
            { l: "P", v: totalProt, c: "#ef4444" },
            { l: "C", v: totalCarb, c: "#06b6d4" },
            { l: "F", v: totalFat, c: "#f59e0b" }
          ].map(m => (
            <div key={m.l} className="text-center">
              <p className="text-xs font-black tabular-nums" style={{ color: m.c }}>{Math.round(m.v)}g</p>
              <p className="text-[9px] text-muted-foreground">{m.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1.5 flex-1 mt-2" style={{ minHeight: 180 }}>
        {data.map((d, i) => {
          const dailyGoal = goal
          const h = Math.min((d.cal / (dailyGoal || 1)) * 100, 100)
          const totalMacros = d.protein * 4 + d.carbs * 4 + d.fats * 9 || 1
          const pH = d.cal > 0 ? (d.protein * 4 / totalMacros) * h : 0
          const cH = d.cal > 0 ? (d.carbs * 4 / totalMacros) * h : 0
          const fH = d.cal > 0 ? (d.fats * 9 / totalMacros) * h : 0
          
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
                {d.cal > 0 ? Math.round(d.cal) : "—"}
              </p>
              <div
                className={cn("w-full relative rounded-lg overflow-hidden border transition-all duration-250",
                  isHov ? "border-violet-500/50 shadow-md shadow-violet-500/20" : "border-white/6")}
                style={{ height: 150 }}
              >
                <div className="absolute inset-0 bg-white/3" />
                {d.cal > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 flex flex-col" style={{ height: `${h}%` }}>
                    <div style={{ height: `${fH / h * 100}%`, background: "linear-gradient(to top, #d97706, #f59e0b)" }} />
                    <div style={{ height: `${cH / h * 100}%`, background: "linear-gradient(to top, #0891b2, #06b6d4)" }} />
                    <div style={{ height: `${pH / h * 100}%`, background: "linear-gradient(to top, #dc2626, #ef4444)" }} />
                  </div>
                )}
                {isHov && d.cal > 0 && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/85 backdrop-blur-sm rounded-lg gap-0.5">
                    <p className="text-white font-bold text-[10px] tabular-nums">{Math.round(d.cal)} kcal</p>
                    <p className="text-violet-300 text-[9px] font-semibold">{Math.round((d.cal / dailyGoal) * 100)}%</p>
                    <div className="space-y-0.5 mt-1 text-[9px]">
                      <p className="text-red-400 tabular-nums">{Math.round(d.protein)}g P</p>
                      <p className="text-cyan-400 tabular-nums">{Math.round(d.carbs)}g C</p>
                      <p className="text-amber-400 tabular-nums">{Math.round(d.fats)}g F</p>
                    </div>
                  </div>
                )}
              </div>
              <span className={cn("text-[9px] transition-all", isHov ? "text-violet-400 font-bold" : "text-muted-foreground/60")}>
                {d.day}
              </span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-2">
        {[["Protein", "#ef4444"], ["Carbs", "#06b6d4"], ["Fats", "#f59e0b"]].map(([l, c]) => (
          <div key={l} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ background: c }} />
            <span className="text-[9px] text-muted-foreground">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Macro adherence bar ──────────────────────────────────────────────────
function AdherenceBar({ label, avg, goal, pct, color, unit }: {
  label: string; avg: number; goal: number; pct: number; color: string; unit: string
}) {
  const anim = useAnimPct(pct, 900)
  const capped = Math.min(anim, 100)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground font-medium">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground/60 tabular-nums">
            {Math.round(avg)}{unit} / {Math.round(goal)}{unit}
          </span>
          <span className="text-xs font-bold tabular-nums" style={{ color }}>
            {Math.round(anim)}%
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-75"
          style={{
            width: `${capped}%`,
            background: color,
            opacity: 0.85,
          }}
        />
      </div>
    </div>
  )
}

// ─── Macro donut ─────────────────────────────────────────────────────────
function MacroDonut({ protein, carbs, fats, calories }: {
  protein: number; carbs: number; fats: number; calories: number
}) {
  const total = protein * 4 + carbs * 4 + fats * 9
  const pP = total ? (protein * 4 / total) * 100 : 33.3
  const pC = total ? (carbs   * 4 / total) * 100 : 33.3
  const pF = total ? (fats    * 9 / total) * 100 : 33.4

  const [a, setA] = useState({ p: 0, c: 0, f: 0 })
  const prev = useRef({ p: 0, c: 0, f: 0 })
  const raf  = useRef<number>(0)
  useEffect(() => {
    const s = { ...prev.current }
    const d = { p: pP - s.p, c: pC - s.c, f: pF - s.f }
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - t0) / 1000, 1)
      const e = 1 - Math.pow(1 - t, 3)
      const n = { p: s.p + d.p * e, c: s.c + d.c * e, f: s.f + d.f * e }
      setA(n); prev.current = n
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [pP, pC, pF])

  const r = 44, circ = 2 * Math.PI * r
  const macros = [
    { key: "p", pct: a.p, color: "#ef4444", label: "Protein", grams: protein },
    { key: "c", pct: a.c, color: "#3b82f6", label: "Carbs",   grams: carbs   },
    { key: "f", pct: a.f, color: "#f59e0b", label: "Fats",    grams: fats    },
  ]
  let offset = 0

  return (
    <div className="flex items-center gap-5">
      {/* Donut */}
      <div className="relative flex-shrink-0" style={{ width: 110, height: 110 }}>
        <svg width={110} height={110} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={55} cy={55} r={r} fill="none" strokeWidth={12}
            stroke="currentColor" className="text-border/20" />
          {macros.map(m => {
            const dash = (m.pct / 100) * circ
            const el = (
              <circle key={m.key}
                cx={55} cy={55} r={r} fill="none"
                stroke={m.color} strokeWidth={12} strokeLinecap="butt"
                strokeDasharray={`${dash} ${circ}`}
                strokeDashoffset={-offset}
                style={{ opacity: 0.9 }}
              />
            )
            offset += dash
            return el
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-black text-foreground tabular-nums">{Math.round(calories)}</span>
          <span className="text-[8px] text-muted-foreground/60 tracking-wide">kcal/day</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2.5">
        {macros.map(m => (
          <div key={m.key} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color, opacity: 0.9 }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground/60 tabular-nums">{Math.round(m.grams)}g</span>
                  <span className="text-[10px] font-semibold tabular-nums" style={{ color: m.color }}>
                    {Math.round(m.pct)}%
                  </span>
                </div>
              </div>
              <div className="h-0.5 w-full rounded-full bg-border/25 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${m.pct}%`, background: m.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Best / Worst day card ────────────────────────────────────────────────
function DayCard({ day, label, Icon, accent, goals }: {
  day: any; label: string; Icon: any; accent: string; goals: any
}) {
  const fmtDay = (d: string) => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  return (
    <div className="p-4 rounded-2xl border border-border/40 bg-card/40 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-[10px] text-muted-foreground/50">{fmtDay(day.date)}</span>
      </div>
      <div>
        <span className="text-2xl font-black tabular-nums text-foreground">
          {Math.round(day.totals.calories)}
        </span>
        <span className="text-xs text-muted-foreground ml-1">kcal</span>
      </div>
      <div className="space-y-1">
        {[
          { label: "P", val: day.totals.protein, max: goals.protein, color: "#ef4444" },
          { label: "C", val: day.totals.carbs,   max: goals.carbs,   color: "#3b82f6" },
          { label: "F", val: day.totals.fats,    max: goals.fats,    color: "#f59e0b" },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground/60 w-3">{m.label}</span>
            <div className="flex-1 h-px rounded-full bg-border/30 overflow-hidden">
              <div className="h-full rounded-full" style={{
                width: `${Math.min((m.val / (m.max || 1)) * 100, 100)}%`,
                background: m.color, opacity: 0.7,
              }} />
            </div>
            <span className="text-[9px] text-muted-foreground/60 tabular-nums w-8 text-right">
              {Math.round(m.val)}g
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────
export function MealAnalytics({ goals, profile }: MealAnalyticsProps) {
  const [view, setView]           = useState<View>("weekly")
  const [weeklyStats, setWeekly]  = useState<any>(null)
  const [monthlyStats, setMonthly]= useState<any>(null)
  const [isLoading, setLoading]   = useState(false)

  const calcWeekly = (meals: any[], totals: any, wGoals: any) => {
    const active = meals.filter(d => d.meals?.length > 0)
    const n = active.length || 1
    const avgCal  = totals.calories / n
    const avgProt = totals.protein  / n
    const avgCarb = totals.carbs    / n
    const avgFat  = totals.fats     / n
    const calGoal = wGoals.calories / 7
    const adh = {
      calories: (avgCal  / calGoal) * 100,
      protein:  (avgProt / (wGoals.protein / 7)) * 100,
      carbs:    (avgCarb / (wGoals.carbs / 7)) * 100,
      fats:     (avgFat  / (wGoals.fats  / 7)) * 100,
    }
    const score = Math.round(
      Math.min(adh.calories, 100) * 0.4 +
      Math.min(adh.protein,  100) * 0.3 +
      Math.min(adh.carbs,    100) * 0.15 +
      Math.min(adh.fats,     100) * 0.15
    )
    const variance = active.map(d => Math.abs(d.totals.calories - avgCal))
    const avgVar   = variance.reduce((s, v) => s + v, 0) / (variance.length || 1)
    return {
      activeDays: active.length, n, avgCal, avgProt, avgCarb, avgFat,
      weeklyTotals: totals, adherence: adh, score,
      consistency: Math.max(0, 100 - (avgVar / (avgCal || 1)) * 100),
      bestDay:  active.length ? active.reduce((b, d) => d.totals.calories > (b?.totals.calories || 0)   ? d : b, active[0]) : null,
      worstDay: active.length ? active.reduce((w, d) => d.totals.calories < (w?.totals.calories ?? Infinity) ? d : w, active[0]) : null,
      chartData: meals.map(d => ({
        day: new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1),
        cal: d.totals?.calories || 0,
        protein: d.totals?.protein || 0,
        carbs: d.totals?.carbs || 0,
        fats: d.totals?.fats || 0,
        date: d.date,
      })),
    }
  }

  const calcMonthly = (daily: any[]) => {
    const n = daily.length || 1
    const totals = daily.reduce((a, d) => ({
      calories: a.calories + d.totals.calories, protein: a.protein + d.totals.protein,
      carbs:    a.carbs    + d.totals.carbs,    fats:    a.fats    + d.totals.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 })
    const averages = {
      calories: totals.calories / n, protein: totals.protein / n,
      carbs:    totals.carbs    / n, fats:    totals.fats    / n,
    }
    const adh = {
      calories: (totals.calories / (goals.calories * 30)) * 100,
      protein:  (totals.protein  / (goals.protein  * 30)) * 100,
      carbs:    (totals.carbs    / (goals.carbs    * 30)) * 100,
      fats:     (totals.fats     / (goals.fats     * 30)) * 100,
    }
    const score = Math.round(
      Math.min(adh.calories, 100) * 0.4 +
      Math.min(adh.protein,  100) * 0.3 +
      Math.min(adh.carbs,    100) * 0.15 +
      Math.min(adh.fats,     100) * 0.15
    )
    return {
      totalActiveDays: n, totals, averages, adherence: adh, score,
      best:  daily.reduce((b, d) => d.totals.calories > (b?.totals.calories || 0)   ? d : b, daily[0] || null),
      worst: daily.reduce((w, d) => d.totals.calories < (w?.totals.calories ?? Infinity) ? d : w, daily[0] || null),
    }
  }

  const fetchWeekly = async () => {
    setLoading(true)
    try {
      const data = await mealsApi.getWeeklyDetailed()
      setWeekly(calcWeekly(data.weeklyMeals, data.weeklyTotals, data.weeklyGoals))
    } catch { setWeekly(null) }
    finally { setLoading(false) }
  }

  const fetchMonthly = async () => {
    setLoading(true)
    try {
      const { meals } = await mealsApi.getHistory(1000, 1)
      if (!meals?.length) { setMonthly(null); return }
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30)
      const recent = meals.filter((m: any) => new Date(m.date) >= cutoff)
      const byDate: Record<string, any[]> = {}
      recent.forEach((m: any) => {
        const k = new Date(m.date).toISOString().split("T")[0]
        byDate[k] = [...(byDate[k] || []), m]
      })
      const daily = Object.entries(byDate).map(([date, ms]) => ({
        date,
        totals: ms.reduce((a, m: any) => ({
          calories: a.calories + (m.calories || 0), protein: a.protein + (m.protein || 0),
          carbs:    a.carbs    + (m.carbs    || 0), fats:    a.fats    + (m.fats    || 0),
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 }),
      }))
      setMonthly(calcMonthly(daily))
    } catch { setMonthly(null) }
    finally { setLoading(false) }
  }

  useEffect(() => { view === "weekly" ? fetchWeekly() : fetchMonthly() }, [view])

  const S       = view === "weekly" ? weeklyStats  : monthlyStats
  const avgCal  = S?.averages?.calories ?? S?.avgCal  ?? 0
  const avgProt = S?.averages?.protein  ?? S?.avgProt ?? 0
  const avgCarb = S?.averages?.carbs    ?? S?.avgCarb ?? 0
  const avgFat  = S?.averages?.fats     ?? S?.avgFat  ?? 0

  const wk = weeklyStats, mo = monthlyStats
  const totCal  = useAnimNum(S ? Math.round(view === "weekly" ? (wk?.weeklyTotals?.calories ?? 0) : (mo?.totals?.calories ?? 0)) : 0)
  const totProt = useAnimNum(S ? Math.round(view === "weekly" ? (wk?.weeklyTotals?.protein  ?? 0) : (mo?.totals?.protein  ?? 0)) : 0)
  const totCarb = useAnimNum(S ? Math.round(view === "weekly" ? (wk?.weeklyTotals?.carbs    ?? 0) : (mo?.totals?.carbs    ?? 0)) : 0)
  const totFat  = useAnimNum(S ? Math.round(view === "weekly" ? (wk?.weeklyTotals?.fats     ?? 0) : (mo?.totals?.fats     ?? 0)) : 0)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Analytics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Nutrition performance overview</p>
        </div>
        <div className="flex p-1 rounded-xl border border-border/40 bg-muted/10">
          {(["weekly", "monthly"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                view === v
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}>
              {v === "weekly" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-border border-t-foreground animate-spin" />
          <p className="text-xs text-muted-foreground">Loading…</p>
        </div>
      )}

      {/* No data */}
      {!isLoading && !S && (
        <Card className="bg-card/60 border-border/40 rounded-3xl p-12 text-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No {view} data yet</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Log meals to see insights here</p>
        </Card>
      )}

      {/* Data view */}
      {!isLoading && S && (
        <div className="space-y-4">

          {/* ── Row 1: Score + quick stats ─────────────────────────────── */}
          <Card className="bg-card/70 backdrop-blur-xl border-border/40 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-6">
              {/* Score arc */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <ScoreArc score={S.score ?? 0} />
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-medium mt-0.5">
                  Nutrition Score
                </p>
              </div>

              {/* Divider */}
              <div className="w-px self-stretch bg-border/30" />

              {/* Stats grid */}
              <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-3">
                {[
                  {
                    label: "Active Days",
                    value: view === "weekly" ? weeklyStats?.activeDays : monthlyStats?.totalActiveDays,
                    suffix: `/ ${view === "weekly" ? 7 : 30}`,
                    icon: Calendar, color: "text-blue-500",
                  },
                  {
                    label: "Avg Calories",
                    value: Math.round(avgCal),
                    suffix: "kcal",
                    icon: Flame, color: "text-orange-500",
                  },
                  {
                    label: view === "weekly" ? "Consistency" : "Avg Protein",
                    value: view === "weekly"
                      ? Math.round(weeklyStats?.consistency ?? 0)
                      : Math.round(avgProt),
                    suffix: view === "weekly" ? "%" : "g",
                    icon: Activity, color: "text-violet-500",
                  },
                  {
                    label: "Goal Adherence",
                    value: Math.round(S.adherence?.calories ?? 0),
                    suffix: "%",
                    icon: Target, color: "text-violet-500",
                  },
                ].map(({ label, value, suffix, icon: Icon, color }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-muted/20 flex-shrink-0">
                      <Icon className={cn("w-3.5 h-3.5", color)} />
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider leading-none">{label}</p>
                      <p className="text-base font-black tabular-nums text-foreground leading-tight mt-0.5">
                        {value}
                        <span className="text-xs font-normal text-muted-foreground ml-0.5">{suffix}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ── Row 2: Bar chart & Totals side-by-side ───────────────────── */}
          {view === "weekly" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Daily Calories stacked bar chart */}
              {weeklyStats?.chartData && (
                <Card className="lg:col-span-2 bg-card/70 backdrop-blur-xl border-border/40 rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5 text-muted-foreground/60" />
                      <h3 className="text-xs font-semibold text-foreground">Daily Calories</h3>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60">
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-6 border-t border-dashed border-border/60" />
                        {goals.calories} kcal goal
                      </span>
                    </div>
                  </div>
                  <WeeklyBarChart data={weeklyStats.chartData} goal={goals.calories} />
                </Card>
              )}

              {/* 7-Day Totals */}
              <Card className="lg:col-span-1 bg-card/70 backdrop-blur-xl border-border/40 rounded-3xl p-5 shadow-sm flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-foreground">7-Day Totals</h3>
                  <span className="text-[9px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">Weekly Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-3 my-auto">
                  {[
                    { label: "Calories", val: totCal,  unit: "kcal", color: "#f97316", bg: "from-orange-500/5 to-transparent border-orange-500/10 hover:border-orange-500/30" },
                    { label: "Protein",  val: totProt, unit: "g",    color: "#ef4444", bg: "from-red-500/5 to-transparent border-red-500/10 hover:border-red-500/30" },
                    { label: "Carbs",    val: totCarb, unit: "g",    color: "#3b82f6", bg: "from-blue-500/5 to-transparent border-blue-500/10 hover:border-blue-500/30" },
                    { label: "Fats",     val: totFat,  unit: "g",    color: "#f59e0b", bg: "from-amber-500/5 to-transparent border-amber-500/10 hover:border-amber-500/30" },
                  ].map(t => (
                    <div 
                      key={t.label} 
                      className={cn(
                        "text-center p-4 rounded-2xl bg-gradient-to-b border transition-all duration-300 flex flex-col justify-center items-center group hover:scale-[1.02]",
                        t.bg
                      )}
                    >
                      <p className="text-lg font-black tabular-nums transition-transform duration-300 group-hover:scale-105" style={{ color: t.color }}>
                        {t.label === "Calories"
                          ? Math.round(t.val) >= 10000
                            ? `${(Math.round(t.val) / 1000).toFixed(1)}k`
                            : Math.round(t.val).toLocaleString()
                          : Math.round(t.val)
                        }
                      </p>
                      <p className="text-[9px] text-muted-foreground/60 mt-0.5 font-medium uppercase tracking-wider">{t.unit}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-1 group-hover:text-foreground transition-colors">{t.label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            /* 30-Day Totals */
            <Card className="bg-card/70 backdrop-blur-xl border-border/40 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xs font-semibold text-foreground">30-Day Totals</h3>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Calories", val: totCal,  unit: "kcal", color: "#f97316" },
                  { label: "Protein",  val: totProt, unit: "g",    color: "#ef4444" },
                  { label: "Carbs",    val: totCarb, unit: "g",    color: "#3b82f6" },
                  { label: "Fats",     val: totFat,  unit: "g",    color: "#f59e0b" },
                ].map(t => (
                  <div key={t.label} className="text-center p-3 rounded-2xl bg-muted/10 border border-border/30">
                    <p className="text-lg font-black tabular-nums" style={{ color: t.color }}>
                      {t.label === "Calories"
                        ? Math.round(t.val) >= 10000
                          ? `${(Math.round(t.val) / 1000).toFixed(1)}k`
                          : Math.round(t.val).toLocaleString()
                        : Math.round(t.val)
                      }
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 mt-0.5">{t.unit}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{t.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── Row 3: Adherence + Donut ─────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Card className="bg-card/70 backdrop-blur-xl border-border/40 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-3.5 h-3.5 text-muted-foreground/60" />
                <h3 className="text-xs font-semibold text-foreground">Goal Adherence</h3>
              </div>
              <div className="space-y-3.5">
                {[
                  { label: "Calories", avg: avgCal,  goal: goals.calories, pct: S.adherence.calories, color: "#f97316", unit: " kcal" },
                  { label: "Protein",  avg: avgProt, goal: goals.protein,  pct: S.adherence.protein,  color: "#ef4444", unit: "g" },
                  { label: "Carbs",    avg: avgCarb, goal: goals.carbs,    pct: S.adherence.carbs,    color: "#3b82f6", unit: "g" },
                  { label: "Fats",     avg: avgFat,  goal: goals.fats,     pct: S.adherence.fats,     color: "#f59e0b", unit: "g" },
                ].map(m => <AdherenceBar key={m.label} {...m} />)}
              </div>
            </Card>

            <Card className="bg-card/70 backdrop-blur-xl border-border/40 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-3.5 h-3.5 text-muted-foreground/60" />
                <h3 className="text-xs font-semibold text-foreground">Macro Distribution</h3>
              </div>
              <MacroDonut protein={avgProt} carbs={avgCarb} fats={avgFat} calories={avgCal} />
            </Card>
          </div>

          {/* ── Row 4: Best / Worst ──────────────────────────────────────── */}
          {(S.bestDay || S.best) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DayCard
                day={S.bestDay  || S.best}
                label="Peak Day"
                Icon={TrendingUp}
                accent="#8b5cf6"
                goals={goals}
              />
              {(S.worstDay || S.worst) && (
                <DayCard
                  day={S.worstDay || S.worst}
                  label="Lowest Day"
                  Icon={TrendingDown}
                  accent="#6b7280"
                  goals={goals}
                />
              )}
            </div>
          )}



        </div>
      )}
    </div>
  )
}