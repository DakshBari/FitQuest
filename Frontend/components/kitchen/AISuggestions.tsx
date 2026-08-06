"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft, Sparkles, TrendingUp, Utensils,
  ChevronRight, RefreshCw, AlertCircle
} from "lucide-react"
import { useApi } from "@/hooks/useApi"
import { cn } from "@/lib/utils"

interface AISuggestionsProps {
  onBack: () => void
  profile: any
  goals: any
  dailyStats: any
}

type TabType = "today" | "weekly" | "overall"

const TABS: { key: TabType; label: string; sub: string }[] = [
  { key: "today",   label: "Today",   sub: "Daily guidance"   },
  { key: "weekly",  label: "Weekly",  sub: "7-day summary"    },
  { key: "overall", label: "Overall", sub: "Full analysis"    },
]

export function AISuggestions({ onBack, profile, goals, dailyStats }: AISuggestionsProps) {
  const api = useApi()
  const [activeTab, setActiveTab]   = useState<TabType>("today")
  const [suggestions, setSuggestions] = useState<any>(null)
  const [isLoading, setIsLoading]   = useState(false)
  const cache = useRef<Partial<Record<TabType, any>>>({})

  useEffect(() => {
    if (cache.current[activeTab]) {
      setSuggestions(cache.current[activeTab])
    } else {
      fetchSuggestions(activeTab)
    }
  }, [activeTab])

  const fetchSuggestions = async (type: TabType) => {
    setIsLoading(true)
    setSuggestions(null)
    try {
      const data = await api.call(`/api/meals/ai-suggestions?type=${type}`)
      cache.current[type] = data.suggestions
      setSuggestions(data.suggestions)
    } catch {
      const err = { error: true }
      cache.current[type] = err
      setSuggestions(err)
    } finally {
      setIsLoading(false)
    }
  }

  const refresh = () => {
    delete cache.current[activeTab]
    fetchSuggestions(activeTab)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Kitchen
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/50 bg-card/60">
            <Sparkles className="w-3 h-3 text-violet-500" />
            <span className="text-[11px] font-semibold text-muted-foreground">AI Powered</span>
          </div>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-2 rounded-lg border border-border/50 bg-card/60 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ── Page title ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Personalized Insights</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          AI-generated nutrition analysis based on your logged data
        </p>
      </div>

      {/* ── Tab strip ───────────────────────────────────────────── */}
      <div className="flex border-b border-border/40">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex flex-col items-start px-5 py-3 text-left transition-all duration-150 border-b-2 -mb-px",
              activeTab === tab.key
                ? "border-violet-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <span className="text-sm font-semibold">{tab.label}</span>
            <span className="text-[10px] text-muted-foreground/60 mt-0.5">{tab.sub}</span>
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="min-h-[400px]">

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-border/30" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-violet-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Analyzing your nutrition data</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">This may take a moment…</p>
            </div>
          </div>
        )}

        {/* Error */}
        {!isLoading && suggestions?.error && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertCircle className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Failed to load insights</p>
            <button onClick={refresh}
              className="text-xs text-violet-500 hover:text-violet-400 font-medium transition-colors">
              Try again
            </button>
          </div>
        )}

        {/* Data */}
        {!isLoading && suggestions && !suggestions.error && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">

            {/* Summary */}
            {suggestions.summary && (
              <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-violet-500/10 flex-shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Summary</p>
                    <p className="text-sm text-foreground leading-relaxed">{suggestions.summary}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {suggestions.recommendations?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Recommendations</h3>
                </div>
                <div className="space-y-2">
                  {suggestions.recommendations.map((rec: string, i: number) => (
                    <div key={i}
                      className="flex items-start gap-3 p-4 rounded-xl border border-border/40 bg-card/50 hover:border-border/60 hover:bg-card/70 transition-all duration-150 group"
                    >
                      <div className="w-5 h-5 rounded-md bg-muted/30 border border-border/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed flex-1">{rec}</p>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0 mt-0.5 group-hover:text-muted-foreground/60 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meal Suggestions */}
            {suggestions.mealSuggestions?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Utensils className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Suggested Meals</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.mealSuggestions.map((meal: any, i: number) => (
                    <div key={i}
                      className="p-4 rounded-xl border border-border/40 bg-card/50 hover:border-border/60 hover:bg-card/70 transition-all duration-150"
                    >
                      {/* Meal name + desc */}
                      <p className="text-sm font-semibold text-foreground">{meal.name}</p>
                      {meal.description && (
                        <p className="text-[11px] text-muted-foreground/70 mt-1 leading-snug line-clamp-2">
                          {meal.description}
                        </p>
                      )}

                      {/* Macro pills */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {[
                          { label: "Cal",  val: meal.calories, unit: "",  color: "#f97316" },
                          { label: "Pro",  val: meal.protein,  unit: "g", color: "#ef4444" },
                          { label: "Carb", val: meal.carbs,    unit: "g", color: "#3b82f6" },
                          { label: "Fat",  val: meal.fats,     unit: "g", color: "#f59e0b" },
                        ].map(m => (
                          <div key={m.label}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md border"
                            style={{ background: `${m.color}0a`, borderColor: `${m.color}20` }}
                          >
                            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide">{m.label}</span>
                            <span className="text-[11px] font-bold tabular-nums" style={{ color: m.color }}>
                              {m.val}{m.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
