"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Target, Dumbbell, History, BarChart3 } from "lucide-react"
import { WorkoutForm } from "@/components/arena/WorkoutForm"
import { LearnGameMode } from "@/components/arena/LearnGameMode"
import { HistoryTab } from "@/components/arena/HistoryTab"
import { AnalyticsTab } from "@/components/arena/AnalyticsTab"
import { ProtectedLayout } from "@/components/layouts/ProtectedLayout"
import { getThemeClasses } from "@/lib/pageThemes"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { ThemedTabsTrigger } from "@/components/themed-tabs"

export default function ArenaPage() {
  // --- Mode State ---
  const [mode, setMode] = useState<'log' | 'learn'>('log') // Default: Workout Log (as requested)
  const [showLogSummary, setShowLogSummary] = useState(false)
  const pathname = usePathname()
  const themeClasses = getThemeClasses(pathname)

  const handleWorkoutSaved = () => {
    // Refresh data or show success message
    console.log("Workout saved successfully!")
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen flex flex-col bg-background">
        
        {/* Modern Header */}
        <PageHeader 
          icon={Dumbbell}
          title="The Arena"
          subtitle="Elite Training Ground"
          actions={
            <span className="px-4 py-2 bg-card backdrop-blur-xl border border-border/50 rounded-full text-xs text-muted-foreground font-mono shadow-lg">
              v2.0.1
            </span>
          }
        />

        {/* Main Content */}
        <div className="flex-1 px-6 pb-8">
          {/* Tabs */}
          <Tabs defaultValue="training" className="w-full">
            <TabsList className="bg-card/80 backdrop-blur-xl border border-border/50 p-1.5 rounded-2xl w-full md:w-auto shadow-2xl shadow-primary/5 mb-8">
              <ThemedTabsTrigger value="training" icon={Dumbbell}>
                Training
              </ThemedTabsTrigger>
              <ThemedTabsTrigger value="history" icon={History}>
                History
              </ThemedTabsTrigger>
              <ThemedTabsTrigger value="analytics" icon={BarChart3}>
                Analytics
              </ThemedTabsTrigger>
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
              <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 ring-1 ring-border/30">
                <div className="p-8 border-b border-border bg-gradient-to-r from-red-500/10 via-transparent to-orange-500/10 rounded-t-3xl">
                  <h2 className="text-2xl font-bold text-foreground font-inter tracking-tight">Training History</h2>
                  <p className="text-base text-muted-foreground mt-2">Track your workout journey</p>
                </div>
                <div className="p-8">
                  <HistoryTab />
                </div>
              </div>
            </TabsContent>

            {/* Analytics Tab Content */}
            <TabsContent value="analytics" className="mt-0">
              <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 ring-1 ring-border/30">
                <div className="p-8 border-b border-border bg-gradient-to-r from-red-500/10 via-transparent to-orange-500/10 rounded-t-3xl">
                  <h2 className="text-2xl font-bold text-foreground font-inter tracking-tight">Training Analytics</h2>
                  <p className="text-base text-muted-foreground mt-2">Performance insights and trends</p>
                </div>
                <div className="p-8">
                  <AnalyticsTab />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Enhanced Modal: Log Summary */}
        {showLogSummary && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card/95 backdrop-blur-xl border border-border p-8 rounded-3xl w-full max-w-2xl shadow-2xl shadow-primary/10 ring-1 ring-border/30">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-bold text-foreground font-inter tracking-tight">Historical Data</h2>
                      <button 
                        onClick={() => setShowLogSummary(false)} 
                        className="text-muted-foreground hover:text-foreground transition-colors duration-300 w-10 h-10 rounded-full hover:bg-muted/50 flex items-center justify-center"
                      >
                        ✕
                      </button>
                  </div>
                  <div className="text-center py-16">
                    <Target className="w-20 h-20 mx-auto mb-6 text-muted-foreground opacity-40" />
                    <p className="text-foreground font-semibold text-lg mb-2">This feature is coming soon.</p>
                    <p className="text-muted-foreground mt-3">We're working hard to bring you detailed analytics.</p>
                  </div>
              </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}