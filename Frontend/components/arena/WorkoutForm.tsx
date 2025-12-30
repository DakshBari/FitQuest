"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Save, Calendar, Dumbbell, ChevronDown, Activity, Clock, Gamepad2, Loader2 } from "lucide-react"
import { createWorkout, ExerciseSet } from "@/services/workoutService"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

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

export function WorkoutForm({ onSave, onSwitchMode }: { onSave: () => void; onSwitchMode?: () => void }) {
    const { isAuthenticated } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    
    // Form state
    const [exercise, setExercise] = useState("")
    const [muscleGroup, setMuscleGroup] = useState<string>("Chest")
    const [weightType, setWeightType] = useState<string>("dumbbell")
    const [workoutTime, setWorkoutTime] = useState(() => {
        const now = new Date()
        return now.toTimeString().slice(0, 5) // HH:MM format
    })
    const [sets, setSets] = useState<ExerciseSet[]>([])
    const [currentSet, setCurrentSet] = useState<ExerciseSet>({ reps: 0, weight: 0, unit: "kg" })
    const [rpe, setRpe] = useState(7)
    const [restTime, setRestTime] = useState("")
    const [notes, setNotes] = useState("")

    const handleAddSet = () => {
        if (currentSet.reps > 0 && currentSet.weight >= 0) {
            setSets([...sets, currentSet])
            setCurrentSet({ reps: 0, weight: 0, unit: currentSet.unit })
        }
    }

    const handleRemoveSet = (index: number) => {
        setSets(sets.filter((_, i) => i !== index))
    }

    const handleSaveWorkout = async () => {
        if (!isAuthenticated) {
            toast.error("Please log in to save workouts")
            return
        }

        if (!exercise.trim()) {
            toast.error("Please enter an exercise name")
            return
        }

        if (sets.length === 0) {
            toast.error("Please add at least one set")
            return
        }

        // Make rest time mandatory for multiple sets
        if (sets.length > 1 && !restTime.trim()) {
            toast.error("Rest time is required when logging multiple sets")
            return
        }

        setIsLoading(true)
        try {
            // Parse rest time to seconds for calculation
            const parseRestTime = (restTimeStr: string): number => {
                if (!restTimeStr) return 0
                const match = restTimeStr.match(/(\d+)\s*(s|sec|seconds?|m|min|minutes?)?/i)
                if (!match) return 60 // Default to 60 seconds if can't parse
                
                const value = parseInt(match[1])
                const unit = match[2]?.toLowerCase() || 's'
                
                if (unit.startsWith('m')) return value * 60 // minutes to seconds
                return value // seconds
            }

            const restTimeSeconds = parseRestTime(restTime.trim())
            
            // Create base date with custom time
            const baseDate = new Date()
            const [hours, minutes] = workoutTime.split(':').map(Number)
            baseDate.setHours(hours, minutes, 0, 0)
            
            let totalXpGained = 0

            // Create separate workout logs for each set with time intervals
            for (let i = 0; i < sets.length; i++) {
                const setDate = new Date(baseDate.getTime() + (i * restTimeSeconds * 1000))
                
                const workoutData = {
                    exercise: exercise.trim(),
                    muscleGroup,
                    weightType: weightType as 'dumbbell' | 'barbell' | 'bodyweight' | 'machine' | 'cable' | 'kettlebell' | 'resistance_band',
                    sets: [sets[i]], // Single set per workout log
                    rpe,
                    restTime: i < sets.length - 1 ? restTime.trim() : undefined, // No rest time for last set
                    notes: i === 0 ? notes.trim() || undefined : `Set ${i + 1}${notes.trim() ? ` - ${notes.trim()}` : ''}`,
                    date: setDate.toISOString()
                }

                const response = await createWorkout(workoutData)
                if (response.xpGained) {
                    totalXpGained += response.xpGained
                }
            }
            
            toast.success(`${sets.length} sets saved as separate logs! ${totalXpGained ? `+${totalXpGained} XP earned!` : ''}`)
            
            // Reset form
            setExercise("")
            setMuscleGroup("Chest")
            setWeightType("dumbbell")
            setWorkoutTime(() => {
                const now = new Date()
                return now.toTimeString().slice(0, 5)
            })
            setSets([])
            setCurrentSet({ reps: 0, weight: 0, unit: "kg" })
            setRpe(7)
            setRestTime("")
            setNotes("")
            
            onSave()
        } catch (error: any) {
            toast.error(error.message || "Failed to save workout")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full">
            <div className="bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 backdrop-blur-xl p-6 md:p-8 lg:p-10 rounded-2xl shadow-2xl">
                
                {/* A. Header & Muscle Group */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Dumbbell className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-orbitron tracking-tight">Workout Logger</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your progress and PRs</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                        {/* Muscle Group Selector */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:block">Target</span>
                            <div className="relative">
                                <select 
                                    value={muscleGroup}
                                    onChange={(e) => setMuscleGroup(e.target.value)}
                                    className="appearance-none bg-gray-50 dark:bg-black/50 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white px-4 py-2.5 pr-8 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 font-medium shadow-sm cursor-pointer transition-colors w-full md:w-64"
                                >
                                    {MUSCLE_GROUPS.map(group => (
                                        <option key={group} value={group}>{group}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Mode Toggle Button - Top Right */}
                        {onSwitchMode && (
                            <Button
                                onClick={onSwitchMode}
                                variant="outline"
                                className="bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 px-4 py-2.5 font-semibold transition-all whitespace-nowrap"
                            >
                                <Gamepad2 className="h-4 w-4 mr-2"/> Switch to Learn / Game Mode
                            </Button>
                        )}
                    </div>
                </div>

                {/* B. Main Form Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                    
                    {/* B.1 Exercise Name (Spans 4 cols) */}
                    <div className="lg:col-span-4">
                        <Label className="text-gray-700 dark:text-gray-300 font-medium mb-2 block">Exercise Name</Label>
                        <div className="relative">
                            <Input 
                                value={exercise}
                                onChange={(e) => setExercise(e.target.value)}
                                placeholder="e.g. Incline Dumbbell Press" 
                                className="pl-10 bg-gray-50 dark:bg-black/30 border-gray-300 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all text-base h-12"
                            />
                            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                    </div>

                    {/* B.1.5 Weight Type (Spans 2 cols) */}
                    <div className="lg:col-span-2">
                        <Label className="text-gray-700 dark:text-gray-300 font-medium mb-2 block">Weight Type</Label>
                        <div className="relative">
                            <select 
                                value={weightType}
                                onChange={(e) => setWeightType(e.target.value)}
                                className="appearance-none bg-gray-50 dark:bg-black/30 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white px-4 py-2.5 pr-8 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 font-medium shadow-sm cursor-pointer transition-colors w-full h-12"
                            >
                                {WEIGHT_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.icon} {type.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* B.2 Reps (Spans 2 cols) */}
                    <div className="lg:col-span-2">
                        <Label className="text-gray-700 dark:text-gray-300 font-medium mb-2 block">Reps</Label>
                        <Input 
                            type="number" 
                            value={currentSet.reps || ''}
                            onChange={(e) => setCurrentSet({...currentSet, reps: parseInt(e.target.value) || 0})}
                            placeholder="12" 
                            className="bg-gray-50 dark:bg-black/30 border-gray-300 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-primary/50 text-lg font-mono text-center h-12" 
                        />
                    </div>

                    {/* B.3 Weight & Unit (Spans 4 cols) */}
                    <div className="lg:col-span-4">
                        <Label className="text-gray-700 dark:text-gray-300 font-medium mb-2 block">
                            Weight {weightType === 'bodyweight' ? '(Additional)' : ''}
                        </Label>
                        <div className="flex gap-2">
                            <Input 
                                type="number" 
                                value={currentSet.weight || ''}
                                onChange={(e) => setCurrentSet({...currentSet, weight: parseFloat(e.target.value) || 0})}
                                placeholder={weightType === 'bodyweight' ? '0' : '20'} 
                                className="bg-gray-50 dark:bg-black/30 border-gray-300 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-primary/50 text-lg font-mono flex-1 h-12" 
                            />
                            <select 
                                value={currentSet.unit}
                                onChange={(e) => setCurrentSet({...currentSet, unit: e.target.value as 'kg' | 'lb'})}
                                className="bg-gray-50 dark:bg-black/30 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white rounded-lg px-4 py-2 h-12 text-sm font-medium focus:ring-2 focus:ring-primary/50 cursor-pointer transition-colors"
                            >
                                <option value="kg">KG</option>
                                <option value="lb">LB</option>
                            </select>
                        </div>
                        {weightType === 'bodyweight' && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Enter 0 for bodyweight only, or add additional weight
                            </p>
                        )}
                    </div>
                </div>

                {/* Sets Display & Add Set Button */}
                <div className="mb-6 flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-cyan-500/5 dark:from-primary/10 dark:to-cyan-500/10 rounded-xl border border-primary/20 dark:border-primary/30">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sets Logged:</span>
                            <span className="text-2xl font-bold text-primary font-orbitron">{sets.length}</span>
                        </div>
                        {sets.length > 0 && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Latest: {sets[sets.length - 1].reps} reps × {sets[sets.length - 1].weight} {sets[sets.length - 1].unit}
                            </div>
                        )}
                    </div>
                    <Button 
                        variant="ghost" 
                        onClick={handleAddSet} 
                        disabled={currentSet.reps === 0}
                        className="bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 text-primary border border-primary/30 dark:border-primary/50 disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4 mr-2"/> Add Set
                    </Button>
                </div>

                {/* Sets List */}
                {sets.length > 0 && (
                    <div className="mb-6 space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 font-medium">Completed Sets</Label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {sets.map((set, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/30 rounded-lg">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        Set {index + 1}: {set.reps} reps × {set.weight} {set.unit}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveSet(index)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* C. Session Metadata (Full Width) */}
                <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-white/5">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                         <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">Date</Label>
                            </div>
                            <div className="bg-gray-50 dark:bg-black/30 border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white font-medium shadow-sm">
                                {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                            </div>
                         </div>
                         <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">Time</Label>
                            </div>
                            <Input 
                                type="time" 
                                value={workoutTime}
                                onChange={(e) => setWorkoutTime(e.target.value)}
                                className="bg-gray-50 dark:bg-black/30 border-gray-300 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-primary/50 text-base h-12 font-mono" 
                            />
                         </div>
                         <div className="lg:col-span-3">
                             <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-4 h-4 text-primary" />
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">RPE (Effort 1-10)</Label>
                            </div>
                            <div className="flex gap-1 items-center bg-white dark:bg-white/5 rounded-lg p-1.5 border border-gray-200 dark:border-white/10">
                                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                                    <button 
                                        key={n}
                                        onClick={() => setRpe(n)}
                                        className={`flex-1 h-10 rounded-lg text-sm font-bold transition-all ${
                                            rpe === n 
                                                ? "bg-primary text-white shadow-md scale-105" 
                                                : "bg-gray-50 dark:bg-black/40 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                                        }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                         </div>
                         <div className="lg:col-span-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">
                                    Rest Time {sets.length > 1 ? '(Required for multiple sets)' : '(Optional)'}
                                </Label>
                            </div>
                            <Input 
                                type="text" 
                                value={restTime}
                                onChange={(e) => setRestTime(e.target.value)}
                                placeholder="e.g. 90s, 2min, 120" 
                                className={`bg-gray-50 dark:bg-black/30 border-gray-300 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-primary/50 text-base h-12 ${
                                    sets.length > 1 && !restTime.trim() ? 'border-red-500 dark:border-red-500' : ''
                                }`}
                                required={sets.length > 1}
                            />
                            {sets.length > 1 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Time between sets (e.g., 90s, 2min, 120)
                                </p>
                            )}
                         </div>
                    </div>
                    <div>
                        <Label className="text-gray-700 dark:text-gray-300 font-medium mb-2 block">Tempo / Notes</Label>
                        <Textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional notes, tempo cues, or form reminders..." 
                            className="bg-gray-50 dark:bg-black/30 border-gray-300 dark:border-white/10 resize-none h-28 text-sm focus-visible:ring-2 focus-visible:ring-primary/50 w-full"
                        />
                    </div>
                </div>

                {/* D. Actions (Sticky Bottom) */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
                     <Button 
                        variant="outline" 
                        className="flex-1 border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 h-12 text-base bg-white dark:bg-black/20 shadow-sm" 
                        onClick={handleAddSet}
                        disabled={currentSet.reps === 0}
                    >
                        <Plus className="h-5 w-5 mr-2"/> Add Another Set
                    </Button>
                    <Button 
                        className="flex-1 bg-gradient-to-r from-primary to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold h-12 text-base shadow-lg shadow-[0_4px_20px_rgba(6,182,212,0.3)] disabled:opacity-50" 
                        onClick={handleSaveWorkout}
                        disabled={isLoading || !exercise.trim() || sets.length === 0 || (sets.length > 1 && !restTime.trim())}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin"/> Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5 mr-2"/> Save Workout
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}