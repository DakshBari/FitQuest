"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Edit2, Plus, RefreshCw, Utensils, History, BarChart3, Sparkles } from "lucide-react"
import { FuelGauge } from "@/components/kitchen/FuelGauge"
import { HydrationTracker } from "@/components/kitchen/HydrationTracker"
import { MealCard } from "@/components/kitchen/MealCard"
import { WeeklyMealCard } from "@/components/kitchen/WeeklyMealCard"
import { FoodSearch } from "@/components/kitchen/FoodSearch"
import { GoalSettings, GoalType } from "@/components/kitchen/GoalSettings"
import { AddMealModal } from "@/components/kitchen/AddMealModal"
import { MealHistory } from "@/components/kitchen/MealHistory"
import { MealAnalytics } from "@/components/kitchen/MealAnalytics"
import { AISuggestions } from "@/components/kitchen/AISuggestions"
import { useApi } from "@/hooks/useApi"
import { getCurrentTime } from "@/lib/timeUtils"
import { getThemeClasses } from "@/lib/pageThemes"
import { cn } from "@/lib/utils"
import { PageHeader, ThemedButton } from "@/components/page-header"
import { ThemedTabsTrigger } from "@/components/themed-tabs"
import { ProtectedLayout } from "@/components/layouts/ProtectedLayout"
import { useAuth } from "@/contexts/AuthContext"

export default function KitchenPage() {
  const api = useApi()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const pathname = usePathname()
  const themeClasses = getThemeClasses(pathname)
  const [showGoalSettings, setShowGoalSettings] = useState(false)
  const [profile, setProfile] = useState({
    weight: 75, 
    height: 180, 
    bodyType: 'mesomorph' as 'ectomorph' | 'mesomorph' | 'endomorph',
    goal: 'muscle-gain' as GoalType,
    foodPreference: 'non-veg' as 'non-veg' | 'veg' | 'vegan' | 'jain'
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
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  
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
      const data = await api.meals.getDaily()
      setMeals(data.meals || [])
      setDailyStats({
        totalCalories: data.totalCalories || 0,
        targetCalories: data.targetCalories || 2200,
        totalProtein: data.protein || 0,
        totalCarbs: data.carbs || 0,
        totalFats: data.fats || 0,
        targetProtein: data.targetProtein || 150,
        targetCarbs: data.targetCarbs || 200,
        targetFats: data.targetFats || 70
      })
    } catch (error) {
      console.error("Failed to fetch daily data", error)
    } finally {
      setIsLoading(false)
    }
  }

  // NEW: Fetch all meals to populate global favorites
  const fetchFavorites = async () => {
    try {
      const data = await api.meals.getFavorites()
      setAllMeals(data.favorites || []);
    } catch (error) {
      console.error("Failed to fetch favorites", error)
    }
  }

  const fetchWeeklyData = async () => {
    setIsLoading(true)
    try {
      const [mealsData, hydrationData] = await Promise.all([
        api.call('/api/meals/weekly-detailed?timezoneOffset=' + new Date().getTimezoneOffset()),
        api.call('/api/hydration/weekly?timezoneOffset=' + new Date().getTimezoneOffset())
      ])
      
      setWeeklyMeals(mealsData.weeklyMeals)
      setWeeklyTotals(mealsData.weeklyTotals)
      setWeeklyGoals(mealsData.weeklyGoals)
      setWeeklyHydration(hydrationData.weeklyHydration)
      
      // Also get the simple weekly data for fuel gauge
      const simpleWeeklyData = await api.call('/api/meals/weekly?timezoneOffset=' + new Date().getTimezoneOffset())
      setWeeklyData(simpleWeeklyData.weeklyData)
    } catch (error) {
      console.error("Failed to fetch weekly data", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHydration = async () => {
    try {
      const data = await api.hydration.getToday()
      console.log('Hydration data:', data) // Debug log
      setHydration(data.hydration?.amount || 0)
    } catch (error) {
      console.error("Failed to fetch hydration", error)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchUserProfile()
      fetchDailyData()
      fetchHydration()
      fetchFavorites() // Fetch all favorites
    }
  }, [isAuthenticated, authLoading])

  const fetchUserProfile = async () => {
    try {
      const data = await api.call('/api/users/profile')
      if (data.user) {
        setProfile({
          weight: data.user.profile?.weight || 75,
          height: data.user.profile?.height || 180,
          bodyType: data.user.profile?.bodyType || 'mesomorph',
          goal: data.user.profile?.goal === 'weight-loss' ? 'fat-loss' : (data.user.profile?.goal || 'muscle-gain'),
          foodPreference: data.user.profile?.foodPreference || 'non-veg'
        })
        setGoals({
          calories: data.user.goals?.calories || 2000,
          protein: data.user.goals?.protein || 150,
          carbs: data.user.goals?.carbs || 200,
          fats: data.user.goals?.fats || 65,
          water: data.user.goals?.water || 3000
        })
      }
    } catch (error) {
      console.error("Failed to fetch user profile", error)
    }
  }

  const handleSaveGoals = async (newProfile: any, newGoals: any) => {
    try {
      await api.call('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          profile: {
            weight: newProfile.weight,
            height: newProfile.height,
            bodyType: newProfile.bodyType,
            goal: newProfile.goal === 'fat-loss' ? 'weight-loss' : newProfile.goal,
            foodPreference: newProfile.foodPreference
          },
          goals: newGoals
        })
      })
      setProfile(newProfile)
      setGoals(newGoals)
      // Refresh data to reflect new goals
      await fetchDailyData()
    } catch (error) {
      console.error("Failed to save goals", error)
      throw error
    }
  }

  useEffect(() => {
    if (viewMode === 'weekly') {
      fetchWeeklyData()
    }
  }, [viewMode])

  // --- Handlers ---

  const handleAddMeal = async (newMeal: any) => {
    setIsLoading(true)
    try {
      await api.meals.add(newMeal)
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
      await api.meals.addFavoriteToLog(favorite._id || favorite.id, {
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
      await api.meals.delete(id)
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
      
      await api.meals.add(newMeal)
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
      await api.meals.toggleFavorite(id)
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
      await api.meals.update(id, {
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
      await api.hydration.add(amount)
      // Refetch hydration data to get the actual total from server
      await fetchHydration()
    } catch (error) {
      console.error("Failed to add water", error)
    }
  }

  const favorites = meals.filter(m => m.isFavorite)

  return (
    <ProtectedLayout>
      <div className="min-h-screen flex flex-col bg-background">
      {showGoalSettings && (
        <GoalSettings 
          profile={profile} 
          setProfile={setProfile} 
          onClose={() => setShowGoalSettings(false)}
          onSave={handleSaveGoals}
        />
      )}

      <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 flex-1 flex flex-col">
        {/* Show AI Suggestions or Normal Content */}
        {showAISuggestions ? (
          <div className="flex-1 pb-8 pt-8">
            <AISuggestions 
              onBack={() => setShowAISuggestions(false)}
              profile={profile}
              goals={goals}
              dailyStats={dailyStats}
            />
          </div>
        ) : (
          <>
            {/* Modern Header */}
            <PageHeader 
              className="px-0"
              title="The Kitchen"
              subtitle={profile.goal === 'muscle-gain' ? "Mode: Hypertrophy (Bulk)" : 
                       profile.goal === 'fat-loss' ? "Mode: Cutting (Deficit)" : "Mode: Maintenance"}
              actions={
                <>
                  <ThemedButton 
                    variant="outline" 
                    onClick={() => setShowAISuggestions(true)} 
                    disabled={isLoading}
                    className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30 hover:from-violet-500/20 hover:to-purple-500/20 hover:border-violet-500/50"
                  >
                    <Sparkles className="h-4 w-4 mr-2 text-violet-400"/> AI Insights
                  </ThemedButton>
                  <ThemedButton 
                    variant="outline" 
                    onClick={() => setShowGoalSettings(true)} 
                    disabled={isLoading}
                  >
                    <Edit2 className="h-4 w-4 mr-2"/> Profile
                  </ThemedButton>
                  <ThemedButton 
                    variant="outline" 
                    size="icon"
                    onClick={fetchDailyData}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </ThemedButton>
                </>
              }
            />

            {/* Main Content */}
            <div className="flex-1 pb-8">
        {/* Tabs */}
        <Tabs defaultValue="meal" className="w-full">
          <TabsList className="bg-card/80 backdrop-blur-xl border border-border/50 p-1 rounded-2xl w-full md:w-auto shadow-lg shadow-black/5 mb-6">
            <ThemedTabsTrigger value="meal" icon={Utensils}>
              Meal
            </ThemedTabsTrigger>
            <ThemedTabsTrigger value="history" icon={History}>
              History
            </ThemedTabsTrigger>
            <ThemedTabsTrigger value="analytics" icon={BarChart3}>
              Analytics
            </ThemedTabsTrigger>
          </TabsList>

          {/* Meal Tab Content */}
          <TabsContent value="meal" className="mt-0">
            {/* Daily/Weekly Toggle for Meal Tab */}
            {/* Daily/Weekly Toggle */}
            <div className="flex gap-2 w-fit mb-6">
              <Button
                onClick={() => setViewMode('daily')}
                className={`font-semibold text-xs px-6 py-2.5 rounded-xl transition-all duration-300 ${
                  viewMode === 'daily'
                    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25 border-0"
                    : "border border-border/60 text-muted-foreground hover:text-foreground bg-card/80 hover:bg-violet-500/10 hover:border-violet-500/30"
                }`}
                disabled={isLoading}
              >TODAY</Button>
              <Button
                onClick={() => setViewMode('weekly')}
                className={`font-semibold text-xs px-6 py-2.5 rounded-xl transition-all duration-300 ${
                  viewMode === 'weekly'
                    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25 border-0"
                    : "border border-border/60 text-muted-foreground hover:text-foreground bg-card/80 hover:bg-violet-500/10 hover:border-violet-500/30"
                }`}
                disabled={isLoading}
              >WEEKLY</Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              <div className="xl:col-span-7 space-y-5 order-2 xl:order-1">
                <FoodSearch 
                  searchQuery={searchQuery} 
                  setSearchQuery={setSearchQuery} 
                  favorites={allMeals} // Pass global favorites
                  onAddMeal={handleAddFavoriteToLog} // Pass favorite-to-log handler
                  onToggleFavorite={(id, fav) => handleToggleFavorite(id, fav)} // Pass toggle handler
                />

                <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 ring-1 ring-border/30">
                  <div className="p-8 border-b border-border bg-gradient-to-r from-violet-500/10 via-transparent to-purple-500/10 rounded-t-3xl">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-foreground font-inter tracking-tight">
                        {viewMode === 'daily' ? "Today's Log" : "Weekly Overview"}
                      </h2>
                      {viewMode === 'daily' && (
                        <Button 
                          onClick={() => setIsAddMealOpen(true)} 
                          className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white border-0 shadow-xl shadow-violet-500/30 rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/40 ring-1 ring-violet-400/20 px-6 py-3"
                        >
                          <Plus className="h-4 w-4 mr-2"/> Add Meal
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="p-0">
                    {viewMode === 'daily' ? (
                      // Daily View
                      <>
                        {isLoading && meals.length === 0 ? (
                            <div className="h-72 flex items-center justify-center text-muted-foreground">
                                <div className="flex items-center space-x-4">
                                  <div className="flex space-x-2">
                                    <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce shadow-lg shadow-violet-400/50"></div>
                                    <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce shadow-lg shadow-violet-400/50" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce shadow-lg shadow-violet-400/50" style={{animationDelay: '0.2s'}}></div>
                                  </div>
                                  <span className="text-base font-medium">Loading meals...</span>
                                </div>
                            </div>
                        ) : meals.length > 0 ? (
                            <div className="space-y-0">
                              {meals.map((meal) => {
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
                                            quantity: meal.quantity,
                                            quantityType: meal.quantityType || 'weight'
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
                              })}
                            </div>
                        ) : (
                            <div className="h-72 flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-br from-violet-500/5 to-purple-500/5 m-8 rounded-3xl border border-violet-500/20 ring-1 ring-violet-500/10">
                                <Utensils className="h-20 w-20 mb-6 opacity-40 text-violet-400" />
                                <p className="text-lg mb-3 font-semibold text-foreground">No meals logged yet.</p>
                                <Button variant="link" onClick={() => setIsAddMealOpen(true)} className="text-violet-400 hover:text-violet-300 h-auto p-0 font-semibold text-base transition-all duration-300">Log your first meal</Button>
                            </div>
                        )}
                      </>
                    ) : (
                      // Weekly View
                      <>
                        {isLoading ? (
                          <div className="h-72 flex items-center justify-center text-muted-foreground">
                              <div className="flex items-center space-x-4">
                                <div className="flex space-x-2">
                                  <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce shadow-lg shadow-violet-400/50"></div>
                                  <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce shadow-lg shadow-violet-400/50" style={{animationDelay: '0.1s'}}></div>
                                  <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce shadow-lg shadow-violet-400/50" style={{animationDelay: '0.2s'}}></div>
                                </div>
                                <span className="text-base font-medium">Loading weekly data...</span>
                              </div>
                          </div>
                        ) : weeklyMeals && weeklyTotals && weeklyGoals ? (
                          <div className="p-8">
                            <WeeklyMealCard 
                              weeklyMeals={weeklyMeals}
                              weeklyTotals={weeklyTotals}
                              weeklyGoals={weeklyGoals}
                            />
                          </div>
                        ) : (
                          <div className="h-72 flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-br from-violet-500/5 to-purple-500/5 m-8 rounded-3xl border border-violet-500/20 ring-1 ring-violet-500/10">
                              <BarChart3 className="h-20 w-20 mb-6 opacity-40 text-violet-400" />
                              <p className="text-lg mb-3 font-semibold text-foreground">No weekly data available.</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right sidebar */}
              <div className="xl:col-span-5 space-y-5 order-1 xl:order-2 xl:sticky xl:top-20 xl:self-start">
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
          <TabsContent value="history" className="mt-0">
            <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 ring-1 ring-border/30">
              <div className="p-8 border-b border-border bg-gradient-to-r from-violet-500/10 via-transparent to-purple-500/10 rounded-t-3xl">
                <h2 className="text-2xl font-bold text-foreground font-inter tracking-tight">Meal History</h2>
                <p className="text-base text-muted-foreground mt-2">Track your nutrition journey</p>
              </div>
              <div className="p-8">
                <MealHistory 
                  goals={goals}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab Content */}
          <TabsContent value="analytics" className="mt-0">
            <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 ring-1 ring-border/30">
              <div className="p-8 border-b border-border bg-gradient-to-r from-violet-500/10 via-transparent to-purple-500/10 rounded-t-3xl">
                <h2 className="text-2xl font-bold text-foreground font-inter tracking-tight">Nutrition Analytics</h2>
                <p className="text-base text-muted-foreground mt-2">Insights and trends</p>
              </div>
              <div className="p-8">
                <MealAnalytics 
                  goals={goals}
                  profile={profile}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AddMealModal 
        isOpen={isAddMealOpen} 
        onClose={() => setIsAddMealOpen(false)} 
        onAdd={handleAddMeal} 
      />
      </>
      )}
      </div>
    </div>
    </ProtectedLayout>
  )
}