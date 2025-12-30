"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Droplet, Plus } from "lucide-react"

interface HydrationTrackerProps {
  current: number
  target: number
  onAdd: (amount: number) => void
  viewMode?: 'daily' | 'weekly'
  weeklyData?: Array<{
    date: string
    amount: number
    dayName: string
  }>
  weeklyTotal?: number
}

export function HydrationTracker({ 
  current, 
  target, 
  onAdd, 
  viewMode = 'daily',
  weeklyData = [],
  weeklyTotal = 0
}: HydrationTrackerProps) {
    // FIX: Add safety checks for NaN calculation
    const safeCurrent = typeof current === 'number' && !isNaN(current) ? current : 0;
    const safeTarget = typeof target === 'number' && !isNaN(target) && target > 0 ? target : 3000;
    
    // Calculate percentage based on view mode
    const displayCurrent = viewMode === 'weekly' ? weeklyTotal : safeCurrent;
    const displayTarget = viewMode === 'weekly' ? safeTarget * 7 : safeTarget;
    const pct = Math.min((displayCurrent / displayTarget) * 100, 100);
    const [customAmount, setCustomAmount] = useState("");
    
    const [isPouring, setIsPouring] = useState(false);

    const handleAdd = (amount: number) => {
        onAdd(amount);
        triggerPour();
    }

    const handleCustomAdd = () => {
        const amount = parseInt(customAmount);
        if(amount && amount > 0) {
            handleAdd(amount);
            setCustomAmount("");
        }
    }

    const triggerPour = () => {
        setIsPouring(true);
        setTimeout(() => setIsPouring(false), 800); 
    }

    const bottlePath = "M 20,0 L 60,0 L 60,50 L 80,60 L 80,190 Q 80,200 70,200 L 10,200 Q 0,200 0,190 L 0,60 L 20,50 Z";

    return (
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20 shadow-sm p-5 flex flex-col justify-between h-[240px] rounded-2xl relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Header Section */}
            <div className="flex justify-between items-start z-10">
                <div>
                    <h3 className="font-bold text-foreground tracking-wide text-sm flex items-center gap-2">
                        <Droplet className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20"/> Hydration
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                      {viewMode === 'weekly' ? 'Weekly Goal' : 'Daily Goal'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-blue-500 font-mono leading-none">
                      {displayCurrent}<span className="text-sm text-muted-foreground ml-1 font-sans">ml</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">Target: {displayTarget}ml</p>
                </div>
            </div>

            {/* Body Section: Bottle & Controls */}
            <div className="flex items-end justify-between gap-4 z-10 mt-2">
                
                {/* Bottle Visual */}
                <div className="relative w-[70px] h-[140px] flex-shrink-0 select-none">
                    <svg viewBox="0 0 80 220" className="w-full h-full drop-shadow-lg">
                        <defs>
                            <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2"/>
                                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05"/>
                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1"/>
                            </linearGradient>
                            <clipPath id="bottleClip">
                                <path d={bottlePath} />
                            </clipPath>
                        </defs>

                        <path d={bottlePath} fill="url(#glassGradient)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />

                        <g clipPath="url(#bottleClip)">
                            {/* FIX: Use calculated pct here */}
                            <rect 
                                x="-10" 
                                y={200 - (pct/100 * 200)} 
                                width="100" 
                                height="220" 
                                fill="url(#waterGradient)"
                                className="transition-all duration-1000 ease-out"
                            />
                            <defs>
                                <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9"/>
                                    <stop offset="100%" stopColor="#1e3a8a" stopOpacity="1"/>
                                </linearGradient>
                            </defs>
                            {/* Surface Shine */}
                            <rect 
                                x="-10" 
                                y={200 - (pct/100 * 200)} 
                                width="100" 
                                height="1.5" 
                                fill="white" 
                                opacity="0.4"
                                className="transition-all duration-1000 ease-out"
                            />
                        </g>

                        <rect x="18" y="-8" width="44" height="10" rx="2" fill="#334155" />
                        <rect x="20" y="0" width="40" height="2" fill="#475569" />

                        {/* Pouring Stream */}
                        {isPouring && (
                            <g className="animate-stream">
                                <path 
                                    d="M 38,-10 L 42,-10 L 42,45" 
                                    stroke="#60a5fa" 
                                    strokeWidth="4" 
                                    strokeLinecap="round"
                                    className="opacity-80"
                                />
                                <circle cx="40" cy="55" r="3" fill="#60a5fa" className="opacity-80 animate-ping" />
                            </g>
                        )}
                    </svg>
                </div>

                {/* Controls - Only show in daily mode */}
                {viewMode === 'daily' ? (
                  <div className="flex-1 flex flex-col justify-end gap-3 pb-1">
                      {/* Quick Presets */}
                      <div className="grid grid-cols-3 gap-2">
                          {[
                              { val: 125, label: '125ml' },
                              { val: 250, label: '250ml' },
                              { val: 500, label: '500ml' },
                          ].map((btn) => (
                              <Button 
                                  key={btn.val}
                                  onClick={() => handleAdd(btn.val)}
                                  className="h-9 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-foreground hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-400 transition-all"
                              >
                                  +{btn.val}
                              </Button>
                          ))}
                      </div>

                      {/* Custom Input */}
                      <div className="flex gap-2 h-9">
                          <Input 
                              type="number" 
                              placeholder="Custom (ml)" 
                              value={customAmount}
                              onChange={(e) => setCustomAmount(e.target.value)}
                              className="bg-background/50 border-border text-xs h-full focus-visible:ring-blue-500/50 placeholder:text-muted-foreground/50"
                          />
                          <Button 
                              onClick={handleCustomAdd}
                              className="h-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 shadow-md shadow-blue-500/20"
                          >
                              <Plus className="w-4 h-4"/>
                          </Button>
                      </div>
                  </div>
                ) : (
                  /* Weekly View - Show daily breakdown */
                  <div className="flex-1 flex flex-col justify-end gap-2 pb-1">
                    <div className="grid grid-cols-7 gap-1">
                      {weeklyData.map((day, index) => {
                        const dayPct = Math.min((day.amount / safeTarget) * 100, 100);
                        return (
                          <div key={day.date} className="text-center">
                            <div className="text-[8px] text-muted-foreground mb-1 uppercase">
                              {day.dayName}
                            </div>
                            <div className="h-12 w-full bg-muted/30 rounded-sm relative overflow-hidden">
                              <div 
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-500"
                                style={{ height: `${dayPct}%` }}
                              />
                            </div>
                            <div className="text-[8px] text-muted-foreground mt-1 font-mono">
                              {Math.round(day.amount / 1000 * 10) / 10}L
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
        </Card>
    )
}