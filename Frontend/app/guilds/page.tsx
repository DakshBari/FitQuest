"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Users, Crown, Target, Flame } from "lucide-react"

export default function GuildsPage() {
  const friends = [
    { name: "Sarah Chen", status: "Running...", avatar: "SC", level: 18, online: true },
    { name: "Mike Rodriguez", status: "In Arena", avatar: "MR", level: 15, online: true },
    { name: "Emma Wilson", status: "Offline", avatar: "EW", level: 22, online: false },
    { name: "Jake Thompson", status: "In Kitchen", avatar: "JT", level: 14, online: true },
  ]

  const leaderboard = [
    { rank: 1, name: "Emma Wilson", territories: 24, xp: 12480, avatar: "EW" },
    { rank: 2, name: "You", territories: 18, xp: 9240, avatar: "WX" },
    { rank: 3, name: "Sarah Chen", territories: 16, xp: 8100, avatar: "SC" },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground font-orbitron">Guilds & Social</h1>
        <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold">
          <Users className="h-4 w-4 mr-2" />
          Create Guild
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top 3 Podium */}
          <Card className="bg-card/80 border-primary/20 backdrop-blur-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-6 font-orbitron">Top Warriors</h2>
            <div className="flex items-end justify-center gap-4 mb-8">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <Avatar className="h-16 w-16 border-2 border-slate-400 mb-2">
                  <AvatarFallback className="bg-muted border border-border text-foreground text-lg">
                    {leaderboard[2].avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="h-24 w-32 bg-gradient-to-t from-muted to-accent rounded-t-xl flex flex-col items-center justify-center border-2 border-slate-400">
                  <Crown className="h-6 w-6 text-slate-400 mb-1" />
                  <p className="text-2xl font-bold text-foreground font-orbitron">2</p>
                </div>
                <p className="text-sm font-semibold text-foreground mt-2">{leaderboard[2].name}</p>
                <p className="text-xs text-muted-foreground">{leaderboard[2].territories} territories</p>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center">
                <Avatar className="h-20 w-20 border-2 border-yellow-400 mb-2">
                  <AvatarFallback className="bg-yellow-600 text-white text-xl">{leaderboard[0].avatar}</AvatarFallback>
                </Avatar>
                <div className="h-32 w-32 bg-gradient-to-t from-yellow-600 to-yellow-500 rounded-t-xl flex flex-col items-center justify-center border-2 border-yellow-400 shadow-lg shadow-yellow-500/50">
                  <Crown className="h-8 w-8 text-yellow-200 mb-1" />
                  <p className="text-3xl font-bold text-white font-orbitron">1</p>
                </div>
                <p className="text-sm font-semibold text-foreground mt-2">{leaderboard[0].name}</p>
                <p className="text-xs text-muted-foreground">{leaderboard[0].territories} territories</p>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <Avatar className="h-16 w-16 border-2 border-amber-700 mb-2">
                  <AvatarFallback className="bg-amber-800/20 dark:bg-amber-800 text-foreground text-lg">
                    {leaderboard[1].avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="h-20 w-32 bg-gradient-to-t from-amber-800/30 to-amber-700/20 dark:from-amber-800 dark:to-amber-700 rounded-t-xl flex flex-col items-center justify-center border-2 border-amber-700">
                  <Crown className="h-6 w-6 text-amber-600 mb-1" />
                  <p className="text-2xl font-bold text-foreground font-orbitron">3</p>
                </div>
                <p className="text-sm font-semibold text-foreground mt-2">{leaderboard[1].name}</p>
                <p className="text-xs text-muted-foreground">{leaderboard[1].territories} territories</p>
              </div>
            </div>
          </Card>

          {/* Raid Boss */}
          <Card className="bg-gradient-to-br from-red-500/10 to-purple-500/10 border-red-500/30 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground font-orbitron">Global Raid Boss</h2>
              <span className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-xs text-red-300 font-semibold">
                ACTIVE
              </span>
            </div>
            <div className="flex items-center gap-6 mb-6">
              <img
                src="/raid-boss-titan-of-sloth-dark-monster.jpg"
                alt="Raid Boss"
                className="w-32 h-32 rounded-xl border-2 border-red-500/50"
              />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground mb-2 font-orbitron">Titan of Sloth</h3>
                <p className="text-muted-foreground mb-4">Global community boss. Deal damage by completing workouts!</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">Boss Health</span>
                    <span className="text-red-400 font-semibold">2.4M / 10M HP</span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden border border-red-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-purple-500 rounded-full shadow-lg"
                      style={{ width: "24%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Your Damage</p>
                <p className="text-xl font-bold text-cyan-400 font-orbitron">42,800</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Time Remaining</p>
                <p className="text-xl font-bold text-secondary font-orbitron">5d 12h</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Friends */}
        <div className="space-y-6">
          <Card className="bg-card/80 border-primary/20 backdrop-blur-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 font-orbitron">Friends</h2>
            <div className="space-y-3">
              {friends.map((friend, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted text-primary">{friend.avatar}</AvatarFallback>
                      </Avatar>
                      {friend.online && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{friend.name}</p>
                      <p className="text-xs text-muted-foreground">{friend.status}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-primary/50 text-primary hover:bg-primary/10 bg-transparent text-xs"
                  >
                    Challenge
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-card/80 border-primary/20 backdrop-blur-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 font-orbitron">Your Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Guild Rank</p>
                  <p className="text-lg font-bold text-foreground font-orbitron">#2</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Target className="h-5 w-5 text-cyan-400" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Challenges Won</p>
                  <p className="text-lg font-bold text-foreground font-orbitron">18</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Flame className="h-5 w-5 text-orange-400" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Win Streak</p>
                  <p className="text-lg font-bold text-foreground font-orbitron">5</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
