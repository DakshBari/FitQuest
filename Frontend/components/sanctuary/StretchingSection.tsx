"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, RotateCcw, Clock, Target, Activity } from "lucide-react"

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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-orbitron flex items-center gap-2">
          <Activity className="w-6 h-6 text-green-500" />
          Stretching
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Improve flexibility and prevent injury with guided stretching routines
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Stretch Card */}
        <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border-green-200 dark:border-green-500/30">
          {selectedRoutine ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 dark:text-green-400 font-mono mb-2">
                  {formatTime(timeRemaining)}
                </div>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {currentExercise?.name || "Ready"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentExercise?.instructions || ""}
                </p>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Exercise Progress</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {currentExerciseIndex + 1} / {exercises.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
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
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      index === currentExerciseIndex
                        ? "bg-green-500/20 border border-green-500/50"
                        : index < currentExerciseIndex
                        ? "bg-gray-100 dark:bg-gray-800 opacity-60"
                        : "bg-white/50 dark:bg-black/20"
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {exercise.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
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
                  className="h-12 w-12 border-gray-300 dark:border-white/10"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button
                  onClick={handleToggle}
                  className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/50"
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
              <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Select a routine to begin stretching
              </p>
            </div>
          )}
        </Card>

        {/* Routines List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Routines</h3>
          <div className="space-y-3">
            {stretchRoutines.map((routine) => (
              <Card
                key={routine.id}
                className="p-4 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleStartRoutine(routine)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{routine.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {routine.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 rounded-full flex items-center gap-1">
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
                          className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="ml-2">
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sessions This Week</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">8</p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">4.5h</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Flexibility Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">85%</p>
            </div>
            <Activity className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>
    </div>
  )
}

