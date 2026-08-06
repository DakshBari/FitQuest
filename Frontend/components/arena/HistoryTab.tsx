"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Info, Edit, Trash2, Calendar, Clock, Dumbbell,
  Loader2, ChevronDown, Save, X, Activity, TrendingUp
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { getWorkouts, deleteWorkout, updateWorkout, Workout, groupWorkoutsByDate } from "@/services/workoutService"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const MUSCLE_GROUPS = ["Chest","Triceps","Back","Biceps","Shoulders","Legs","Core","Cardio"] as const
const EQUIPMENT_LABELS: Record<string, string> = {
  dumbbell: "Dumbbell", barbell: "Barbell", bodyweight: "Bodyweight",
  machine: "Machine", cable: "Cable", kettlebell: "Kettlebell", resistance_band: "Resistance Band",
}

const ACCENT = "#ef4444"

// ─── RPE badge  ──────────────────────────────────────────
function RpeBadge({ rpe }: { rpe: number }) {
  const col = rpe <= 3 ? "#10b981" : rpe <= 6 ? "#f59e0b" : rpe <= 8 ? "#f97316" : "#ef4444"
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide"
      style={{ background: `${col}15`, color: col, border: `1px solid ${col}25` }}
    >
      RPE {rpe}
    </span>
  )
}

// ─── Hover-to-reveal set row card (CSS grid-rows trick) ──
function WorkoutCard({
  group, onEdit, onInfo, onDelete,
}: {
  group: ReturnType<typeof groupRelatedSets>[number]
  onEdit: (w: Workout) => void
  onInfo: (w: Workout) => void
  onDelete: (w: Workout) => void
}) {
  const [hovered, setHovered] = useState(false)

  const fmtDate = (d: string) => new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const totalVol = group.sets.reduce((s, w) => {
    const set = w.sets[0]
    return s + set.reps * (set.unit === "lb" ? set.weight * 0.453592 : set.weight)
  }, 0)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl p-4 transition-[transform,box-shadow] duration-200",
        hovered && "-translate-y-0.5 shadow-md shadow-black/5"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Left avatar */}
        <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-sm font-black text-violet-500">{group.exercise.charAt(0)}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-foreground">{group.exercise}</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 border border-violet-500/20">
              {group.muscleGroup}
            </span>
            <span className="text-[10px] text-muted-foreground/60 px-1.5 py-0.5 rounded-lg bg-muted/30">
              {EQUIPMENT_LABELS[group.sets[0].weightType || "dumbbell"] || "Dumbbell"}
            </span>
          </div>

          {/* Date + time */}
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground/60">
            <Calendar className="w-2.5 h-2.5" />
            <span>{fmtDate(group.date)}</span>
            <span className="mx-0.5">·</span>
            <Clock className="w-2.5 h-2.5" />
            <span>{fmtTime(group.date)}</span>
          </div>

          {/* Hover-reveal sets — grid-rows 0fr→1fr trick */}
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: hovered ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden min-h-0">
              <div className="mt-3 space-y-1.5 pb-0.5">
                {/* Table header */}
                <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-3 px-2 pb-1 border-b border-border/30">
                  {["#", "Reps", "Weight", "RPE", ""].map(h => (
                    <span key={h} className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">{h}</span>
                  ))}
                </div>
                {group.sets.map((w, i) => (
                  <div
                    key={w._id}
                    className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-3 items-center px-2 py-1 rounded-lg hover:bg-muted/20 transition-colors group/row"
                  >
                    <span className="text-[9px] font-bold text-muted-foreground/40 w-4 text-center">{i + 1}</span>
                    <span className="text-xs font-semibold tabular-nums text-foreground">{w.sets[0].reps}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{w.sets[0].weight}{w.sets[0].unit}</span>
                    <RpeBadge rpe={w.rpe} />
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(w)}
                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                        <Edit className="w-2.5 h-2.5" />
                      </button>
                      <button onClick={() => onInfo(w)}
                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-all">
                        <Info className="w-2.5 h-2.5" />
                      </button>
                      <button onClick={() => onDelete(w)}
                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Volume summary */}
                {group.sets.length > 1 && (
                  <div className="flex items-center justify-between px-2 pt-1.5 border-t border-border/30">
                    <span className="text-[10px] text-muted-foreground/50">
                      {group.sets.length} sets · {totalVol.toFixed(0)} kg total volume
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">
                      Avg RPE {(group.sets.reduce((s, w) => s + w.rpe, 0) / group.sets.length).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: sets count + action opacity on hover */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-muted/15 border border-border/30">
            <Dumbbell className="w-3 h-3 text-muted-foreground/60" />
            <span className="text-sm font-black text-foreground tabular-nums">{group.sets.length}</span>
            <span className="text-[9px] text-muted-foreground/50">sets</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Group related sets (reused logic) ───────────────────
function groupRelatedSets(workouts: Workout[]) {
  const grouped: Record<string, Workout[]> = {}
  workouts.forEach(w => {
    const d = new Date(w.date)
    const rounded = new Date(Math.floor(d.getTime() / (10 * 60 * 1000)) * (10 * 60 * 1000))
    const key = `${w.exercise}-${w.muscleGroup}-${rounded.toISOString()}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(w)
  })
  return Object.values(grouped).map(g => {
    const sorted = [...g].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return {
      exercise: sorted[0].exercise,
      muscleGroup: sorted[0].muscleGroup,
      date: sorted[0].date,
      sets: sorted,
    }
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// ─── Label helper ─────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1.5">{children}</p>
}

// ─── Main component ───────────────────────────────────────
export function HistoryTab() {
  const { isAuthenticated } = useAuth()
  const [workouts,       setWorkouts]       = useState<Workout[]>([])
  const [isLoading,      setIsLoading]      = useState(true)
  const [selectedWorkout,setSelectedWorkout]= useState<Workout | null>(null)
  const [isDetailsOpen,  setIsDetailsOpen]  = useState(false)
  const [isEditOpen,     setIsEditOpen]     = useState(false)
  const [activeTab,      setActiveTab]      = useState<"all" | "daily">("all")
  const [expandedDays,   setExpandedDays]   = useState<Set<string>>(new Set())
  const [isEditLoading,  setIsEditLoading]  = useState(false)

  const [editForm, setEditForm] = useState({
    exercise: "", muscleGroup: "", weightType: "dumbbell" as const,
    reps: 0, weight: 0, unit: "kg" as const,
    rpe: 7, restTime: "", notes: "", date: "", time: "",
  })

  useEffect(() => { if (isAuthenticated) fetchWorkouts() }, [isAuthenticated])

  const fetchWorkouts = async () => {
    try {
      setIsLoading(true)
      const res = await getWorkouts({ limit: 100 })
      setWorkouts(res.workouts)
    } catch (e: any) { toast.error(e.message || "Failed to fetch workouts") }
    finally { setIsLoading(false) }
  }

  const handleEdit = (w: Workout) => {
    const d = new Date(w.date)
    setEditForm({
      exercise: w.exercise, muscleGroup: w.muscleGroup,
      weightType: (w.weightType as any) || "dumbbell",
      reps: w.sets[0]?.reps || 0, weight: w.sets[0]?.weight || 0,
      unit: (w.sets[0]?.unit as any) || "kg",
      rpe: w.rpe, restTime: w.restTime || "", notes: w.notes || "",
      date: d.toISOString().split("T")[0], time: d.toTimeString().slice(0, 5),
    })
    setSelectedWorkout(w); setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedWorkout) return
    setIsEditLoading(true)
    try {
      const updated = {
        exercise: editForm.exercise.trim(), muscleGroup: editForm.muscleGroup,
        weightType: editForm.weightType,
        sets: [{ reps: editForm.reps, weight: editForm.weight, unit: editForm.unit }],
        rpe: editForm.rpe, restTime: editForm.restTime.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
        date: new Date(`${editForm.date}T${editForm.time}:00`).toISOString(),
      }
      await updateWorkout(selectedWorkout._id!, updated)
      setWorkouts(prev => prev.map(w => w._id === selectedWorkout._id ? { ...w, ...updated } : w))
      toast.success("Workout updated")
      setIsEditOpen(false); setSelectedWorkout(null)
    } catch (e: any) { toast.error(e.message || "Failed to update") }
    finally { setIsEditLoading(false) }
  }

  const handleDelete = async (w: Workout) => {
    if (!confirm(`Delete "${w.exercise}" set?`)) return
    try {
      await deleteWorkout(w._id!)
      setWorkouts(prev => prev.filter(x => x._id !== w._id))
      toast.success("Deleted")
    } catch (e: any) { toast.error(e.message || "Failed to delete") }
  }

  const fmtDateFull  = (d: string) => new Date(d).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
  const fmtDateShort = (d: string) => new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
  const fmtTime      = (d: string) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  const grouped = groupRelatedSets(workouts)
  const byDate  = Object.entries(groupWorkoutsByDate(workouts)).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())

  // ── Loading / auth guards ─────────────────────────────
  if (!isAuthenticated) return (
    <div className="rounded-3xl border border-border/40 bg-card/70 p-12 text-center">
      <p className="text-sm text-muted-foreground">Please log in to view workout history</p>
    </div>
  )

  if (isLoading) return (
    <div className="rounded-3xl border border-border/40 bg-card/70 p-12 flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-border border-t-violet-500 animate-spin" />
      <p className="text-sm text-muted-foreground">Loading history…</p>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Workout History</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Your training log</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{workouts.length} sessions recorded</span>
        </div>
      </div>

      {/* ── Tab strip ────────────────────────────────────── */}
      <div className="flex border-b border-border/40">
        {([
          { key: "all",   label: "All Workouts",  sub: "Grouped by exercise" },
          { key: "daily", label: "By Day",         sub: "Daily breakdown"     },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "flex flex-col items-start px-5 py-3 border-b-2 -mb-px transition-all duration-150",
              activeTab === t.key
                ? "border-violet-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <span className="text-sm font-semibold">{t.label}</span>
            <span className="text-[10px] text-muted-foreground/50 mt-0.5">{t.sub}</span>
          </button>
        ))}
      </div>

      {/* ── All Workouts tab ─────────────────────────────── */}
      {activeTab === "all" && (
        grouped.length === 0 ? (
          <div className="rounded-2xl border border-border/40 bg-card/60 p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-3">
              <Dumbbell className="w-5 h-5 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No workouts yet</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Start logging to see your history</p>
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map((g, i) => (
              <WorkoutCard
                key={i} group={g}
                onEdit={handleEdit}
                onInfo={w => { setSelectedWorkout(w); setIsDetailsOpen(true) }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )
      )}

      {/* ── By Day tab ───────────────────────────────────── */}
      {activeTab === "daily" && (
        byDate.length === 0 ? (
          <div className="rounded-2xl border border-border/40 bg-card/60 p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-5 h-5 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No daily entries yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {byDate.map(([date, dayWorkouts]) => {
              const isOpen = expandedDays.has(date)
              const totalSets = dayWorkouts.reduce((s, w) => s + w.sets.length, 0)
              const exercises = [...new Set(dayWorkouts.map(w => w.exercise))]
              const groups = groupRelatedSets(dayWorkouts)
              return (
                <div key={date} className="rounded-2xl border border-border/40 bg-card/70 overflow-hidden">
                  {/* Clickable day header */}
                  <button
                    onClick={() => {
                      const n = new Set(expandedDays)
                      n.has(date) ? n.delete(date) : n.add(date)
                      setExpandedDays(n)
                    }}
                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-muted/10 transition-colors group"
                  >
                    <div className="flex items-center gap-3 text-left">
                      {/* Day avatar */}
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-violet-500 uppercase leading-none">
                          {new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        <span className="text-sm font-black text-violet-500 tabular-nums leading-none">
                          {new Date(date).getDate()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{fmtDateShort(date)}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {exercises.slice(0, 2).join(", ")}{exercises.length > 2 ? ` +${exercises.length - 2} more` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-black text-foreground tabular-nums">{totalSets}</p>
                        <p className="text-[9px] text-muted-foreground/50">sets</p>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-muted-foreground/50 transition-transform duration-200",
                        isOpen && "rotate-180"
                      )} />
                    </div>
                  </button>

                  {/* Expandable exercises */}
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-out"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden min-h-0">
                      <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/30">
                        {groups.map((g, gi) => (
                          <WorkoutCard
                            key={gi} group={g}
                            onEdit={handleEdit}
                            onInfo={w => { setSelectedWorkout(w); setIsDetailsOpen(true) }}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── Details Dialog ───────────────────────────────── */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg bg-card border-border/50 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Workout Details</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground/60">Full session info</DialogDescription>
          </DialogHeader>
          {selectedWorkout && (
            <div className="space-y-4 mt-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-black text-violet-500">{selectedWorkout.exercise.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">{selectedWorkout.exercise}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 border border-violet-500/20 font-semibold">
                      {selectedWorkout.muscleGroup}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground">
                      {EQUIPMENT_LABELS[selectedWorkout.weightType || "dumbbell"]}
                    </span>
                    <RpeBadge rpe={selectedWorkout.rpe} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Date", value: fmtDateFull(selectedWorkout.date), icon: Calendar },
                  { label: "Time", value: fmtTime(selectedWorkout.date),     icon: Clock    },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="p-3 rounded-xl border border-border/40 bg-muted/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3 h-3 text-muted-foreground/60" />
                      <FieldLabel>{label}</FieldLabel>
                    </div>
                    <p className="text-sm font-medium text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <FieldLabel>Sets</FieldLabel>
                <div className="space-y-1.5">
                  {selectedWorkout.sets.map((s, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl border border-border/40 bg-muted/10">
                      <span className="text-xs text-muted-foreground/60">Set {i + 1}</span>
                      <span className="text-sm font-bold text-violet-500 tabular-nums">
                        {s.reps} × {s.weight}{s.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedWorkout.restTime && (
                <div className="p-3 rounded-xl border border-border/40 bg-muted/10">
                  <FieldLabel>Rest Time</FieldLabel>
                  <p className="text-sm text-foreground">{selectedWorkout.restTime}</p>
                </div>
              )}
              {selectedWorkout.notes && (
                <div className="p-3 rounded-xl border border-border/40 bg-muted/10">
                  <FieldLabel>Notes</FieldLabel>
                  <p className="text-sm text-foreground leading-relaxed">{selectedWorkout.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ──────────────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/50 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Workout</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground/60">Update set details</DialogDescription>
          </DialogHeader>
          {selectedWorkout && (
            <div className="space-y-5 mt-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Exercise Name</FieldLabel>
                  <Input value={editForm.exercise} onChange={e => setEditForm({ ...editForm, exercise: e.target.value })}
                    className="bg-muted/10 border-border/50 h-10 rounded-xl" />
                </div>
                <div>
                  <FieldLabel>Muscle Group</FieldLabel>
                  <select value={editForm.muscleGroup} onChange={e => setEditForm({ ...editForm, muscleGroup: e.target.value })}
                    className="w-full h-10 rounded-xl border border-border/50 bg-muted/10 px-3 text-sm text-foreground focus:outline-none">
                    {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Equipment</FieldLabel>
                  <select value={editForm.weightType} onChange={e => setEditForm({ ...editForm, weightType: e.target.value as any })}
                    className="w-full h-10 rounded-xl border border-border/50 bg-muted/10 px-3 text-sm text-foreground focus:outline-none">
                    {Object.entries(EQUIPMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Reps</FieldLabel>
                  <Input type="number" value={editForm.reps || ""} onChange={e => setEditForm({ ...editForm, reps: parseInt(e.target.value) || 0 })}
                    className="bg-muted/10 border-border/50 h-10 rounded-xl text-center font-mono" />
                </div>
                <div>
                  <FieldLabel>Weight</FieldLabel>
                  <div className="flex gap-1.5">
                    <Input type="number" value={editForm.weight || ""} onChange={e => setEditForm({ ...editForm, weight: parseFloat(e.target.value) || 0 })}
                      className="bg-muted/10 border-border/50 h-10 rounded-xl flex-1 font-mono" />
                    <select value={editForm.unit} onChange={e => setEditForm({ ...editForm, unit: e.target.value as any })}
                      className="h-10 rounded-xl border border-border/50 bg-muted/10 px-2 text-sm text-foreground focus:outline-none">
                      <option value="kg">kg</option>
                      <option value="lb">lb</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Date</FieldLabel>
                  <Input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                    className="bg-muted/10 border-border/50 h-10 rounded-xl" />
                </div>
                <div>
                  <FieldLabel>Time</FieldLabel>
                  <Input type="time" value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                    className="bg-muted/10 border-border/50 h-10 rounded-xl font-mono" />
                </div>
                <div>
                  <FieldLabel>Rest Time</FieldLabel>
                  <Input value={editForm.restTime} onChange={e => setEditForm({ ...editForm, restTime: e.target.value })}
                    placeholder="90s · 2min"
                    className="bg-muted/10 border-border/50 h-10 rounded-xl" />
                </div>
              </div>

              <div>
                <FieldLabel>RPE (1–10)</FieldLabel>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <button key={n} type="button" onClick={() => setEditForm({ ...editForm, rpe: n })}
                      className={cn(
                        "flex-1 h-9 rounded-lg text-[11px] font-bold border transition-all duration-100",
                        editForm.rpe === n
                          ? "bg-violet-500 text-white border-transparent"
                          : "border-border/40 text-muted-foreground/60 hover:text-foreground"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Notes</FieldLabel>
                <Textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Additional notes…"
                  className="bg-muted/10 border-border/50 resize-none h-20 rounded-xl text-sm" />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-border/40">
                <button onClick={() => setIsEditOpen(false)} disabled={isEditLoading}
                  className="px-4 py-2 rounded-xl border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isEditLoading || !editForm.exercise.trim() || editForm.reps === 0}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all",
                    !isEditLoading && editForm.exercise.trim() && editForm.reps > 0
                      ? "bg-violet-500 text-white hover:bg-violet-600 shadow-sm shadow-violet-500/20"
                      : "bg-muted/10 text-muted-foreground/40 border border-border/30 cursor-not-allowed"
                  )}
                >
                  {isEditLoading
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    : <><Save className="w-3.5 h-3.5" /> Save Changes</>
                  }
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
