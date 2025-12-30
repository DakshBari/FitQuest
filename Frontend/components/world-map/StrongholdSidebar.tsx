"use client"

import { Card } from "@/components/ui/card"
import { Flag, Crown } from "lucide-react"

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
  return (
    <Card className="bg-card/80 border border-border rounded-xl h-full overflow-hidden flex flex-col">
        <div className="p-5 border-b border-border bg-muted/20">
            <h2 className="text-xl font-bold text-foreground font-orbitron">Nearby Strongholds</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {strongholds.map((hold) => (
                <div
                    key={hold.id}
                    onClick={() => onSelect(hold.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${
                        hold.captured
                        ? "bg-green-500/5 border-green-500/30"
                        : "bg-muted/30 border-border hover:border-primary/50 hover:bg-muted/50"
                    } ${selectedId === hold.id ? "ring-2 ring-primary/50" : ""}`}
                >
                    {/* Background Glow */}
                    {hold.captured && (
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-500/10 rounded-full blur-xl pointer-events-none"></div>
                    )}

                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <div>
                            <h3 className="font-bold text-foreground text-sm">{hold.name}</h3>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{hold.distance}</p>
                        </div>
                        {hold.captured && <Crown className="h-5 w-5 text-green-400" />}
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 relative z-10">
                        <span className="text-sm text-muted-foreground">{hold.challenge}</span>
                        <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/50 rounded text-amber-400 text-xs font-semibold">
                            +{hold.reward} XP
                        </span>
                    </div>
                </div>
            ))}
        </div>
    </Card>
  )
}