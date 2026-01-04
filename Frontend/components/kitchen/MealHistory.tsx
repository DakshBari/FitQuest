"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  Calendar, 
  Clock, 
  Info, 
  Star, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Utensils,
  Loader2
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { mealsApi, hydrationApi } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { formatTime } from "@/lib/timeUtils"

interface MealHistoryProps {
  goals: {
    calories: number
    protein: number
    carbs: number
    fats: number
    water: number
  }
  onToggleFavorite: (id: string, currentState: boolean) => void
}

export function MealHistory({ goals, onToggleFavorite }: MealHistoryProps) {
  const api = useApi()
  const [allMeals, setAllMeals] = useState<any[]>([])
  const [dailyEntries, setDailyEntries] = useState<any[]>([])
  const [selectedMeal, setSelectedMeal] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  
  const mealsPerPage = 10

  // Fetch all meals for history
  const fetchAllMeals = async () => {
    setIsLoading(true)
    try {
      const data = await api.meals.getHistory(100, 1)
      setAllMeals(data.meals || [])
    } catch (error) {
      console.error("Failed to fetch meal history", error)
      setAllMeals([])
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to calculate daily totals from meals
  const calculateDailyTotals = (meals: any[]) => {
    console.log('Calculating totals for meals:', meals)
    
    if (!meals || meals.length === 0) {
      console.log('No meals found, returning zeros')
      return { calories: 0, protein: 0, carbs: 0, fats: 0 }
    }
    
    const totals = meals.reduce((acc: any, meal: any) => {
      console.log('Processing meal:', meal)
      const calories = Number(meal.calories) || 0
      const protein = Number(meal.protein) || 0
      const carbs = Number(meal.carbs) || Number(meal.carbohydrates) || 0
      const fats = Number(meal.fats) || Number(meal.fat) || 0
      
      console.log(`Meal ${meal.name}: ${calories}cal, ${protein}p, ${carbs}c, ${fats}f`)
      
      return {
        calories: acc.calories + calories,
        protein: acc.protein + protein,
        carbs: acc.carbs + carbs,
        fats: acc.fats + fats
      }
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 })
    
    console.log('Final calculated totals:', totals)
    return totals
  }

  // Fetch daily entries (days with meals)
  const fetchDailyEntries = async () => {
    setIsLoading(true)
    try {
      // Try to get both meals and hydration data
      const [mealsData, hydrationData] = await Promise.all([
        mealsApi.getDailyEntries(),
        hydrationApi.getWeekly().catch(() => ({ weeklyHydration: [] }))
      ])
      
      const dailyMeals = mealsData.dailyEntries || []
      const weeklyHydration = hydrationData.weeklyHydration || []
      
      // Debug: Log the data structure
      console.log('Daily entries data:', dailyMeals)
      
      // Merge meals and hydration data, and calculate macros if missing
      const entriesWithHydration = dailyMeals.map((entry: any) => {
        const hydrationForDay = weeklyHydration.find((h: any) => h.date === entry.date)
        
        console.log('Processing entry for date:', entry.date)
        console.log('Entry object keys:', Object.keys(entry))
        console.log('Entry meals property:', entry.meals)
        console.log('Entry meals type:', typeof entry.meals)
        console.log('Entry meals length:', entry.meals ? entry.meals.length : 'undefined')
        console.log('Entry mealCount:', entry.mealCount)
        console.log('Full entry object:', JSON.stringify(entry, null, 2))
        
        // Always calculate macros from individual meals to ensure accuracy
        // Try different possible property names for meals
        const mealsArray = entry.meals || entry.mealsList || entry.dailyMeals || entry.entries || []
        console.log('Using meals array:', mealsArray)
        
        const calculated = calculateDailyTotals(mealsArray)
        
        const processedEntry = {
          ...entry,
          meals: mealsArray, // Ensure meals property is set correctly
          totalCalories: calculated.calories,
          totalProtein: calculated.protein,
          totalCarbs: calculated.carbs,
          totalFats: calculated.fats,
          waterIntake: hydrationForDay?.amount || 0
        }
        
        console.log('Processed entry:', processedEntry)
        return processedEntry
      })
      
      console.log('Processed daily entries:', entriesWithHydration)
      
      // If no meals are found in entries but mealCount > 0, try to fetch meals separately
      const entriesWithMeals = await Promise.all(
        entriesWithHydration.map(async (entry: any) => {
          if (entry.mealCount > 0 && (!entry.meals || entry.meals.length === 0)) {
            console.log(`Fetching meals for date ${entry.date} separately`)
            try {
              // Try to fetch meals for this specific date
              const dateStr = entry.date
              const mealsForDate = await api.meals.getByDate?.(dateStr) || 
                                   await api.meals.getDaily?.(dateStr) ||
                                   await api.call(`/api/meals/date/${dateStr}`)
              
              console.log(`Fetched meals for ${dateStr}:`, mealsForDate)
              
              if (mealsForDate && mealsForDate.meals) {
                const calculated = calculateDailyTotals(mealsForDate.meals)
                return {
                  ...entry,
                  meals: mealsForDate.meals,
                  totalCalories: calculated.calories,
                  totalProtein: calculated.protein,
                  totalCarbs: calculated.carbs,
                  totalFats: calculated.fats,
                }
              }
            } catch (error) {
              console.error(`Failed to fetch meals for ${entry.date}:`, error)
            }
          }
          return entry
        })
      )
      
      console.log('Final entries with meals:', entriesWithMeals)
      setDailyEntries(entriesWithMeals)
    } catch (error) {
      console.error("Daily entries endpoint failed, using fallback", error)
      // Fallback 1: Use weekly data to create daily entries
      try {
        const [weeklyMealsData, weeklyHydrationData] = await Promise.all([
          mealsApi.getWeeklyDetailed(),
          hydrationApi.getWeekly().catch(() => ({ weeklyHydration: [] }))
        ])
        
        if (weeklyMealsData.weeklyMeals) {
          const weeklyHydration = weeklyHydrationData.weeklyHydration || []
          
          const entries = weeklyMealsData.weeklyMeals
            .filter((day: any) => day.meals && day.meals.length > 0)
            .map((day: any) => {
              const hydrationForDay = weeklyHydration.find((h: any) => h.date === day.date)
              const calculated = calculateDailyTotals(day.meals || [])
              
              return {
                date: day.date,
                mealCount: day.meals.length,
                totalCalories: day.totals?.calories || calculated.calories,
                totalProtein: day.totals?.protein || calculated.protein,
                totalCarbs: day.totals?.carbs || calculated.carbs,
                totalFats: day.totals?.fats || calculated.fats,
                waterIntake: hydrationForDay?.amount || 0,
                meals: day.meals
              }
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          
          setDailyEntries(entries)
        } else {
          // Fallback 2: Use meal history and group by date
          console.log("Using meal history fallback")
          const historyData = await api.meals.getHistory(100, 1)
          const allMeals = historyData.meals || []
          
          if (allMeals.length > 0) {
            const groupedByDate = groupMealsByDate(allMeals)
            const weeklyHydration = weeklyHydrationData?.weeklyHydration || []
            
            const entries = Object.entries(groupedByDate)
              .map(([date, meals]: [string, any]) => {
                const hydrationForDay = weeklyHydration.find((h: any) => h.date === date)
                const calculated = calculateDailyTotals(meals)
                
                return {
                  date,
                  mealCount: meals.length,
                  totalCalories: calculated.calories,
                  totalProtein: calculated.protein,
                  totalCarbs: calculated.carbs,
                  totalFats: calculated.fats,
                  waterIntake: hydrationForDay?.amount || 0,
                  meals: meals
                }
              })
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            
            console.log("Grouped entries from history:", entries)
            setDailyEntries(entries)
          } else {
            setDailyEntries([])
          }
        }
      } catch (fallbackError) {
        console.error("All fallbacks failed", fallbackError)
        setDailyEntries([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'all') {
      fetchAllMeals()
    } else {
      fetchDailyEntries()
    }
  }, [activeTab])

  const handleViewDetails = (meal: any) => {
    setSelectedMeal(meal)
    setIsDetailsOpen(true)
  }

  const toggleDayExpansion = (date: string) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(date)) {
      newExpanded.delete(date)
    } else {
      newExpanded.add(date)
    }
    setExpandedDays(newExpanded)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    })
  }

  const formatTime12Hour = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    })
  }

  // Group meals by date for daily view
  const groupMealsByDate = (meals: any[]) => {
    const grouped: { [key: string]: any[] } = {}
    
    meals.forEach(meal => {
      const date = new Date(meal.date).toISOString().split('T')[0]
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(meal)
    })
    
    return grouped
  }

  // Filter meals based on search
  const filteredMeals = allMeals.filter(meal =>
    meal.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Paginate meals
  const totalPages = Math.ceil(filteredMeals.length / mealsPerPage)
  const paginatedMeals = filteredMeals.slice(
    (currentPage - 1) * mealsPerPage,
    currentPage * mealsPerPage
  )

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-inter">Meal History</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View, edit, or manage your nutrition journey
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {allMeals.length} meals
        </div>
      </div>

      {/* Tabs for All Meals vs Daily Entries */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card/80 backdrop-blur-xl border border-border/50 p-1 rounded-2xl shadow-lg shadow-primary/5">
          <TabsTrigger value="all" className="gap-2 rounded-xl font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/25">
            <Utensils className="w-4 h-4" />
            All Meals
          </TabsTrigger>
          <TabsTrigger value="daily" className="gap-2 rounded-xl font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/25">
            <Calendar className="w-4 h-4" />
            Daily Entries
          </TabsTrigger>
        </TabsList>

        {/* All Meals Tab */}
        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meals by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-background/50 border-border backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 rounded-xl"
              />
            </div>

            {isLoading ? (
              <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 p-12 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-green-500 mb-4" />
                <p className="text-muted-foreground">Loading meal history...</p>
              </div>
            ) : paginatedMeals.length === 0 ? (
              <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 p-12 text-center">
                <Utensils className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-4" />
                <p className="text-muted-foreground font-medium">No meal history yet</p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  Start logging your meals to see them here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedMeals.map((meal) => (
                  <div 
                    key={meal._id} 
                    className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-200"
                  >
                    <div className="p-6">
                      <div className="flex flex-col gap-4">
                        {/* Meal Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-foreground">
                              {meal.name}
                            </h3>
                            {meal.isFavorite && (
                              <span className="px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-500 text-xs font-semibold rounded-full border border-yellow-500/30">
                                ⭐ Favorite
                              </span>
                            )}
                            <span className="px-2 py-1 bg-muted/50 text-muted-foreground text-xs font-medium rounded-full">
                              {meal.quantity || meal.baseQuantity || 100}g
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(meal.date)} • {formatTime12Hour(meal.date)}
                          </div>
                        </div>

                        {/* Nutrition Info */}
                        <div className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border backdrop-blur-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-muted-foreground min-w-[60px]">
                              Nutrition
                            </span>
                            <span className="text-sm font-bold text-foreground">
                              {meal.calories} kcal
                            </span>
                            <span className="text-xs text-muted-foreground">
                              P: {Math.round(meal.protein)}g
                            </span>
                            <span className="text-xs text-muted-foreground">
                              C: {Math.round(meal.carbs)}g
                            </span>
                            <span className="text-xs text-muted-foreground">
                              F: {Math.round(meal.fats)}g
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onToggleFavorite(meal._id, meal.isFavorite)}
                              className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10 rounded-lg"
                              title="Toggle favorite"
                            >
                              <Star className={`w-4 h-4 ${meal.isFavorite ? 'fill-yellow-500' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(meal)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
                            >
                              <Info className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages} • {filteredMeals.length} meals
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="border-border/50 text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-xl"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="border-border/50 text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-xl"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Daily Entries Tab */}
        <TabsContent value="daily" className="mt-6">
          <div className="space-y-4">
            {isLoading ? (
              <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 p-12 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-green-500 mb-4" />
                <p className="text-muted-foreground">Loading daily entries...</p>
              </div>
            ) : dailyEntries.length === 0 ? (
              <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-4" />
                <p className="text-muted-foreground font-medium">No daily entries yet</p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  Start logging meals to see daily summaries
                </p>
              </div>
            ) : (
              dailyEntries.map((entry) => {
                const isExpanded = expandedDays.has(entry.date)
                return (
                  <div 
                    key={entry.date}
                    className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-200"
                  >
                    {/* Clickable Header */}
                    <div 
                      className="p-6 cursor-pointer hover:bg-background/30 transition-colors rounded-t-3xl"
                      onClick={() => toggleDayExpansion(entry.date)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">
                            {formatDate(entry.date)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {entry.mealCount} meal{entry.mealCount !== 1 ? 's' : ''} • {entry.waterIntake || 0}ml water
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-bold text-foreground">{entry.totalCalories}</div>
                            <div className="text-xs text-muted-foreground">calories</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              P: {Math.round(entry.totalProtein || 0)}g • C: {Math.round(entry.totalCarbs || 0)}g • F: {Math.round(entry.totalFats || 0)}g
                            </div>
                          </div>
                          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-border">
                        <div className="pt-4 space-y-4">
                          {/* Daily Nutrition Summary */}
                          <div className="p-4 bg-gradient-to-r from-green-500/10 via-transparent to-emerald-500/10 rounded-xl border border-green-500/20">
                            <h4 className="text-sm font-semibold text-foreground mb-3">Daily Nutrition Summary</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-500">{entry.totalCalories || 0}</div>
                                <div className="text-xs text-muted-foreground">Calories</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-foreground">{Math.round(entry.totalProtein || 0)}g</div>
                                <div className="text-xs text-muted-foreground">Protein</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-foreground">{Math.round(entry.totalCarbs || 0)}g</div>
                                <div className="text-xs text-muted-foreground">Carbs</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-foreground">{Math.round(entry.totalFats || 0)}g</div>
                                <div className="text-xs text-muted-foreground">Fats</div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-green-500/20">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Water Intake:</span>
                                <span className="text-blue-500 font-medium">
                                  {entry.waterIntake || 0}ml ({Math.round(((entry.waterIntake || 0) / goals.water) * 100)}% of goal)
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Individual Meals */}
                          {entry.meals && entry.meals.length > 0 ? (
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-foreground">Individual Meals ({entry.meals.length})</h4>
                              {entry.meals.map((meal: any, index: number) => (
                                <div key={meal._id || meal.id || index} className="p-4 bg-background/50 rounded-xl border border-border backdrop-blur-sm">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <span className="text-base font-semibold text-foreground">
                                        {meal.name || 'Unnamed Meal'}
                                      </span>
                                      {meal.isFavorite && (
                                        <span className="px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-500 text-xs font-semibold rounded-full border border-yellow-500/30">
                                          ⭐ Favorite
                                        </span>
                                      )}
                                      <span className="px-2 py-1 bg-muted/50 text-muted-foreground text-xs font-medium rounded-full">
                                        {meal.quantity || meal.baseQuantity || 100}g
                                      </span>
                                    </div>
                                    <span className="text-sm text-muted-foreground/70">
                                      {meal.date ? formatTime12Hour(meal.date) : meal.time || 'No time'}
                                    </span>
                                  </div>
                                  
                                  {/* Nutrition Details */}
                                  <div className="flex items-center justify-between p-2 bg-background/80 rounded-lg border border-border/50">
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-medium text-muted-foreground min-w-[50px]">
                                        Nutrition
                                      </span>
                                      <span className="text-sm font-bold text-foreground">
                                        {meal.calories || 0} kcal
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        P: {Math.round(meal.protein || 0)}g
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        C: {Math.round(meal.carbs || meal.carbohydrates || 0)}g
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        F: {Math.round(meal.fats || meal.fat || 0)}g
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (meal._id || meal.id) {
                                            onToggleFavorite(meal._id || meal.id, meal.isFavorite)
                                          }
                                        }}
                                        className="h-7 w-7 p-0 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10 rounded-lg"
                                        title="Toggle favorite"
                                      >
                                        <Star className={`w-3 h-3 ${meal.isFavorite ? 'fill-yellow-500' : ''}`} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleViewDetails(meal)
                                        }}
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
                                      >
                                        <Info className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 bg-background/50 rounded-xl border border-border backdrop-blur-sm text-center">
                              <p className="text-muted-foreground">No meals found for this day</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border border-border rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-inter">Meal Details</DialogTitle>
            <DialogDescription>
              Complete nutritional information for this meal
            </DialogDescription>
          </DialogHeader>
          
          {selectedMeal && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Meal Name</label>
                  <p className="text-lg font-semibold text-foreground mt-1">
                    {selectedMeal.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Favorite Status</label>
                  <p className="text-lg font-semibold text-foreground mt-1 flex items-center gap-2">
                    {selectedMeal.isFavorite ? (
                      <>
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-yellow-500">Favorited</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Not favorited</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p className="text-base text-foreground mt-1">
                    {formatDate(selectedMeal.date)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Time</label>
                  <p className="text-base text-foreground mt-1">
                    {formatTime12Hour(selectedMeal.date)}
                  </p>
                </div>
              </div>

              {/* Nutrition Details */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nutritional Information</label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border backdrop-blur-sm">
                    <span className="font-medium">Calories</span>
                    <span className="text-green-500 font-bold">{selectedMeal.calories} kcal</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border backdrop-blur-sm">
                    <span className="font-medium">Protein</span>
                    <span className="text-foreground font-bold">{Math.round(selectedMeal.protein)}g</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border backdrop-blur-sm">
                    <span className="font-medium">Carbs</span>
                    <span className="text-foreground font-bold">{Math.round(selectedMeal.carbs)}g</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border backdrop-blur-sm">
                    <span className="font-medium">Fats</span>
                    <span className="text-foreground font-bold">{Math.round(selectedMeal.fats)}g</span>
                  </div>
                </div>
              </div>

              {selectedMeal.micros && Object.keys(selectedMeal.micros).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Micronutrients</label>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {Object.entries(selectedMeal.micros).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border backdrop-blur-sm">
                        <span className="text-muted-foreground capitalize">{key}:</span>
                        <span className="font-medium text-foreground">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}