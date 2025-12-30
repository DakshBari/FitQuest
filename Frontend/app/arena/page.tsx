"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Target, Dumbbell, History, BarChart3 } from "lucide-react"
import { WorkoutForm } from "@/components/arena/WorkoutForm"
import { AICameraView } from "@/components/arena/AICameraView"
import { CoachingPanel } from "@/components/arena/CoachingPanel"
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
      {/* Main Background: #F7F5FF (Light) | #171717 (Dark) */}
      <div className="min-h-screen bg-[#F7F5FF] dark:bg-[#171717] text-foreground p-4 md:p-6 space-y-6 transition-colors duration-300">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-3">
             <h1 className="text-3xl font-bold text-black dark:text-white font-orbitron tracking-wider">
               ARENA
             </h1>
             <span className="px-3 py-1 bg-black/5 dark:bg-white/10 rounded-full text-xs text-gray-500 dark:text-gray-400 font-mono">
               v2.0.1
             </span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="training" className="w-full">
          <TabsList className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-1 rounded-lg w-full md:w-auto">
            <TabsTrigger value="training" className="gap-2">
              <Dumbbell className="w-4 h-4" />
              Training
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Training Tab Content */}
          <TabsContent value="training" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-200px)]">
              
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
                <>
                   <div className="lg:col-span-9 relative h-[600px]">
                      <AICameraView onSwitchMode={() => setMode('log')} />
                   </div>
                   
                   <div className="lg:col-span-3 space-y-6">
                      <CoachingPanel />
                      
                      <Button 
                          variant="outline" 
                          className="w-full border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
                          onClick={() => setShowLogSummary(true)}
                      >
                          <Target className="h-4 w-4 mr-2" />
                          View Progress
                      </Button>
                   </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* History Tab Content */}
          <TabsContent value="history" className="mt-6">
            <HistoryTab />
          </TabsContent>

          {/* Analytics Tab Content */}
          <TabsContent value="analytics" className="mt-6">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>

        {/* Modal: Log Summary */}
        {showLogSummary && (
          <div className="fixed inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-card border border-gray-200 dark:border-border p-6 rounded-2xl w-full max-w-2xl shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-foreground font-orbitron">Historical Data</h2>
                      <button onClick={() => setShowLogSummary(false)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">✕</button>
                  </div>
                  <p className="text-center text-gray-600 dark:text-muted-foreground">This feature is coming soon.</p>
              </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}