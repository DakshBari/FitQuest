"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Star, Trash2, Copy, Edit2, X, Check, Info, Clock, Flame, ChevronDown } from "lucide-react"
import { GoalType } from "./GoalSettings"
import { formatTime } from "@/lib/timeUtils"
import { cn } from "@/lib/utils"

interface Meal {
  id: number | string
  name: string
  time: string
  calories: number
  protein: number
  carbs: number
  fats: number
  micros: {
    fiber: number
    sugar: number
    sodium: number
    cholesterol: number
    vitA: number
    vitC: number
    iron: number
    calcium: number
  }
  isFavorite: boolean
  baseQuantity: number
  quantity?: number
  quantityType?: "weight" | "units"
}

interface MealCardProps {
  meal: Meal
  onFavorite: () => void
  onDelete: () => void
  onDuplicate: () => void
  isEditing: boolean
  onEditStart: () => void
  onEditSave: (id: string, multiplier: number) => void
  onEditCancel: () => void
  editQuantity: number[]
  onQuantityChange: (val: number[]) => void
  onLiveEdit?: (id: string, multiplier: number) => void
  goal: GoalType
  isReadOnly?: boolean
}

// Thin macro progress bar
function MacroBar({ val, max, color }: { val: number; max: number; color: string }) {
  const pct = Math.min((val / (max || 1)) * 100, 100)
  return (
    <div className="h-1 w-full rounded-full bg-muted/30 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 4px ${color}70` }}
      />
    </div>
  )
}

export function MealCard({
  meal, onFavorite, onDelete, onDuplicate,
  isEditing, onEditStart, onEditSave, onEditCancel,
  editQuantity, onQuantityChange, onLiveEdit, goal,
  isReadOnly = false,
}: MealCardProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const mult = editQuantity[0] || 1
  const adjProtein = isEditing ? Math.round(meal.protein * mult) : meal.protein
  const adjCarbs   = isEditing ? Math.round(meal.carbs   * mult) : meal.carbs
  const adjFats    = isEditing ? Math.round(meal.fats    * mult) : meal.fats
  const adjCals    = isEditing ? Math.round(meal.calories * mult) : meal.calories
  const currentGrams = isEditing
    ? Math.round(meal.baseQuantity * mult)
    : (meal.quantity || meal.baseQuantity)
  const unit = meal.quantityType === "units" ? "pcs" : "g"

  const handleSlider = (val: number[]) => {
    onQuantityChange(val)
    onLiveEdit?.(meal.id as string, val[0] || 1)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setTimeout(() => onDelete(), 300)
  }

  // Macro target estimates (rough per-meal approximation for progress bars)
  const protMax = 50
  const carbMax = 70
  const fatMax  = 25

  return (
    <>
      <div
        className={cn(
          "group relative flex flex-col border-b border-border/50 transition-all duration-300",
          "hover:bg-violet-500/3 dark:hover:bg-violet-500/4",
          isDeleting && "opacity-0 -translate-x-4 scale-95",
          isEditing && "bg-violet-500/5 dark:bg-violet-500/6"
        )}
      >
        {/* ── Main row ── */}
        <div className="flex items-center gap-3 px-4 py-3">

          {/* Left accent bar (shows on hover/edit) */}
          <div className={cn(
            "absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-all duration-300",
            isEditing ? "bg-violet-500 opacity-100" : "bg-violet-500/0 group-hover:bg-violet-500/60 group-hover:opacity-100"
          )} />

          {/* ── Meal info ── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "text-sm font-semibold text-foreground truncate transition-colors duration-200",
                "group-hover:text-violet-600 dark:group-hover:text-violet-400"
              )}>
                {meal.name}
              </h3>
              {!isEditing && (
                <button
                  onClick={(e) => { e.stopPropagation(); onFavorite() }}
                  className="flex-shrink-0 text-muted-foreground/40 hover:text-amber-500 transition-colors duration-150"
                >
                  <Star className={cn("w-3.5 h-3.5", meal.isFavorite && "fill-amber-500 text-amber-500")} />
                </button>
              )}
            </div>

            {/* Time + quantity */}
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                <span>{formatTime(meal.time)}</span>
              </div>
              <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                {currentGrams}{unit}
              </span>
            </div>
          </div>

          {/* ── Macros ── */}
          <div className="hidden sm:flex items-center gap-4 text-xs flex-shrink-0">
            {[
              { label: "P", val: adjProtein, color: "#ef4444" },
              { label: "C", val: adjCarbs,   color: "#06b6d4" },
              { label: "F", val: adjFats,    color: "#f59e0b" },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <p className="font-bold tabular-nums leading-none" style={{ color: m.color }}>{m.val}g</p>
                <p className="text-[9px] text-muted-foreground/50 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          {/* ── Calorie badge ── */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/15 flex-shrink-0">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-sm font-black text-orange-500 tabular-nums leading-none">{adjCals}</span>
            <span className="text-[9px] text-orange-500/60">kcal</span>
          </div>

          {/* ── Action buttons ── */}
          <div className={cn(
            "flex items-center gap-0.5 flex-shrink-0",
            !isEditing && "opacity-0 group-hover:opacity-100 transition-all duration-200"
          )}>
            {!isEditing ? (
              !isReadOnly ? (
                <>
                  <button
                    onClick={() => onEditStart()}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Edit portion"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onDuplicate}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsInfoOpen(true)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Nutrition details"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button onClick={onFavorite} className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors">
                  <Star className={cn("w-3.5 h-3.5", meal.isFavorite && "fill-amber-500")} />
                </button>
              )
            ) : (
              <div className="flex items-center gap-1 opacity-100">
                <button onClick={onFavorite} className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors">
                  <Star className={cn("w-3 h-3", meal.isFavorite && "fill-amber-500")} />
                </button>
                <button onClick={onEditCancel} className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                  <X className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onEditSave(meal.id as string, mult)}
                  className="p-1.5 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors shadow-md shadow-violet-500/25"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Macro mini-bars (always visible) ── */}
        <div className="flex gap-1.5 px-4 pb-2.5 sm:hidden">
          {[
            { val: adjProtein, max: protMax, color: "#ef4444", label: "P" },
            { val: adjCarbs,   max: carbMax, color: "#06b6d4", label: "C" },
            { val: adjFats,    max: fatMax,  color: "#f59e0b", label: "F" },
          ].map((m) => (
            <div key={m.label} className="flex-1">
              <MacroBar val={m.val} max={m.max} color={m.color} />
            </div>
          ))}
        </div>

        {/* ── Edit slider ── */}
        {isEditing && (
          <div className="mx-4 mb-3 pt-3 border-t border-violet-500/15 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider w-12 flex-shrink-0">Portion</span>
              <Slider
                min={0.5} max={3} step={0.1}
                value={editQuantity}
                onValueChange={handleSlider}
                className="flex-1"
              />
              <div className="text-right flex-shrink-0 w-20">
                <p className="text-xs font-bold text-violet-500 tabular-nums">{mult.toFixed(1)}×</p>
                <p className="text-[10px] text-muted-foreground tabular-nums">{currentGrams}{unit}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Info modal ── */}
      {isInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsInfoOpen(false)}>
          <div
            className="bg-card border border-border/50 w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-border/50 bg-gradient-to-r from-violet-500/8 to-transparent">
              <button onClick={() => setIsInfoOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-bold text-foreground pr-8">{meal.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{formatTime(meal.time)} · {currentGrams}{unit}</p>

              {/* Calorie badge */}
              <div className="flex items-center gap-1.5 mt-3 w-fit px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-xl font-black text-orange-500 tabular-nums">{adjCals}</span>
                <span className="text-sm text-orange-500/70">kcal</span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Macros */}
              <div>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Macronutrients</h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Protein", val: adjProtein, color: "#ef4444", bg: "#ef444415" },
                    { label: "Carbs",   val: adjCarbs,   color: "#06b6d4", bg: "#06b6d415" },
                    { label: "Fats",    val: adjFats,    color: "#f59e0b", bg: "#f59e0b15" },
                  ].map((m) => (
                    <div key={m.label} className="flex flex-col items-center p-3 rounded-2xl border"
                      style={{ background: m.bg, borderColor: `${m.color}25` }}>
                      <p className="text-2xl font-black tabular-nums" style={{ color: m.color }}>{m.val}g</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Micros */}
              {meal.micros && (
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Micronutrients</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Fiber",       val: meal.micros.fiber,       unit: "g",  mult, decimals: 1 },
                      { label: "Sugar",       val: meal.micros.sugar,       unit: "g",  mult, decimals: 1 },
                      { label: "Sodium",      val: meal.micros.sodium,      unit: "mg", mult, decimals: 0 },
                      { label: "Cholesterol", val: meal.micros.cholesterol, unit: "mg", mult, decimals: 0 },
                      { label: "Iron",        val: meal.micros.iron,        unit: "mg", mult, decimals: 1 },
                      { label: "Calcium",     val: meal.micros.calcium,     unit: "mg", mult, decimals: 0 },
                      { label: "Vitamin A",   val: meal.micros.vitA,        unit: "%",  mult, decimals: 0 },
                      { label: "Vitamin C",   val: meal.micros.vitC,        unit: "%",  mult, decimals: 0 },
                    ].map((micro) => (
                      <div key={micro.label} className="flex justify-between items-center py-1.5 px-2 rounded-xl hover:bg-muted/30 transition-colors">
                        <span className="text-xs text-muted-foreground">{micro.label}</span>
                        <span className="text-xs font-semibold text-foreground tabular-nums">
                          {(micro.val * mult).toFixed(micro.decimals)}{micro.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}