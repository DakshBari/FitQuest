"use client"

import { Card } from "@/components/ui/card"
import { 
  ChefHat, 
  Swords, 
  Sparkles, 
  Map,
  Clock,
  Trophy,
  Target,
  Activity
} from "lucide-react"
import FriendsComponent from "@/components/guilds/friends"

// Mock data for the activity sections as requested focus was on Friends component
// Note: These should ideally be fetched from API endpoints like /api/dashboard/activity
const mockFriends = [ 
  // ... removed mock friends data ...
]

// Keeping this temporary data just for the Activity sections to render visually as per original file
// Ideally, you would fetch specific activity data for each section.
const demoActivityData = [
  { 
    id: 1, 
    name: "Sarah Chen", 
    avatar: "SC", 
    activities: {
      kitchen: { completed: 3, total: 5, lastActive: "2 hours ago" },
      arena: { rank: 12, wins: 8, lastActive: "1 hour ago" },
      sanctuary: { streak: 7, meditation: 45, lastActive: "30 min ago" },
      worldMap: { territories: 5, distance: "12.5 km", lastActive: "Active now" }
    }
  },
  { 
    id: 2, 
    name: "Mike Rodriguez", 
    avatar: "MR", 
    activities: {
      kitchen: { completed: 2, total: 4, lastActive: "1 hour ago" },
      arena: { rank: 8, wins: 12, lastActive: "Active now" },
      sanctuary: { streak: 3, meditation: 20, lastActive: "3 hours ago" },
      worldMap: { territories: 3, distance: "8.2 km", lastActive: "2 hours ago" }
    }
  },
  { 
    id: 3, 
    name: "Emma Wilson", 
    avatar: "EW", 
    activities: {
      kitchen: { completed: 5, total: 5, lastActive: "Yesterday" },
      arena: { rank: 3, wins: 15, lastActive: "Yesterday" },
      sanctuary: { streak: 12, meditation: 60, lastActive: "Yesterday" },
      worldMap: { territories: 8, distance: "18.7 km", lastActive: "Yesterday" }
    }
  }
]

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function GuildsPage() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#00BBA7]">Guilds</h1>
      </div>

      {/* Friends Section - Now using the new Component */}
      <FriendsComponent />

      {/* Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Kitchen Section */}
        <Card className="bg-card border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#00DE73]/10 rounded-lg">
              <ChefHat className="h-5 w-5 text-[#00DE73]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Kitchen</h3>
          </div>
          <div className="space-y-3">
            {demoActivityData.slice(0, 3).map((friend) => (
              <div key={`kitchen-${friend.id}`} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-[#00BBA7]/20 text-[#00BBA7] text-xs">
                      {friend.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{friend.name}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Meals: {friend.activities.kitchen.completed}/{friend.activities.kitchen.total}</p>
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {friend.activities.kitchen.lastActive}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Arena Section */}
        <Card className="bg-card border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#FB2C36]/10 rounded-lg">
              <Swords className="h-5 w-5 text-[#FB2C36]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Arena</h3>
          </div>
          <div className="space-y-3">
            {demoActivityData.slice(0, 3).map((friend) => (
              <div key={`arena-${friend.id}`} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-[#00BBA7]/20 text-[#00BBA7] text-xs">
                      {friend.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{friend.name}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    Rank #{friend.activities.arena.rank}
                  </p>
                  <p className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {friend.activities.arena.wins} wins
                  </p>
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {friend.activities.arena.lastActive}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Sanctuary Section */}
        <Card className="bg-card border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#BF94E5]/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-[#BF94E5]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Sanctuary</h3>
          </div>
          <div className="space-y-3">
            {demoActivityData.slice(0, 3).map((friend) => (
              <div key={`sanctuary-${friend.id}`} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-[#00BBA7]/20 text-[#00BBA7] text-xs">
                      {friend.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{friend.name}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Streak: {friend.activities.sanctuary.streak} days</p>
                  <p>{friend.activities.sanctuary.meditation} min meditation</p>
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {friend.activities.sanctuary.lastActive}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* World Map Section */}
        <Card className="bg-card border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#2C80FF]/10 rounded-lg">
              <Map className="h-5 w-5 text-[#2C80FF]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">World Map</h3>
          </div>
          <div className="space-y-3">
            {demoActivityData.slice(0, 3).map((friend) => (
              <div key={`worldmap-${friend.id}`} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-[#00BBA7]/20 text-[#00BBA7] text-xs">
                      {friend.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{friend.name}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{friend.activities.worldMap.territories} territories</p>
                  <p className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {friend.activities.worldMap.distance}
                  </p>
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {friend.activities.worldMap.lastActive}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}