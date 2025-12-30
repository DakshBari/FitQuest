"use client"

import { Card } from "@/components/ui/card"
import { Award, TrendingUp, Target, AlertTriangle } from "lucide-react"

export function CoachingPanel() {
    return (
        <div className="space-y-6">
            {/* Gamification Stats */}
            <Card className="bg-card/80 border border-white/10 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                    <Award className="text-yellow-500 fill-yellow-500/20 w-6 h-6"/>
                </div>
                
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Performance</h3>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                        <span className="text-muted-foreground">Session Grade</span>
                        <span className="text-xl font-bold text-green-400 font-orbitron">A+</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                        <span className="text-muted-foreground">Rep Consistency</span>
                        <span className="text-xl font-bold text-cyan-400 font-orbitron">98%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Weekly Trend</span>
                        <div className="flex items-center gap-2 text-green-400">
                            <TrendingUp className="w-4 h-4"/>
                            <span className="text-xl font-bold font-orbitron">+12%</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Coaching Feedback */}
            <Card className="bg-card/80 border border-white/10 p-5">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary"/>
                    AI Insights
                </h3>
                
                <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5"/>
                        <div>
                            <span className="text-sm font-bold text-red-300 block">Common Mistake</span>
                            <span className="text-xs text-red-400">Knees caving inward during ascent.</span>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <Target className="w-5 h-5 text-primary mt-0.5"/>
                        <div>
                            <span className="text-sm font-bold text-primary block">Improvement Target</span>
                            <span className="text-xs text-primary/80">Focus on tempo: 3s down, 1s up.</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}