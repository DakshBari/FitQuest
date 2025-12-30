"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Calendar, TrendingUp, Star } from "lucide-react"
import { formatTime } from "@/lib/timeUtils"

interface DayData {
  date: string
  dayName: string
  meals: any[]
  totals: {
    calories: number
    protein: number
    carbs: number
    fats: number
  }
  isToday: boolean
}

interface WeeklyMealCardProps {
  weeklyMeals: DayData[]
  weeklyTotals: {
    calories: number
    protein: number
    carbs: number
    fats: number
  }
  weeklyGoals: {
    calories: number
    protein: number
    carbs: number
    fats: number
  }
}

export function WeeklyMealCard({ weeklyMeals, weeklyTotals, weeklyGoals }: WeeklyMealCardProps) {
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({})

  const toggleDay = (date: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }))
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <>
      {/* Weekly Summary */}
      <div className="p-4 border-b border-border/50 bg-muted/10">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-foreground font-mono">{weeklyTotals.calories}</div>
            <div className="text-xs text-muted-foreground">Calories</div>
            <div className="text-xs text-primary">{Math.round((weeklyTotals.calories / weeklyGoals.calories) * 100)}%</div>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground font-mono">{Math.round(weeklyTotals.protein)}g</div>
            <div className="text-xs text-muted-foreground">Protein</div>
            <div className="text-xs text-primary">{Math.round((weeklyTotals.protein / weeklyGoals.protein) * 100)}%</div>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground font-mono">{Math.round(weeklyTotals.carbs)}g</div>
            <div className="text-xs text-muted-foreground">Carbs</div>
            <div className="text-xs text-primary">{Math.round((weeklyTotals.carbs / weeklyGoals.carbs) * 100)}%</div>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground font-mono">{Math.round(weeklyTotals.fats)}g</div>
            <div className="text-xs text-muted-foreground">Fats</div>
            <div className="text-xs text-primary">{Math.round((weeklyTotals.fats / weeklyGoals.fats) * 100)}%</div>
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="flex-1">
        {weeklyMeals.map((day) => (
          <div key={day.date} className="border-b border-border/30 last:border-b-0">
            <button
              onClick={() => toggleDay(day.date)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {expandedDays[day.date] ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{day.dayName}</span>
                    <span className="text-sm text-muted-foreground">{formatDate(day.date)}</span>
                    {day.isToday && (
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">Today</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {day.meals.length} meal{day.meals.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <div className="font-mono font-medium text-foreground">{day.totals.calories} kcal</div>
                  <div className="text-xs text-muted-foreground">
                    P: {Math.round(day.totals.protein)}g • C: {Math.round(day.totals.carbs)}g • F: {Math.round(day.totals.fats)}g
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded Day Content */}
            {expandedDays[day.date] && (
              <div className="border-t border-border/30 bg-muted/5">
                {day.meals.length > 0 ? (
                  day.meals.map((meal) => (
                    <div key={meal._id} className="border-b border-border/20 last:border-b-0">
                      <div className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {meal.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground text-sm">{meal.name}</span>
                              {meal.isFavorite && (
                                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{formatTime(meal.time)}</div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <span className="block text-lg font-bold text-foreground tracking-tight font-mono">{meal.calories}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">kcal</span>
                        </div>
                        
                        <div className="flex gap-3 text-xs font-mono text-muted-foreground ml-4">
                          <div className="text-center">
                            <span className="font-medium text-foreground">{Math.round(meal.protein)}g</span>
                            <div className="text-[10px] uppercase opacity-70">P</div>
                          </div>
                          <div className="text-center">
                            <span className="font-medium text-foreground">{Math.round(meal.carbs)}g</span>
                            <div className="text-[10px] uppercase opacity-70">C</div>
                          </div>
                          <div className="text-center">
                            <span className="font-medium text-foreground">{Math.round(meal.fats)}g</span>
                            <div className="text-[10px] uppercase opacity-70">F</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">No meals logged for this day</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}