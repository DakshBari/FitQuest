"use client"

import { Activity, Clock, MapPin, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface LiveStatsProps {
  distance: number
  speed: number
  duration: number
  area: number
}

export function LiveStats({ distance, speed, duration, area }: LiveStatsProps) {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
    }
    return `${m}:${s.toString().padStart(2,'0')}`
  }

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`
    }
    return `${meters.toFixed(0)} m`
  }

  const stats = [
    {
      icon: MapPin,
      label: "Distance",
      value: formatDistance(distance),
      color: "text-emerald-600"
    },
    {
      icon: Zap,
      label: "Speed",
      value: `${speed.toFixed(1)} km/h`,
      color: "text-blue-600"
    },
    {
      icon: Clock,
      label: "Time",
      value: formatTime(duration),
      color: "text-purple-600"
    },
    {
      icon: Activity,
      label: "Area",
      value: area > 0 ? `${area.toFixed(0)} m²` : "0 m²",
      color: "text-orange-600"
    }
  ]

  return (
    <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat, index) => (
          <div key={index} className={cn(
            "flex items-center gap-2 p-2 rounded-lg transition-all duration-300",
            "bg-black/80 backdrop-blur-sm shadow-lg",
            "border border-gray-300"
          )}>
            <div className={cn(
              "p-1.5 rounded-md bg-gray-100 backdrop-blur-sm",
              "flex items-center justify-center flex-shrink-0"
            )}>
              <stat.icon className={cn("h-3 w-3", stat.color)} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-gray-300 text-xs font-medium uppercase tracking-wide leading-none">
                {stat.label}
              </span>
              <span className={cn(
                "text-white font-bold text-xs leading-tight mt-0.5",
                "font-mono tabular-nums"
              )}>
                {stat.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}