"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Calendar, 
  Clock, 
  Info, 
  Star, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  List,
  CalendarDays,
  Droplet
} from "lucide-react"
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

type HistoryView = 'all' | 'daily'

export function MealHistory({ goals, onToggleFavorite }: MealHistoryProps) {
  const api = useApi()
  const [historyView, setHistoryView] = useState<HistoryView>('all')
  const [allMeals, setAllMeals] = useState<any[]>([])
  const [dailyEntries, setDailyEntries] = useState<any[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedDayMeals, setSelectedDayMeals] = useState<any[]>([])
  const [selectedDayHydration, setSelectedDayHydration] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedMeal, setSelectedMeal] = useState<any>(null)
  
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
      
      // Merge meals and hydration data
      const entriesWithHydration = dailyMeals.map((entry: any) => {
        const hydrationForDay = weeklyHydration.find((h: any) => h.date === entry.date)
        return {
          ...entry,
          waterIntake: hydrationForDay?.amount || 0
        }
      })
      
      setDailyEntries(entriesWithHydration)
    } catch (error) {
      console.error("Daily entries endpoint failed, using fallback", error)
      // Fallback: Use weekly data to create daily entries
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
              return {
                date: day.date,
                mealCount: day.meals.length,
                totalCalories: day.totals.calories,
                totalProtein: day.totals.protein,
                totalCarbs: day.totals.carbs,
                totalFats: day.totals.fats,
                waterIntake: hydrationForDay?.amount || 0
              }
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          
          setDailyEntries(entries)
        } else {
          setDailyEntries([])
        }
      } catch (fallbackError) {
        console.error("All fallbacks failed", fallbackError)
        setDailyEntries([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch meals for a specific day
  const fetchDayMeals = async (date: string) => {
    try {
      const [mealsData, hydrationData] = await Promise.all([
        mealsApi.getDaily(date),
        hydrationApi.getToday() // We'll need to modify this to get specific date
      ])
      
      setSelectedDayMeals(mealsData.summary.meals || [])
      
      // For now, we'll use today's hydration as fallback
      // In a real implementation, you'd have a hydrationApi.getByDate(date) method
      if (date === new Date().toISOString().split('T')[0]) {
        setSelectedDayHydration(hydrationData.hydration.amount || 0)
      } else {
        // For past dates, we'll set to 0 or fetch from weekly data
        setSelectedDayHydration(0)
      }
    } catch (error) {
      console.error("Failed to fetch day data", error)
      setSelectedDayMeals([])
      setSelectedDayHydration(0)
    }
  }

  useEffect(() => {
    if (historyView === 'all') {
      fetchAllMeals()
    } else {
      fetchDailyEntries()
    }
  }, [historyView])

  useEffect(() => {
    if (selectedDay) {
      fetchDayMeals(selectedDay)
    }
  }, [selectedDay])

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* History View Toggle */}
      <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-lg w-fit">
        <Button
          variant={historyView === 'all' ? 'default' : 'ghost'}
          onClick={() => setHistoryView('all')}
          className="font-orbitron text-xs px-4 h-8"
        >
          <List className="w-4 h-4 mr-2" />
          ALL MEALS
        </Button>
        <Button
          variant={historyView === 'daily' ? 'default' : 'ghost'}
          onClick={() => setHistoryView('daily')}
          className="font-orbitron text-xs px-4 h-8"
        >
          <CalendarDays className="w-4 h-4 mr-2" />
          DAILY ENTRIES
        </Button>
      </div>

      {historyView === 'all' ? (
        // All Meals View
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Water Summary Card */}
          <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/5 border-blue-500/20">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Droplet className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Weekly Water Summary</h4>
                    <p className="text-sm text-muted-foreground">View daily entries for detailed breakdown</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-500">Track by Day</div>
                  <div className="text-xs text-muted-foreground">Switch to Daily Entries</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Meals List */}
          <Card className="bg-card/80 border border-border">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">All Meals History</h3>
                  <p className="text-sm text-muted-foreground">
                    {filteredMeals.length} meals found
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm">
                    <Droplet className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-500 font-medium">Weekly Water Tracking</span>
                  </div>
                  <p className="text-xs text-muted-foreground">View daily entries for water details</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <span className="animate-pulse">Loading meals...</span>
                </div>
              ) : paginatedMeals.length > 0 ? (
                paginatedMeals.map((meal) => (
                  <div key={meal._id} className="p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {meal.name.charAt(0)}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">{meal.name}</h4>
                            {meal.isFavorite && (
                              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(meal.date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(meal.time)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-foreground">{meal.calories} kcal</div>
                          <div className="text-xs text-muted-foreground">
                            P: {Math.round(meal.protein)}g • C: {Math.round(meal.carbs)}g • F: {Math.round(meal.fats)}g
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onToggleFavorite(meal._id, meal.isFavorite)}
                            className="h-8 w-8"
                          >
                            <Star className={`w-4 h-4 ${meal.isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedMeal(meal)}
                            className="h-8 w-8"
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No meals found</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : (
        // Daily Entries View
        <div className="space-y-4">
          {selectedDay ? (
            // Selected Day View
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDay(null)}
                  className="h-8"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Days
                </Button>
                <h3 className="text-lg font-bold text-foreground">
                  {formatDate(selectedDay)}
                </h3>
              </div>

              <Card className="bg-card/80 border border-border">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">
                      Meals for {formatDate(selectedDay)}
                    </h4>
                    <div className="flex items-center gap-2 text-sm">
                      <Droplet className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-500 font-medium">{selectedDayHydration}ml water</span>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-border">
                  {selectedDayMeals.length > 0 ? (
                    selectedDayMeals.map((meal) => (
                      <div key={meal._id} className="p-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">
                                {meal.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{meal.name}</span>
                                {meal.isFavorite && (
                                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">{formatTime(meal.time)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-bold text-foreground">{meal.calories} kcal</div>
                              <div className="text-xs text-muted-foreground">
                                P: {Math.round(meal.protein)}g • C: {Math.round(meal.carbs)}g • F: {Math.round(meal.fats)}g
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedMeal(meal)}
                              className="h-8 w-8"
                            >
                              <Info className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>No meals found for this day</p>
                    </div>
                  )}
                </div>
                
                {/* Water Summary for Selected Day */}
                <div className="p-4 border-t border-border bg-blue-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-foreground">Water Intake</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-500">{selectedDayHydration}ml</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((selectedDayHydration / goals.water) * 100)}% of daily goal ({goals.water}ml)
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            // Daily Entries List
            <Card className="bg-card/80 border border-border">
              <div className="p-4 border-b border-border">
                <h3 className="text-lg font-bold text-foreground">Daily Entries</h3>
                <p className="text-sm text-muted-foreground">
                  Days with logged meals
                </p>
              </div>

              <div className="divide-y divide-border">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <span className="animate-pulse">Loading daily entries...</span>
                  </div>
                ) : dailyEntries.length > 0 ? (
                  dailyEntries.map((entry) => (
                    <button
                      key={entry.date}
                      onClick={() => setSelectedDay(entry.date)}
                      className="w-full p-4 hover:bg-muted/20 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {formatDate(entry.date)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {entry.mealCount} meal{entry.mealCount !== 1 ? 's' : ''} • {entry.waterIntake || 0}ml water
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-bold text-foreground">{entry.totalCalories} kcal</div>
                          <div className="text-xs text-muted-foreground">
                            P: {Math.round(entry.totalProtein)}g • C: {Math.round(entry.totalCarbs)}g • F: {Math.round(entry.totalFats)}g
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <Droplet className="w-3 h-3 text-blue-500" />
                            <span className="text-xs text-blue-500 font-medium">{entry.waterIntake || 0}ml</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No meal entries found</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">{selectedMeal.name}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedMeal(null)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <p className="font-medium">{formatDate(selectedMeal.date)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <p className="font-medium">{formatTime(selectedMeal.time)}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="font-medium mb-3">Nutritional Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/20 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{selectedMeal.calories}</div>
                      <div className="text-xs text-muted-foreground">Calories</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Protein:</span>
                        <span className="font-medium">{Math.round(selectedMeal.protein)}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Carbs:</span>
                        <span className="font-medium">{Math.round(selectedMeal.carbs)}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fats:</span>
                        <span className="font-medium">{Math.round(selectedMeal.fats)}g</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedMeal.micros && (
                  <div className="border-t border-border pt-4">
                    <h4 className="font-medium mb-3">Micronutrients</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fiber:</span>
                        <span>{selectedMeal.micros.fiber || 0}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sugar:</span>
                        <span>{selectedMeal.micros.sugar || 0}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sodium:</span>
                        <span>{selectedMeal.micros.sodium || 0}mg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Iron:</span>
                        <span>{selectedMeal.micros.iron || 0}mg</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}