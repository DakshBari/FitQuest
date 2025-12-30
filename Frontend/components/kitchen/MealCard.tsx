"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Star, Trash2, Copy, Edit2, X, Check, Info, Clock } from "lucide-react"
import { GoalType } from "./GoalSettings"
import { formatTime } from "@/lib/timeUtils"

interface Meal {
  id: number | string 
  name: string
  time: string
  calories: number
  protein: number
  carbs: number
  fats: number
  micros: {
    fiber: number
    sugar: number
    sodium: number
    cholesterol: number
    vitA: number
    vitC: number
    iron: number
    calcium: number
  }
  isFavorite: boolean
  baseQuantity: number
  quantity?: number
}

interface MealCardProps {
  meal: Meal
  onFavorite: () => void
  onDelete: () => void
  onDuplicate: () => void
  isEditing: boolean
  onEditStart: () => void
  onEditSave: (id: string, multiplier: number) => void 
  onEditCancel: () => void
  editQuantity: number[]
  onQuantityChange: (val: number[]) => void
  onLiveEdit?: (id: string, multiplier: number) => void
  goal: GoalType
  isReadOnly?: boolean
}

export function MealCard({ 
    meal, 
    onFavorite, onDelete, onDuplicate, 
    isEditing, onEditStart, onEditSave, onEditCancel, 
    editQuantity, onQuantityChange, onLiveEdit, goal,
    isReadOnly = false
}: MealCardProps) {
    
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)

    const mult = editQuantity[0] || 1;

    // Calculation logic (same as before)
    const adjProtein = isEditing ? Math.round(meal.protein * mult) : meal.protein;
    const adjCarbs = isEditing ? Math.round(meal.carbs * mult) : meal.carbs;
    const adjFats = isEditing ? Math.round(meal.fats * mult) : meal.fats;
    const adjCals = isEditing ? Math.round(meal.calories * mult) : meal.calories;
    const currentGrams = isEditing ? Math.round(meal.baseQuantity * mult) : (meal.quantity || meal.baseQuantity);

    const handleSliderChange = (val: number[]) => {
        onQuantityChange(val);
        if (onLiveEdit) {
            onLiveEdit(meal.id as string, val[0] || 1);
        }
    }

    return (
        <>
            <div className={`group relative flex flex-col md:flex-row items-center justify-between p-4 border-b border-border bg-transparent hover:bg-muted/30 transition-colors`}>
                
                {/* Left: Info */}
                <div className="flex items-center gap-4 w-full md:w-1/3">
                    <div className="flex-1">
                        {/* CHANGED: Star is ONLY visible when NOT editing */}
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground text-sm">
                                {meal.name} <span className="text-muted-foreground text-xs font-normal">({currentGrams} g)</span>
                            </h3>
                            {/* Star Icon Button - Only show when NOT editing */}
                            {!isEditing && (
                                <button 
                                    className="text-muted-foreground hover:text-yellow-500 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFavorite();
                                    }}
                                >
                                    <Star className={`w-3.5 h-3.5 ${meal.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                                </button>
                            )}
                        </div>
                        
                        {/* Time (Always visible) */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(meal.time)}
                        </div>
                    </div>
                </div>

                {/* Center: Calories (Highlight) */}
                <div className="w-full md:w-1/4 flex justify-center">
                    <div className="text-center">
                        <span className="block text-xl font-bold text-foreground tracking-tight font-mono">{adjCals}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">kcal</span>
                    </div>
                </div>

                {/* Right: Macros & Actions */}
                <div className="flex items-center justify-between w-full md:w-5/12 gap-4">
                    <div className="flex gap-4 text-xs font-mono text-muted-foreground">
                        <div className="flex flex-col">
                            <span className="font-medium text-foreground">{adjProtein}g</span>
                            <span className="text-[10px] uppercase opacity-70">Prot</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-foreground">{adjCarbs}g</span>
                            <span className="text-[10px] uppercase opacity-70">Carb</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-foreground">{adjFats}g</span>
                            <span className="text-[10px] uppercase opacity-70">Fat</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* CHANGED: Action Logic with Read-Only Support */}
                        {!isEditing ? (
                            /* NORMAL MODE: Show Edit, Copy, Trash (only if not read-only) */
                            !isReadOnly ? (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => onEditStart()} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={onDuplicate} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                        <Copy className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ) : (
                                /* READ-ONLY MODE: Show only favorite star */
                                <div className="flex items-center gap-1 opacity-60">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={onFavorite} 
                                        className={`h-8 w-8 text-yellow-500 hover:text-yellow-600 hover:bg-muted/50`}
                                        title={meal.isFavorite ? "Unfavorite" : "Favorite"}
                                    >
                                        <Star className={`w-3.5 h-3.5 ${meal.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                                    </Button>
                                </div>
                            )
                        ) : (
                            /* EDIT MODE: Show Star (Left of Cancel), Cancel, Save */
                            <div className="flex items-center gap-1">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={onFavorite} 
                                    className={`h-7 w-7 p-0 text-yellow-500 hover:text-yellow-600 hover:bg-muted/50`}
                                    title={meal.isFavorite ? "Unfavorite" : "Favorite"}
                                >
                                    <Star className={`w-3.5 h-3.5 ${meal.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                                </Button>
                                <Button onClick={onEditCancel} className="h-7 w-7 p-0 bg-muted hover:bg-muted/80 text-muted-foreground"><X className="w-3 h-3"/></Button>
                                <Button 
                                    onClick={() => onEditSave(meal.id as string, mult)} 
                                    className="h-7 w-7 p-0 bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    <Check className="w-3 h-3"/>
                                </Button>
                            </div>
                        )}

                        {/* Info Button (Always visible at far right) */}
                        <button
                            onClick={() => setIsInfoModalOpen(true)}
                            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="View Details"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Edit Slider */}
                {isEditing && (
                    <div className="w-full mt-4 pt-4 border-t border-border/50 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground uppercase font-bold w-16">Portion</span>
                            <Slider 
                                min={0.5} 
                                max={3} 
                                step={0.1} 
                                value={editQuantity} 
                                onValueChange={handleSliderChange}
                                className="flex-1"
                            />
                            <span className="text-xs font-mono text-primary w-24 text-right flex flex-col items-end">
                                <span>{mult.toFixed(1)}x</span>
                                <span className="text-[10px] opacity-80">({currentGrams}g)</span>
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Info Modal */}
            {isInfoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border w-full max-w-lg p-6 rounded-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsInfoModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-foreground">{meal.name}</h3>
                            <p className="text-sm text-muted-foreground">{formatTime(meal.time)} • {currentGrams}g</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 border-b border-border pb-2">Macronutrients</h4>
                                <div className="grid grid-cols-3 divide-x divide-border">
                                    <div className="px-2 text-center">
                                        <div className="text-2xl font-bold text-foreground font-mono">{adjProtein}g</div>
                                        <div className="text-xs text-muted-foreground">Protein</div>
                                    </div>
                                    <div className="px-2 text-center">
                                        <div className="text-2xl font-bold text-foreground font-mono">{adjCarbs}g</div>
                                        <div className="text-xs text-muted-foreground">Carbs</div>
                                    </div>
                                    <div className="px-2 text-center">
                                        <div className="text-2xl font-bold text-foreground font-mono">{adjFats}g</div>
                                        <div className="text-xs text-muted-foreground">Fats</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 border-b border-border pb-2">Micronutrients</h4>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Fiber</span> <span className="font-medium text-foreground">{Math.round(meal.micros.fiber * mult).toFixed(1)}g</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Sugar</span> <span className="font-medium text-foreground">{Math.round(meal.micros.sugar * mult).toFixed(1)}g</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Sodium</span> <span className="font-medium text-foreground">{Math.round(meal.micros.sodium * mult).toFixed(0)}mg</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Cholesterol</span> <span className="font-medium text-foreground">{Math.round(meal.micros.cholesterol * mult).toFixed(0)}mg</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Iron</span> <span className="font-medium text-foreground">{Math.round(meal.micros.iron * mult).toFixed(1)}mg</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Calcium</span> <span className="font-medium text-foreground">{Math.round(meal.micros.calcium * mult).toFixed(0)}mg</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Vit A</span> <span className="font-medium text-foreground">{Math.round(meal.micros.vitA * mult).toFixed(0)}%</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Vit C</span> <span className="font-medium text-foreground">{Math.round(meal.micros.vitC * mult).toFixed(0)}%</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}