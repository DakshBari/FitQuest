"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Camera, Star, Clock, Plus, Flame, Zap } from "lucide-react"
import { formatTime } from "@/lib/timeUtils"
import { cn } from "@/lib/utils"

interface Meal {
  _id?: string
  id?: string | number
  name: string
  calories: number
  time?: string
  isFavorite: boolean
  protein?: number
  carbs?: number
  fats?: number
  baseQuantity?: number
  quantity?: number
  quantityType?: "weight" | "units"
  micros?: any
}

interface FoodSearchProps {
  searchQuery: string
  setSearchQuery: (q: string) => void
  favorites: Meal[]
  onAddMeal?: (meal: any) => void
  onToggleFavorite?: (id: string, currentStatus: boolean) => void
}

// Mini macro pill
function MacroPill({ val, label, color }: { val?: number; label: string; color: string }) {
  if (!val) return null
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: `${color}18`, color }}>
      {Math.round(val)}g {label}
    </span>
  )
}

export function FoodSearch({ searchQuery, setSearchQuery, favorites, onAddMeal, onToggleFavorite }: FoodSearchProps) {
  const [addingId, setAddingId] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  const handleAdd = async (fav: Meal) => {
    const id = String(fav._id || fav.id)
    setAddingId(id)
    await onAddMeal?.(fav)
    setTimeout(() => setAddingId(null), 800)
  }

  return (
    <Card className="bg-card/70 backdrop-blur-xl border-border/50 rounded-3xl p-5 shadow-lg shadow-black/5 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300">
      {/* Background accent */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* ── Search bar ── */}
      <div className={cn(
        "relative flex items-center rounded-2xl border transition-all duration-300",
        isFocused
          ? "border-violet-500/50 shadow-md shadow-violet-500/10 bg-card"
          : "border-border/50 bg-muted/20"
      )}>
        <Search className={cn(
          "absolute left-3.5 h-4 w-4 transition-colors duration-200",
          isFocused ? "text-violet-500" : "text-muted-foreground/50"
        )} />
        <Input
          type="text"
          placeholder="Search food database…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="pl-10 pr-10 bg-transparent border-0 h-11 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
        />
        <button className={cn(
          "absolute right-2 p-1.5 rounded-xl transition-all duration-200",
          "text-muted-foreground/50 hover:text-violet-500 hover:bg-violet-500/10"
        )}>
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* ── Favorites ── */}
      {favorites.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Star className="w-3 h-3 fill-amber-500/30 text-amber-500" />
              Favorites
            </h4>
            <span className="text-[10px] text-muted-foreground/60 tabular-nums">{favorites.length} saved</span>
          </div>

          <div className="space-y-1.5">
            {favorites.slice(0, 6).map((fav) => {
              const id = String(fav._id || fav.id)
              const isAdding = addingId === id
              const initial = fav.name.charAt(0).toUpperCase()

              return (
                <div key={id}
                  className={cn(
                    "group/item flex items-center gap-3 p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer",
                    "border-border/30 hover:border-violet-500/30 hover:bg-violet-500/5",
                    isAdding && "border-violet-500/50 bg-violet-500/8 scale-[0.99]"
                  )}
                  onClick={() => handleAdd(fav)}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 transition-all duration-200",
                    "bg-gradient-to-br from-violet-500/20 to-indigo-500/10 text-violet-600 dark:text-violet-400",
                    "group-hover/item:from-violet-500/30 group-hover/item:to-indigo-500/20"
                  )}>
                    {isAdding ? (
                      <Plus className="w-4 h-4 animate-spin" style={{ animationDuration: "0.4s" }} />
                    ) : (
                      initial
                    )}
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate group-hover/item:text-violet-600 dark:group-hover/item:text-violet-400 transition-colors">
                      {fav.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                        <span>{fav.time ? formatTime(fav.time) : "Recently added"}</span>
                      </div>
                      <MacroPill val={fav.protein} label="P" color="#ef4444" />
                      <MacroPill val={fav.carbs} label="C" color="#06b6d4" />
                      <MacroPill val={fav.fats} label="F" color="#f59e0b" />
                    </div>
                  </div>

                  {/* Calorie badge + star */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-orange-500/10 border border-orange-500/15">
                      <Flame className="w-2.5 h-2.5 text-orange-500" />
                      <span className="text-[10px] font-bold text-orange-500 tabular-nums">{fav.calories}</span>
                    </div>
                    <button
                      className="p-1 rounded-lg text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      onClick={(e) => { e.stopPropagation(); if (onToggleFavorite) onToggleFavorite(id, fav.isFavorite) }}
                      title="Remove from favorites"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {favorites.length > 6 && (
            <p className="text-center text-[11px] text-muted-foreground/60 mt-2 cursor-pointer hover:text-violet-500 transition-colors">
              +{favorites.length - 6} more favorites
            </p>
          )}
        </div>
      )}

      {/* Empty state when no favorites yet */}
      {favorites.length === 0 && (
        <div className="mt-4 flex flex-col items-center gap-2 py-6 text-center">
          <div className="p-3 rounded-2xl bg-muted/30">
            <Star className="w-6 h-6 text-muted-foreground/30" />
          </div>
          <p className="text-xs text-muted-foreground/60">Star a meal to save it as a favorite</p>
        </div>
      )}
    </Card>
  )
}