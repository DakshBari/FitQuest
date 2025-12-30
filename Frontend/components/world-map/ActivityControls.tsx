"use client"

import { Button } from "@/components/ui/button"
import { Play, Square } from "lucide-react"

interface ActivityControlsProps {
  isTracking: boolean
  onStart: (type: 'run' | 'cycle') => void
  onStop: () => void
}

export function ActivityControls({ isTracking, onStart, onStop }: ActivityControlsProps) {
  return (
    <div className="flex gap-3">
      {!isTracking ? (
        <>
          <Button 
            onClick={() => onStart('run')}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Run
          </Button>
          <Button 
            onClick={() => onStart('cycle')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Cycle
          </Button>
        </>
      ) : (
        <Button 
          onClick={onStop}
          variant="destructive"
          className="bg-red-500/90 hover:bg-red-500 text-white font-bold border border-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
        >
          <Square className="h-4 w-4 mr-2" />
          Stop Activity
        </Button>
      )}
    </div>
  )
}