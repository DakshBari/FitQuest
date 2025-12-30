"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Camera, Star, Clock, Plus } from "lucide-react"
import { formatTime } from "@/lib/timeUtils"

interface Meal {
    _id?: string
    id?: string | number
    name: string
    calories: number
    time?: string
    isFavorite: boolean
    protein?: number
    carbs?: number
    fats?: number
    baseQuantity?: number
    quantity?: number
    micros?: any
}

interface FoodSearchProps {
    searchQuery: string
    setSearchQuery: (q: string) => void
    favorites: Meal[]
    onAddMeal?: (meal: any) => void
    onToggleFavorite?: (id: string, currentStatus: boolean) => void
}

export function FoodSearch({ searchQuery, setSearchQuery, favorites, onAddMeal, onToggleFavorite }: FoodSearchProps) {
    
    return (
        <Card className="bg-card/50 border border-border shadow-sm p-5">
            {/* Professional Search Bar */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                    type="text"
                    placeholder="Search food database..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-10 bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary/50 h-10 text-sm shadow-sm"
                />
                <div className="absolute inset-y-0 right-2 flex items-center">
                    <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                        <Camera className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Frequent / Favorites Section */}
            {favorites.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Star className="w-3 h-3 fill-yellow-500/20 text-yellow-500"/> Favorites
                        </h4>
                        <button className="text-[10px] text-primary hover:underline">View All</button>
                    </div>
                    
                    <div className="space-y-2">
                        {favorites.map((fav) => (
                            <div key={fav._id || fav.id} className="group">
                                <div className="w-full flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-border/50 transition-all">
                                    {/* Left side - clickable area for adding meal */}
                                    <button 
                                        className="flex items-center gap-3 flex-1 text-left"
                                        onClick={() => onAddMeal && onAddMeal(fav)}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:border-primary/50 group-hover:text-primary transition-colors">
                                            {fav.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{fav.name}</span>
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <Clock className="w-2.5 h-2.5"/>
                                                {fav.time ? formatTime(fav.time) : 'Recently added'}
                                            </div>
                                        </div>
                                    </button>
                                    
                                    {/* Right Side: Kcal + Unfavorite Button */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-muted-foreground">{fav.calories} kcal</span>
                                        
                                        {/* Unfavorite Button - separate from main button */}
                                        <button 
                                            className="p-1.5 rounded-md text-yellow-500 hover:text-yellow-600 hover:bg-muted/50 transition-colors"
                                            onClick={() => {
                                                if(onToggleFavorite) onToggleFavorite((fav._id || fav.id) as string, fav.isFavorite);
                                            }}
                                            title="Remove from favorites"
                                        >
                                            <Star className="w-4 h-4 fill-yellow-500" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    )
}