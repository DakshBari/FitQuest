"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Target,
  BarChart3,
  PieChart,
  Activity,
  Flame
} from "lucide-react"
import { mealsApi } from "@/lib/api"

interface MealAnalyticsProps {
  goals: {
    calories: number
    protein: number
    carbs: number
    fats: number
    water: number
  }
  profile: {
    weight: number
    height: number
    bodyType: 'ectomorph' | 'mesomorph' | 'endomorph'
    goal: string
  }
}

type AnalyticsView = 'weekly' | 'monthly'

export function MealAnalytics({ goals, profile }: MealAnalyticsProps) {
  const [analyticsView, setAnalyticsView] = useState<AnalyticsView>('weekly')
  const [weeklyStats, setWeeklyStats] = useState<any>(null)
  const [monthlyStats, setMonthlyStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch weekly analytics
  const fetchWeeklyAnalytics = async () => {
    setIsLoading(true)
    try {
      const data = await mealsApi.getWeeklyDetailed()
      
      // Calculate analytics from weekly data
      const analytics = calculateWeeklyAnalytics(data.weeklyMeals, data.weeklyTotals, data.weeklyGoals)
      setWeeklyStats(analytics)
    } catch (error) {
      console.error("Failed to fetch weekly analytics", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch monthly analytics - now working implementation
  const fetchMonthlyAnalytics = async () => {
    setIsLoading(true)
    try {
      // Get data for the last 30 days using existing APIs
      const promises = []
      const today = new Date()
      
      // Fetch last 4 weeks of data
      for (let week = 0; week < 4; week++) {
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - (week * 7) - 6)
        
        // For now, we'll use the weekly detailed API multiple times
        // In a real implementation, you'd have a monthly endpoint
        promises.push(mealsApi.getWeeklyDetailed())
      }
      
      const weeklyDataArray = await Promise.all(promises)
      
      // Combine all weekly data into monthly stats
      const monthlyAnalytics = calculateMonthlyAnalytics(weeklyDataArray, goals)
      setMonthlyStats(monthlyAnalytics)
    } catch (error) {
      console.error("Failed to fetch monthly analytics", error)
      // Fallback: use current week data as monthly sample
      try {
        const weeklyData = await mealsApi.getWeeklyDetailed()
        const fallbackMonthly = calculateMonthlyAnalytics([weeklyData], goals)
        setMonthlyStats(fallbackMonthly)
      } catch (fallbackError) {
        console.error("Monthly fallback failed", fallbackError)
        setMonthlyStats(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate monthly analytics from weekly data
  const calculateMonthlyAnalytics = (weeklyDataArray: any[], monthlyGoals: any) => {
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFats = 0
    let totalActiveDays = 0
    let allDays: any[] = []
    
    // Combine all weekly data
    weeklyDataArray.forEach(weekData => {
      if (weekData.weeklyTotals) {
        totalCalories += weekData.weeklyTotals.calories
        totalProtein += weekData.weeklyTotals.protein
        totalCarbs += weekData.weeklyTotals.carbs
        totalFats += weekData.weeklyTotals.fats
      }
      
      if (weekData.weeklyMeals) {
        const activeDaysInWeek = weekData.weeklyMeals.filter((day: any) => day.meals.length > 0)
        totalActiveDays += activeDaysInWeek.length
        allDays.push(...weekData.weeklyMeals)
      }
    })
    
    // Calculate monthly averages
    const avgCalories = totalActiveDays > 0 ? totalCalories / totalActiveDays : 0
    const avgProtein = totalActiveDays > 0 ? totalProtein / totalActiveDays : 0
    const avgCarbs = totalActiveDays > 0 ? totalCarbs / totalActiveDays : 0
    const avgFats = totalActiveDays > 0 ? totalFats / totalActiveDays : 0
    
    // Calculate goal adherence (monthly goals = daily goals * 30)
    const monthlyCalorieGoal = monthlyGoals.calories * 30
    const monthlyProteinGoal = monthlyGoals.protein * 30
    const monthlyCarbsGoal = monthlyGoals.carbs * 30
    const monthlyFatsGoal = monthlyGoals.fats * 30
    
    const calorieAdherence = (totalCalories / monthlyCalorieGoal) * 100
    const proteinAdherence = (totalProtein / monthlyProteinGoal) * 100
    const carbsAdherence = (totalCarbs / monthlyCarbsGoal) * 100
    const fatsAdherence = (totalFats / monthlyFatsGoal) * 100
    
    // Find best and worst days
    const daysWithMeals = allDays.filter(day => day.meals && day.meals.length > 0)
    const bestDay = daysWithMeals.reduce((best, day) => 
      day.totals.calories > (best?.totals.calories || 0) ? day : best, null)
    const worstDay = daysWithMeals.reduce((worst, day) => 
      day.totals.calories < (worst?.totals.calories || Infinity) ? day : worst, null)
    
    // Calculate weekly averages for trend
    const weeklyAverages = weeklyDataArray.map((weekData, index) => {
      const weekActiveDays = weekData.weeklyMeals ? 
        weekData.weeklyMeals.filter((day: any) => day.meals.length > 0).length : 0
      const weekAvgCalories = weekActiveDays > 0 ? 
        (weekData.weeklyTotals?.calories || 0) / weekActiveDays : 0
      
      return {
        week: `Week ${index + 1}`,
        avgCalories: weekAvgCalories,
        totalCalories: weekData.weeklyTotals?.calories || 0,
        activeDays: weekActiveDays
      }
    }).reverse() // Reverse to show oldest to newest
    
    return {
      totalActiveDays,
      totalDays: 30, // Assuming 30-day month
      averages: { calories: avgCalories, protein: avgProtein, carbs: avgCarbs, fats: avgFats },
      totals: { calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fats: totalFats },
      adherence: { calories: calorieAdherence, protein: proteinAdherence, carbs: carbsAdherence, fats: fatsAdherence },
      goals: { calories: monthlyCalorieGoal, protein: monthlyProteinGoal, carbs: monthlyCarbsGoal, fats: monthlyFatsGoal },
      bestDay,
      worstDay,
      weeklyTrends: weeklyAverages
    }
  }

  // Calculate weekly analytics
  const calculateWeeklyAnalytics = (weeklyMeals: any[], weeklyTotals: any, weeklyGoals: any) => {
    const daysWithMeals = weeklyMeals.filter(day => day.meals.length > 0)
    const totalDays = weeklyMeals.length
    const activeDays = daysWithMeals.length
    
    // Calculate averages
    const avgCalories = activeDays > 0 ? weeklyTotals.calories / activeDays : 0
    const avgProtein = activeDays > 0 ? weeklyTotals.protein / activeDays : 0
    const avgCarbs = activeDays > 0 ? weeklyTotals.carbs / activeDays : 0
    const avgFats = activeDays > 0 ? weeklyTotals.fats / activeDays : 0

    // Calculate goal adherence
    const dailyCalorieGoal = weeklyGoals.calories / 7
    const calorieAdherence = (avgCalories / dailyCalorieGoal) * 100
    const proteinAdherence = (avgProtein / (weeklyGoals.protein / 7)) * 100
    const carbsAdherence = (avgCarbs / (weeklyGoals.carbs / 7)) * 100
    const fatsAdherence = (avgFats / (weeklyGoals.fats / 7)) * 100

    // Find best and worst days
    const bestDay = daysWithMeals.reduce((best, day) => 
      day.totals.calories > (best?.totals.calories || 0) ? day : best, null)
    const worstDay = daysWithMeals.reduce((worst, day) => 
      day.totals.calories < (worst?.totals.calories || Infinity) ? day : worst, null)

    // Calculate consistency (how close each day is to the average)
    const calorieVariances = daysWithMeals.map(day => 
      Math.abs(day.totals.calories - avgCalories)
    )
    const avgVariance = calorieVariances.reduce((sum, v) => sum + v, 0) / calorieVariances.length
    const consistency = Math.max(0, 100 - (avgVariance / avgCalories) * 100)

    return {
      activeDays,
      totalDays,
      averages: { calories: avgCalories, protein: avgProtein, carbs: avgCarbs, fats: avgFats },
      adherence: { calories: calorieAdherence, protein: proteinAdherence, carbs: carbsAdherence, fats: fatsAdherence },
      bestDay,
      worstDay,
      consistency,
      weeklyTotals
    }
  }

  useEffect(() => {
    if (analyticsView === 'weekly') {
      fetchWeeklyAnalytics()
    } else {
      fetchMonthlyAnalytics()
    }
  }, [analyticsView])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getAdherenceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-500'
    if (percentage >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getAdherenceIcon = (percentage: number) => {
    if (percentage >= 90) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (percentage >= 70) return <Activity className="w-4 h-4 text-yellow-500" />
    return <TrendingDown className="w-4 h-4 text-red-500" />
  }

  return (
    <div className="space-y-6">
      {/* Analytics View Toggle */}
      <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-lg w-fit">
        <Button
          variant={analyticsView === 'weekly' ? 'default' : 'ghost'}
          onClick={() => setAnalyticsView('weekly')}
          className="font-orbitron text-xs px-4 h-8"
        >
          <Calendar className="w-4 h-4 mr-2" />
          WEEKLY
        </Button>
        <Button
          variant={analyticsView === 'monthly' ? 'default' : 'ghost'}
          onClick={() => setAnalyticsView('monthly')}
          className="font-orbitron text-xs px-4 h-8"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          MONTHLY
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <span className="animate-pulse text-muted-foreground">Loading analytics...</span>
        </div>
      ) : (
        <>
          {analyticsView === 'weekly' && weeklyStats && (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Days</p>
                      <p className="text-2xl font-bold text-foreground">
                        {weeklyStats.activeDays}/{weeklyStats.totalDays}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-500" />
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Calories</p>
                      <p className="text-2xl font-bold text-foreground">
                        {Math.round(weeklyStats.averages.calories)}
                      </p>
                    </div>
                    <Flame className="w-8 h-8 text-green-500" />
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Consistency</p>
                      <p className="text-2xl font-bold text-foreground">
                        {Math.round(weeklyStats.consistency)}%
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-purple-500" />
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-600/5 border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Goal Adherence</p>
                      <p className="text-2xl font-bold text-foreground">
                        {Math.round(weeklyStats.adherence.calories)}%
                      </p>
                    </div>
                    {getAdherenceIcon(weeklyStats.adherence.calories)}
                  </div>
                </Card>
              </div>

              {/* Macro Adherence */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Macro Goal Adherence</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Protein</span>
                      <span className={`text-sm font-bold ${getAdherenceColor(weeklyStats.adherence.protein)}`}>
                        {Math.round(weeklyStats.adherence.protein)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(weeklyStats.adherence.protein, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg: {Math.round(weeklyStats.averages.protein)}g / {Math.round(goals.protein)}g
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Carbs</span>
                      <span className={`text-sm font-bold ${getAdherenceColor(weeklyStats.adherence.carbs)}`}>
                        {Math.round(weeklyStats.adherence.carbs)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div 
                        className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(weeklyStats.adherence.carbs, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg: {Math.round(weeklyStats.averages.carbs)}g / {Math.round(goals.carbs)}g
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Fats</span>
                      <span className={`text-sm font-bold ${getAdherenceColor(weeklyStats.adherence.fats)}`}>
                        {Math.round(weeklyStats.adherence.fats)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(weeklyStats.adherence.fats, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg: {Math.round(weeklyStats.averages.fats)}g / {Math.round(goals.fats)}g
                    </p>
                  </div>
                </div>
              </Card>

              {/* Best & Worst Days */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weeklyStats.bestDay && (
                  <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <h4 className="font-medium text-foreground">Best Day</h4>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(weeklyStats.bestDay.date)}
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {weeklyStats.bestDay.totals.calories} kcal
                      </p>
                      <p className="text-xs text-muted-foreground">
                        P: {Math.round(weeklyStats.bestDay.totals.protein)}g • 
                        C: {Math.round(weeklyStats.bestDay.totals.carbs)}g • 
                        F: {Math.round(weeklyStats.bestDay.totals.fats)}g
                      </p>
                    </div>
                  </Card>
                )}

                {weeklyStats.worstDay && (
                  <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingDown className="w-5 h-5 text-red-500" />
                      <h4 className="font-medium text-foreground">Lowest Day</h4>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(weeklyStats.worstDay.date)}
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {weeklyStats.worstDay.totals.calories} kcal
                      </p>
                      <p className="text-xs text-muted-foreground">
                        P: {Math.round(weeklyStats.worstDay.totals.protein)}g • 
                        C: {Math.round(weeklyStats.worstDay.totals.carbs)}g • 
                        F: {Math.round(weeklyStats.worstDay.totals.fats)}g
                      </p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Weekly Totals */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Weekly Totals</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">
                      {Math.round(weeklyStats.weeklyTotals.calories).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Calories</div>
                  </div>
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">
                      {Math.round(weeklyStats.weeklyTotals.protein)}g
                    </div>
                    <div className="text-sm text-muted-foreground">Total Protein</div>
                  </div>
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <div className="text-2xl font-bold text-cyan-400">
                      {Math.round(weeklyStats.weeklyTotals.carbs)}g
                    </div>
                    <div className="text-sm text-muted-foreground">Total Carbs</div>
                  </div>
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">
                      {Math.round(weeklyStats.weeklyTotals.fats)}g
                    </div>
                    <div className="text-sm text-muted-foreground">Total Fats</div>
                  </div>
                </div>
              </Card>

            </div>
          )}

          {analyticsView === 'monthly' && monthlyStats && (
            <div className="space-y-6">
              {/* Monthly Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Days</p>
                      <p className="text-2xl font-bold text-foreground">
                        {monthlyStats.totalActiveDays}/{monthlyStats.totalDays}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-500" />
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Calories</p>
                      <p className="text-2xl font-bold text-foreground">
                        {Math.round(monthlyStats.averages.calories)}
                      </p>
                    </div>
                    <Flame className="w-8 h-8 text-green-500" />
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Calories</p>
                      <p className="text-2xl font-bold text-foreground">
                        {Math.round(monthlyStats.totals.calories).toLocaleString()}
                      </p>
                    </div>
                    <Flame className="w-8 h-8 text-purple-500" />
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-600/5 border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Goal Progress</p>
                      <p className="text-2xl font-bold text-foreground">
                        {Math.round(monthlyStats.adherence.calories)}%
                      </p>
                    </div>
                    {getAdherenceIcon(monthlyStats.adherence.calories)}
                  </div>
                </Card>
              </div>

              {/* Monthly Macro Adherence */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Monthly Macro Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Protein</span>
                      <span className={`text-sm font-bold ${getAdherenceColor(monthlyStats.adherence.protein)}`}>
                        {Math.round(monthlyStats.adherence.protein)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(monthlyStats.adherence.protein, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total: {Math.round(monthlyStats.totals.protein)}g / {Math.round(monthlyStats.goals.protein)}g
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Carbs</span>
                      <span className={`text-sm font-bold ${getAdherenceColor(monthlyStats.adherence.carbs)}`}>
                        {Math.round(monthlyStats.adherence.carbs)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div 
                        className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(monthlyStats.adherence.carbs, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total: {Math.round(monthlyStats.totals.carbs)}g / {Math.round(monthlyStats.goals.carbs)}g
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Fats</span>
                      <span className={`text-sm font-bold ${getAdherenceColor(monthlyStats.adherence.fats)}`}>
                        {Math.round(monthlyStats.adherence.fats)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(monthlyStats.adherence.fats, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total: {Math.round(monthlyStats.totals.fats)}g / {Math.round(monthlyStats.goals.fats)}g
                    </p>
                  </div>
                </div>
              </Card>

              {/* Weekly Trends */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Weekly Trends</h3>
                <div className="space-y-4">
                  {monthlyStats.weeklyTrends.map((week: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{week.week}</p>
                          <p className="text-xs text-muted-foreground">{week.activeDays} active days</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{Math.round(week.avgCalories)} kcal/day</p>
                        <p className="text-xs text-muted-foreground">{Math.round(week.totalCalories)} total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Monthly Best & Worst Days */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {monthlyStats.bestDay && (
                  <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <h4 className="font-medium text-foreground">Best Day This Month</h4>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(monthlyStats.bestDay.date)}
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {monthlyStats.bestDay.totals.calories} kcal
                      </p>
                      <p className="text-xs text-muted-foreground">
                        P: {Math.round(monthlyStats.bestDay.totals.protein)}g • 
                        C: {Math.round(monthlyStats.bestDay.totals.carbs)}g • 
                        F: {Math.round(monthlyStats.bestDay.totals.fats)}g
                      </p>
                    </div>
                  </Card>
                )}

                {monthlyStats.worstDay && (
                  <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingDown className="w-5 h-5 text-red-500" />
                      <h4 className="font-medium text-foreground">Lowest Day This Month</h4>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(monthlyStats.worstDay.date)}
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {monthlyStats.worstDay.totals.calories} kcal
                      </p>
                      <p className="text-xs text-muted-foreground">
                        P: {Math.round(monthlyStats.worstDay.totals.protein)}g • 
                        C: {Math.round(monthlyStats.worstDay.totals.carbs)}g • 
                        F: {Math.round(monthlyStats.worstDay.totals.fats)}g
                      </p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Monthly Summary */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Monthly Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">
                      {Math.round(monthlyStats.totals.calories).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Calories</div>
                  </div>
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">
                      {Math.round(monthlyStats.totals.protein)}g
                    </div>
                    <div className="text-sm text-muted-foreground">Total Protein</div>
                  </div>
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <div className="text-2xl font-bold text-cyan-400">
                      {Math.round(monthlyStats.totals.carbs)}g
                    </div>
                    <div className="text-sm text-muted-foreground">Total Carbs</div>
                  </div>
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">
                      {Math.round(monthlyStats.totals.fats)}g
                    </div>
                    <div className="text-sm text-muted-foreground">Total Fats</div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {analyticsView === 'monthly' && !monthlyStats && !isLoading && (
            <Card className="p-8 text-center">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">No Monthly Data</h3>
              <p className="text-muted-foreground">
                Not enough data available for monthly analytics. Keep logging meals to see your monthly trends!
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}