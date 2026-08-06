"use client"

import { useState, useEffect, useRef } from "react"
import { TrendingUp, Dumbbell, Calendar, Target, BarChart2, Zap, Award } from "lucide-react"
import { getWorkouts, getWorkoutStats } from "@/services/workoutService"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

// ─── Colors ───────────────────────────────────────────────
const ACCENT = "#ef4444"
const MG_COLORS: Record<string, string> = {
  Chest: "#ef4444", Back: "#3b82f6", Legs: "#10b981", Shoulders: "#f59e0b",
  Biceps: "#06b6d4", Triceps: "#f97316", Core: "#8b5cf6", Cardio: "#ec4899",
}

// ─── Animated counter ─────────────────────────────────────
function AnimNum({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const [val, setVal] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 900, 1)
      const e = 1 - Math.pow(1 - p, 4)
      setVal(e * to)
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [to])
  return <>{val.toFixed(decimals)}</>
}

// ─── SVG Line Chart (daily volume) ────────────────────────
function DailyLineChart({ data }: { data: { date: string; volume: number }[] }) {
  const pathRef = useRef<SVGPathElement>(null)
  const [pathLen, setPathLen] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (pathRef.current) setPathLen(pathRef.current.getTotalLength())
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [data])

  if (data.length < 2) return (
    <div className="h-40 flex items-center justify-center text-xs text-muted-foreground/40">
      Log more workouts to see the trend
    </div>
  )

  const W = 480, H = 160
  const PAD = { t: 12, r: 8, b: 28, l: 38 }
  const iW = W - PAD.l - PAD.r
  const iH = H - PAD.t - PAD.b

  const maxV = Math.max(...data.map(d => d.volume), 1)
  const minV = 0
  const xp = (i: number) => PAD.l + (i / (data.length - 1)) * iW
  const yp = (v: number) => PAD.t + iH - ((v - minV) / (maxV - minV || 1)) * iH

  const pts = data.map((d, i) => ({ x: xp(i), y: yp(d.volume), ...d }))
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${PAD.t + iH} L ${PAD.l} ${PAD.t + iH} Z`

  const gridVals = [0, 0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
      {/* Grid */}
      {gridVals.map(t => {
        const y = PAD.t + iH * (1 - t)
        return (
          <g key={t}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y}
              stroke="currentColor" strokeOpacity={0.07} strokeWidth={1} />
            <text x={PAD.l - 4} y={y + 3} fontSize={7} fill="currentColor"
              fillOpacity={0.35} textAnchor="end">
              {Math.round(maxV * t)}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={areaPath} fill={ACCENT} fillOpacity={0.07} />

      {/* Gradient def */}
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity={0.15} />
          <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Animated line */}
      <path
        ref={pathRef}
        d={linePath}
        fill="none"
        stroke={ACCENT}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: pathLen || 9999,
          strokeDashoffset: mounted ? 0 : (pathLen || 9999),
          transition: mounted ? "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" : "none",
        }}
      />

      {/* Dots + x-labels */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill={ACCENT}
            style={{ opacity: mounted ? 1 : 0, transition: `opacity 0.3s ${0.9 + i * 0.05}s` }} />
          {/* Only show some labels if many points */}
          {(data.length <= 10 || i % 2 === 0) && (
            <text x={p.x} y={H - 4} fontSize={7} fill="currentColor"
              fillOpacity={0.35} textAnchor="middle">
              {p.date}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

// ─── SVG Donut / Pie chart ────────────────────────────────
function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t) }, [])

  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const R = 54, ri = 36, CX = 70, CY = 70

  type Seg = { path: string; color: string; name: string; value: number; pct: number }
  const segments: Seg[] = []
  let a = -Math.PI / 2

  data.forEach(d => {
    const pct = d.value / total
    const sweep = pct * 2 * Math.PI
    if (sweep < 0.01) return
    const x1 = CX + R * Math.cos(a),    y1 = CY + R * Math.sin(a)
    const x2 = CX + R * Math.cos(a + sweep), y2 = CY + R * Math.sin(a + sweep)
    const ix1 = CX + ri * Math.cos(a + sweep), iy1 = CY + ri * Math.sin(a + sweep)
    const ix2 = CX + ri * Math.cos(a),         iy2 = CY + ri * Math.sin(a)
    const large = sweep > Math.PI ? 1 : 0
    segments.push({
      path: `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${ix1.toFixed(2)} ${iy1.toFixed(2)} A ${ri} ${ri} 0 ${large} 0 ${ix2.toFixed(2)} ${iy2.toFixed(2)} Z`,
      color: d.color, name: d.name, value: d.value, pct: Math.round(pct * 100),
    })
    a += sweep
  })

  const topSeg = [...segments].sort((a, b) => b.value - a.value)[0]

  return (
    <div className="flex flex-col gap-3">
      {/* Donut */}
      <div className="flex justify-center">
        <svg width={140} height={140} viewBox="0 0 140 140">
          {/* Background ring */}
          <circle cx={CX} cy={CY} r={(R + ri) / 2}
            fill="none" stroke="currentColor" strokeOpacity={0.06}
            strokeWidth={R - ri} />
          {/* Segments */}
          {segments.map((s, i) => (
            <path key={i} d={s.path}
              fill={s.color}
              style={{
                opacity: mounted ? 0.85 : 0,
                transition: `opacity 0.35s ${i * 0.07}s`,
              }}
            />
          ))}
          {/* Center */}
          <text x={CX} y={CY - 5} textAnchor="middle" fontSize={17}
            fontWeight={900} fill="currentColor">
            {topSeg?.pct ?? 0}%
          </text>
          <text x={CX} y={CY + 10} textAnchor="middle" fontSize={7}
            fill="currentColor" fillOpacity={0.45}>
            {topSeg?.name ?? ""}
          </text>
        </svg>
      </div>

      {/* Legend grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 min-w-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-[9px] text-muted-foreground/70 truncate">{s.name}</span>
            <span className="text-[9px] font-bold ml-auto flex-shrink-0" style={{ color: s.color }}>
              {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Animated horizontal bar ─────────────────────────────
function Bar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(pct), delay + 120); return () => clearTimeout(t) }, [pct, delay])
  return (
    <div className="h-1.5 w-full rounded-full bg-muted/20 overflow-hidden">
      <div className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${w}%`, background: color }} />
    </div>
  )
}

// ─── Monthly frequency bars ───────────────────────────────
function FrequencyBars({ data }: { data: { month: string; workouts: number }[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t) }, [])
  const max = Math.max(...data.map(d => d.workouts), 1)
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[9px] font-bold text-muted-foreground/60 tabular-nums">{d.workouts}</span>
          <div className="w-full flex-1 rounded-lg bg-muted/15 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 rounded-lg transition-[height] duration-700 ease-out"
              style={{ height: mounted ? `${(d.workouts / max) * 100}%` : "0%", transitionDelay: `${i * 80}ms`, background: `${ACCENT}cc` }} />
          </div>
          <span className="text-[9px] text-muted-foreground/50">{d.month}</span>
        </div>
      ))}
    </div>
  )
}

// ─── RPE distribution ─────────────────────────────────────
function RpeDist({ workouts }: { workouts: any[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t) }, [])
  const dist: Record<number, number> = {}
  workouts.forEach(w => { dist[w.rpe] = (dist[w.rpe] || 0) + 1 })
  const total = workouts.length || 1
  const col = (n: number) => n <= 3 ? "#10b981" : n <= 6 ? "#f59e0b" : n <= 8 ? "#f97316" : ACCENT
  return (
    <div className="space-y-1.5">
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
        const c = dist[n] || 0
        const pct = (c / total) * 100
        return (
          <div key={n} className="flex items-center gap-2">
            <span className="text-[9px] font-bold w-3 text-right text-muted-foreground/50">{n}</span>
            <div className="flex-1 h-2 rounded-full bg-muted/20 overflow-hidden">
              <div className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: mounted ? `${Math.max(pct, c > 0 ? 1.5 : 0)}%` : "0%", background: col(n), transitionDelay: `${n * 35}ms` }} />
            </div>
            <span className="text-[9px] text-muted-foreground/40 tabular-nums w-5 text-right">{c}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: React.ReactNode; sub?: string; icon: any; color: string
}) {
  return (
    <div className="p-4 rounded-2xl border border-border/40 bg-card/70 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
        <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-black text-foreground tabular-nums leading-none">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground/60 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────
export function AnalyticsTab() {
  const { isAuthenticated } = useAuth()
  const [isLoading,      setIsLoading]      = useState(true)
  const [stats,          setStats]          = useState<any>(null)
  const [workouts,       setWorkouts]       = useState<any[]>([])
  const [dailyVolume,    setDailyVolume]    = useState<{ date: string; volume: number }[]>([])
  const [muscleData,     setMuscleData]     = useState<{ name: string; value: number; color: string }[]>([])
  const [frequency,      setFrequency]      = useState<{ month: string; workouts: number }[]>([])
  const [topLifts,       setTopLifts]       = useState<{ exercise: string; weight: number; unit: string; reps: number }[]>([])

  useEffect(() => { if (isAuthenticated) fetchData() }, [isAuthenticated])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [wr, sr] = await Promise.all([getWorkouts({ limit: 200 }), getWorkoutStats()])
      const ws = wr.workouts
      setWorkouts(ws); setStats(sr.stats)
      buildDaily(ws); buildMuscle(sr.stats.muscleGroupDistribution)
      buildFreq(ws);  buildTopLifts(ws)
    } catch (e: any) { toast.error(e.message || "Failed to load analytics") }
    finally { setIsLoading(false) }
  }

  // Group by calendar day, last 14 days
  const buildDaily = (ws: any[]) => {
    const dv: Record<string, number> = {}
    ws.forEach(w => {
      const k = new Date(w.date).toISOString().split("T")[0]
      const vol = w.sets.reduce((t: number, s: any) => t + s.reps * (s.unit === "lb" ? s.weight * 0.453592 : s.weight), 0)
      dv[k] = (dv[k] || 0) + vol
    })
    setDailyVolume(
      Object.entries(dv)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([date, volume]) => ({
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          volume: Math.round(volume),
        }))
    )
  }

  const buildMuscle = (dist: Record<string, number>) => {
    setMuscleData(
      Object.entries(dist)
        .sort(([, a], [, b]) => b - a)
        .map(([name, value]) => ({ name, value, color: MG_COLORS[name] || "#6b7280" }))
    )
  }

  const buildFreq = (ws: any[]) => {
    const mc: Record<string, number> = {}
    ws.forEach(w => {
      const k = new Date(w.date).toLocaleDateString("en-US", { month: "short" })
      mc[k] = (mc[k] || 0) + 1
    })
    setFrequency(Object.entries(mc).slice(-6).map(([month, workouts]) => ({ month, workouts })))
  }

  const buildTopLifts = (ws: any[]) => {
    const best: Record<string, { weight: number; unit: string; reps: number }> = {}
    ws.forEach(w => w.sets.forEach((s: any) => {
      const kg = s.unit === "lb" ? s.weight * 0.453592 : s.weight
      const cur = best[w.exercise]
      const curKg = cur ? (cur.unit === "lb" ? cur.weight * 0.453592 : cur.weight) : -1
      if (kg > curKg) best[w.exercise] = { weight: s.weight, unit: s.unit, reps: s.reps }
    }))
    setTopLifts(
      Object.entries(best)
        .sort(([, a], [, b]) => (b.unit === "lb" ? b.weight * 0.453592 : b.weight) - (a.unit === "lb" ? a.weight * 0.453592 : a.weight))
        .slice(0, 6)
        .map(([exercise, d]) => ({ exercise, ...d }))
    )
  }

  if (!isAuthenticated) return (
    <div className="rounded-2xl border border-border/40 bg-card/70 p-12 text-center">
      <p className="text-sm text-muted-foreground">Please log in to view analytics</p>
    </div>
  )
  if (isLoading) return (
    <div className="rounded-2xl border border-border/40 bg-card/70 p-12 flex flex-col items-center gap-3">
      <div className="w-7 h-7 rounded-full border-2 border-border border-t-violet-500 animate-spin" />
      <p className="text-sm text-muted-foreground">Loading analytics…</p>
    </div>
  )
  if (!stats || workouts.length === 0) return (
    <div className="rounded-2xl border border-border/40 bg-card/70 p-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-3">
        <BarChart2 className="w-5 h-5 text-muted-foreground/30" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">No workout data yet</p>
      <p className="text-xs text-muted-foreground/50 mt-1">Log workouts to see analytics</p>
    </div>
  )

  const thisWeek = workouts.filter(w => {
    const d = new Date(w.date), now = new Date()
    const ws = new Date(now); ws.setDate(now.getDate() - now.getDay())
    return d >= ws
  }).length
  const mgMax = Math.max(...muscleData.map(d => d.value), 1)
  const rankColor = (i: number) => i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#f97316" : "#374151"

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Analytics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Training insights & progress</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{workouts.length} sessions total</span>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Volume" icon={Dumbbell} color={ACCENT} sub="cumulative lifted"
          value={<><AnimNum to={Math.round(stats.totalVolume)} /> <span className="text-sm font-medium text-muted-foreground">kg</span></>}
        />
        <StatCard label="Sessions" icon={Calendar} color="#3b82f6" sub={`${thisWeek} this week`}
          value={<AnimNum to={stats.totalWorkouts} />}
        />
        <StatCard label="Avg RPE" icon={Target} color="#f59e0b" sub="perceived effort"
          value={<AnimNum to={stats.averageRPE} decimals={1} />}
        />
        <StatCard label="Total Sets" icon={Zap} color="#8b5cf6" sub="across all sessions"
          value={<AnimNum to={stats.totalSets} />}
        />
      </div>

      {/* Row 2: Line chart + Pie chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Daily Volume — line chart, 2 cols */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border/40 bg-card/70">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Daily</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">Volume Progression</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-500">
              Last {dailyVolume.length}d
            </span>
          </div>
          <DailyLineChart data={dailyVolume} />
        </div>

        {/* Muscle group pie — 1 col */}
        <div className="p-5 rounded-2xl border border-border/40 bg-card/70">
          <div className="mb-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Distribution</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">Muscle Groups</p>
          </div>
          {muscleData.length > 0
            ? <DonutChart data={muscleData} />
            : <div className="h-40 flex items-center justify-center text-xs text-muted-foreground/40">No data</div>
          }
        </div>
      </div>

      {/* Row 3: RPE dist + Frequency + Top Lifts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* RPE distribution */}
        <div className="p-5 rounded-2xl border border-border/40 bg-card/70">
          <div className="mb-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Effort</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">RPE Distribution</p>
          </div>
          <RpeDist workouts={workouts} />
        </div>

        {/* Monthly frequency */}
        <div className="p-5 rounded-2xl border border-border/40 bg-card/70">
          <div className="mb-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Consistency</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">Monthly Frequency</p>
          </div>
          {frequency.length > 0
            ? <FrequencyBars data={frequency} />
            : <div className="h-28 flex items-center justify-center text-xs text-muted-foreground/40">Not enough data</div>
          }
        </div>

        {/* Top lifts leaderboard */}
        <div className="p-5 rounded-2xl border border-border/40 bg-card/70">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Personal Bests</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">Top Lifts</p>
            </div>
            <Award className="w-4 h-4 text-muted-foreground/30" />
          </div>
          <div className="space-y-2">
            {topLifts.length === 0
              ? <p className="text-xs text-muted-foreground/40 text-center py-4">No data yet</p>
              : topLifts.map((l, i) => (
                <div key={i}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/30 hover:border-border/60 hover:bg-muted/10 transition-colors">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: rankColor(i) }}>
                    <span className="text-[8px] font-black text-white">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground truncate">{l.exercise}</p>
                    <p className="text-[9px] text-muted-foreground/50">{l.reps} reps</p>
                  </div>
                  <span className="text-xs font-black tabular-nums text-violet-500">{l.weight}{l.unit}</span>
                </div>
              ))
            }
          </div>
        </div>

      </div>
    </div>
  )
}
