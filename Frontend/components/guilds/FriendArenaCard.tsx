"use client"

import { useState, useEffect, useCallback } from "react"
import { Swords, X, Dumbbell, Loader2, Zap, BarChart2, Target, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface WorkoutSet {
  reps: number
  weight: number
  unit: "kg" | "lb"
}

interface FriendWorkout {
  _id: string
  exercise: string
  muscleGroup: string
  weightType: string
  sets: WorkoutSet[]
  rpe: number
  notes?: string
}

interface FriendArenaData {
  workoutCount: number
  workouts: FriendWorkout[]
  stats: {
    totalSets: number
    totalVolume: number
    avgRPE: number
    muscleGroups: string[]
  }
}

interface Friend {
  id: string
  name: string
  avatar: string
  level: number
  online: boolean
}

const getHeaders = () => {
  const token = localStorage.getItem("token")
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// RPE colour scale (red theme matching arena)
const rpeColor = (rpe: number) => {
  if (rpe <= 4) return "#22c55e"
  if (rpe <= 6) return "#f59e0b"
  if (rpe <= 8) return "#ef4444"
  return "#dc2626"
}

const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#ef4444", Triceps: "#f97316", Back: "#3b82f6",
  Biceps: "#8b5cf6", Shoulders: "#06b6d4", Legs: "#10b981",
  Core: "#f59e0b", Cardio: "#ec4899",
}
const muscleColor = (m: string) => MUSCLE_COLORS[m] ?? "#6b7280"

// ─── Stat pill ────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl bg-muted/20">
      <Icon className="w-3 h-3" style={{ color }} />
      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">{label}</span>
      <span className="text-xs font-black tabular-nums" style={{ color }}>{value}</span>
    </div>
  )
}

// ─── Exercise row in modal ────────────────────────────────
function ExerciseRow({ workout }: { workout: FriendWorkout }) {
  const volume = workout.sets.reduce((s, set) => {
    const kg = set.unit === "lb" ? set.weight * 0.453592 : set.weight
    return s + set.reps * kg
  }, 0)

  return (
    <div className="py-3 border-b border-border/30 last:border-0">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-foreground">{workout.exercise}</p>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide"
              style={{ color: muscleColor(workout.muscleGroup), background: `${muscleColor(workout.muscleGroup)}18` }}
            >
              {workout.muscleGroup}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 capitalize mt-0.5">{workout.weightType.replace(/_/g, " ")}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs font-black px-2 py-0.5 rounded-lg"
            style={{ color: rpeColor(workout.rpe), background: `${rpeColor(workout.rpe)}18` }}
          >
            RPE {workout.rpe}
          </span>
        </div>
      </div>

      {/* Sets */}
      <div className="flex flex-wrap gap-1.5">
        {workout.sets.map((set, i) => (
          <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted/30 text-muted-foreground/80">
            {set.reps} × {set.weight}{set.unit}
          </span>
        ))}
      </div>

      {/* Volume */}
      <p className="text-[10px] text-muted-foreground/50 mt-1.5">
        Volume: <span className="font-bold text-red-400">{Math.round(volume)} kg</span>
      </p>
    </div>
  )
}

// ─── Friend Arena Modal ───────────────────────────────────
function FriendArenaModal({
  friend, data, onClose,
}: {
  friend: Friend; data: FriendArenaData; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl border border-border/50 bg-card overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <span className="text-sm font-black text-red-500">{friend.avatar.substring(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{friend.name}'s Arena</p>
              <p className="text-[10px] text-muted-foreground/60">Today · {data.workoutCount} exercise{data.workoutCount !== 1 ? "s" : ""} · View only</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stats strip */}
        <div className="flex-shrink-0 px-5 py-3 border-b border-border/30">
          <div className="grid grid-cols-4 gap-2">
            <StatPill icon={Dumbbell}   label="Exercises" value={data.workoutCount}        color="#ef4444" />
            <StatPill icon={Layers}     label="Sets"      value={data.stats.totalSets}     color="#f97316" />
            <StatPill icon={BarChart2}  label="Volume"    value={`${data.stats.totalVolume}kg`} color="#3b82f6" />
            <StatPill icon={Zap}        label="Avg RPE"   value={data.stats.avgRPE}        color={rpeColor(data.stats.avgRPE)} />
          </div>
        </div>

        {/* Muscle groups */}
        {data.stats.muscleGroups.length > 0 && (
          <div className="flex-shrink-0 px-5 py-2.5 border-b border-border/20 flex flex-wrap gap-1.5">
            {data.stats.muscleGroups.map(mg => (
              <span key={mg}
                className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                style={{ color: muscleColor(mg), background: `${muscleColor(mg)}18` }}>
                {mg}
              </span>
            ))}
          </div>
        )}

        {/* Exercise list */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-2">
          {data.workouts.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-center">
              <Dumbbell className="w-8 h-8 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground/50">No exercises logged today</p>
            </div>
          ) : (
            data.workouts.map(w => <ExerciseRow key={w._id} workout={w} />)
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-border/30">
          <p className="text-[9px] text-muted-foreground/35 text-center">
            Read-only view · {friend.name}'s training data
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Single friend row (in card) ──────────────────────────
function FriendArenaRow({
  friend, arenaData, onClick,
}: {
  friend: Friend; arenaData: FriendArenaData; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className="w-full text-left p-3 rounded-xl border border-border/30 hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-150 group">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-[10px] font-black text-red-500">{friend.avatar.substring(0, 2).toUpperCase()}</span>
          </div>
          {friend.online && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-card" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{friend.name}</p>
          <p className="text-[9px] text-red-500 font-medium">
            {arenaData.workoutCount} exercise{arenaData.workoutCount !== 1 ? "s" : ""} · {arenaData.stats.totalSets} sets
          </p>
        </div>
        <Swords className="w-3 h-3 text-red-500 opacity-60 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Compact stat row */}
      <div className="flex gap-1.5 text-[9px] font-bold flex-wrap">
        <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500">{arenaData.stats.totalVolume}kg vol</span>
        <span className="px-1.5 py-0.5 rounded-md" style={{
          color: rpeColor(arenaData.stats.avgRPE),
          background: `${rpeColor(arenaData.stats.avgRPE)}18`,
        }}>RPE {arenaData.stats.avgRPE}</span>
        {arenaData.stats.muscleGroups.slice(0, 3).map(mg => (
          <span key={mg} className="px-1.5 py-0.5 rounded-md"
            style={{ color: muscleColor(mg), background: `${muscleColor(mg)}15` }}>
            {mg}
          </span>
        ))}
        {arenaData.stats.muscleGroups.length > 3 && (
          <span className="px-1.5 py-0.5 rounded-md bg-muted/30 text-muted-foreground/60">
            +{arenaData.stats.muscleGroups.length - 3}
          </span>
        )}
      </div>
    </button>
  )
}

// ─── Main export ──────────────────────────────────────────
export function FriendArenaCard({ friends }: { friends: Friend[] }) {
  const [arenaMap, setArenaMap]         = useState<Record<string, FriendArenaData>>({})
  const [loading, setLoading]           = useState(true)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)

  const fetch = useCallback(async () => {
    if (friends.length === 0) { setLoading(false); return }
    setLoading(true)
    const results: Record<string, FriendArenaData> = {}
    await Promise.all(
      friends.map(async f => {
        try {
          const res = await window.fetch(`${API_URL}/api/workouts/friend/${f.id}/today`, {
            headers: getHeaders(),
          })
          if (!res.ok) return
          const data = await res.json()
          if (data.status === "success" && data.workoutCount > 0) {
            results[f.id] = data
          }
        } catch {}
      })
    )
    setArenaMap(results)
    setLoading(false)
  }, [friends])

  useEffect(() => { fetch() }, [fetch])

  const activeFriends = friends.filter(f => arenaMap[f.id])

  return (
    <>
      <div className="rounded-2xl border border-border/40 bg-card/70 p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Swords className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Friends Activity</p>
            <h3 className="text-sm font-bold text-foreground">Arena</h3>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
          </div>
        ) : activeFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <Dumbbell className="w-6 h-6 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/50">No friends have trained today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeFriends.map(f => (
              <FriendArenaRow
                key={f.id}
                friend={f}
                arenaData={arenaMap[f.id]}
                onClick={() => setSelectedFriend(f)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedFriend && arenaMap[selectedFriend.id] && (
        <FriendArenaModal
          friend={selectedFriend}
          data={arenaMap[selectedFriend.id]}
          onClose={() => setSelectedFriend(null)}
        />
      )}
    </>
  )
}
