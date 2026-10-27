"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, Calendar, TrendingUp, Loader2, Dumbbell, BarChart3 } from "lucide-react"
import { useApi } from "@/hooks/useApi"

interface AISuggestionsProps {
  onBack: () => void
  profile: any
}

export function AISuggestions({ onBack, profile }: AISuggestionsProps) {
  const api = useApi()
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'overall'>('today')
  const [suggestions, setSuggestions] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Cache for each tab type to avoid regenerating
  const cacheRef = useRef<{
    today?: any
    weekly?: any
    overall?: any
  }>({})

  useEffect(() => {
    // Check if we have cached data for this tab
    if (cacheRef.current[activeTab]) {
      setSuggestions(cacheRef.current[activeTab])
    } else {
      fetchSuggestions(activeTab)
    }
  }, [activeTab])

  const fetchSuggestions = async (type: 'today' | 'weekly' | 'overall') => {
    setIsLoading(true)
    try {
      const data = await api.call(`/api/workouts/ai-suggestions?type=${type}`)
      setSuggestions(data.suggestions)
      // Cache the response
      cacheRef.current[type] = data.suggestions
    } catch (error) {
      console.error("Failed to fetch AI suggestions", error)
      const errorSuggestions = { error: "Failed to load suggestions. Please try again." }
      setSuggestions(errorSuggestions)
      cacheRef.current[type] = errorSuggestions
    } finally {
      setIsLoading(false)
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center animate-pulse">
              <Sparkles className="w-10 h-10 text-violet-400" />
            </div>
            <Loader2 className="w-6 h-6 text-violet-400 absolute -bottom-1 -right-1 animate-spin" />
          </div>
          <p className="text-lg font-semibold text-foreground mt-6">Analyzing your training...</p>
          <p className="text-sm text-muted-foreground mt-2">FitQuest AI is preparing personalized insights</p>
        </div>
      )
    }

    if (suggestions?.error) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-violet-400" />
          </div>
          <p className="text-lg font-semibold text-foreground">{suggestions.error}</p>
        </div>
      )
    }

    if (!suggestions) return null

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Summary Card */}
        {suggestions.summary && (
          <div className="bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent rounded-2xl p-6 border border-violet-500/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{suggestions.summary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {suggestions.recommendations && suggestions.recommendations.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-400" />
              Recommendations
            </h3>
            <div className="space-y-3">
              {suggestions.recommendations.map((rec: string, index: number) => (
                <div 
                  key={index}
                  className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-4 hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-violet-400">{index + 1}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed flex-1">{rec}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workout Suggestions */}
        {suggestions.workoutSuggestions && suggestions.workoutSuggestions.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-violet-400" />
              Suggested Workouts
            </h3>
            <div className="space-y-4">
              {suggestions.workoutSuggestions.map((workout: any, index: number) => (
                <div 
                  key={index}
                  className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-5 hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-foreground">{workout.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{workout.description}</p>
                    </div>
                    {workout.type && (
                      <span className="px-2 py-1 bg-violet-500/20 text-violet-400 text-xs font-semibold rounded-full">
                        {workout.type}
                      </span>
                    )}
                  </div>
                  {workout.exercises && workout.exercises.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {workout.exercises.map((exercise: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400"></div>
                          <span className="text-muted-foreground">{exercise}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Insights */}
        {suggestions.stats && (
          <div className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-5">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-400" />
              Performance Insights
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {suggestions.stats.totalWorkouts !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{suggestions.stats.totalWorkouts}</div>
                  <div className="text-xs text-muted-foreground mt-1">Workouts</div>
                </div>
              )}
              {suggestions.stats.avgDuration !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{suggestions.stats.avgDuration}</div>
                  <div className="text-xs text-muted-foreground mt-1">Avg Duration</div>
                </div>
              )}
              {suggestions.stats.frequency !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{suggestions.stats.frequency}</div>
                  <div className="text-xs text-muted-foreground mt-1">Days/Week</div>
                </div>
              )}
              {suggestions.stats.consistency !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{suggestions.stats.consistency}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Consistency</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 ring-1 ring-border/30 overflow-hidden">
        <div className="p-8 border-b border-border bg-gradient-to-r from-violet-500/10 via-transparent to-purple-500/10">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="hover:bg-violet-500/10 hover:text-violet-400 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30">
              <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
              <span className="text-sm font-semibold text-violet-400">AI Powered</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-xl shadow-violet-500/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground font-inter tracking-tight">Training Insights</h2>
              <p className="text-base text-muted-foreground mt-1">AI-powered workout guidance from FitQuest AI</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex gap-2 p-1.5 bg-muted/40 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === 'today'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              Today's Plan
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === 'weekly'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              Weekly Summary
            </button>
            <button
              onClick={() => setActiveTab('overall')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === 'overall'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              Overall Analysis
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
