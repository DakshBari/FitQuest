"use client"

import { usePathname } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Flag, Crown, MapPin } from "lucide-react"
import { getThemeClasses } from "@/lib/pageThemes"
import { cn } from "@/lib/utils"

export interface Stronghold {
  id: number
  name: string
  lat: number
  lng: number
  distance: string
  challenge: string
  reward: number
  captured: boolean
}

interface StrongholdSidebarProps {
  strongholds: Stronghold[]
  selectedId: number | null
  onSelect: (id: number) => void
}

export function StrongholdSidebar({ strongholds, selectedId, onSelect }: StrongholdSidebarProps) {
  const pathname = usePathname()
  const themeClasses = getThemeClasses(pathname)

  return (
    <Card className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl h-full overflow-hidden flex flex-col shadow-lg shadow-primary/5 ring-1 ring-border/30">
      <div className="p-6 border-b border-border bg-gradient-to-r from-[#8b5cf6]/10 via-transparent to-[#a78bfa]/10">
        <div className="flex items-center gap-3">
          <div 
            className={cn("w-8 h-8 rounded-lg flex items-center justify-center", themeClasses.buttonGradient)}
            style={themeClasses.buttonGradientStyle || undefined}
          >
            <Flag className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Strongholds</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {strongholds.map((hold) => (
          <div
            key={hold.id}
            onClick={() => onSelect(hold.id)}
            className={cn(
              "p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden",
              hold.captured
                ? "bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/10"
                : "bg-card/50 border-border hover:border-[#8b5cf6]/50 hover:bg-[#8b5cf6]/5 hover:shadow-lg hover:shadow-[#8b5cf6]/10",
              selectedId === hold.id ? "ring-2 ring-[#8b5cf6]/50 shadow-xl shadow-[#8b5cf6]/20" : ""
            )}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start gap-2">
                <MapPin className={cn("h-4 w-4 mt-0.5", hold.captured ? "text-green-400" : "text-[#8b5cf6]")} />
                <div>
                  <h3 className="font-semibold text-foreground text-sm leading-tight">{hold.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{hold.distance} away</p>
                </div>
              </div>
              {hold.captured && <Crown className="h-5 w-5 text-green-400" />}
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Challenge:</span> {hold.challenge}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Reward</span>
                <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-semibold">
                  +{hold.reward} XP
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}