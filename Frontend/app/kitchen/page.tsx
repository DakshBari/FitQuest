"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Edit2, Plus, RefreshCw, Utensils, History, BarChart3 } from "lucide-react"
import { FuelGauge } from "@/components/kitchen/FuelGauge"
import { HydrationTracker } from "@/components/kitchen/HydrationTracker"
import { MealCard } from "@/components/kitchen/MealCard"
import { WeeklyMealCard } from "@/components/kitchen/WeeklyMealCard"
import { FoodSearch } from "@/components/kitchen/FoodSearch"
import { GoalSettings, GoalType } from "@/components/kitchen/GoalSettings"
import { AddMealModal } from "@/components/kitchen/AddMealModal"
import { MealHistory } from "@/components/kitchen/MealHistory"
import { MealAnalytics } from "@/components/kitchen/MealAnalytics"
import { mealsApi, hydrationApi } from "@/lib/api"
import { getCurrentTime } from "@/lib/timeUtils"

export default function KitchenPage() {
  const [showGoalSettings, setShowGoalSettings] = useState(false)
  const [profile, setProfile] = useState({
    weight: 75, 
    height: 180, 
    bodyType: 'mesomorph' as 'ectomorph' | 'mesomorph' | 'endomorph',
    goal: 'muscle-gain' as GoalType
  })

  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily')
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAddMealOpen, setIsAddMealOpen] = useState(false)
  const [editingQuantities, setEditingQuantities] = useState<Record<string, number[]>>({})

  // NEW: State for all meals (to populate favorites from "forever")
  const [allMeals, setAllMeals] = useState<any[]>([])

  const [meals, setMeals] = useState<any[]>([])
  const [dailyStats, setDailyStats] = useState<any>(null)
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [weeklyMeals, setWeeklyMeals] = useState<any[]>([])
  const [weeklyTotals, setWeeklyTotals] = useState<any>(null)
  const [weeklyGoals, setWeeklyGoals] = useState<any>(null)
  const [weeklyHydration, setWeeklyHydration] = useState<any[]>([])
  const [hydration, setHydration] = useState(0)
  
  const [goals, setGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 65,
    water: 3000
  })

  const recalculateStats = (mealsList: any[]) => {
    const stats = mealsList.reduce((acc, m) => ({
        calories: (acc.calories || 0) + m.calories,
        protein: (acc.protein || 0) + m.protein,
        carbs: (acc.carbs || 0) + m.carbs,
        fats: (acc.fats || 0) + m.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    return {
        totalCalories: stats.calories,
        totalProtein: stats.protein,
        totalCarbs: stats.carbs,
        totalFats: stats.fats
    };
  }

  // --- Data Fetching ---

  const fetchDailyData = async () => {
    setIsLoading(true)
    try {
      const data = await mealsApi.getDaily()
      setMeals(data.summary.meals)
      setDailyStats(data.summary)
      setGoals((prevGoals) => ({
        ...prevGoals,    
        ...data.summary.goals 
      }))
    } catch (error) {
      console.error("Failed to fetch daily data", error)
    } finally {
      setIsLoading(false)
    }
  }

  // NEW: Fetch all meals to populate global favorites
  const fetchFavorites = async () => {
    try {
      const data = await mealsApi.getFavorites()
      setAllMeals(data.favorites);
    } catch (error) {
      console.error("Failed to fetch favorites", error)
    }
  }

  const fetchWeeklyData = async () => {
    setIsLoading(true)
    try {
      const [mealsData, hydrationData] = await Promise.all([
        mealsApi.getWeeklyDetailed(),
        hydrationApi.getWeekly()
      ])
      
      setWeeklyMeals(mealsData.weeklyMeals)
      setWeeklyTotals(mealsData.weeklyTotals)
      setWeeklyGoals(mealsData.weeklyGoals)
      setWeeklyHydration(hydrationData.weeklyHydration)
      
      // Also get the simple weekly data for fuel gauge
      const simpleWeeklyData = await mealsApi.getWeekly()
      setWeeklyData(simpleWeeklyData.weeklyData)
    } catch (error) {
      console.error("Failed to fetch weekly data", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHydration = async () => {
    try {
      const data = await hydrationApi.getToday()
      setHydration(data.hydration.amount)
    } catch (error) {
      console.error("Failed to fetch hydration", error)
    }
  }

  useEffect(() => {
    fetchDailyData()
    fetchHydration()
    fetchFavorites() // Fetch all favorites
  }, [])

  useEffect(() => {
    if (viewMode === 'weekly') {
      fetchWeeklyData()
    }
  }, [viewMode])

  // --- Handlers ---

  const handleAddMeal = async (newMeal: any) => {
    setIsLoading(true)
    try {
      await mealsApi.add(newMeal)
      await fetchDailyData()
      setIsAddMealOpen(false)
    } catch (error) {
      console.error("Failed to add meal", error)
    } finally {
      setIsLoading(false)
    }
  }

  // NEW: Handle adding favorite meal to log
  const handleAddFavoriteToLog = async (favorite: any, customQuantity?: number) => {
    setIsLoading(true)
    try {
      const currentTime = getCurrentTime()
      await mealsApi.addFavoriteToLog(favorite._id || favorite.id, {
        date: new Date().toISOString(),
        time: currentTime,
        quantity: customQuantity || favorite.quantity || favorite.baseQuantity
      })
      await fetchDailyData()
    } catch (error) {
      console.error("Failed to add favorite to log", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMeal = async (id: string) => {
    setIsLoading(true)
    try {
      await mealsApi.delete(id)
      await fetchDailyData()
    } catch (error) {
      console.error("Failed to delete meal", error)
    } finally {
      setIsLoading(false)
    }
  }

  // NEW: Handle Duplicate (Clone meal)
  const handleDuplicate = async (mealToCopy: any) => {
    setIsLoading(true)
    try {
      // Create new meal object without ID
      const newMeal = {
        name: mealToCopy.name,
        calories: mealToCopy.calories,
        protein: mealToCopy.protein,
        carbs: mealToCopy.carbs,
        fats: mealToCopy.fats,
        micros: mealToCopy.micros,
        baseQuantity: mealToCopy.baseQuantity,
        isFavorite: false, // Duplicate is not favorited by default
      };
      
      await mealsApi.add(newMeal)
      await fetchDailyData()
      await fetchFavorites() // Refresh favorites list too
    } catch (error) {
      console.error("Failed to duplicate meal", error)
    } finally {
      setIsLoading(false)
    }
  }

  // NEW: Handle Toggle Favorite
  const handleToggleFavorite = async (id: string, currentState: boolean) => {
    try {
      await mealsApi.toggleFavorite(id)
      // Update local states
      await fetchDailyData()
      await fetchFavorites()
    } catch (error) {
      console.error("Failed to toggle favorite", error)
    }
  }

  const handleLiveEdit = (id: string, multiplier: number) => {
    const tempMeals = meals.map(m => {
      if (m._id === id) {
        return {
          ...m,
          calories: Math.round(m.calories * multiplier),
          protein: Math.round(m.protein * multiplier),
          carbs: Math.round(m.carbs * multiplier),
          fats: Math.round(m.fats * multiplier),
        };
      }
      return m;
    });
    setDailyStats(recalculateStats(tempMeals));
  }

  const handleEditSave = async (id: string, multiplier: number) => {
    const originalMeals = [...meals]; 
    const updatedMeals = meals.map(m => {
      if (m._id === id) {
        return {
          ...m,
          calories: Math.round(m.calories * multiplier),
          protein: Math.round(m.protein * multiplier),
          carbs: Math.round(m.carbs * multiplier),
          fats: Math.round(m.fats * multiplier),
          quantity: Math.round((m.quantity || m.baseQuantity) * multiplier)
        };
      }
      return m;
    });
    setMeals(updatedMeals);
    setDailyStats(recalculateStats(updatedMeals));
    
    setEditingQuantities(prev => {
      const next = {...prev}
      delete next[id]
      return next
    })

    const updatedMeal = updatedMeals.find(m => m._id === id);
    if (!updatedMeal) return;

    try {
      await mealsApi.update(id, {
        calories: updatedMeal.calories,
        protein: updatedMeal.protein,
        carbs: updatedMeal.carbs,
        fats: updatedMeal.fats,
        quantity: updatedMeal.quantity
      });
    } catch (error) {
      console.error("Failed to update meal", error)
      setMeals(originalMeals);
      setDailyStats(recalculateStats(originalMeals)); 
      alert("Failed to update meal. Please try again.");
    }
  }

  const addWater = async (amount: number) => {
    try {
      await hydrationApi.add(amount)
      setHydration(prev => Math.min(prev + amount, goals.water + 1000))
    } catch (error) {
      console.error("Failed to add water", error)
    }
  }

  const favorites = meals.filter(m => m.isFavorite)

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      {showGoalSettings && (
        <GoalSettings 
          profile={profile} 
          setProfile={setProfile} 
          onClose={() => setShowGoalSettings(false)} 
        />
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-orbitron tracking-wider">THE KITCHEN</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {profile.goal === 'muscle-gain' ? "Mode: Hypertrophy (Bulk)" : 
             profile.goal === 'fat-loss' ? "Mode: Cutting (Deficit)" : "Mode: Maintenance"}
          </p>
        </div>
        <div className="flex gap-2">
           <Button 
            variant="ghost" 
            onClick={() => setShowGoalSettings(true)} 
            className="text-primary"
            disabled={isLoading}
          >
            <Edit2 className="h-4 w-4 mr-2"/> Edit Goals
           </Button>
           <Button 
            variant="ghost" 
            size="icon"
            onClick={fetchDailyData}
            disabled={isLoading}
           >
             <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
           </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="meal" className="w-full">
        <TabsList className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-1 rounded-lg w-full md:w-auto">
          <TabsTrigger value="meal" className="gap-2">
            <Utensils className="w-4 h-4" />
            Meal
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

        {/* Meal Tab Content */}
        <TabsContent value="meal" className="mt-6">
          {/* Daily/Weekly Toggle for Meal Tab */}
          <div className="flex gap-2 w-fit mb-4">
            <Button 
              variant={viewMode === 'daily' ? 'default' : 'outline'} 
              onClick={() => setViewMode('daily')} 
              className="font-orbitron text-xs px-4"
              disabled={isLoading}
            >TODAY</Button>
            <Button 
              variant={viewMode === 'weekly' ? 'default' : 'outline'} 
              onClick={() => setViewMode('weekly')} 
              className="font-orbitron text-xs px-4"
              disabled={isLoading}
            >WEEKLY</Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-7 space-y-4 order-2 xl:order-1">
              <FoodSearch 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
                favorites={allMeals} // Pass global favorites
                onAddMeal={handleAddFavoriteToLog} // Pass favorite-to-log handler
                onToggleFavorite={(id, fav) => handleToggleFavorite(id, fav)} // Pass toggle handler
              />

              <div className="bg-card/80 border border-border rounded-2xl min-h-[500px] flex flex-col shadow-sm">
                <div className="p-5 border-b border-border flex justify-between items-center bg-muted/20">
                  <h2 className="text-lg font-bold text-foreground">
                    {viewMode === 'daily' ? "Today's Log" : "Weekly Overview"}
                  </h2>
                  {viewMode === 'daily' && (
                    <Button onClick={() => setIsAddMealOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-3 text-xs font-semibold shadow-sm">
                      <Plus className="h-3.5 w-3.5 mr-2"/> Add Meal
                    </Button>
                  )}
                </div>

                <div className="p-0">
                  {viewMode === 'daily' ? (
                    // Daily View
                    <>
                      {isLoading && meals.length === 0 ? (
                          <div className="h-64 flex items-center justify-center text-muted-foreground">
                              <span className="animate-pulse">Loading...</span>
                          </div>
                      ) : meals.length > 0 ? (
                          meals.map((meal) => {
                              let initialMultiplier = 1;
                              if (meal.quantity && meal.baseQuantity) {
                                  initialMultiplier = meal.quantity / meal.baseQuantity;
                              }
                              
                              return (
                                  <MealCard 
                                      key={meal._id}
                                      meal={{
                                        ...meal,
                                        id: meal._id,
                                        time: meal.time,
                                        calories: meal.calories,
                                        protein: meal.protein,
                                        carbs: meal.carbs,
                                        fats: meal.fats,
                                        micros: meal.micros || {},
                                        isFavorite: meal.isFavorite,
                                        baseQuantity: meal.baseQuantity || 100,
                                        quantity: meal.quantity
                                      }}
                                      onFavorite={() => handleToggleFavorite(meal._id, meal.isFavorite)} 
                                      onDelete={() => handleDeleteMeal(meal._id)}
                                      onDuplicate={() => handleDuplicate(meal)} 
                                      isEditing={editingQuantities[meal._id] !== undefined}
                                      onEditStart={() => setEditingQuantities({...editingQuantities, [meal._id]: [initialMultiplier]})}
                                      onEditSave={(id, mult) => handleEditSave(id, mult)}
                                      onEditCancel={() => {
                                          setEditingQuantities(prev => { const n = {...prev}; delete n[meal._id]; return n; })
                                          setDailyStats(recalculateStats(meals)); 
                                      }}
                                      editQuantity={editingQuantities[meal._id] || [initialMultiplier]}
                                      onQuantityChange={(val) => setEditingQuantities({...editingQuantities, [meal._id]: val})}
                                      onLiveEdit={handleLiveEdit}
                                      goal={profile.goal}
                                  />
                              )
                          })
                      ) : (
                          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                              <p className="text-sm mb-2">No meals logged yet.</p>
                              <Button variant="link" onClick={() => setIsAddMealOpen(true)} className="text-primary h-auto p-0">Log your first meal</Button>
                          </div>
                      )}
                    </>
                  ) : (
                    // Weekly View
                    <>
                      {isLoading ? (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                            <span className="animate-pulse">Loading weekly data...</span>
                        </div>
                      ) : weeklyMeals && weeklyTotals && weeklyGoals ? (
                        <WeeklyMealCard 
                          weeklyMeals={weeklyMeals}
                          weeklyTotals={weeklyTotals}
                          weeklyGoals={weeklyGoals}
                        />
                      ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                            <p className="text-sm mb-2">No weekly data available.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="xl:col-span-5 space-y-4 order-1 xl:order-2">
                <HydrationTracker 
                    current={hydration} 
                    target={goals.water} 
                    onAdd={addWater}
                    viewMode={viewMode}
                    weeklyData={weeklyHydration}
                    weeklyTotal={weeklyHydration.reduce((sum, day) => sum + day.amount, 0)}
                />
                <FuelGauge 
                    current={viewMode === 'daily' ? (dailyStats ? {
                        calories: dailyStats.totalCalories,
                        protein: dailyStats.totalProtein,
                        carbs: dailyStats.totalCarbs,
                        fats: dailyStats.totalFats
                    } : { calories: 0, protein: 0, carbs: 0, fats: 0 }) : (weeklyTotals || { calories: 0, protein: 0, carbs: 0, fats: 0 })} 
                    target={viewMode === 'daily' ? goals : (weeklyGoals || {
                      calories: goals.calories * 7,
                      protein: goals.protein * 7,
                      carbs: goals.carbs * 7,
                      fats: goals.fats * 7,
                      water: goals.water * 7
                    })} 
                    goal={profile.goal} 
                    viewMode={viewMode}
                    weeklyData={weeklyData}
                />
            </div>
          </div>
        </TabsContent>

        {/* History Tab Content */}
        <TabsContent value="history" className="mt-6">
          <MealHistory 
            goals={goals}
            onToggleFavorite={handleToggleFavorite}
          />
        </TabsContent>

        {/* Analytics Tab Content */}
        <TabsContent value="analytics" className="mt-6">
          <MealAnalytics 
            goals={goals}
            profile={profile}
          />
        </TabsContent>
      </Tabs>

      <AddMealModal 
        isOpen={isAddMealOpen} 
        onClose={() => setIsAddMealOpen(false)} 
        onAdd={handleAddMeal} 
      />
    </div>
  )
}