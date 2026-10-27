"use client"

import { useState, useEffect, useCallback } from "react"
import { ChefHat, X, Utensils, Loader2, Flame, Beef, Wheat, Droplets } from "lucide-react"
import { cn } from "@/lib/utils"

import { getApiUrl } from "@/lib/config"

const API_URL = getApiUrl()

interface FriendMeal {
  _id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
  time?: string
  mealType?: string
}

interface FriendKitchenData {
  mealCount: number
  meals: FriendMeal[]
  totals: { calories: number; protein: number; carbs: number; fats: number }
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

// ─── Macro pill ───────────────────────────────────────────
function MacroPill({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl bg-muted/20">
      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">{label}</span>
      <span className="text-xs font-black tabular-nums" style={{ color }}>
        {Math.round(value)}<span className="text-[9px] font-medium ml-0.5 text-muted-foreground/60">{unit}</span>
      </span>
    </div>
  )
}

// ─── Meal row in the modal ────────────────────────────────
function MealRow({ meal }: { meal: FriendMeal }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{meal.name}</p>
        {meal.mealType && (
          <p className="text-[10px] text-muted-foreground/60 capitalize mt-0.5">{meal.mealType} · {meal.time || ""}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <span className="text-xs font-bold text-amber-500">{meal.calories} kcal</span>
        <div className="flex gap-1.5 text-[10px] text-muted-foreground/70">
          <span className="font-medium text-blue-400">{Math.round(meal.protein)}P</span>
          <span>·</span>
          <span className="font-medium text-green-400">{Math.round(meal.carbs)}C</span>
          <span>·</span>
          <span className="font-medium text-orange-400">{Math.round(meal.fats)}F</span>
        </div>
      </div>
    </div>
  )
}

// ─── Friend Kitchen Modal ─────────────────────────────────
function FriendKitchenModal({
  friend,
  data,
  onClose,
}: {
  friend: Friend
  data: FriendKitchenData
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl border border-border/50 bg-card overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <span className="text-sm font-black text-green-500">{friend.avatar.substring(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{friend.name}'s Kitchen</p>
              <p className="text-[10px] text-muted-foreground/60">Today · {data.mealCount} meals logged · View only</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Macro summary strip */}
        <div className="flex-shrink-0 px-5 py-3 border-b border-border/30">
          <div className="grid grid-cols-4 gap-2">
            <MacroPill label="Calories" value={data.totals.calories} unit="kcal" color="#f59e0b" />
            <MacroPill label="Protein"  value={data.totals.protein}  unit="g"    color="#3b82f6" />
            <MacroPill label="Carbs"    value={data.totals.carbs}    unit="g"    color="#10b981" />
            <MacroPill label="Fats"     value={data.totals.fats}     unit="g"    color="#f97316" />
          </div>
        </div>

        {/* Meal list */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-2">
          {data.meals.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-center">
              <Utensils className="w-8 h-8 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground/50">No meals logged yet today</p>
            </div>
          ) : (
            data.meals.map(m => <MealRow key={m._id} meal={m} />)
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-border/30">
          <p className="text-[9px] text-muted-foreground/35 text-center">
            Read-only view · {friend.name}'s data is private beyond today's log
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Single friend kitchen row (in card) ─────────────────
function FriendKitchenRow({
  friend,
  kitchenData,
  onClick,
}: {
  friend: Friend
  kitchenData: FriendKitchenData
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl border border-border/30 hover:border-green-500/30 hover:bg-green-500/5 transition-all duration-150 group"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <span className="text-[10px] font-black text-green-500">{friend.avatar.substring(0, 2).toUpperCase()}</span>
          </div>
          {friend.online && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-card" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{friend.name}</p>
          <p className="text-[9px] text-green-500 font-medium">{kitchenData.mealCount} meal{kitchenData.mealCount !== 1 ? "s" : ""} today</p>
        </div>
        <Flame className="w-3 h-3 text-amber-500 opacity-60 group-hover:opacity-100 transition-opacity" />
      </div>
      {/* Compact macro row */}
      <div className="flex gap-1.5 text-[9px] font-bold">
        <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500">{Math.round(kitchenData.totals.calories)} kcal</span>
        <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500">{Math.round(kitchenData.totals.protein)}g P</span>
        <span className="px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-500">{Math.round(kitchenData.totals.carbs)}g C</span>
        <span className="px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-500">{Math.round(kitchenData.totals.fats)}g F</span>
      </div>
    </button>
  )
}

// ─── Main component ───────────────────────────────────────
export function FriendKitchenCard({ friends }: { friends: Friend[] }) {
  const [kitchenMap, setKitchenMap]     = useState<Record<string, FriendKitchenData>>({})
  const [loading, setLoading]           = useState(true)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)

  const fetchFriendKitchens = useCallback(async () => {
    if (friends.length === 0) { setLoading(false); return }
    setLoading(true)
    const results: Record<string, FriendKitchenData> = {}
    await Promise.all(
      friends.map(async f => {
        try {
          const res = await fetch(`${API_URL}/api/meals/friend/${f.id}/today`, {
            headers: getHeaders(),
          })
          if (!res.ok) return
          const data = await res.json()
          if (data.status === "success" && data.mealCount > 0) {
            results[f.id] = data
          }
        } catch {}
      })
    )
    setKitchenMap(results)
    setLoading(false)
  }, [friends])

  useEffect(() => { fetchFriendKitchens() }, [fetchFriendKitchens])

  // Friends who actually logged a meal today
  const activeFriends = friends.filter(f => kitchenMap[f.id])

  return (
    <>
      <div className="rounded-2xl border border-border/40 bg-card/70 p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Friends Activity</p>
            <h3 className="text-sm font-bold text-foreground">Kitchen</h3>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
          </div>
        ) : activeFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <Utensils className="w-6 h-6 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/50">No friends have logged meals today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeFriends.map(f => (
              <FriendKitchenRow
                key={f.id}
                friend={f}
                kitchenData={kitchenMap[f.id]}
                onClick={() => setSelectedFriend(f)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedFriend && kitchenMap[selectedFriend.id] && (
        <FriendKitchenModal
          friend={selectedFriend}
          data={kitchenMap[selectedFriend.id]}
          onClose={() => setSelectedFriend(null)}
        />
      )}
    </>
  )
}
