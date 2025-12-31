"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronRight, 
  Play, 
  Camera, 
  Upload, 
  ArrowLeft, 
  Target,
  Zap,
  Trophy,
  FileText
} from "lucide-react"
import { MotionTracker } from "./MotionTracker"

// Exercise data structure
const MUSCLE_GROUPS = {
  chest: {
    name: "Chest",
    icon: "💪",
    color: "bg-red-500",
    exercises: [
      { id: "push-ups", name: "Push-ups", difficulty: "Beginner", duration: "2-3 min" },
      { id: "bench-press", name: "Bench Press", difficulty: "Intermediate", duration: "3-4 min" },
      { id: "incline-press", name: "Incline Press", difficulty: "Intermediate", duration: "3-4 min" },
      { id: "chest-fly", name: "Chest Fly", difficulty: "Advanced", duration: "4-5 min" }
    ]
  },
  triceps: {
    name: "Triceps",
    icon: "🔥",
    color: "bg-orange-500",
    exercises: [
      { id: "tricep-dips", name: "Tricep Dips", difficulty: "Beginner", duration: "2-3 min" },
      { id: "overhead-extension", name: "Overhead Extension", difficulty: "Intermediate", duration: "3-4 min" },
      { id: "close-grip-press", name: "Close Grip Press", difficulty: "Advanced", duration: "4-5 min" }
    ]
  },
  back: {
    name: "Back",
    icon: "🏋️",
    color: "bg-blue-500",
    exercises: [
      { id: "pull-ups", name: "Pull-ups", difficulty: "Intermediate", duration: "3-4 min" },
      { id: "rows", name: "Rows", difficulty: "Beginner", duration: "2-3 min" },
      { id: "lat-pulldown", name: "Lat Pulldown", difficulty: "Intermediate", duration: "3-4 min" },
      { id: "deadlift", name: "Deadlift", difficulty: "Advanced", duration: "5-6 min" }
    ]
  },
  biceps: {
    name: "Biceps",
    icon: "💥",
    color: "bg-green-500",
    exercises: [
      { id: "bicep-curls", name: "Bicep Curls", difficulty: "Beginner", duration: "2-3 min" },
      { id: "hammer-curls", name: "Hammer Curls", difficulty: "Beginner", duration: "2-3 min" },
      { id: "chin-ups", name: "Chin-ups", difficulty: "Advanced", duration: "4-5 min" }
    ]
  },
  shoulders: {
    name: "Shoulders",
    icon: "🎯",
    color: "bg-purple-500",
    exercises: [
      { id: "shoulder-press", name: "Shoulder Press", difficulty: "Intermediate", duration: "3-4 min" },
      { id: "lateral-raises", name: "Lateral Raises", difficulty: "Beginner", duration: "2-3 min" },
      { id: "front-raises", name: "Front Raises", difficulty: "Beginner", duration: "2-3 min" }
    ]
  },
  legs: {
    name: "Legs",
    icon: "🦵",
    color: "bg-yellow-500",
    exercises: [
      { id: "squats", name: "Squats", difficulty: "Beginner", duration: "3-4 min", available: true },
      { id: "lunges", name: "Lunges", difficulty: "Intermediate", duration: "3-4 min" },
      { id: "leg-press", name: "Leg Press", difficulty: "Intermediate", duration: "4-5 min" },
      { id: "calf-raises", name: "Calf Raises", difficulty: "Beginner", duration: "2-3 min" }
    ]
  },
  core: {
    name: "Core",
    icon: "⚡",
    color: "bg-pink-500",
    exercises: [
      { id: "plank", name: "Plank", difficulty: "Beginner", duration: "2-3 min" },
      { id: "crunches", name: "Crunches", difficulty: "Beginner", duration: "2-3 min" },
      { id: "russian-twists", name: "Russian Twists", difficulty: "Intermediate", duration: "3-4 min" },
      { id: "mountain-climbers", name: "Mountain Climbers", difficulty: "Advanced", duration: "4-5 min" }
    ]
  }
}

type ViewMode = 'muscle-groups' | 'exercises' | 'training'
type TrainingMode = 'live' | 'upload' | null

interface LearnGameModeProps {
  onSwitchMode?: () => void
}

export function LearnGameMode({ onSwitchMode }: LearnGameModeProps) {
  const [currentView, setCurrentView] = useState<ViewMode>('muscle-groups')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<any>(null)
  const [trainingMode, setTrainingMode] = useState<TrainingMode>(null)

  const handleMuscleGroupSelect = (groupKey: string) => {
    setSelectedMuscleGroup(groupKey)
    setCurrentView('exercises')
  }

  const handleExerciseSelect = (exercise: any) => {
    if (exercise.available) {
      setSelectedExercise(exercise)
      setCurrentView('training')
    }
  }

  const handleTrainingModeSelect = (mode: TrainingMode) => {
    setTrainingMode(mode)
    // Here we'll integrate with the motion tracking system
  }

  const handleBack = () => {
    if (currentView === 'exercises') {
      setCurrentView('muscle-groups')
      setSelectedMuscleGroup(null)
    } else if (currentView === 'training') {
      setCurrentView('exercises')
      setSelectedExercise(null)
      setTrainingMode(null)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  return (
    <div className="w-full h-full bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-white/10 bg-gradient-to-r from-primary/5 to-cyan-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentView !== 'muscle-groups' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-orbitron">
                  {currentView === 'muscle-groups' && 'Learn & Train'}
                  {currentView === 'exercises' && MUSCLE_GROUPS[selectedMuscleGroup as keyof typeof MUSCLE_GROUPS]?.name}
                  {currentView === 'training' && selectedExercise?.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentView === 'muscle-groups' && 'AI-powered form analysis and real-time feedback'}
                  {currentView === 'exercises' && 'Choose an exercise to start training'}
                  {currentView === 'training' && 'Select your training mode'}
                </p>
              </div>
            </div>
          </div>
          
          {onSwitchMode && (
            <Button
              onClick={onSwitchMode}
              variant="outline"
              className="bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
            >
              <FileText className="h-4 w-4 mr-2" />
              Switch to Workout Log
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        
        {/* Muscle Groups View */}
        {currentView === 'muscle-groups' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(MUSCLE_GROUPS).map(([key, group]) => (
              <Card
                key={key}
                className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-white dark:bg-black/30 border-gray-200 dark:border-white/10"
                onClick={() => handleMuscleGroupSelect(key)}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-16 h-16 ${group.color} rounded-full flex items-center justify-center text-2xl shadow-lg`}>
                    {group.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {group.exercises.length} exercises available
                    </p>
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <span className="text-sm font-medium">Start Training</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Exercises View */}
        {currentView === 'exercises' && selectedMuscleGroup && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MUSCLE_GROUPS[selectedMuscleGroup as keyof typeof MUSCLE_GROUPS].exercises.map((exercise) => (
                <Card
                  key={exercise.id}
                  className={`p-6 cursor-pointer transition-all duration-300 ${
                    exercise.available 
                      ? 'hover:shadow-lg hover:scale-105 bg-white dark:bg-black/30' 
                      : 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900/30'
                  } border-gray-200 dark:border-white/10`}
                  onClick={() => handleExerciseSelect(exercise)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {exercise.name}
                        </h3>
                        {exercise.available && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            Available
                          </Badge>
                        )}
                        {!exercise.available && (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <Badge className={getDifficultyColor(exercise.difficulty)}>
                          {exercise.difficulty}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          {exercise.duration}
                        </span>
                      </div>
                    </div>
                    {exercise.available && (
                      <ChevronRight className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Training Mode Selection */}
        {currentView === 'training' && selectedExercise && !trainingMode && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Choose Your Training Mode
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Select how you want to train with AI-powered form analysis
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Live Camera Mode */}
              <Card
                className="p-8 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800"
                onClick={() => handleTrainingModeSelect('live')}
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Live Camera
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Real-time motion tracking with instant feedback
                    </p>
                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Real-time pose estimation</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Live form correction</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Automatic rep counting</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-blue-500 hover:bg-blue-600">
                    <Play className="w-4 h-4 mr-2" />
                    Start Live Training
                  </Button>
                </div>
              </Card>

              {/* Upload Video Mode */}
              <Card
                className="p-8 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800"
                onClick={() => handleTrainingModeSelect('upload')}
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Upload Video
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Analyze your recorded workout videos
                    </p>
                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Detailed form analysis</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Frame-by-frame breakdown</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Comprehensive feedback</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-purple-500 hover:bg-purple-600">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Analyze
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Training Interface - Motion Tracking */}
        {currentView === 'training' && trainingMode && (
          <MotionTracker
            exercise={selectedExercise}
            mode={trainingMode}
            onBack={() => setTrainingMode(null)}
          />
        )}
      </div>
    </div>
  )
}