"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Save, Clock, Dumbbell, Activity, Gamepad2, Loader2, X, ChevronDown, Zap } from "lucide-react"
import { createWorkout, ExerciseSet } from "@/services/workoutService"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const MUSCLE_GROUPS = ["Chest","Triceps","Back","Biceps","Shoulders","Legs","Core","Cardio"] as const

const EQUIPMENT: { value: string; label: string }[] = [
  { value: "barbell",         label: "Barbell"         },
  { value: "dumbbell",        label: "Dumbbell"        },
  { value: "bodyweight",      label: "Bodyweight"      },
  { value: "machine",         label: "Machine"         },
  { value: "cable",           label: "Cable"           },
  { value: "kettlebell",      label: "Kettlebell"      },
  { value: "resistance_band", label: "Resistance Band" },
]

// Single accent color — violet
const ACCENT = "#8b5cf6"

const RPE_LABELS: Record<number, string> = {
  1:"Very Easy", 2:"Easy", 3:"Light", 4:"Moderate", 5:"Moderate+",
  6:"Hard", 7:"Hard+", 8:"Very Hard", 9:"Near Max", 10:"Max Effort"
}

// Animated number counter
function AnimNum({ val, className }: { val: number; className?: string }) {
  const [disp, setDisp] = useState(0)
  const prev = useRef(0)
  const raf  = useRef<number>(0)
  useEffect(() => {
    const s = prev.current, d = val - s, t0 = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - t0) / 600, 1)
      const e = 1 - Math.pow(1 - t, 3)
      const n = s + d * e
      setDisp(n); prev.current = n
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [val])
  return <span className={className}>{Math.round(disp).toLocaleString()}</span>
}

// Live real-time clock (HH:MM:SS)
function LiveClock() {
  const fmt = () => {
    const n = new Date()
    return [
      String(n.getHours()).padStart(2, "0"),
      String(n.getMinutes()).padStart(2, "0"),
      String(n.getSeconds()).padStart(2, "0"),
    ].join(":")
  }
  const [time, setTime] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="tabular-nums font-mono">{time}</span>
}

export function WorkoutForm({ onSave, onSwitchMode }: { onSave: () => void; onSwitchMode?: () => void }) {
  const { isAuthenticated } = useAuth()
  const [isLoading,    setIsLoading]    = useState(false)
  const [exercise,     setExercise]     = useState("")
  const [muscleGroup,  setMuscleGroup]  = useState<string>("Chest")
  const [weightType,   setWeightType]   = useState<string>("barbell")
  const [workoutTime,  setWorkoutTime]  = useState(() => new Date().toTimeString().slice(0, 5))
  const [sets,         setSets]         = useState<ExerciseSet[]>([])
  const [current,      setCurrent]      = useState<ExerciseSet>({ reps: 0, weight: 0, unit: "kg" })
  const [rpe,          setRpe]          = useState(7)
  const [restTime,     setRestTime]     = useState("")
  const [notes,        setNotes]        = useState("")
  const [sessionActive,setSessionActive]= useState(false)

  // ──────────────────────────────────────────────────────────────────────
  // FIX: Dynamic Color Logic
  // Text/Borders: Matches the color at the "tip" of the current RPE
  const rpeColor = rpe <= 3 
    ? "#10b981"  // Green (Warmup)
    : rpe <= 5 
    ? "#eab308"  // Yellow (Moderate)
    : rpe <= 7 
    ? "#f97316"  // Orange (Hard)
    : "#8b5cf6"  // Violet (Max Effort)

  // Gradient: Expands as RPE increases.
  // 1-3: Blue -> Green
  // 4-5: Blue -> Green -> Yellow
  // 6-7: ... -> Orange
  // 8-10: ... -> Violet
  const getIntensityGradient = (val: number) => {
    if (val <= 3) return "linear-gradient(to right, #3b82f6, #10b981)"
    if (val <= 5) return "linear-gradient(to right, #3b82f6, #10b981, #eab308)"
    if (val <= 7) return "linear-gradient(to right, #3b82f6, #10b981, #eab308, #f97316)"
    return "linear-gradient(to right, #3b82f6, #10b981, #eab308, #f97316, #8b5cf6)"
  }
  // ──────────────────────────────────────────────────────────────────────

  const totalVol  = sets.reduce((s, x) => s + x.reps * x.weight, 0)
  const totalReps = sets.reduce((s, x) => s + x.reps, 0)
  const canSave   = !isLoading && exercise.trim() && sets.length > 0 && (sets.length <= 1 || restTime.trim())

  const handleAddSet = () => {
    if (current.reps > 0 && current.weight >= 0) {
      setSets(prev => [...prev, current])
      setCurrent({ reps: 0, weight: 0, unit: current.unit })
      if (!sessionActive) setSessionActive(true)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAddSet()
  }

  const handleSave = async () => {
    if (!isAuthenticated)                    { toast.error("Please log in"); return }
    if (!exercise.trim())                    { toast.error("Enter an exercise name"); return }
    if (sets.length === 0)                   { toast.error("Add at least one set"); return }
    if (sets.length > 1 && !restTime.trim()) { toast.error("Rest time required for multiple sets"); return }

    setIsLoading(true)
    try {
      const parseRest = (s: string) => {
        if (!s) return 0
        const m = s.match(/(\d+)\s*(s|sec|seconds?|m|min|minutes?)?/i)
        if (!m) return 60
        return m[2]?.toLowerCase().startsWith("m") ? parseInt(m[1]) * 60 : parseInt(m[1])
      }
      const restSec = parseRest(restTime.trim())
      const base = new Date()
      const [h, min] = workoutTime.split(":").map(Number)
      base.setHours(h, min, 0, 0)
      let xp = 0
      for (let i = 0; i < sets.length; i++) {
        const d = new Date(base.getTime() + i * restSec * 1000)
        const res = await createWorkout({
          exercise: exercise.trim(), muscleGroup,
          weightType: weightType as any,
          sets: [sets[i]], rpe,
          restTime: i < sets.length - 1 ? restTime.trim() : undefined,
          notes: i === 0 ? notes.trim() || undefined : `Set ${i + 1}`,
          date: d.toISOString(),
        })
        if (res.xpGained) xp += res.xpGained
      }
      toast.success(`${sets.length} set${sets.length > 1 ? "s" : ""} logged${xp ? ` · +${xp} XP` : ""}`)
      setExercise(""); setMuscleGroup("Chest"); setWeightType("barbell")
      setWorkoutTime(new Date().toTimeString().slice(0, 5))
      setSets([]); setCurrent({ reps: 0, weight: 0, unit: "kg" })
      setRpe(7); setRestTime(""); setNotes(""); setSessionActive(false)
      onSave()
    } catch (e: any) {
      toast.error(e.message || "Failed to save")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-sm">

      {/* ── Intensity header strip ──────────────────────────────────── */}
      <div className="relative px-6 py-5 border-b border-border/50 overflow-hidden">
        {/* Accent color left bar — always red */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: ACCENT }}
        />
        {/* Faint red background tint */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ background: `radial-gradient(ellipse at left, ${ACCENT}, transparent 70%)` }}
        />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Workout Logger
              </h2>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <LiveClock />
                </span>
                {sessionActive && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide bg-violet-500/15 text-violet-500"
                  >
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Muscle group pill selector */}
            <div className="relative">
              <select
                value={muscleGroup}
                onChange={e => setMuscleGroup(e.target.value)}
                className="appearance-none text-xs font-semibold bg-muted/30 border border-border/50 text-foreground pl-3 pr-7 py-2 rounded-xl cursor-pointer focus:outline-none focus:ring-1 focus:ring-border"
              >
                {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>

            {onSwitchMode && (
              <button
                onClick={onSwitchMode}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Learn / Game</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">

        {/* ── Left: inputs ─────────────────────────────────────────── */}
        <div className="p-6 space-y-6 border-r border-border/40">

          {/* Exercise name — large and prominent */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 block mb-1.5">
              Exercise Name
            </label>
            <div className="relative">
              <input
                value={exercise}
                onChange={e => setExercise(e.target.value)}
                placeholder="e.g. Bench Press"
                className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-violet-500 outline-none text-2xl font-bold text-foreground placeholder:text-muted-foreground/25 placeholder:font-normal pb-2 transition-colors duration-200"
                style={{ borderBottomColor: exercise ? rpeColor + "80" : undefined }}
              />
            </div>
          </div>

          {/* Equipment chips */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 block mb-2">
              Equipment
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT.map(eq => {
                const active = weightType === eq.value
                return (
                  <button
                    key={eq.value}
                    onClick={() => setWeightType(eq.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150",
                      active
                        ? "bg-violet-500/10 border-violet-500/30 text-violet-500"
                        : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70 bg-transparent"
                    )}
                  >
                    {eq.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Set builder row */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 block mb-2">
              Log Set
            </label>
            <div className="flex items-stretch gap-2">
              {/* Reps */}
              <div className="flex-1">
                <div className="text-[9px] text-muted-foreground/50 text-center mb-1">REPS</div>
                <input
                  type="number"
                  value={current.reps || ""}
                  onChange={e => setCurrent({ ...current, reps: parseInt(e.target.value) || 0 })}
                  onKeyDown={handleKey}
                  placeholder="0"
                  className="w-full h-14 rounded-xl border border-border/50 bg-muted/10 text-center text-2xl font-black tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/50 transition-colors"
                />
              </div>
              {/* × divider */}
              <div className="flex items-center justify-center text-muted-foreground/30 font-thin text-2xl self-end pb-2">×</div>
              {/* Weight */}
              <div className="flex-1">
                <div className="text-[9px] text-muted-foreground/50 text-center mb-1">WEIGHT</div>
                <input
                  type="number"
                  value={current.weight || ""}
                  onChange={e => setCurrent({ ...current, weight: parseFloat(e.target.value) || 0 })}
                  onKeyDown={handleKey}
                  placeholder="0"
                  className="w-full h-14 rounded-xl border border-border/50 bg-muted/10 text-center text-2xl font-black tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/50 transition-colors"
                />
              </div>
              {/* Unit toggle */}
              <div className="flex flex-col justify-end gap-0.5">
                {(["kg", "lb"] as const).map(u => (
                  <button
                    key={u}
                    onClick={() => setCurrent({ ...current, unit: u })}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all",
                      current.unit === u
                        ? "text-white"
                        : "text-muted-foreground/50 hover:text-muted-foreground"
                    )}
                    style={current.unit === u ? { background: ACCENT } : {}}
                  >
                    {u.toUpperCase()}
                  </button>
                ))}
              </div>
              {/* Add set button */}
              <button
                onClick={handleAddSet}
                disabled={current.reps === 0}
                className={cn(
                  "h-14 px-5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all duration-150 border self-end",
                  current.reps > 0
                    ? "bg-violet-500 text-white border-transparent shadow-sm shadow-violet-500/20 hover:bg-violet-600"
                    : "border-border/30 text-muted-foreground/30 bg-muted/10 cursor-not-allowed"
                )}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:block">Add Set</span>
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/40 mt-1.5">Press Enter to add</p>
          </div>

          {/* RPE — colored spectrum strip */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                RPE — Perceived Effort
              </label>
              <span className="text-[10px] font-semibold text-violet-500">
                {rpe}/10 · {RPE_LABELS[rpe]}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
                const active = rpe === n
                return (
                  <button
                    key={n}
                    onClick={() => setRpe(n)}
                    className="flex-1 rounded-lg transition-all duration-100 relative"
                    style={{
                      height: active ? 36 : 28,
                      background: active ? ACCENT : `${ACCENT}20`,
                      border: `1px solid ${active ? ACCENT : ACCENT + "35"}`,
                      marginTop: active ? 0 : 4,
                    }}
                  >
                    {/* Text color logic: Active = White, Inactive = Red/70 */}
                    <span className={cn(
                      "text-[9px] font-black transition-colors", 
                      active ? "text-white" : "text-violet-500/70"
                    )}>
                      {n}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time + Rest side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 block mb-1.5">
                Start Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={workoutTime}
                  onChange={e => setWorkoutTime(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border/50 bg-muted/10 px-3 pl-9 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-border transition-colors"
                />
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 block mb-1.5 flex items-center justify-between">
                <span>Rest Period</span>
                {sets.length > 1 && !restTime && <span className="text-violet-500 normal-case font-normal">Required</span>}
              </label>
              <input
                type="text"
                value={restTime}
                onChange={e => setRestTime(e.target.value)}
                placeholder="90s · 2min"
                className={cn(
                  "w-full h-10 rounded-xl border bg-muted/10 px-3 text-sm text-foreground focus:outline-none focus:ring-1 transition-colors placeholder:text-muted-foreground/30",
                  sets.length > 1 && !restTime.trim()
                    ? "border-violet-500/50 focus:ring-violet-500/30"
                    : "border-border/50 focus:ring-border"
                )}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 block mb-1.5">
              Notes / Cues
            </label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Tempo, form reminders, how it felt…"
              className="bg-muted/10 border-border/50 resize-none h-16 text-sm focus-visible:ring-1 focus-visible:ring-border rounded-xl placeholder:text-muted-foreground/30"
            />
          </div>
        </div>

        {/* ── Right: live stats + sets ─────────────────────────────── */}
        <div className="flex flex-col bg-muted/5">

          {/* Live stats strip */}
          <div className="grid grid-cols-3 divide-x divide-border/40 border-b border-border/40">
            {[
              { label: "Sets",   value: sets.length,    unit: ""      },
              { label: "Reps",   value: totalReps,      unit: ""      },
              { label: "Volume", value: totalVol,       unit: current.unit },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center justify-center py-4 gap-0.5">
                <AnimNum val={s.value} className="text-2xl font-black tabular-nums text-foreground" />
                {s.unit && <span className="text-[9px] text-muted-foreground/50">{s.unit}</span>}
                <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mt-0.5">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Intensity bar */}
          <div className="px-4 py-3 border-b border-border/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Intensity</span>
              <span className="text-[9px] font-semibold" style={{ color: rpeColor }}>RPE {rpe}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${rpe * 10}%`,
                  // UPDATED: Uses the dynamic gradient function
                  background: getIntensityGradient(rpe),
                }}
              />
            </div>
          </div>

          {/* Sets log */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                Set Log
              </span>
              {sets.length > 0 && (
                <span className="text-[9px] text-muted-foreground/40">{sets.length} set{sets.length !== 1 ? "s" : ""}</span>
              )}
            </div>

            {sets.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
                <div className="w-10 h-10 rounded-2xl bg-muted/20 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-muted-foreground/30" />
                </div>
                <p className="text-xs text-muted-foreground/40 text-center px-6">
                  Add sets above to start building your session
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5 max-h-[320px]">
                {sets.map((s, i) => {
                  const setVol = s.reps * s.weight
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/30 bg-card hover:border-border/60 transition-colors group"
                    >
                      {/* Set number badge */}
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                        style={{ background: ACCENT }}
                      >
                        {i + 1}
                      </div>
                      {/* Reps × Weight */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold tabular-nums text-foreground">
                          {s.reps}
                        </span>
                        <span className="text-xs text-muted-foreground/50 mx-1">×</span>
                        <span className="text-sm font-bold tabular-nums text-foreground">
                          {s.weight}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50 ml-0.5">{s.unit}</span>
                      </div>
                      {/* Volume per set */}
                      <span className="text-[10px] text-muted-foreground/40 tabular-nums flex-shrink-0">
                        {setVol}{s.unit}
                      </span>
                      {/* Remove */}
                      <button
                        onClick={() => setSets(prev => prev.filter((_, idx) => idx !== i))}
                        className="w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground/20 hover:text-violet-400 hover:bg-violet-500/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Save CTA */}
          <div className="p-4 border-t border-border/40">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={cn(
                "w-full h-12 rounded-xl flex items-center justify-center gap-2.5 text-sm font-bold transition-all duration-200",
                canSave
                  ? "text-white shadow-md"
                  : "bg-muted/10 border border-border/30 text-muted-foreground/30 cursor-not-allowed"
              )}
              style={canSave ? {
                background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
                boxShadow: "0 4px 16px #8b5cf635",
              } : {}}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Complete Session
                  {sets.length > 0 && (
                    <span className="text-[10px] font-normal opacity-70 ml-1">
                      · {sets.length} set{sets.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}