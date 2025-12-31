"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, RotateCcw, Clock, Target, Activity, Heart, Sparkles, Plus } from "lucide-react"

interface StretchRoutine {
  id: string
  title: string
  duration: number // in minutes
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  targetAreas: string[]
}

const stretchRoutines: StretchRoutine[] = [
  {
    id: "1",
    title: "Morning Wake-Up",
    duration: 10,
    description: "Gentle stretches to start your day",
    difficulty: "beginner",
    targetAreas: ["Full Body", "Back", "Legs"]
  },
  {
    id: "2",
    title: "Post-Workout Recovery",
    duration: 15,
    description: "Relieve muscle tension after training",
    difficulty: "intermediate",
    targetAreas: ["Legs", "Shoulders", "Back"]
  },
  {
    id: "3",
    title: "Hip Flexibility",
    duration: 12,
    description: "Improve hip mobility and reduce stiffness",
    difficulty: "intermediate",
    targetAreas: ["Hips", "Lower Back"]
  },
  {
    id: "4",
    title: "Deep Stretch",
    duration: 20,
    description: "Advanced flexibility training",
    difficulty: "advanced",
    targetAreas: ["Full Body", "Spine"]
  },
]

interface StretchExercise {
  name: string
  duration: number // in seconds
  instructions: string
}

const currentRoutineExercises: StretchExercise[] = [
  { name: "Neck Rolls", duration: 30, instructions: "Slowly roll your head in circles" },
  { name: "Shoulder Stretch", duration: 30, instructions: "Cross arm across chest and hold" },
  { name: "Hamstring Stretch", duration: 45, instructions: "Sit and reach for your toes" },
  { name: "Quad Stretch", duration: 30, instructions: "Stand and pull heel to glutes" },
  { name: "Spinal Twist", duration: 45, instructions: "Sit and twist torso gently" },
]

export function StretchingSection() {
  const [isActive, setIsActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(30) // current exercise time
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [selectedRoutine, setSelectedRoutine] = useState<StretchRoutine | null>(null)
  const [exercises, setExercises] = useState<StretchExercise[]>(currentRoutineExercises)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Move to next exercise
            if (currentExerciseIndex < exercises.length - 1) {
              setCurrentExerciseIndex((idx) => idx + 1)
              return exercises[currentExerciseIndex + 1]?.duration || 30
            } else {
              setIsActive(false)
              return 0
            }
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, timeRemaining, currentExerciseIndex, exercises])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStartRoutine = (routine: StretchRoutine) => {
    setSelectedRoutine(routine)
    setCurrentExerciseIndex(0)
    setExercises(currentRoutineExercises) // In real app, this would be routine-specific
    setTimeRemaining(currentRoutineExercises[0].duration)
    setIsActive(true)
  }

  const handleReset = () => {
    setIsActive(false)
    setCurrentExerciseIndex(0)
    setTimeRemaining(exercises[0]?.duration || 30)
  }

  const handleToggle = () => {
    setIsActive(!isActive)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300"
      case "intermediate":
        return "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
      case "advanced":
        return "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300"
      default:
        return "bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300"
    }
  }

  const currentExercise = exercises[currentExerciseIndex]

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Stretch Card */}
        <Card className="lg:col-span-2 bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5">
          <div className="p-6 border-b border-border bg-gradient-to-r from-purple-500/10 via-transparent to-violet-500/10">
            <h2 className="text-xl font-bold text-foreground font-inter flex items-center gap-2">
              <Heart className="w-6 h-6 text-purple-500" />
              Active Session
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedRoutine ? selectedRoutine.title : "Select a routine to begin"}
            </p>
          </div>
          
          <div className="p-6">
            {selectedRoutine ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent font-mono mb-2">
                    {formatTime(timeRemaining)}
                  </div>
                  <p className="text-xl font-semibold text-foreground mb-1">
                    {currentExercise?.name || "Ready"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentExercise?.instructions || ""}
                  </p>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Exercise Progress</span>
                    <span className="text-foreground font-medium">
                      {currentExerciseIndex + 1} / {exercises.length}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Exercise List */}
                <div className="space-y-2">
                  {exercises.map((exercise, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                        index === currentExerciseIndex
                          ? "bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/50"
                          : index < currentExerciseIndex
                          ? "bg-muted opacity-60"
                          : "bg-card/50"
                      }`}
                    >
                      <span className="text-sm font-medium text-foreground">
                        {exercise.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {exercise.duration}s
                      </span>
                    </div>
                  ))}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleReset}
                    className="h-12 w-12 border-border/50 hover:bg-muted rounded-xl"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={handleToggle}
                    className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white shadow-lg shadow-purple-500/30"
                  >
                    {isActive ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8 ml-1" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select a routine to begin stretching
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Routines List */}
        <div className="space-y-4">
          <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg shadow-primary/5 p-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Routines
            </h3>
            <div className="space-y-3">
              {stretchRoutines.map((routine) => (
                <Card
                  key={routine.id}
                  className="p-4 bg-card/70 border border-border/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer rounded-xl backdrop-blur-sm group"
                  onClick={() => handleStartRoutine(routine)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground group-hover:text-purple-600 transition-colors">
                        {routine.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {routine.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {routine.duration} min
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(
                            routine.difficulty
                          )}`}
                        >
                          {routine.difficulty}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {routine.targetAreas.map((area, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="ml-2 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg shadow-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sessions This Week</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mt-1">8</p>
            </div>
            <Target className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg shadow-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Time</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mt-1">4.5h</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg shadow-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Flexibility Score</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mt-1">85%</p>
            </div>
            <Activity className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>
      </div>
    </div>
  )
}

