"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Apple, 
  Activity, 
  MapPin, 
  Target, 
  Zap, 
  Droplets, 
  Clock,
  Calendar,
  Plus,
  TrendingUp,
  Users,
  Loader2,
  Dumbbell,
  Flame,
  Heart,
  ChevronRight,
  Sparkles,
  Timer,
  ArrowUpRight,
  BarChart3,
  Brain,
  Swords,
  Map,
  Trophy,
  Star
} from "lucide-react"
import { ProtectedLayout } from "@/components/layouts/ProtectedLayout"
import { useApi } from "@/hooks/useApi"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

// ─── Animated Counter Hook ───────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1200) {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    if (target === 0) { setCurrent(0); return }
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCurrent(target); clearInterval(timer) }
      else setCurrent(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return current
}

// ─── SVG Radial Progress ─────────────────────────────────────────────────────
function RadialProgress({ 
  value, max, size = 120, strokeWidth = 10, color, bg, children 
}: { 
  value: number; max: number; size?: number; strokeWidth?: number; 
  color: string; bg: string; children?: React.ReactNode 
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(value / (max || 1), 1)
  const [animated, setAnimated] = useState(0)
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(pct), 100)
    return () => clearTimeout(timer)
  }, [pct])

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={bg} strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - animated)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        {children}
      </div>
    </div>
  )
}

// ─── Thin Progress Bar ────────────────────────────────────────────────────────
function ThinBar({ value, max, color }: { value: number; max: number; color: string }) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setW(Math.min((value / (max || 1)) * 100, 100)), 150)
    return () => clearTimeout(t)
  }, [value, max])
  return (
    <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${w}%`, background: color, transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </div>
  )
}

// ─── Live Clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState("")
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="font-mono tabular-nums">{time}</span>
}

// ─── Animated Dot ─────────────────────────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: color }} />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: color }} />
    </span>
  )
}

// ─── Sparkline Mini Chart ─────────────────────────────────────────────────────
function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 100
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 6) - 3}`)
    .join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Static Workout Sparkline (Demo) ─────────────────────────────────────────
const WORKOUT_SPARKLINE = [2, 4, 3, 5, 4, 6, 5, 7, 6, 8]

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const api = useApi()
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState("Athlete")
  const [greeting, setGreeting] = useState("Good Morning")
  const [dateStr, setDateStr] = useState("")
  const [hydrateGlasses, setHydrateGlasses] = useState(4)    // local state - up to 8 glasses
  const [motiveLine, setMotiveLine] = useState(0)

  const MOTIVES = [
    "Every rep counts. Keep crushing it! 💪",
    "Consistency beats perfection, every time.",
    "Your future self will thank you.",
    "One more set. One more step forward.",
    "The only bad workout is the one you skipped.",
  ]

  // Nutrition
  const [nutritionStats, setNutritionStats] = useState({
    calories: { current: 0, target: 2200 },
    macros: { protein: 0, carbs: 0, fats: 0 }
  })
  // Arena
  const [workoutStats, setWorkoutStats] = useState({ recentWorkouts: [] as any[], totalWorkouts: 0 })
  // Map
  const [mapStats, setMapStats] = useState({ territories: 0, totalDistance: 0 })
  // Social
  const [socialStats, setSocialStats] = useState({ totalFriends: 0, onlineFriends: 0 })

  const isFetchingRef = useRef(false)

  // Greeting + date
  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening")
    setDateStr(new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }))
  }, [])

  // Rotating motivational line
  useEffect(() => {
    const id = setInterval(() => setMotiveLine(p => (p + 1) % MOTIVES.length), 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (isAuthenticated) fetchDashboardData()
  }, [isAuthenticated])

  const fetchDashboardData = async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setIsLoading(true)
    try {
      try {
        const p = await api.call("/api/users/profile")
        if (p?.user) setUserName(p.user.username || p.user.email?.split("@")[0] || "Athlete")
      } catch {}
      try {
        const k = await api.meals.getDaily()
        if (k) setNutritionStats({ calories: { current: k.totalCalories||0, target: k.targetCalories||2200 }, macros: { protein: k.totalProtein||0, carbs: k.totalCarbs||0, fats: k.totalFats||0 } })
      } catch {}
      try {
        let wd: any
        if (api.workouts?.get) wd = await api.workouts.get({ limit: 5 })
        else wd = await api.call("/api/workouts?limit=5")
        if (wd?.workouts) {
          const sorted = [...wd.workouts].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          setWorkoutStats({ recentWorkouts: sorted.slice(0, 3), totalWorkouts: wd.workouts.length })
        }
      } catch {}
      try {
        const s = await api.call("/api/world-map/sessions")
        if (s?.sessions) setMapStats({ territories: s.capturedAreas?.features?.length||0, totalDistance: s.sessions.reduce((acc: number, x: any)=>acc+(x.distance||0),0) })
      } catch {}
      try {
        const f = await api.call("/api/guilds/friends")
        if (f?.friends) setSocialStats({ totalFriends: f.friends.length, onlineFriends: f.friends.filter((x: any)=>x.online).length })
      } catch {}
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }

  // Animated nutrient values
  const animCal = useAnimatedCounter(nutritionStats.calories.current)
  const animProtein = useAnimatedCounter(nutritionStats.macros.protein)
  const animCarbs = useAnimatedCounter(nutritionStats.macros.carbs)
  const animFats = useAnimatedCounter(nutritionStats.macros.fats)
  const animWorkouts = useAnimatedCounter(workoutStats.totalWorkouts)
  const animFriends = useAnimatedCounter(socialStats.totalFriends)
  const animOnline = useAnimatedCounter(socialStats.onlineFriends)
  const animDist = useAnimatedCounter(Math.round(mapStats.totalDistance * 10))
  const calPct = Math.round((nutritionStats.calories.current / (nutritionStats.calories.target || 2200)) * 100)

  const macroTargets = { protein: Math.round(nutritionStats.calories.target * 0.27), carbs: Math.round(nutritionStats.calories.target * 0.40), fats: Math.round(nutritionStats.calories.target * 0.25) }

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <Zap className="absolute inset-0 m-auto h-6 w-6 text-emerald-500" />
          </div>
          <p className="text-muted-foreground text-sm font-medium tracking-wider animate-pulse">Loading Command Center…</p>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-background">
        {/* ── Noise Texture Overlay (Dark Mode Only) ── */}
        <div className="pointer-events-none fixed inset-0 dark:opacity-[0.015] opacity-0 bg-[url('/noise.png')] z-0" />

        <div className="relative z-10 p-5 md:p-7 space-y-6 max-w-[1600px] mx-auto">

          {/* ════════════════════════════════════════
              HERO HEADER
          ════════════════════════════════════════ */}
          <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 md:p-8 shadow-xl shadow-black/5">
            {/* Gradient blobs */}
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-gradient-to-br from-emerald-500/15 to-teal-400/5 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-gradient-to-tr from-violet-500/10 to-purple-400/5 blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
              {/* Left: welcome */}
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
                  <span className="inline-block w-4 h-px bg-muted-foreground/50" />
                  {greeting}
                </p>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                  Welcome back, <span className="text-emerald-500">{userName}</span>
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {dateStr}
                </p>
                {/* Rotating motivational line */}
                <p key={motiveLine} className="text-sm text-muted-foreground italic pt-1 animate-in" style={{ animationDuration: "0.5s" }}>
                  {MOTIVES[motiveLine]}
                </p>
              </div>

              {/* Right: live clock + quick stats */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Live Clock */}
                <div className="px-4 py-2.5 rounded-2xl bg-muted/50 border border-border/50 text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <LiveClock />
                </div>
                {/* Cal badge */}
                <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Flame className="h-3.5 w-3.5" />
                  {calPct}% Cal Goal
                </div>
                {/* Workouts badge */}
                <div className="px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Dumbbell className="h-3.5 w-3.5" />
                  {animWorkouts} Workouts
                </div>
              </div>
            </div>


          </div>

          {/* ════════════════════════════════════════
              BENTO GRID
          ════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* ── 1. NUTRITION ── */}
            <Card className="min-h-[360px] bg-card/70 backdrop-blur-xl border-border/50 rounded-3xl p-5 flex flex-col gap-4 shadow-lg shadow-black/5 hover:shadow-emerald-500/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-400/5 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700 pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/15">
                    <Apple className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span className="font-semibold text-foreground text-sm">Nutrition</span>
                </div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Today</span>
              </div>

              {/* Calorie ring + goal side-by-side */}
              <div className="flex items-center gap-4 relative">
                <RadialProgress
                  value={nutritionStats.calories.current}
                  max={nutritionStats.calories.target}
                  size={100} strokeWidth={9}
                  color="#10b981"
                  bg="rgba(16,185,129,0.12)"
                >
                  <span className="text-lg font-black text-emerald-500 leading-none tabular-nums">{animCal}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">kcal</span>
                </RadialProgress>
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">Goal</p>
                  <p className="text-xl font-black text-foreground tabular-nums">{nutritionStats.calories.target}<span className="text-xs font-normal text-muted-foreground ml-1">kcal</span></p>
                  <div className="flex items-center gap-1.5">
                    <ThinBar value={nutritionStats.calories.current} max={nutritionStats.calories.target} color="#10b981" />
                    <span className="text-[11px] font-bold text-emerald-500 whitespace-nowrap">{calPct}%</span>
                  </div>
                </div>
              </div>

              {/* Macros */}
              <div className="space-y-3 flex-1 relative">
                {[
                  { label: "Protein", current: animProtein, target: macroTargets.protein, color: "#ef4444" },
                  { label: "Carbs",   current: animCarbs,   target: macroTargets.carbs,   color: "#06b6d4" },
                  { label: "Fats",    current: animFats,    target: macroTargets.fats,     color: "#f59e0b" },
                ].map((m) => (
                  <div key={m.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">{m.label}</span>
                      <span className="font-bold tabular-nums" style={{ color: m.color }}>{m.current}g <span className="text-muted-foreground font-normal">/ {m.target}g</span></span>
                    </div>
                    <ThinBar value={m.current} max={m.target} color={m.color} />
                  </div>
                ))}
              </div>

              <Button
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold border-0 shadow-lg shadow-emerald-500/20 text-sm h-9 gap-2 relative mt-auto"
                onClick={() => router.push("/kitchen")}
              >
                <Apple className="h-4 w-4" />
                Open Kitchen
                <ArrowUpRight className="h-3.5 w-3.5 ml-auto opacity-70" />
              </Button>
            </Card>

            {/* ── 2. TRAINING CARD ── */}
            <Card className="min-h-[360px] bg-card/70 backdrop-blur-xl border-border/50 rounded-3xl p-5 flex flex-col gap-4 shadow-lg shadow-black/5 hover:shadow-red-500/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-gradient-to-br from-red-500/20 to-orange-400/5 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-125 transition-transform duration-700" />

              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-red-500/15">
                    <Swords className="h-4 w-4 text-red-500" />
                  </div>
                  <span className="font-semibold text-foreground text-sm">Training</span>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-500 tabular-nums">
                  {animWorkouts} total
                </div>
              </div>

              {/* Sparkline */}
              <div className="opacity-60">
                <Sparkline data={WORKOUT_SPARKLINE} color="#ef4444" height={36} />
              </div>

              {/* Recent workouts */}
              <div className="space-y-2 flex-1 relative">
                {workoutStats.recentWorkouts.length > 0 ? workoutStats.recentWorkouts.slice(0, 2).map((w: any) => (
                  <div key={w._id} className="flex items-center justify-between p-2.5 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-red-500/15">
                        <Dumbbell className="h-3 w-3 text-red-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-none">{w.exercise}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(w.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground tabular-nums">{w.sets?.length ?? 0}×</p>
                      <p className="text-[11px] text-muted-foreground">{w.sets?.reduce((s: number, x: any) => s + x.reps, 0) ?? 0} reps</p>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center flex-1 text-center gap-2">
                    <Dumbbell className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No workouts yet</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-auto">
                <Button className="flex-1 h-9 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0 text-xs font-semibold shadow-lg shadow-red-500/20" onClick={() => router.push("/arena")}>
                  Log Workout
                </Button>
                <Button variant="outline" className="h-9 px-3 rounded-xl border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-semibold" onClick={() => router.push("/arena")}>
                  History
                </Button>
              </div>
            </Card>

            {/* ── 3. WORLD MAP ── */}
            <Card className="min-h-[360px] bg-card/70 backdrop-blur-xl border-border/50 rounded-3xl p-5 flex flex-col gap-4 shadow-lg shadow-black/5 hover:shadow-blue-500/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-400/5 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-125 transition-transform duration-700" />

              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/15">
                    <Map className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="font-semibold text-foreground text-sm">World Map</span>
                </div>
                <PulseDot color="#3b82f6" />
              </div>

              <div className="grid grid-cols-2 gap-3 relative">
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-500/8 border border-blue-500/15">
                  <span className="text-3xl font-black text-blue-500 tabular-nums leading-none">{mapStats.territories}</span>
                  <span className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wide">Zones</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-cyan-500/8 border border-cyan-500/15">
                  <span className="text-3xl font-black text-cyan-500 tabular-nums leading-none">{(animDist / 10).toFixed(1)}</span>
                  <span className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wide">km</span>
                </div>
              </div>

              {/* Distance bar */}
              <div className="space-y-1.5 relative">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Distance this month</span>
                  <span className="font-bold text-blue-500 tabular-nums">{(animDist / 10).toFixed(1)} km</span>
                </div>
                <ThinBar value={animDist} max={Math.max(animDist + 50, 100)} color="#3b82f6" />
              </div>

              <Button className="w-full h-9 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 text-xs font-semibold shadow-lg shadow-blue-500/20 relative gap-2 mt-auto" onClick={() => router.push("/world-map")}>
                <MapPin className="h-3.5 w-3.5" />
                View Map
                <ArrowUpRight className="h-3.5 w-3.5 ml-auto opacity-70" />
              </Button>
            </Card>

            {/* ── 4. SANCTUARY ── */}
            <Card className="min-h-[360px] bg-card/70 backdrop-blur-xl border-border/50 rounded-3xl p-5 flex flex-col gap-4 shadow-lg shadow-black/5 hover:shadow-violet-500/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-400/5 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-125 transition-transform duration-700" />

              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-violet-500/15">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                  </div>
                  <span className="font-semibold text-foreground text-sm">Sanctuary</span>
                </div>
                <span className="text-[11px] text-violet-400 font-semibold uppercase tracking-wider">Zen</span>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center gap-4 relative">
                {/* Animated breathing ring */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-violet-400/30 animate-ping" style={{ animationDuration: "3s" }} />
                  <div className="absolute inset-2 rounded-full border-2 border-violet-400/20 animate-ping" style={{ animationDuration: "3s", animationDelay: "0.5s" }} />
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-500/20 flex items-center justify-center">
                    <Brain className="h-7 w-7 text-violet-400" />
                  </div>
                </div>
                {/* Session suggestions */}
                <div className="w-full space-y-2">
                  {["5-min breathing", "10-min meditation", "Full body stretch"].map((s) => (
                    <div key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/5 border border-violet-500/10">
                      <Sparkles className="h-3 w-3 text-violet-400 shrink-0" />
                      <span className="text-xs text-muted-foreground">{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full h-9 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white border-0 text-xs font-semibold shadow-lg shadow-violet-500/20 relative gap-2 mt-auto" onClick={() => router.push("/sanctuary")}>
                <Sparkles className="h-3.5 w-3.5" />
                Enter Sanctuary
              </Button>
            </Card>

            {/* ── 5. HYDRATION (2 cols) ── */}
            <Card className="sm:col-span-2 lg:col-span-2 bg-card/70 backdrop-blur-xl border-border/50 rounded-3xl p-6 flex flex-col sm:flex-row gap-6 shadow-lg shadow-black/5 hover:shadow-cyan-500/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-cyan-500/15 to-blue-400/5 blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

              <div className="flex-1 relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-xl bg-cyan-500/15">
                    <Droplets className="h-4 w-4 text-cyan-500" />
                  </div>
                  <span className="font-semibold text-foreground text-sm">Hydration</span>
                  <span className="ml-auto text-xs text-muted-foreground">{hydrateGlasses}/8 glasses</span>
                </div>

                {/* Glass row */}
                <div className="flex gap-1.5 mb-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setHydrateGlasses(i < hydrateGlasses ? i : i + 1)}
                      className={cn(
                        "flex-1 h-8 rounded-xl border transition-all duration-300",
                        i < hydrateGlasses
                          ? "bg-cyan-500 border-cyan-400 shadow-md shadow-cyan-500/30"
                          : "bg-cyan-500/5 border-cyan-500/15 hover:bg-cyan-500/15"
                      )}
                    />
                  ))}
                </div>

                <ThinBar value={hydrateGlasses} max={8} color="#06b6d4" />
                <p className="text-xs text-muted-foreground mt-2">Target: 8 glasses per day for peak performance</p>
              </div>

              <div className="flex flex-col justify-between sm:w-36 gap-3 relative">
                <RadialProgress value={hydrateGlasses} max={8} size={90} strokeWidth={8} color="#06b6d4" bg="rgba(6,182,212,0.12)">
                  <span className="text-lg font-black text-cyan-500 tabular-nums leading-none">{Math.round((hydrateGlasses / 8) * 100)}%</span>
                </RadialProgress>
                <Button
                  className="h-9 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white border-0 text-xs font-semibold shadow-lg shadow-cyan-500/20"
                  onClick={() => setHydrateGlasses(prev => Math.min(prev + 1, 8))}
                >
                  + Add Glass
                </Button>
              </div>
            </Card>

            {/* ── 6. COMMUNITY (2 cols) ── */}
            <Card className="sm:col-span-2 lg:col-span-2 bg-card/70 backdrop-blur-xl border-border/50 rounded-3xl p-6 flex flex-col gap-4 shadow-lg shadow-black/5 hover:shadow-teal-500/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute -bottom-10 left-0 w-40 h-40 rounded-full bg-gradient-to-tr from-teal-500/15 to-emerald-400/5 blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-500/15">
                    <Users className="h-4 w-4 text-teal-500" />
                  </div>
                  <span className="font-semibold text-foreground text-sm">Community</span>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg border-teal-500/20 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 gap-1" onClick={() => router.push("/guilds")}>
                  Manage <ChevronRight className="h-3 w-3" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 flex-1 relative">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-500/5 border border-teal-500/15">
                  <div className="p-2.5 rounded-xl bg-teal-500/15">
                    <Users className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-teal-500 tabular-nums leading-none">{animFriends}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Friends</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
                  <div className="flex items-center gap-2">
                    <PulseDot color="#10b981" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-emerald-500 tabular-nums leading-none">{animOnline}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Online Now</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* ── 7. QUICK ACTIONS (spans 4 cols) ── */}
            <Card className="sm:col-span-2 lg:col-span-4 bg-card/70 backdrop-blur-xl border-border/50 rounded-3xl p-6 shadow-lg shadow-black/5 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 rounded-xl bg-foreground/8">
                  <Zap className="h-4 w-4 text-foreground/60" />
                </div>
                <span className="font-semibold text-foreground text-sm">Quick Actions</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Log Meal", icon: Apple, href: "/kitchen", from: "#10b981", to: "#14b8a6", shadow: "shadow-emerald-500/20", border: "border-emerald-500/20", hover: "hover:border-emerald-500/40" },
                  { label: "Log Workout", icon: Dumbbell, href: "/arena", from: "#ef4444", to: "#f97316", shadow: "shadow-red-500/20", border: "border-red-500/20", hover: "hover:border-red-500/40" },
                  { label: "Start Run", icon: MapPin, href: "/world-map", from: "#3b82f6", to: "#06b6d4", shadow: "shadow-blue-500/20", border: "border-blue-500/20", hover: "hover:border-blue-500/40" },
                  { label: "Meditate", icon: Sparkles, href: "/sanctuary", from: "#8b5cf6", to: "#a855f7", shadow: "shadow-violet-500/20", border: "border-violet-500/20", hover: "hover:border-violet-500/40" },
                ].map((a) => {
                  const Icon = a.icon
                  return (
                    <button
                      key={a.label}
                      onClick={() => router.push(a.href)}
                      className={cn(
                        "group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border bg-transparent",
                        "hover:bg-card hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300",
                        a.border, a.hover
                      )}
                    >
                      <div
                        className={cn("p-3 rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110", a.shadow)}
                        style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-foreground/80 group-hover:text-foreground transition-colors">{a.label}</span>
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* ── 8. AI COACH CTA ── */}
            <Card className="sm:col-span-2 lg:col-span-4 relative overflow-hidden rounded-3xl border border-violet-500/20 shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group bg-card/70 backdrop-blur-xl" onClick={() => router.push("/ai-coach")}>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-pink-500/5 group-hover:from-violet-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500" />
              <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/10 blur-3xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
              
              <div className="relative p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl shadow-violet-500/30">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-card" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base">AI Coach</h3>
                    <p className="text-sm text-muted-foreground">Get personalized plans, nutrition advice & form feedback</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-violet-500/15 border border-violet-500/25 text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-2">
                    <Star className="h-3.5 w-3.5" />
                    Ask Now
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-violet-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
