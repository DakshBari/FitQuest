"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Calendar, Clock, Info, Star, Search,
  ChevronLeft, ChevronRight, ChevronDown,
  Utensils, Loader2, Flame, Droplets, X,
} from "lucide-react"
import { mealsApi, hydrationApi } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { formatTime } from "@/lib/timeUtils"
import { cn } from "@/lib/utils"

interface MealHistoryProps {
  goals: { calories: number; protein: number; carbs: number; fats: number; water: number }
  onToggleFavorite: (id: string, currentState: boolean) => void
}

// ── Animated progress bar ──────────────────────────────────────────────────
function AnimBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 flex-1 rounded-full bg-muted/25 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(pct, 100)}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
      />
    </div>
  )
}

// ── Single meal row inside expanded day ───────────────────────────────────
function MealRow({ meal, onFavorite, onInfo }: { meal: any; onFavorite: () => void; onInfo: () => void }) {
  const qty = meal.quantity || meal.baseQuantity || 100
  const unit = meal.quantityType === "units" ? "pcs" : "g"
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-2xl hover:bg-muted/20 transition-colors group/row">
      {/* avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 flex items-center justify-center text-xs font-black text-violet-500 flex-shrink-0">
        {meal.name?.charAt(0) ?? "?"}
      </div>
      {/* name + time */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{meal.name || "Unnamed"}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <Clock className="w-2.5 h-2.5" />
            <span>{meal.date ? new Date(meal.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : meal.time || "—"}</span>
          </div>
          <span className="text-[10px] text-muted-foreground/50">{qty}{unit}</span>
          {meal.isFavorite && <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />}
        </div>
      </div>
      {/* macros */}
      <div className="hidden sm:flex items-center gap-3 text-[10px]">
        {[{ label: "P", val: meal.protein, color: "#ef4444" }, { label: "C", val: meal.carbs || meal.carbohydrates, color: "#06b6d4" }, { label: "F", val: meal.fats || meal.fat, color: "#f59e0b" }].map(m => (
          <div key={m.label} className="text-center">
            <p className="font-bold tabular-nums" style={{ color: m.color }}>{Math.round(m.val || 0)}g</p>
            <p className="text-muted-foreground/50">{m.label}</p>
          </div>
        ))}
      </div>
      {/* kcal */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-orange-500/10 border border-orange-500/15">
        <Flame className="w-2.5 h-2.5 text-orange-500" />
        <span className="text-[11px] font-black text-orange-500 tabular-nums">{meal.calories || 0}</span>
      </div>
      {/* actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
        <button onClick={onFavorite} className="p-1 rounded-lg text-muted-foreground/50 hover:text-amber-500 transition-colors">
          <Star className={cn("w-3.5 h-3.5", meal.isFavorite && "fill-amber-500 text-amber-500")} />
        </button>
        <button onClick={onInfo} className="p-1 rounded-lg text-muted-foreground/50 hover:text-foreground transition-colors">
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Individual All-Meals card with smooth grid-rows expand ─────────────────
function HistoryMealCard({
  meal, goals, onFavorite, onInfo,
}: {
  meal: any
  goals: { protein: number; carbs: number; fats: number }
  onFavorite: () => void
  onInfo: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const fmtDateShort = (d: string) => new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <Card
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "bg-card/70 backdrop-blur-xl border-border/50 rounded-3xl p-4 shadow-sm transition-[transform,box-shadow] duration-200",
        hovered && "-translate-y-0.5 shadow-md shadow-black/5"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 flex items-center justify-center text-sm font-black text-violet-500 flex-shrink-0 mt-0.5">
          {meal.name?.charAt(0) ?? "?"}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-foreground">{meal.name}</h3>
            {meal.isFavorite && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20">
                <Star className="w-2.5 h-2.5 fill-amber-500" /> Fav
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/60 px-1.5 py-0.5 rounded-lg bg-muted/30">
              {meal.quantity || meal.baseQuantity || 100}{meal.quantityType === "units" ? "pcs" : "g"}
            </span>
          </div>

          {/* Date + time */}
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground/60">
            <Calendar className="w-2.5 h-2.5" />
            <span>{fmtDateShort(meal.date)}</span>
            <span className="mx-0.5">·</span>
            <Clock className="w-2.5 h-2.5" />
            <span>{fmtTime(meal.date)}</span>
          </div>

          {/*
            CSS grid-rows trick: animates between grid-template-rows: 0fr and 1fr.
            This always expands to EXACTLY the content height — no jump, no lag.
            The inner div needs min-h-0 and overflow-hidden for the trick to work.
          */}
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: hovered ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden min-h-0">
              <div className="mt-2.5 space-y-1.5 pb-0.5">
                {[
                  { label: "P", val: meal.protein, max: goals.protein, color: "#ef4444" },
                  { label: "C", val: meal.carbs,   max: goals.carbs,   color: "#06b6d4" },
                  { label: "F", val: meal.fats,    max: goals.fats,    color: "#f59e0b" },
                ].map(m => (
                  <div key={m.label} className="flex items-center gap-2">
                    <span className="text-[9px] font-bold w-3" style={{ color: m.color }}>{m.label}</span>
                    <AnimBar pct={(m.val / (m.max || 1)) * 100} color={m.color} />
                    <span className="text-[9px] tabular-nums text-muted-foreground/60 w-8 text-right">{Math.round(m.val || 0)}g</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Calorie badge + actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/15">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-sm font-black text-orange-500 tabular-nums">{meal.calories}</span>
            <span className="text-[9px] text-orange-500/60">kcal</span>
          </div>
          <div
            className="flex items-center gap-1 transition-opacity duration-200"
            style={{ opacity: hovered ? 1 : 0 }}
          >
            <button onClick={onFavorite} className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors">
              <Star className={cn("w-3.5 h-3.5", meal.isFavorite && "fill-amber-500 text-amber-500")} />
            </button>
            <button onClick={onInfo} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function MealHistory({ goals, onToggleFavorite }: MealHistoryProps) {
  const api = useApi()
  const [allMeals, setAllMeals] = useState<any[]>([])
  const [dailyEntries, setDailyEntries] = useState<any[]>([])
  const [selectedMeal, setSelectedMeal] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"all" | "daily">("all")
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const mealsPerPage = 8

  const calcTotals = (meals: any[]) =>
    (meals || []).reduce((a, m) => ({
      calories: a.calories + (Number(m.calories) || 0),
      protein:  a.protein  + (Number(m.protein)  || 0),
      carbs:    a.carbs    + (Number(m.carbs) || Number(m.carbohydrates) || 0),
      fats:     a.fats     + (Number(m.fats)  || Number(m.fat) || 0),
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 })

  const fetchAll = async () => {
    setIsLoading(true)
    try { setAllMeals((await api.meals.getHistory(100, 1)).meals || []) }
    catch { setAllMeals([]) }
    finally { setIsLoading(false) }
  }

  const fetchDaily = async () => {
    setIsLoading(true)
    try {
      // Fetch daily entry summaries AND full history in parallel.
      // getDailyEntries gives us pre-computed totals/counts but NO meal arrays.
      // getHistory gives us every meal with its date, so we can group by date.
      const [entriesData, hydData, historyData] = await Promise.all([
        mealsApi.getDailyEntries().catch(() => ({ dailyEntries: [] })),
        hydrationApi.getWeekly().catch(() => ({ weeklyHydration: [] })),
        mealsApi.getHistory(500, 1).catch(() => ({ meals: [] })),
      ])

      const weeklyHydration: any[] = hydData.weeklyHydration || []
      const rawEntries: any[] = entriesData.dailyEntries || []
      const allHistoryMeals: any[] = historyData.meals || []

      // Group history meals by ISO date string (YYYY-MM-DD)
      const mealsByDate: Record<string, any[]> = {}
      allHistoryMeals.forEach((m: any) => {
        // meal.date could be an ISO timestamp or a date string
        const key = new Date(m.date).toISOString().split('T')[0]
        mealsByDate[key] = [...(mealsByDate[key] || []), m]
      })

      if (rawEntries.length > 0) {
        // Merge server summaries with actual meal arrays from history
        const entries = rawEntries.map((entry: any) => {
          const meals = mealsByDate[entry.date] || []
          const hyd = weeklyHydration.find((h: any) => h.date === entry.date)
          // Re-calculate totals from real meals when available, otherwise keep server totals
          const totals = meals.length > 0 ? calcTotals(meals) : null
          return {
            ...entry,
            meals,
            totalCalories: totals?.calories ?? entry.totalCalories ?? 0,
            totalProtein:  totals?.protein  ?? entry.totalProtein  ?? 0,
            totalCarbs:    totals?.carbs    ?? entry.totalCarbs    ?? 0,
            totalFats:     totals?.fats     ?? entry.totalFats     ?? 0,
            waterIntake: hyd?.amount || 0,
          }
        })
        setDailyEntries(entries)
        return
      }

      // No daily entries from server — build entirely from history
      if (Object.keys(mealsByDate).length > 0) {
        const entries = Object.entries(mealsByDate)
          .map(([date, ms]) => {
            const totals = calcTotals(ms)
            const hyd = weeklyHydration.find((h: any) => h.date === date)
            return {
              date,
              mealCount: ms.length,
              meals: ms,
              waterIntake: hyd?.amount || 0,
              totalCalories: totals.calories,
              totalProtein:  totals.protein,
              totalCarbs:    totals.carbs,
              totalFats:     totals.fats,
            }
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setDailyEntries(entries)
        return
      }

      setDailyEntries([])
    } catch (err) {
      console.error('fetchDaily failed:', err)
      setDailyEntries([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { activeTab === "all" ? fetchAll() : fetchDaily() }, [activeTab])

  const filtered = allMeals.filter(m => m.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  const totalPages = Math.ceil(filtered.length / mealsPerPage)
  const paginated = filtered.slice((currentPage - 1) * mealsPerPage, currentPage * mealsPerPage)

  const toggleDay = (date: string) => {
    const s = new Set(expandedDays)
    s.has(date) ? s.delete(date) : s.add(date)
    setExpandedDays(s)
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
  const fmtDateShort = (d: string) => new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Meal History</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Track your complete nutrition journey</p>
        </div>
        <span className="text-xs text-muted-foreground/60 tabular-nums">{allMeals.length} meals logged</span>
      </div>

      {/* ── Tab pills ── */}
      <div className="flex gap-2">
        {(["all", "daily"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
              activeTab === tab
                ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md shadow-violet-500/25"
                : "bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground hover:border-violet-500/30"
            )}
          >
            {tab === "all" ? <Utensils className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
            {tab === "all" ? "All Meals" : "By Day"}
          </button>
        ))}
      </div>

      {/* ── All Meals Tab ── */}
      {activeTab === "all" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Search meals…"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              className="pl-10 h-11 bg-card/70 border-border/50 rounded-2xl backdrop-blur-sm focus-visible:ring-violet-500/30 placeholder:text-muted-foreground/40"
            />
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm text-muted-foreground">Loading history…</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="p-4 rounded-3xl bg-muted/20">
                <Utensils className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">{searchQuery ? "No meals match your search" : "No meal history yet"}</p>
              <p className="text-xs text-muted-foreground/60">Start logging meals to see them here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginated.map((meal) => (
                <HistoryMealCard
                  key={meal._id}
                  meal={meal}
                  goals={goals}
                  onFavorite={() => onToggleFavorite(meal._id, meal.isFavorite)}
                  onInfo={() => setSelectedMeal(meal)}
                />
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-muted-foreground/60">Page {currentPage}/{totalPages} · {filtered.length} meals</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Daily Tab ── */}
      {activeTab === "daily" && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm text-muted-foreground">Loading daily entries…</p>
            </div>
          ) : dailyEntries.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="p-4 rounded-3xl bg-muted/20">
                <Calendar className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">No daily entries yet</p>
              <p className="text-xs text-muted-foreground/60">Log meals to see daily summaries</p>
            </div>
          ) : (
            dailyEntries.map(entry => {
              const isExp = expandedDays.has(entry.date)
              const calPct = Math.min(((entry.totalCalories || 0) / goals.calories) * 100, 100)
              const waterPct = Math.min(((entry.waterIntake || 0) / goals.water) * 100, 100)

              return (
                <Card key={entry.date} className="bg-card/70 backdrop-blur-xl border-border/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:shadow-black/5 transition-all duration-200">
                  {/* ── Header ── */}
                  <button
                    className="w-full p-4 flex items-center gap-4 hover:bg-muted/15 transition-colors text-left"
                    onClick={() => toggleDay(entry.date)}
                  >
                    {/* Date pill */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 flex flex-col items-center justify-center">
                      <span className="text-xs font-black text-violet-500 leading-none">
                        {new Date(entry.date).toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                      </span>
                      <span className="text-lg font-black text-violet-600 dark:text-violet-400 leading-none">
                        {new Date(entry.date).getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{fmtDate(entry.date)}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        {entry.mealCount || entry.meals?.length || 0} meals logged
                      </p>
                      {/* Calorie progress bar */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted/25 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${calPct}%`,
                              background: calPct >= 90 ? "linear-gradient(to right, #8b5cf6, #a855f7)" : "linear-gradient(to right, #f97316, #ea580c)",
                              boxShadow: calPct >= 90 ? "0 0 6px #8b5cf660" : "0 0 6px #f9731660",
                            }}
                          />
                        </div>
                        <span className="text-[10px] tabular-nums text-muted-foreground/60">{Math.round(calPct)}%</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-base font-black text-foreground tabular-nums">{entry.totalCalories || 0}</span>
                        <span className="text-[10px] text-muted-foreground">kcal</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px]">
                        <span className="text-red-400 tabular-nums">{Math.round(entry.totalProtein || 0)}g P</span>
                        <span className="text-cyan-400 tabular-nums">{Math.round(entry.totalCarbs || 0)}g C</span>
                        <span className="text-amber-400 tabular-nums">{Math.round(entry.totalFats || 0)}g F</span>
                      </div>
                    </div>

                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground/50 flex-shrink-0 transition-transform duration-300", isExp && "rotate-180")} />
                  </button>

                  {/* ── Expanded ── */}
                  {isExp && (
                    <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-3">
                      {/* Summary tiles */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "Calories", val: `${entry.totalCalories || 0}`, unit: "kcal", color: "#f97316" },
                          { label: "Protein",  val: `${Math.round(entry.totalProtein || 0)}`, unit: "g", color: "#ef4444" },
                          { label: "Carbs",    val: `${Math.round(entry.totalCarbs || 0)}`,   unit: "g", color: "#06b6d4" },
                          { label: "Fats",     val: `${Math.round(entry.totalFats || 0)}`,    unit: "g", color: "#f59e0b" },
                        ].map(t => (
                          <div key={t.label} className="flex flex-col items-center p-2.5 rounded-2xl border"
                            style={{ background: `${t.color}10`, borderColor: `${t.color}20` }}>
                            <p className="text-base font-black tabular-nums" style={{ color: t.color }}>{t.val}</p>
                            <p className="text-[9px] text-muted-foreground">{t.unit}</p>
                            <p className="text-[9px] text-muted-foreground/60">{t.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Water bar */}
                      {entry.waterIntake > 0 && (
                        <div className="flex items-center gap-2 px-1">
                          <Droplets className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <div className="flex-1 h-1.5 rounded-full bg-muted/25 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700" style={{ width: `${waterPct}%` }} />
                          </div>
                          <span className="text-[10px] text-cyan-400 tabular-nums">{entry.waterIntake}ml</span>
                        </div>
                      )}

                      {/* Meals */}
                      {entry.meals?.length > 0 ? (
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                            Meals ({entry.meals.length})
                          </p>
                          <div className="divide-y divide-border/30">
                            {entry.meals.map((meal: any, i: number) => (
                              <MealRow
                                key={meal._id || meal.id || i}
                                meal={meal}
                                onFavorite={() => onToggleFavorite(meal._id || meal.id, meal.isFavorite)}
                                onInfo={() => setSelectedMeal(meal)}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/50 text-center py-2">No individual meals found for this day</p>
                      )}
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMeal(null)}>
          <div className="bg-card border border-border/50 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b border-border/40 bg-gradient-to-r from-violet-500/8 to-transparent relative">
              <button onClick={() => setSelectedMeal(null)} className="absolute top-4 right-4 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50">
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-bold text-foreground pr-8">{selectedMeal.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedMeal.date && fmtDateShort(selectedMeal.date)} · {selectedMeal.date ? fmtTime(selectedMeal.date) : selectedMeal.time}
              </p>
              <div className="flex items-center gap-1.5 mt-3 w-fit px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-xl font-black text-orange-500 tabular-nums">{selectedMeal.calories}</span>
                <span className="text-xs text-orange-500/60">kcal</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Macros */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Macronutrients</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Protein", val: selectedMeal.protein,                       color: "#ef4444", bg: "#ef444415" },
                    { label: "Carbs",   val: selectedMeal.carbs || selectedMeal.carbohydrates, color: "#06b6d4", bg: "#06b6d415" },
                    { label: "Fats",    val: selectedMeal.fats  || selectedMeal.fat,          color: "#f59e0b", bg: "#f59e0b15" },
                  ].map(m => (
                    <div key={m.label} className="flex flex-col items-center p-3 rounded-2xl border"
                      style={{ background: m.bg, borderColor: `${m.color}25` }}>
                      <p className="text-xl font-black tabular-nums" style={{ color: m.color }}>{Math.round(m.val || 0)}g</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Micros */}
              {selectedMeal.micros && Object.keys(selectedMeal.micros).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Micronutrients</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(selectedMeal.micros).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-1.5 px-2 rounded-xl hover:bg-muted/30 transition-colors">
                        <span className="text-xs text-muted-foreground capitalize">{key}</span>
                        <span className="text-xs font-semibold text-foreground tabular-nums">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}