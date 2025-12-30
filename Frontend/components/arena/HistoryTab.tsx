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
      <Card className="p-12 text-center bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
        <p className="text-gray-600 dark:text-gray-400">Please log in to view workout history</p>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="p-12 text-center bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading workout history...</p>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-orbitron">Workout History</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View, edit, or delete your previous workouts
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total: {workouts.length} workouts
        </div>
      </div>

      {/* Tabs for All Workouts vs Daily Entries */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-1 rounded-lg">
          <TabsTrigger value="all" className="gap-2">
            <Dumbbell className="w-4 h-4" />
            All Workouts
          </TabsTrigger>
          <TabsTrigger value="daily" className="gap-2">
            <Calendar className="w-4 h-4" />
            Daily Entries
          </TabsTrigger>
        </TabsList>

        {/* All Workouts Tab */}
        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {groupedSets.length === 0 ? (
              <Card className="p-12 text-center bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
                <Dumbbell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No workout history yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Start logging your workouts to see them here
                </p>
              </Card>
            ) : (
              groupedSets.map((group, groupIndex) => (
                <Card 
                  key={groupIndex} 
                  className="bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex flex-col gap-4">
                      {/* Exercise Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {group.exercise}
                          </h3>
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                            {group.muscleGroup}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-medium rounded-full flex items-center gap-1">
                            <span>{getWeightTypeIcon(group.sets[0].weightType || 'dumbbell')}</span>
                            <span>{formatWeightType(group.sets[0].weightType || 'dumbbell')}</span>
                          </span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
                            {group.sets.length} set{group.sets.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(group.date)} • {formatTime(group.date)}
                        </div>
                      </div>

                      {/* Individual Sets */}
                      <div className="space-y-2">
                        {group.sets.map((workout, setIndex) => (
                          <div key={workout._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/30 rounded-lg">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[60px]">
                                Set {setIndex + 1}
                              </span>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {workout.sets[0].reps} reps × {workout.sets[0].weight} {workout.sets[0].unit}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                RPE {workout.rpe}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatTime(workout.date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(workout)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(workout)}
                                className="h-8 w-8 p-0"
                              >
                                <Info className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(workout._id!)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      {group.sets.length > 1 && (
                        <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
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
                </Card>
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
              <Card className="p-12 text-center bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No daily entries yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Start logging workouts to see daily summaries
                </p>
              </Card>
            ) : (
              Object.entries(groupWorkoutsByDate(workouts)).sort(([a], [b]) => 
                new Date(b).getTime() - new Date(a).getTime()
              ).map(([date, dayWorkouts]) => {
                const isExpanded = expandedDays.has(date)
                return (
                  <Card 
                    key={date}
                    className="bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 hover:shadow-md transition-shadow"
                  >
                    {/* Clickable Header */}
                    <div 
                      className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-black/20 transition-colors"
                      onClick={() => toggleDayExpansion(date)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatDate(date)}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {dayWorkouts.length} workout log{dayWorkouts.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {dayWorkouts.reduce((sum, w) => sum + w.sets.length, 0)} sets
                          </div>
                          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-gray-200 dark:border-white/10">
                        <div className="pt-4 space-y-3">
                          {groupRelatedSets(dayWorkouts).map((group, groupIndex) => (
                            <div key={groupIndex} className="p-4 bg-gray-50 dark:bg-black/30 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-base font-semibold text-gray-900 dark:text-white">
                                    {group.exercise}
                                  </span>
                                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                                    {group.muscleGroup}
                                  </span>
                                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-medium rounded-full flex items-center gap-1">
                                    <span>{getWeightTypeIcon(group.sets[0].weightType || 'dumbbell')}</span>
                                    <span>{formatWeightType(group.sets[0].weightType || 'dumbbell')}</span>
                                  </span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {group.sets.length} set{group.sets.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-400">
                                  {formatTime(group.date)}
                                </span>
                              </div>
                              
                              {/* Individual Sets */}
                              <div className="space-y-2">
                                {group.sets.map((workout, setIndex) => (
                                  <div key={workout._id} className="flex items-center justify-between p-2 bg-white dark:bg-black/40 rounded">
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[50px]">
                                        Set {setIndex + 1}
                                      </span>
                                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {workout.sets[0].reps} reps × {workout.sets[0].weight} {workout.sets[0].unit}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        RPE {workout.rpe}
                                      </span>
                                      <span className="text-xs text-gray-400">
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
                                        className="h-7 w-7 p-0"
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
                                        className="h-7 w-7 p-0"
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
                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Exercise Summary */}
                              {group.sets.length > 1 && (
                                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-white/20">
                                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
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
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-orbitron">Workout Details</DialogTitle>
            <DialogDescription>
              Complete information about this workout session
            </DialogDescription>
          </DialogHeader>
          
          {selectedWorkout && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Exercise</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                    {selectedWorkout.exercise}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Muscle Group</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                    {selectedWorkout.muscleGroup}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Weight Type</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                    <span>{getWeightTypeIcon(selectedWorkout.weightType || 'dumbbell')}</span>
                    <span>{formatWeightType(selectedWorkout.weightType || 'dumbbell')}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">RPE</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">
                    {selectedWorkout.rpe}/10
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">
                    {formatDate(selectedWorkout.date)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Time</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">
                    {formatTime(selectedWorkout.date)}
                  </p>
                </div>
              </div>

              {/* Sets Details */}
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Sets</label>
                <div className="mt-2 space-y-2">
                  {selectedWorkout.sets.map((set, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/30 rounded-lg">
                      <span className="font-medium">Set {index + 1}</span>
                      <span className="text-primary font-bold">
                        {set.reps} reps × {set.weight} {set.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {selectedWorkout.restTime && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Rest Time</label>
                    <p className="text-base text-gray-900 dark:text-white mt-1">
                      {selectedWorkout.restTime}
                    </p>
                  </div>
                )}
              </div>

              {selectedWorkout.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</label>
                  <p className="text-base text-gray-900 dark:text-white mt-2 p-3 bg-gray-50 dark:bg-black/30 rounded-lg">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-orbitron">Edit Workout</DialogTitle>
            <DialogDescription>
              Modify workout details and save changes
            </DialogDescription>
          </DialogHeader>
          
          {selectedWorkout && (
            <div className="space-y-6 mt-4">
              {/* Exercise and Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Exercise Name</Label>
                  <Input
                    value={editForm.exercise}
                    onChange={(e) => setEditForm({...editForm, exercise: e.target.value})}
                    placeholder="e.g. Bench Press"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Muscle Group</Label>
                  <select
                    value={editForm.muscleGroup}
                    onChange={(e) => setEditForm({...editForm, muscleGroup: e.target.value})}
                    className="mt-1 w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
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
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Weight Type</Label>
                  <select
                    value={editForm.weightType}
                    onChange={(e) => setEditForm({...editForm, weightType: e.target.value as any})}
                    className="mt-1 w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
                  >
                    {WEIGHT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reps</Label>
                  <Input
                    type="number"
                    value={editForm.reps || ''}
                    onChange={(e) => setEditForm({...editForm, reps: parseInt(e.target.value) || 0})}
                    placeholder="12"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Weight {editForm.weightType === 'bodyweight' ? '(Additional)' : ''}
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      value={editForm.weight || ''}
                      onChange={(e) => setEditForm({...editForm, weight: parseFloat(e.target.value) || 0})}
                      placeholder={editForm.weightType === 'bodyweight' ? '0' : '20'}
                      className="flex-1"
                    />
                    <select
                      value={editForm.unit}
                      onChange={(e) => setEditForm({...editForm, unit: e.target.value as 'kg' | 'lb'})}
                      className="bg-background border border-input rounded-md px-3 py-2 text-sm"
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
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</Label>
                  <Input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time</Label>
                  <Input
                    type="time"
                    value={editForm.time}
                    onChange={(e) => setEditForm({...editForm, time: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">RPE (1-10)</Label>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setEditForm({...editForm, rpe: n})}
                        className={`flex-1 h-8 rounded text-xs font-bold transition-all ${
                          editForm.rpe === n
                            ? "bg-primary text-primary-foreground shadow-md"
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
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rest Time (Optional)</Label>
                  <Input
                    value={editForm.restTime}
                    onChange={(e) => setEditForm({...editForm, restTime: e.target.value})}
                    placeholder="e.g. 90s, 2min"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</Label>
                  <Textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    placeholder="Additional notes..."
                    className="mt-1 h-20 resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isEditLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isEditLoading || !editForm.exercise.trim() || editForm.reps === 0}
                  className="bg-primary hover:bg-primary/90"
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


