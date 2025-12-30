"use client"

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
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
  }

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-card/90 backdrop-blur-md border border-primary/20 p-3 rounded-xl shadow-2xl min-w-[200px]">
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
                <span className="text-muted-foreground block mb-1 uppercase tracking-wider text-[10px]">Distance</span>
                <span className="text-lg font-bold text-cyan-400">{(distance / 1000).toFixed(2)} <span className="text-xs text-foreground">km</span></span>
            </div>
            <div>
                <span className="text-muted-foreground block mb-1 uppercase tracking-wider text-[10px]">Speed</span>
                <span className="text-lg font-bold text-yellow-400">{speed.toFixed(1)} <span className="text-xs text-foreground">km/h</span></span>
            </div>
            <div>
                <span className="text-muted-foreground block mb-1 uppercase tracking-wider text-[10px]">Duration</span>
                <span className="text-lg font-bold text-foreground">{formatTime(duration)}</span>
            </div>
            <div>
                <span className="text-muted-foreground block mb-1 uppercase tracking-wider text-[10px]">Area</span>
                <span className="text-lg font-bold text-green-400">{area.toFixed(0)} <span className="text-xs text-foreground">m²</span></span>
            </div>
        </div>
    </div>
  )
}