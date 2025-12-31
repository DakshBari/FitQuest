"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { TrendingUp, Dumbbell, Calendar, Target, Loader2 } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { getWorkouts, getWorkoutStats, calculateTotalVolume, getMuscleGroupDistribution } from "@/services/workoutService"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "@/components/ui/sonner"

const chartConfig = {
  volume: {
    label: "Volume (kg)",
    color: "hsl(var(--primary))",
  },
  weight: {
    label: "Weight (kg)",
    color: "hsl(var(--primary))",
  },
  workouts: {
    label: "Workouts",
    color: "hsl(var(--primary))",
  },
}

const MUSCLE_GROUP_COLORS = {
  Chest: "hsl(var(--primary))",
  Back: "#10b981",
  Legs: "#f59e0b", 
  Shoulders: "#ef4444",
  Arms: "#8b5cf6",
  Biceps: "#06b6d4",
  Triceps: "#f97316",
  Core: "#84cc16",
  Cardio: "#ec4899"
}

export function AnalyticsTab() {
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [workouts, setWorkouts] = useState<any[]>([])
  const [volumeData, setVolumeData] = useState<any[]>([])
  const [muscleGroupData, setMuscleGroupData] = useState<any[]>([])
  const [workoutFrequency, setWorkoutFrequency] = useState<any[]>([])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalyticsData()
    }
  }, [isAuthenticated])

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch workouts and stats
      const [workoutsResponse, statsResponse] = await Promise.all([
        getWorkouts({ limit: 100 }),
        getWorkoutStats()
      ])

      setWorkouts(workoutsResponse.workouts)
      setStats(statsResponse.stats)

      // Process data for charts
      processVolumeData(workoutsResponse.workouts)
      processMuscleGroupData(statsResponse.stats.muscleGroupDistribution)
      processWorkoutFrequency(workoutsResponse.workouts)

    } catch (error: any) {
      toast.error(error.message || "Failed to fetch analytics data")
    } finally {
      setIsLoading(false)
    }
  }

  const processVolumeData = (workouts: any[]) => {
    // Group workouts by week and calculate volume
    const weeklyVolume: Record<string, number> = {}
    
    workouts.forEach(workout => {
      const date = new Date(workout.date)
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
      const weekKey = weekStart.toISOString().split('T')[0]
      
      const workoutVolume = workout.sets.reduce((total: number, set: any) => {
        const weightInKg = set.unit === 'lb' ? set.weight * 0.453592 : set.weight
        return total + (set.reps * weightInKg)
      }, 0)
      
      weeklyVolume[weekKey] = (weeklyVolume[weekKey] || 0) + workoutVolume
    })

    const volumeArray = Object.entries(weeklyVolume)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-7) // Last 7 weeks
      .map(([date, volume]) => ({
        date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        volume: Math.round(volume)
      }))

    setVolumeData(volumeArray)
  }

  const processMuscleGroupData = (distribution: Record<string, number>) => {
    const data = Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
      color: MUSCLE_GROUP_COLORS[name as keyof typeof MUSCLE_GROUP_COLORS] || "#6b7280"
    }))
    setMuscleGroupData(data)
  }

  const processWorkoutFrequency = (workouts: any[]) => {
    // Group by month
    const monthlyCount: Record<string, number> = {}
    
    workouts.forEach(workout => {
      const date = new Date(workout.date)
      const monthKey = date.toLocaleDateString(undefined, { month: 'short' })
      monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1
    })

    const frequencyArray = Object.entries(monthlyCount)
      .slice(-4) // Last 4 months
      .map(([month, workouts]) => ({ month, workouts }))

    setWorkoutFrequency(frequencyArray)
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 p-12 text-center">
        <p className="text-muted-foreground">Please log in to view analytics</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 p-12 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-red-500 mb-4" />
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    )
  }

  if (!stats || workouts.length === 0) {
    return (
      <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 p-12 text-center">
        <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-4" />
        <p className="text-muted-foreground font-medium">No workout data available</p>
        <p className="text-sm text-muted-foreground/70 mt-2">
          Start logging workouts to see analytics
        </p>
      </div>
    )
  }
  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground font-inter">Analytics & Progress</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Track your fitness journey with detailed analytics
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-lg shadow-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {Math.round(stats.totalVolume).toLocaleString()} kg
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/25">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-lg shadow-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Workouts</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.totalWorkouts}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-lg shadow-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg. RPE</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.averageRPE.toFixed(1)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-lg shadow-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Sets</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.totalSets}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Progression */}
        {volumeData.length > 0 && (
          <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-lg shadow-primary/5 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-foreground">Volume Progression</h3>
              <p className="text-sm text-muted-foreground">Total volume lifted over time</p>
            </div>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: "#ef4444", r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}

        {/* Muscle Group Distribution */}
        {muscleGroupData.length > 0 && (
          <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-lg shadow-primary/5 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-foreground">Muscle Group Distribution</h3>
              <p className="text-sm text-muted-foreground">Workout distribution by muscle group</p>
            </div>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={muscleGroupData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {muscleGroupData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </div>
        )}

        {/* Workout Frequency */}
        {workoutFrequency.length > 0 && (
          <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-lg shadow-primary/5 p-6 lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-foreground">Workout Frequency</h3>
              <p className="text-sm text-muted-foreground">Number of workouts per month</p>
            </div>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={workoutFrequency}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="workouts" 
                  fill="#ef4444" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </div>
    </div>
  )
}

