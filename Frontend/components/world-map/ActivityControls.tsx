"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Square, Activity, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityControlsProps {
  isTracking: boolean
  onStart: (type: 'run' | 'cycle') => void
  onStop: () => void
}

export function ActivityControls({ isTracking, onStart, onStop }: ActivityControlsProps) {
  const [isStarting, setIsStarting] = useState(false)

  const handleStart = async (type: 'run' | 'cycle') => {
    setIsStarting(true)
    setTimeout(() => {
      onStart(type)
      setIsStarting(false)
    }, 200)
  }

  return (
    <div className="flex gap-3">
      {!isTracking ? (
        <>
          {/* Start Run Button */}
          <Button 
            onClick={() => handleStart('run')}
            disabled={isStarting}
            className={cn(
              "px-4 py-2 h-auto",
              "bg-emerald-500 hover:bg-emerald-600",
              "disabled:bg-emerald-500/50",
              "text-white font-medium text-sm",
              "rounded-lg border-0",
              "shadow-sm hover:shadow-md",
              "transition-all duration-200",
              "hover:scale-[1.02]",
              "active:scale-[0.98]"
            )}
          >
            {isStarting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Start Run
          </Button>

          {/* Start Cycle Button */}
          <Button 
            onClick={() => handleStart('cycle')}
            disabled={isStarting}
            className={cn(
              "px-4 py-2 h-auto",
              "bg-purple-500 hover:bg-purple-600",
              "disabled:bg-purple-500/50",
              "text-white font-medium text-sm",
              "rounded-lg border-0",
              "shadow-sm hover:shadow-md",
              "transition-all duration-200",
              "hover:scale-[1.02]",
              "active:scale-[0.98]"
            )}
          >
            {isStarting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Start Cycle
          </Button>
        </>
      ) : (
        <Button 
          onClick={onStop}
          className={cn(
            "px-4 py-2 h-auto",
            "bg-red-500 hover:bg-red-600",
            "text-white font-medium text-sm",
            "rounded-lg border-0",
            "shadow-sm hover:shadow-md",
            "transition-all duration-200",
            "hover:scale-[1.02]",
            "active:scale-[0.98]"
          )}
        >
          <Square className="h-4 w-4 mr-2" />
          Stop Activity
        </Button>
      )}
    </div>
  )
}