"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Info, Edit, Trash2, Calendar, Clock, Activity, Dumbbell, Loader2, ChevronDown, Save } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getWorkouts, deleteWorkout, updateWorkout, Workout, groupWorkoutsByDate } from "@/services/workoutService"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "@/components/ui/sonner"

const MUSCLE_GROUPS = ['Chest', 'Triceps', 'Back', 'Biceps', 'Shoulders', 'Legs', 'Core', 'Cardio'] as const;
const WEIGHT_TYPES = [
    { value: 'dumbbell', label: 'Dumbbell', icon: '🏋️' },
    { value: 'barbell', label: 'Barbell', icon: '🏋️‍♂️' },
    { value: 'bodyweight', label: 'Bodyweight', icon: '🤸' },
    { value: 'machine', label: 'Machine', icon: '⚙️' },
    { value: 'cable', label: 'Cable', icon: '🔗' },
    { value: 'kettlebell', label: 'Kettlebell', icon: '🔔' },
    { value: 'resistance_band', label: 'Resistance Band', icon: '🎗️' }
] as const;

export function HistoryTab() {
  const { isAuthenticated } = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    exercise: "",
    muscleGroup: "",
    weightType: "dumbbell" as const,
    reps: 0,
    weight: 0,
    unit: "kg" as const,
    rpe: 7,
    restTime: "",
    notes: "",
    date: "",
    time: ""
  })
  const [isEditLoading, setIsEditLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkouts()
    }
  }, [isAuthenticated])

  const fetchWorkouts = async () => {
    try {
      setIsLoading(true)
      const response = await getWorkouts({ limit: 100 })
      setWorkouts(response.workouts)
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch workouts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (workout: Workout) => {
    setSelectedWorkout(workout)
    setIsDetailsOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedWorkout) return

    setIsEditLoading(true)
    try {
      // Create updated workout data
      const updatedDate = new Date(`${editForm.date}T${editForm.time}:00`)
      
      const updatedWorkout = {
        exercise: editForm.exercise.trim(),
        muscleGroup: editForm.muscleGroup,
        weightType: editForm.weightType,
        sets: [{
          reps: editForm.reps,
          weight: editForm.weight,
          unit: editForm.unit
        }],
        rpe: editForm.rpe,
        restTime: editForm.restTime.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
        date: updatedDate.toISOString()
      }

      await updateWorkout(selectedWorkout._id!, updatedWorkout)
      
      // Update local state
      setWorkouts(workouts.map(w => 
        w._id === selectedWorkout._id 
          ? { ...w, ...updatedWorkout }
          : w
      ))
      
      toast.success("Workout updated successfully!")
      setIsEditOpen(false)
      setSelectedWorkout(null)
    } catch (error: any) {
      toast.error(error.message || "Failed to update workout")
    } finally {
      setIsEditLoading(false)
    }
  }

  const handleEdit = (workout: Workout) => {
    const workoutDate = new Date(workout.date)
    setEditForm({
      exercise: workout.exercise,
      muscleGroup: workout.muscleGroup,
      weightType: workout.weightType || 'dumbbell',
      reps: workout.sets[0]?.reps || 0,
      weight: workout.sets[0]?.weight || 0,
      unit: workout.sets[0]?.unit || 'kg',
      rpe: workout.rpe,
      restTime: workout.restTime || "",
      notes: workout.notes || "",
      date: workoutDate.toISOString().split('T')[0], // YYYY-MM-DD format
      time: workoutDate.toTimeString().slice(0, 5) // HH:MM format
    })
    setSelectedWorkout(workout)
    setIsEditOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workout?")) return

    try {
      await deleteWorkout(id)
      setWorkouts(workouts.filter(w => w._id !== id))
      toast.success("Workout deleted successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete workout")
    }
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false // Use 24-hour format
    })
  }

  const getWeightTypeIcon = (weightType: string) => {
    const icons: Record<string, string> = {
      'dumbbell': '🏋️',
      'barbell': '🏋️‍♂️',
      'bodyweight': '🤸',
      'machine': '⚙️',
      'cable': '🔗',
      'kettlebell': '🔔',
      'resistance_band': '🎗️'
    }
    return icons[weightType] || '🏋️'
  }

  const formatWeightType = (weightType: string) => {
    const labels: Record<string, string> = {
      'dumbbell': 'Dumbbell',
      'barbell': 'Barbell',
      'bodyweight': 'Bodyweight',
      'machine': 'Machine',
      'cable': 'Cable',
      'kettlebell': 'Kettlebell',
      'resistance_band': 'Resistance Band'
    }
    return labels[weightType] || 'Dumbbell'
  }

  // Group workouts by exercise and time proximity for better display
  const groupRelatedSets = (workouts: Workout[]) => {
    const grouped: { [key: string]: Workout[] } = {}
    
    workouts.forEach(workout => {
      // Create a key based on exercise, date (rounded to nearest 10 minutes), and muscle group
      const date = new Date(workout.date)
      const roundedTime = new Date(Math.floor(date.getTime() / (10 * 60 * 1000)) * (10 * 60 * 1000))
      const key = `${workout.exercise}-${workout.muscleGroup}-${roundedTime.toISOString()}`
      
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(workout)
    })
    
    return Object.values(grouped).map(group => {
      // Sort sets by time (earliest first) so Set 1 has the earliest time
      const sortedSets = group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      return {
        exercise: sortedSets[0].exercise,
        muscleGroup: sortedSets[0].muscleGroup,
        date: sortedSets[0].date,
        sets: sortedSets,
        totalSets: sortedSets.reduce((sum, w) => sum + w.sets.length, 0),
        rpe: sortedSets[0].rpe,
        restTime: sortedSets[0].restTime
      }
    })
  }

  const groupedSets = groupRelatedSets(workouts)

  if (!isAuthenticated) {
    return (
      <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 p-12 text-center">
        <p className="text-muted-foreground">Please log in to view workout history</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 p-12 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-red-500 mb-4" />
        <p className="text-muted-foreground">Loading workout history...</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-inter">Workout History</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View, edit, or delete your previous workouts
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {workouts.length} workouts
        </div>
      </div>

      {/* Tabs for All Workouts vs Daily Entries */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card/80 backdrop-blur-xl border border-border/50 p-1 rounded-2xl shadow-lg shadow-primary/5">
          <TabsTrigger value="all" className="gap-2 rounded-xl font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/25">
            <Dumbbell className="w-4 h-4" />
            All Workouts
          </TabsTrigger>
          <TabsTrigger value="daily" className="gap-2 rounded-xl font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/25">
            <Calendar className="w-4 h-4" />
            Daily Entries
          </TabsTrigger>
        </TabsList>

        {/* All Workouts Tab */}
        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {groupedSets.length === 0 ? (
              <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 p-12 text-center">
                <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-4" />
                <p className="text-muted-foreground font-medium">No workout history yet</p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  Start logging your workouts to see them here
                </p>
              </div>
            ) : (
              groupedSets.map((group, groupIndex) => (
                <div 
                  key={groupIndex} 
                  className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-200"
                >
                  <div className="p-6">
                    <div className="flex flex-col gap-4">
                      {/* Exercise Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-foreground">
                            {group.exercise}
                          </h3>
                          <span className="px-2 py-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-500 text-xs font-semibold rounded-full border border-red-500/30">
                            {group.muscleGroup}
                          </span>
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-xs font-medium rounded-full flex items-center gap-1 border border-blue-500/20">
                            <span>{getWeightTypeIcon(group.sets[0].weightType || 'dumbbell')}</span>
                            <span>{formatWeightType(group.sets[0].weightType || 'dumbbell')}</span>
                          </span>
                          <span className="px-2 py-1 bg-muted/50 text-muted-foreground text-xs font-medium rounded-full">
                            {group.sets.length} set{group.sets.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(group.date)} • {formatTime(group.date)}
                        </div>
                      </div>

                      {/* Individual Sets */}
                      <div className="space-y-2">
                        {group.sets.map((workout, setIndex) => (
                          <div key={workout._id} className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-muted-foreground min-w-[60px]">
                                Set {setIndex + 1}
                              </span>
                              <span className="text-sm font-bold text-foreground">
                                {workout.sets[0].reps} reps × {workout.sets[0].weight} {workout.sets[0].unit}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                RPE {workout.rpe}
                              </span>
                              <span className="text-xs text-muted-foreground/70">
                                {formatTime(workout.date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(workout)}
                                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 rounded-lg"
                                title="Edit workout"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(workout)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
                              >
                                <Info className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(workout._id!)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      {group.sets.length > 1 && (
                        <div className="pt-2 border-t border-border">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Total Volume: {group.sets.reduce((sum, w) => {
                              const set = w.sets[0]
                              const weightInKg = set.unit === 'lb' ? set.weight * 0.453592 : set.weight
                              return sum + (set.reps * weightInKg)
                            }, 0).toFixed(1)} kg</span>
                            <span>Average RPE: {(group.sets.reduce((sum, w) => sum + w.rpe, 0) / group.sets.length).toFixed(1)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Daily Entries Tab */}
        <TabsContent value="daily" className="mt-6">
          <div className="space-y-4">
            {Object.entries(groupWorkoutsByDate(workouts)).sort(([a], [b]) => 
              new Date(b).getTime() - new Date(a).getTime()
            ).length === 0 ? (
              <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-4" />
                <p className="text-muted-foreground font-medium">No daily entries yet</p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  Start logging workouts to see daily summaries
                </p>
              </div>
            ) : (
              Object.entries(groupWorkoutsByDate(workouts)).sort(([a], [b]) => 
                new Date(b).getTime() - new Date(a).getTime()
              ).map(([date, dayWorkouts]) => {
                const isExpanded = expandedDays.has(date)
                return (
                  <div 
                    key={date}
                    className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-200"
                  >
                    {/* Clickable Header */}
                    <div 
                      className="p-6 cursor-pointer hover:bg-background/30 transition-colors rounded-t-3xl"
                      onClick={() => toggleDayExpansion(date)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">
                            {formatDate(date)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {dayWorkouts.length} workout log{dayWorkouts.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-muted-foreground">
                            {dayWorkouts.reduce((sum, w) => sum + w.sets.length, 0)} sets
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
                        <div className="pt-4 space-y-3">
                          {groupRelatedSets(dayWorkouts).map((group, groupIndex) => (
                            <div key={groupIndex} className="p-4 bg-background/50 rounded-xl border border-border backdrop-blur-sm">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-base font-semibold text-foreground">
                                    {group.exercise}
                                  </span>
                                  <span className="px-2 py-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-500 text-xs font-semibold rounded-full border border-red-500/30">
                                    {group.muscleGroup}
                                  </span>
                                  <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-xs font-medium rounded-full flex items-center gap-1 border border-blue-500/20">
                                    <span>{getWeightTypeIcon(group.sets[0].weightType || 'dumbbell')}</span>
                                    <span>{formatWeightType(group.sets[0].weightType || 'dumbbell')}</span>
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {group.sets.length} set{group.sets.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <span className="text-sm text-muted-foreground/70">
                                  {formatTime(group.date)}
                                </span>
                              </div>
                              
                              {/* Individual Sets */}
                              <div className="space-y-2">
                                {group.sets.map((workout, setIndex) => (
                                  <div key={workout._id} className="flex items-center justify-between p-2 bg-background/80 rounded-lg border border-border/50">
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-medium text-muted-foreground min-w-[50px]">
                                        Set {setIndex + 1}
                                      </span>
                                      <span className="text-sm font-bold text-foreground">
                                        {workout.sets[0].reps} reps × {workout.sets[0].weight} {workout.sets[0].unit}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        RPE {workout.rpe}
                                      </span>
                                      <span className="text-xs text-muted-foreground/70">
                                        {formatTime(workout.date)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEdit(workout)
                                        }}
                                        className="h-7 w-7 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 rounded-lg"
                                        title="Edit workout"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleViewDetails(workout)
                                        }}
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
                                      >
                                        <Info className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDelete(workout._id!)
                                        }}
                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Exercise Summary */}
                              {group.sets.length > 1 && (
                                <div className="mt-3 pt-2 border-t border-border">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Volume: {group.sets.reduce((sum, w) => {
                                      const set = w.sets[0]
                                      const weightInKg = set.unit === 'lb' ? set.weight * 0.453592 : set.weight
                                      return sum + (set.reps * weightInKg)
                                    }, 0).toFixed(1)} kg</span>
                                    <span>Avg RPE: {(group.sets.reduce((sum, w) => sum + w.rpe, 0) / group.sets.length).toFixed(1)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
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
            <DialogTitle className="text-2xl font-inter">Workout Details</DialogTitle>
            <DialogDescription>
              Complete information about this workout session
            </DialogDescription>
          </DialogHeader>
          
          {selectedWorkout && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Exercise</label>
                  <p className="text-lg font-semibold text-foreground mt-1">
                    {selectedWorkout.exercise}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Muscle Group</label>
                  <p className="text-lg font-semibold text-foreground mt-1">
                    {selectedWorkout.muscleGroup}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Weight Type</label>
                  <p className="text-lg font-semibold text-foreground mt-1 flex items-center gap-2">
                    <span>{getWeightTypeIcon(selectedWorkout.weightType || 'dumbbell')}</span>
                    <span>{formatWeightType(selectedWorkout.weightType || 'dumbbell')}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">RPE</label>
                  <p className="text-base text-foreground mt-1">
                    {selectedWorkout.rpe}/10
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p className="text-base text-foreground mt-1">
                    {formatDate(selectedWorkout.date)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Time</label>
                  <p className="text-base text-foreground mt-1">
                    {formatTime(selectedWorkout.date)}
                  </p>
                </div>
              </div>

              {/* Sets Details */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sets</label>
                <div className="mt-2 space-y-2">
                  {selectedWorkout.sets.map((set, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border backdrop-blur-sm">
                      <span className="font-medium">Set {index + 1}</span>
                      <span className="text-red-500 font-bold">
                        {set.reps} reps × {set.weight} {set.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {selectedWorkout.restTime && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Rest Time</label>
                    <p className="text-base text-foreground mt-1">
                      {selectedWorkout.restTime}
                    </p>
                  </div>
                )}
              </div>

              {selectedWorkout.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-base text-foreground mt-2 p-3 bg-background/50 rounded-xl border border-border backdrop-blur-sm">
                    {selectedWorkout.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border border-border rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-inter">Edit Workout</DialogTitle>
            <DialogDescription>
              Modify workout details and save changes
            </DialogDescription>
          </DialogHeader>
          
          {selectedWorkout && (
            <div className="space-y-6 mt-4">
              {/* Exercise and Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-foreground">Exercise Name</Label>
                  <Input
                    value={editForm.exercise}
                    onChange={(e) => setEditForm({...editForm, exercise: e.target.value})}
                    placeholder="e.g. Bench Press"
                    className="mt-1 bg-background/50 border-border backdrop-blur-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground">Muscle Group</Label>
                  <select
                    value={editForm.muscleGroup}
                    onChange={(e) => setEditForm({...editForm, muscleGroup: e.target.value})}
                    className="mt-1 w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-sm backdrop-blur-sm"
                  >
                    {MUSCLE_GROUPS.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Weight Type and Set Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-foreground">Weight Type</Label>
                  <select
                    value={editForm.weightType}
                    onChange={(e) => setEditForm({...editForm, weightType: e.target.value as any})}
                    className="mt-1 w-full bg-background/50 border border-border rounded-xl px-3 py-2 text-sm backdrop-blur-sm"
                  >
                    {WEIGHT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground">Reps</Label>
                  <Input
                    type="number"
                    value={editForm.reps || ''}
                    onChange={(e) => setEditForm({...editForm, reps: parseInt(e.target.value) || 0})}
                    placeholder="12"
                    className="mt-1 bg-background/50 border-border backdrop-blur-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground">
                    Weight {editForm.weightType === 'bodyweight' ? '(Additional)' : ''}
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      value={editForm.weight || ''}
                      onChange={(e) => setEditForm({...editForm, weight: parseFloat(e.target.value) || 0})}
                      placeholder={editForm.weightType === 'bodyweight' ? '0' : '20'}
                      className="flex-1 bg-background/50 border-border backdrop-blur-sm"
                    />
                    <select
                      value={editForm.unit}
                      onChange={(e) => setEditForm({...editForm, unit: e.target.value as 'kg' | 'lb'})}
                      className="bg-background/50 border border-border rounded-xl px-3 py-2 text-sm backdrop-blur-sm"
                    >
                      <option value="kg">KG</option>
                      <option value="lb">LB</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Date, Time, and RPE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-foreground">Date</Label>
                  <Input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                    className="mt-1 bg-background/50 border-border backdrop-blur-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground">Time</Label>
                  <Input
                    type="time"
                    value={editForm.time}
                    onChange={(e) => setEditForm({...editForm, time: e.target.value})}
                    className="mt-1 bg-background/50 border-border backdrop-blur-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground">RPE (1-10)</Label>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setEditForm({...editForm, rpe: n})}
                        className={`flex-1 h-8 rounded text-xs font-bold transition-all ${
                          editForm.rpe === n
                            ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rest Time and Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-foreground">Rest Time (Optional)</Label>
                  <Input
                    value={editForm.restTime}
                    onChange={(e) => setEditForm({...editForm, restTime: e.target.value})}
                    placeholder="e.g. 90s, 2min"
                    className="mt-1 bg-background/50 border-border backdrop-blur-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground">Notes (Optional)</Label>
                  <Textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    placeholder="Additional notes..."
                    className="mt-1 h-20 resize-none bg-background/50 border-border backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isEditLoading}
                  className="border-border/50 text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isEditLoading || !editForm.exercise.trim() || editForm.reps === 0}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl"
                >
                  {isEditLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


