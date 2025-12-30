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
      <Card className="p-12 text-center bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
        <p className="text-gray-600 dark:text-gray-400">Please log in to view analytics</p>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="p-12 text-center bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
      </Card>
    )
  }

  if (!stats || workouts.length === 0) {
    return (
      <Card className="p-12 text-center bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
        <Dumbbell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No workout data available</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Start logging workouts to see analytics
        </p>
      </Card>
    )
  }
  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-orbitron">Analytics & Progress</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track your fitness journey with detailed analytics
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {Math.round(stats.totalVolume).toLocaleString()} kg
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Dumbbell className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Workouts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalWorkouts}</p>
            </div>
            <div className="p-3 bg-secondary/10 rounded-lg">
              <Calendar className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg. RPE</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.averageRPE.toFixed(1)}
              </p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Target className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Sets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalSets}</p>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-cyan-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Progression */}
        {volumeData.length > 0 && (
          <Card className="p-6 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Volume Progression</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total volume lifted over time</p>
            </div>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
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
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </Card>
        )}

        {/* Muscle Group Distribution */}
        {muscleGroupData.length > 0 && (
          <Card className="p-6 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Muscle Group Distribution</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Workout distribution by muscle group</p>
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
          </Card>
        )}

        {/* Workout Frequency */}
        {workoutFrequency.length > 0 && (
          <Card className="p-6 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Workout Frequency</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Number of workouts per month</p>
            </div>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={workoutFrequency}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
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
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </Card>
        )}
      </div>
    </div>
  )
}

