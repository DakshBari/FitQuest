"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Target, Flame, Activity } from "lucide-react"
import { GoalType } from "./GoalSettings"

interface FuelGaugeProps {
  current: { calories: number; protein: number; carbs: number; fats: number }
  target: { calories: number; protein: number; carbs: number; fats: number }
  goal: GoalType
  viewMode: 'daily' | 'weekly'
  weeklyData?: { 
    pct: number; 
    date: string; 
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }[]
}

export function FuelGauge({ current, target, goal, viewMode, weeklyData = [] }: FuelGaugeProps) {
  // State for tracking hovered tube
  const [hoveredTube, setHoveredTube] = useState<number | null>(null);
  
  // SAFETY: Destructure with defaults to prevent NaN
  const { calories = 0, protein = 0, carbs = 0, fats = 0 } = current || {};
  const { calories: targetCal = 2000, protein: targetProt = 150, carbs: targetCarb = 200, fats: targetFat = 65 } = target || {};

  const calPct = Math.min((calories / targetCal) * 100, 100);
  const protPct = Math.min((protein / targetProt) * 100, 100);
  const carbPct = Math.min((carbs / targetCarb) * 100, 100);
  const fatPct = Math.min((fats / targetFat) * 100, 100);

  const borderColor = goal === 'fat-loss' ? 'border-orange-500/30' : 'border-purple-500/30';
  const flameColor = calPct >= 100 ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'text-muted-foreground';

  return (
    <Card className={`h-[480px] border shadow-md p-6 flex flex-col relative overflow-hidden transition-all bg-[#1C1C1C] ${borderColor}`}>
       {/* Decorative Glows */}
       <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/5 rounded-full blur-[60px] pointer-events-none"></div>
       <div className="absolute top-10 -left-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-[50px] pointer-events-none"></div>

       {/* Compact Header */}
       <div className="flex justify-between items-center z-10 mb-4">
        <h2 className="text-sm font-bold text-foreground tracking-wide uppercase">Fuel Gauge</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-black/20 px-2 py-1 rounded-full border border-white/5">
           {viewMode === 'daily' ? 'DAILY' : 'WEEKLY'}
           <Activity className="w-3 h-3 text-primary" />
        </div>
      </div>

      {viewMode === 'weekly' ? (
        // Enhanced Weekly Chart with Stacked Macros and Calories
        <div className="flex-1 flex flex-col gap-4">
          {/* Weekly Total Display */}
          <div className="flex justify-between items-center bg-gradient-to-r from-white/5 to-transparent border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Flame className={`w-8 h-8 ${calories >= targetCal ? 'text-yellow-400' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Weekly Total</p>
                <p className="text-2xl font-bold text-foreground font-orbitron">{Math.round(calories || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">/ {targetCal.toLocaleString()} kcal</p>
              </div>
            </div>
            
            {/* Weekly Macros Summary */}
            <div className="flex gap-4 text-xs">
              <div className="text-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
                <p className="text-red-400 font-mono">{Math.round(protein || 0)}g</p>
                <p className="text-muted-foreground text-[10px]">Protein</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-cyan-500 rounded-full mx-auto mb-1"></div>
                <p className="text-cyan-400 font-mono">{Math.round(carbs || 0)}g</p>
                <p className="text-muted-foreground text-[10px]">Carbs</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-1"></div>
                <p className="text-yellow-400 font-mono">{Math.round(fats || 0)}g</p>
                <p className="text-muted-foreground text-[10px]">Fats</p>
              </div>
            </div>
          </div>

          {/* Daily Breakdown with Stacked Macros */}
          <div className="flex-1 flex items-end justify-between gap-1 pb-2">
            {weeklyData.length > 0 ? (
              weeklyData.map((day, i) => {
                // Use actual macro data from the day
                const dayCalories = day.calories || 0;
                const dayProtein = day.protein || 0;
                const dayCarbs = day.carbs || 0;
                const dayFats = day.fats || 0;
                
                // Use DAILY targets for each tube (not weekly targets)
                const dailyCalTarget = viewMode === 'weekly' ? targetCal / 7 : targetCal;
                const dailyProtTarget = viewMode === 'weekly' ? targetProt / 7 : targetProt;
                const dailyCarbTarget = viewMode === 'weekly' ? targetCarb / 7 : targetCarb;
                const dailyFatTarget = viewMode === 'weekly' ? targetFat / 7 : targetFat;
                
                // Convert macros to calories (protein: 4 cal/g, carbs: 4 cal/g, fats: 9 cal/g)
                const proteinCalories = dayProtein * 4;
                const carbsCalories = dayCarbs * 4;
                const fatsCalories = dayFats * 9;
                
                // Calculate total macro calories
                const totalMacroCalories = proteinCalories + carbsCalories + fatsCalories;
                
                // Calculate the overall bar height based on day's calories vs DAILY target
                const totalBarHeight = Math.min((dayCalories / dailyCalTarget) * 100, 100);
                
                // Calculate proportional heights for each macro within the total bar
                let proteinHeight = 0;
                let carbsHeight = 0;
                let fatsHeight = 0;
                
                if (totalMacroCalories > 0) {
                  proteinHeight = (proteinCalories / totalMacroCalories) * totalBarHeight;
                  carbsHeight = (carbsCalories / totalMacroCalories) * totalBarHeight;
                  fatsHeight = (fatsCalories / totalMacroCalories) * totalBarHeight;
                }

                // Determine tube size based on hover state
                const isHovered = hoveredTube === i;
                const isOtherHovered = hoveredTube !== null && hoveredTube !== i;
                
                return (
                  <div 
                    key={i} 
                    className={`flex flex-col items-center gap-2 h-full justify-end transition-all duration-300 ease-out ${
                      isHovered 
                        ? 'flex-[2] z-10' // Enlarged when hovered
                        : isOtherHovered 
                        ? 'flex-[0.7] opacity-60' // Shrunk when another is hovered
                        : 'flex-1' // Normal size
                    }`}
                    onMouseEnter={() => setHoveredTube(i)}
                    onMouseLeave={() => setHoveredTube(null)}
                  >
                    {/* Calorie Display Above Bar */}
                    <div className={`text-center mb-1 transition-all duration-300 ${
                      isHovered ? 'scale-110' : isOtherHovered ? 'scale-90 opacity-60' : ''
                    }`}>
                      <p className="text-xs font-bold text-foreground font-mono">{dayCalories}</p>
                      <p className="text-[8px] text-muted-foreground">kcal</p>
                    </div>
                    
                    {/* Stacked Macro Bar */}
                    <div className={`relative w-full bg-white/5 rounded-lg h-[240px] overflow-hidden border border-white/10 transition-all duration-300 ${
                      isHovered 
                        ? 'shadow-lg shadow-primary/20 border-primary/30 scale-105' 
                        : isOtherHovered 
                        ? 'scale-95' 
                        : 'hover:border-white/20'
                    }`}>
                      {dayCalories > 0 ? (
                        <div className="absolute bottom-0 left-0 right-0 flex flex-col" style={{ height: `${totalBarHeight}%` }}>
                          {/* Fats Layer (Bottom) - Yellow */}
                          {fatsHeight > 0 && (
                            <div 
                              style={{ height: `${(fatsHeight / totalBarHeight) * 100}%` }} 
                              className={`w-full bg-gradient-to-t from-yellow-600 to-yellow-500 transition-all duration-300 shadow-[0_0_10px_rgba(234,179,8,0.3)] ${
                                isHovered ? 'opacity-100' : 'opacity-80'
                              }`}
                              title={`Fats: ${Math.round(dayFats)}g (${Math.round(fatsCalories)} kcal)`}
                            />
                          )}
                          
                          {/* Carbs Layer (Middle) - Cyan */}
                          {carbsHeight > 0 && (
                            <div 
                              style={{ height: `${(carbsHeight / totalBarHeight) * 100}%` }} 
                              className={`w-full bg-gradient-to-t from-cyan-600 to-cyan-500 transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.3)] ${
                                isHovered ? 'opacity-100' : 'opacity-80'
                              }`}
                              title={`Carbs: ${Math.round(dayCarbs)}g (${Math.round(carbsCalories)} kcal)`}
                            />
                          )}
                          
                          {/* Protein Layer (Top) - Red */}
                          {proteinHeight > 0 && (
                            <div 
                              style={{ height: `${(proteinHeight / totalBarHeight) * 100}%` }} 
                              className={`w-full bg-gradient-to-t from-red-600 to-red-500 transition-all duration-300 shadow-[0_0_10px_rgba(239,68,68,0.3)] ${
                                isHovered ? 'opacity-100' : 'opacity-80'
                              }`}
                              title={`Protein: ${Math.round(dayProtein)}g (${Math.round(proteinCalories)} kcal)`}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-white/5"></div>
                      )}
                      
                      {/* Enhanced Glow Effect on Hover */}
                      <div className={`absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent transition-opacity duration-300 pointer-events-none ${
                        isHovered ? 'opacity-100' : 'opacity-0'
                      }`} />
                      
                      {/* Macro Values on Hover - Enhanced for better visibility */}
                      {dayCalories > 0 && (
                        <div className={`absolute inset-0 flex flex-col justify-center items-center transition-all duration-300 bg-black/80 backdrop-blur-md ${
                          isHovered ? 'opacity-100' : 'opacity-0'
                        }`}>
                          <div className="text-center text-sm space-y-2 p-2">
                            <div className="text-white font-bold text-base mb-3 border-b border-white/20 pb-2">
                              {dayCalories} / {Math.round(dailyCalTarget)} kcal
                            </div>
                            <div className="text-primary text-xs mb-3 font-semibold">
                              {Math.round((dayCalories / dailyCalTarget) * 100)}% of daily goal
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-red-400 font-medium">{Math.round(dayProtein)}g</span>
                                <span className="text-muted-foreground text-xs">({Math.round(proteinCalories)}kcal)</span>
                              </div>
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                                <span className="text-cyan-400 font-medium">{Math.round(dayCarbs)}g</span>
                                <span className="text-muted-foreground text-xs">({Math.round(carbsCalories)}kcal)</span>
                              </div>
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span className="text-yellow-400 font-medium">{Math.round(dayFats)}g</span>
                                <span className="text-muted-foreground text-xs">({Math.round(fatsCalories)}kcal)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Day Label */}
                    <span className={`text-[10px] text-muted-foreground font-mono transition-all duration-300 ${
                      isHovered ? 'scale-110 text-primary' : isOtherHovered ? 'scale-90 opacity-60' : ''
                    }`}>
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })
            ) : (
              // Empty state with placeholder bars
              [0, 0, 0, 0, 0, 0, 0].map((_, i) => (
                <div key={i} className="w-full flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-center mb-1">
                    <p className="text-xs font-bold text-muted-foreground font-mono">0</p>
                    <p className="text-[8px] text-muted-foreground">kcal</p>
                  </div>
                  
                  <div className="relative w-full bg-white/5 rounded-lg h-[240px] overflow-hidden border border-white/10">
                    <div className="w-full h-full bg-white/5"></div>
                  </div>
                  
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {['M','T','W','T','F','S','S'][i]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        // Daily View: Tubes on Left, Calories on Right
        <div className="flex-1 flex items-center justify-between gap-8 z-10 pb-2">
            
            {/* Left: Macro Tubes (Lab Vial Style) */}
            <div className="flex-1 grid grid-cols-3 gap-3 h-full">
                {[
                    { label: 'Protein', val: protein, max: targetProt, pct: protPct, color: 'bg-red-500', text: 'text-red-400', shadow: 'shadow-red-500/20' },
                    { label: 'Carbs', val: carbs, max: targetCarb, pct: carbPct, color: 'bg-cyan-500', text: 'text-cyan-400', shadow: 'shadow-cyan-500/20' },
                    { label: 'Fats', val: fats, max: targetFat, pct: fatPct, color: 'bg-yellow-500', text: 'text-yellow-400', shadow: 'shadow-yellow-500/20' },
                ].map((macro) => (
                    <div key={macro.label} className="flex flex-col items-center justify-end h-full gap-3">
                        {/* Vial Container */}
                        <div className={`relative w-full h-[280px] rounded-t-2xl rounded-b-md border-2 border-white/10 overflow-hidden bg-black/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] backdrop-blur-sm`}>
                            {/* Liquid */}
                            <div 
                                className={`absolute bottom-0 left-0 right-0 ${macro.color} opacity-90 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(255,255,255,0.1)]`}
                                style={{ height: `${macro.pct}%` }}
                            >
                                <div className="absolute top-0 right-4 h-2 w-2 bg-white/40 rounded-full blur-[1px]"></div>
                                <div className="absolute w-2 h-2 bg-white/30 rounded-full bottom-10 left-3 animate-pulse"></div>
                                <div className="absolute w-1.5 h-1.5 bg-white/20 rounded-full bottom-20 right-6 animate-pulse" style={{animationDelay: '1s'}}></div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
                        </div>
                        
                        {/* Labels (Grams) */}
                        <div className="text-center w-full">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{macro.label}</p>
                            {/* SAFETY: Use Math.round and handle potential NaN gracefully */}
                            <p className={`text-2xl font-bold font-orbitron ${macro.text}`}>{Math.round(macro.val || 0)}g</p>
                            <p className="text-[10px] text-muted-foreground opacity-60">/ {macro.max}g</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Right: Total Calorie Display (Prominent) */}
            <div className="w-[180px] h-full flex flex-col items-center justify-center bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 hover:opacity-100 transition-opacity duration-700"></div>

                {/* Big Flame */}
                <div className="relative mb-4 z-10">
                    <Flame className={`w-16 h-16 transition-all duration-700 ${flameColor}`} />
                </div>

                <div className="text-center z-10">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Total Energy</p>
                    {/* SAFETY: Use Math.round and handle NaN */}
                    <p className="text-4xl font-black text-foreground font-orbitron tracking-tight">{Math.round(calories || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Kcal</p>
                    
                    {/* Mini Progress Bar */}
                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden max-w-[120px] mx-auto">
                        <div className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: `${calPct}%` }}></div>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1 font-mono">Target: {targetCal}</p>
                </div>
            </div>
        </div>
      )}
    </Card>
  )
}