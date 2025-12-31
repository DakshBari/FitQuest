"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Target, Dumbbell, History, BarChart3 } from "lucide-react"
import { WorkoutForm } from "@/components/arena/WorkoutForm"
import { LearnGameMode } from "@/components/arena/LearnGameMode"
import { HistoryTab } from "@/components/arena/HistoryTab"
import { AnalyticsTab } from "@/components/arena/AnalyticsTab"
import { ProtectedLayout } from "@/components/layouts/ProtectedLayout"

export default function ArenaPage() {
  // --- Mode State ---
  const [mode, setMode] = useState<'log' | 'learn'>('log') // Default: Workout Log (as requested)
  const [showLogSummary, setShowLogSummary] = useState(false)

  const handleWorkoutSaved = () => {
    // Refresh data or show success message
    console.log("Workout saved successfully!")
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen flex flex-col bg-background">
        
        {/* Modern Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/25 dark:shadow-red-500/10">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-background animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-red-500 to-orange-500 bg-clip-text text-transparent font-inter tracking-tight">
                  The Arena
                </h1>
                <p className="text-muted-foreground font-medium">Elite Training Ground</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-card/80 backdrop-blur-xl border border-border/50 rounded-full text-xs text-muted-foreground font-mono shadow-sm">
                v2.0.1
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 pb-6">
          {/* Tabs */}
          <Tabs defaultValue="training" className="w-full">
            <TabsList className="bg-card/80 backdrop-blur-xl border border-border/50 p-1 rounded-2xl w-full md:w-auto shadow-lg shadow-primary/5 mb-6">
              <TabsTrigger value="training" className="gap-2 rounded-xl font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/25">
                <Dumbbell className="w-4 h-4" />
                Training
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 rounded-xl font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/25">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2 rounded-xl font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/25">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Training Tab Content */}
            <TabsContent value="training" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* --- MODE 1: WORKOUT LOG --- */}
                {mode === 'log' && (
                  <div className="lg:col-span-12">
                     <WorkoutForm 
                        onSave={handleWorkoutSaved}
                        onSwitchMode={() => setMode('learn')}
                     />
                  </div>
                )}

                {/* --- MODE 2: LEARN / GAME --- */}
                {mode === 'learn' && (
                  <div className="lg:col-span-12">
                     <LearnGameMode onSwitchMode={() => setMode('log')} />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* History Tab Content */}
            <TabsContent value="history" className="mt-0">
              <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5">
                <div className="p-6 border-b border-border bg-gradient-to-r from-red-500/10 via-transparent to-orange-500/10">
                  <h2 className="text-xl font-bold text-foreground font-inter">Training History</h2>
                  <p className="text-sm text-muted-foreground mt-1">Track your workout journey</p>
                </div>
                <div className="p-6">
                  <HistoryTab />
                </div>
              </div>
            </TabsContent>

            {/* Analytics Tab Content */}
            <TabsContent value="analytics" className="mt-0">
              <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5">
                <div className="p-6 border-b border-border bg-gradient-to-r from-red-500/10 via-transparent to-orange-500/10">
                  <h2 className="text-xl font-bold text-foreground font-inter">Training Analytics</h2>
                  <p className="text-sm text-muted-foreground mt-1">Performance insights and trends</p>
                </div>
                <div className="p-6">
                  <AnalyticsTab />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Enhanced Modal: Log Summary */}
        {showLogSummary && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card/95 backdrop-blur-xl border border-border p-6 rounded-3xl w-full max-w-2xl shadow-2xl shadow-primary/10">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-foreground font-inter">Historical Data</h2>
                      <button 
                        onClick={() => setShowLogSummary(false)} 
                        className="text-muted-foreground hover:text-foreground transition-colors duration-200 w-8 h-8 rounded-full hover:bg-muted/50 flex items-center justify-center"
                      >
                        ✕
                      </button>
                  </div>
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                    <p className="text-muted-foreground font-medium">This feature is coming soon.</p>
                    <p className="text-sm text-muted-foreground/70 mt-2">We're working hard to bring you detailed analytics.</p>
                  </div>
              </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}