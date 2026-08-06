"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Zap, AlertTriangle, CheckCircle, RotateCcw, Activity, FileText } from "lucide-react"

// Mock AI Data Structure
export type AIFeedback = 'perfect' | 'good' | 'poor' | 'none'

export function AICameraView({ onSwitchMode }: { onSwitchMode?: () => void }) {
    const [isCameraActive, setIsCameraActive] = useState(false)
    const [detectedReps, setDetectedReps] = useState(0)
    const [currentRep, setCurrentRep] = useState(0) // 0-100% range
    const [formScore, setFormScore] = useState(92) // %
    const [feedback, setFeedback] = useState<AIFeedback>('none')
    const [streak, setStreak] = useState(5)
    const videoRef = useRef<HTMLVideoElement>(null)

    // Simulation Loop
    useEffect(() => {
        let interval: any
        if (isCameraActive) {
            interval = setInterval(() => {
                // Simulate AI Detection Logic
                setCurrentRep(prev => {
                    if (prev >= 100) {
                        setDetectedReps(d => d + 1)
                        setFeedback('perfect')
                        return 0
                    }
                    return prev + 5 // Speed of detection
                })
                
                // Simulate Form Score fluctuations
                setFormScore(prev => Math.max(80, prev + (Math.random() * 4 - 2)))

            }, 100)
        } else {
            clearInterval(interval)
        }

        return () => clearInterval(interval)
    }, [isCameraActive])

    return (
        <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden border border-white/10 flex flex-col">
            
            {/* A. Header / Controls */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
                <Button 
                    onClick={() => setIsCameraActive(!isCameraActive)}
                    variant={isCameraActive ? "destructive" : "default"}
                    className="bg-black/50 backdrop-blur-md border-white/20 hover:bg-black/70 text-white shadow-lg"
                >
                    {isCameraActive ? <RotateCcw className="h-4 w-4"/> : <Camera className="h-4 w-4"/>}
                    {isCameraActive ? "Reset" : "Start AI"}
                </Button>
            </div>

            {/* B. Video Feed Simulation */}
            <div className="relative flex-1">
                {/* Placeholder Image / Video */}
                <video 
                    ref={videoRef}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isCameraActive ? 'opacity-100' : 'opacity-30'}`}
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                >
                    <source src="/gym-workout-motion-analysis-computer-vision-skeleton-tracking-interface.jpg" type="image/jpeg" />
                </video>

                {/* C. AR HUD Overlay */}
                {isCameraActive && (
                    <div className="absolute inset-0 pointer-events-none">
                        {/* 1. Skeleton / Joints Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                            <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')] mix-blend-overlay opacity-20"></div>
                            {/* Mock Skeleton Points */}
                            <div className="absolute top-1/3 left-1/4 w-8 h-8 border-2 border-cyan-400 rounded-full animate-pulse"></div>
                            <div className="absolute top-1/3 right-1/4 w-8 h-8 border-2 border-cyan-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                            <div className="absolute bottom-1/3 left-1/2 w-12 h-2 bg-cyan-400 blur-sm"></div> // Torso line
                        </div>

                        {/* 2. Live Metrics (Top Center) */}
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                            <div className="bg-black/60 backdrop-blur-md border border-cyan-500/50 rounded-lg px-4 py-2 text-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white font-orbitron">
                                    {detectedReps}
                                </span>
                                <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Reps</span>
                            </div>
                            <div className="bg-black/60 backdrop-blur-md border border-purple-500/50 rounded-lg px-3 py-1 text-center">
                                <span className="text-sm font-bold text-white font-mono">{formScore}%</span>
                                <span className="text-[10px] text-purple-300 uppercase">Form Score</span>
                            </div>
                        </div>

                        {/* 3. Dynamic Feedback (Center) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 text-center transition-all duration-300">
                            {feedback === 'perfect' && (
                                <div className="px-4 py-2 bg-green-500/90 backdrop-blur-md border border-green-400 rounded-xl animate-in zoom-in-95">
                                    <span className="text-green-100 font-bold text-sm flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4"/> Perfect Form!
                                    </span>
                                </div>
                            )}
                            {feedback === 'poor' && (
                                <div className="px-4 py-2 bg-violet-500/90 backdrop-blur-md border border-violet-400 rounded-xl animate-in zoom-in-95">
                                    <span className="text-violet-100 font-bold text-sm flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4"/> Correct Posture
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* 4. Progress Bar (Bottom) */}
                        <div className="absolute bottom-8 left-8 right-8 bg-black/70 backdrop-blur-md rounded-lg h-4 overflow-hidden border border-white/10">
                             <div 
                                className="h-full transition-all duration-200 bg-gradient-to-r from-cyan-500 to-purple-500"
                                style={{ width: `${currentRep}%` }}
                             >
                                {/* Shine animation */}
                                <div className="absolute top-0 right-0 h-full w-2 bg-white/40 blur-[2px]"></div>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* D. Coaching Panel (Bottom Left) */}
            {isCameraActive && (
                <div className="absolute bottom-8 left-8 w-64">
                    <div className="bg-card/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <span className="text-xs font-bold text-foreground uppercase">Session Grade</span>
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded border border-green-500/30">Excellent</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-white/5 rounded p-2">
                                <span className="text-[10px] text-muted-foreground block">Streak</span>
                                <span className="text-lg font-bold text-primary">{streak} <span className="text-xs text-foreground">🔥</span></span>
                            </div>
                            <div className="bg-white/5 rounded p-2">
                                <span className="text-[10px] text-muted-foreground block">Confidence</span>
                                <span className="text-lg font-bold text-primary">94%</span>
                            </div>
                        </div>
                        <div className="pt-2">
                            <div className="flex items-start gap-2">
                                <Activity className="w-4 h-4 text-cyan-400 mt-1"/>
                                <p className="text-xs text-muted-foreground leading-tight">
                                    <span className="text-white font-bold block">Deepen Squat:</span> Keep chest up. Drive through heels.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mode Toggle Button (Bottom Right) */}
            {onSwitchMode && (
                <div className="absolute bottom-8 right-8 z-20">
                    <Button
                        onClick={onSwitchMode}
                        variant="outline"
                        className="bg-black/50 dark:bg-white/5 backdrop-blur-md border-white/20 dark:border-white/10 text-white dark:text-gray-300 hover:bg-black/70 dark:hover:bg-white/10 px-4 py-2 font-semibold transition-all shadow-lg"
                    >
                        <FileText className="h-4 w-4 mr-2"/> Switch to Workout Log
                    </Button>
                </div>
            )}
        </div>
    )
}