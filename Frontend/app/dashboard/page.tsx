"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Flame, Trophy, Swords, Heart, Zap, Target, AlertTriangle, Gift } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Daily Stats */}
        <div className="space-y-6">
          {/* Activity Rings */}
          <Card className="bg-card/80 border-primary/20 backdrop-blur-xl p-6">
            <h2 className="text-xl font-bold mb-6 font-orbitron">Daily Activity</h2>
            <div className="flex justify-center mb-8">
              <div className="relative w-48 h-48">
                {/* Calories Ring - Outer */}
                <svg className="absolute inset-0 w-48 h-48 -rotate-90">
                  <circle cx="96" cy="96" r="88" stroke="rgb(239 68 68 / 0.2)" strokeWidth="12" fill="none" />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="rgb(239 68 68)"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - 0.68)}
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                  />
                </svg>
                {/* Move Minutes Ring - Middle */}
                <svg className="absolute inset-0 w-48 h-48 -rotate-90">
                  <circle cx="96" cy="96" r="70" stroke="rgb(34 197 94 / 0.2)" strokeWidth="12" fill="none" />
                  <circle
                    cx="96"
                    cy="96"
                    r="70"
                    stroke="rgb(34 197 94)"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 70}
                    strokeDashoffset={2 * Math.PI * 70 * (1 - 0.85)}
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                  />
                </svg>
                {/* Stand Hours Ring - Inner */}
                <svg className="absolute inset-0 w-48 h-48 -rotate-90">
                  <circle cx="96" cy="96" r="52" stroke="rgb(6 182 212 / 0.2)" strokeWidth="12" fill="none" />
                  <circle
                    cx="96"
                    cy="96"
                    r="52"
                    stroke="rgb(6 182 212)"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - 0.92)}
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  />
                </svg>
              </div>
            </div>
            {/* Ring Labels */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Calories</span>
                </div>
                <span className="font-semibold">1632 / 2400</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Move Minutes</span>
                </div>
                <span className="font-semibold">51 / 60</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500" />
                  <span className="text-muted-foreground">Stand Hours</span>
                </div>
                <span className="font-semibold">11 / 12</span>
              </div>
            </div>
          </Card>

          {/* Streak Counter */}
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 backdrop-blur-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-500/20 rounded-2xl">
                <Flame className="h-8 w-8 text-orange-400" />
              </div>
              <div>
                <p className="text-3xl font-bold font-orbitron">12 Days</p>
                <p className="text-orange-400 font-medium">Current Streak</p>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-card/80 border-primary/20 backdrop-blur-xl p-6">
            <h3 className="text-lg font-bold mb-4 font-orbitron">Today's Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-muted-foreground">Quests Completed</span>
                </div>
                <span className="font-semibold">3</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4 text-cyan-500" />
                  <span className="text-muted-foreground">Perfect Reps</span>
                </div>
                <span className="font-semibold">48</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="text-muted-foreground">Form Score</span>
                </div>
                <span className="font-semibold">94%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Center Column - Avatar */}
        <div className="space-y-6">
          <Card className="bg-card/80 border-primary/20 backdrop-blur-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-center font-orbitron">Your Avatar</h2>

            {/* Character Display */}
            <div className="relative aspect-square max-w-sm mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-purple-500/10 rounded-3xl" />
              <div className="relative flex items-center justify-center h-full">
                <img
                  src="/futuristic-3d-warrior-character-silhouette-cyberpu.jpg"
                  alt="Character Avatar"
                  className="w-full h-full object-contain"
                />
              </div>
              {/* Warning for injury */}
              <div className="absolute top-4 right-4 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
            </div>

            {/* Character Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/50 border border-red-500/30 rounded-xl p-4 text-center">
                <Swords className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold font-orbitron">76</p>
                <p className="text-xs text-muted-foreground">Strength</p>
              </div>
              <div className="bg-muted/50 border border-cyan-500/30 rounded-xl p-4 text-center">
                <Zap className="h-6 w-6 text-cyan-500 mx-auto mb-2" />
                <p className="text-2xl font-bold font-orbitron">82</p>
                <p className="text-xs text-muted-foreground">Agility</p>
              </div>
              <div className="bg-muted/50 border border-green-500/30 rounded-xl p-4 text-center">
                <Heart className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold font-orbitron">68</p>
                <p className="text-xs text-muted-foreground">Endurance</p>
              </div>
            </div>

            {/* Injury Warning */}
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-500">Heatmap Alert: Right Knee</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Elevated strain detected. Consider rest or modify exercises.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Current Quest */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border-purple-500/30 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-orbitron">Today's Quest</h2>
              <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-xs text-purple-600 dark:text-purple-300 font-semibold">
                ACTIVE
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold mb-2 font-orbitron">Leg Day Destruction</h3>
                <p className="text-muted-foreground">
                  Complete a legendary lower body workout to unlock the Titan's Greaves armor piece.
                </p>
              </div>

              {/* Quest Progress */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Squats</span>
                    <span className="text-cyan-500 font-semibold">30 / 50</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Lunges</span>
                    <span className="text-cyan-500 font-semibold">20 / 40</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Calf Raises</span>
                    <span className="text-muted-foreground font-semibold">0 / 30</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
              </div>

              {/* Reward Preview */}
              <div className="relative mt-6 p-4 bg-muted/50 border border-cyan-500/30 rounded-2xl">
                <div className="absolute -top-3 left-4 px-3 py-1 bg-card border border-cyan-500/50 rounded-full">
                  <span className="text-xs text-cyan-500 font-semibold flex items-center gap-1">
                    <Gift className="h-3 w-3" />
                    REWARD
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <img
                    src="/futuristic-glowing-armor-boots-treasure-chest.jpg"
                    alt="Reward"
                    className="w-20 h-20 rounded-lg"
                  />
                  <div>
                    <p className="font-bold font-orbitron">Titan's Greaves</p>
                    <p className="text-xs text-muted-foreground mt-1">Epic Leg Armor</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">+15 Endurance, +10 Strength</p>
                  </div>
                </div>
              </div>

              {/* Start Quest Button */}
              <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-purple-500/30 transition-all text-lg font-orbitron">
                START QUEST
              </Button>
            </div>
          </Card>

          {/* Weekly Summary */}
          <Card className="bg-card/80 border-primary/20 backdrop-blur-xl p-6">
            <h3 className="text-lg font-bold mb-4 font-orbitron">This Week</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Total Workouts</span>
                <span className="text-2xl font-bold text-cyan-500 font-orbitron">12</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">XP Earned</span>
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-orbitron">3,480</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Territories Captured</span>
                <span className="text-2xl font-bold text-green-500 font-orbitron">5</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
