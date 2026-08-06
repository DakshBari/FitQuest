"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { ProtectedLayout } from "@/components/layouts/ProtectedLayout"
import { PageHeader } from "@/components/page-header"
import FriendsComponent from "@/components/guilds/friends"
import { FriendKitchenCard } from "@/components/guilds/FriendKitchenCard"
import { FriendArenaCard } from "@/components/guilds/FriendArenaCard"
import { FriendWorldMapCard } from "@/components/guilds/FriendWorldMapCard"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface Friend {
  id: string
  name: string
  avatar: string
  level: number
  online: boolean
}

const getHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export default function GuildsPage() {
  const [friends, setFriends] = useState<Friend[]>([])

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await fetch(`${API_URL}/api/guilds/friends`, { headers: getHeaders() })
        if (!res.ok) return
        const data = await res.json()
        if (data.status === "success") {
          setFriends(
            data.friends.map((f: any) => ({
              id: f.id,
              name: f.name,
              avatar: f.avatar,
              level: f.level,
              online: f.online || false,
            }))
          )
        }
      } catch (e) {
        console.error("Failed to load friends for guilds page", e)
      }
    }
    fetchFriends()
  }, [])

  return (
    <ProtectedLayout>
      <div className="min-h-screen flex flex-col bg-background">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 flex-1 flex flex-col pt-4 pb-8 space-y-6">
          {/* Modern Header */}
          <PageHeader 
            className="px-0"
            title="Guilds"
            subtitle="Connect with friends and share progress"
          />

      {/* Friends Section */}
      <FriendsComponent />

      {/* Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* Kitchen Section — LIVE */}
        <FriendKitchenCard friends={friends} />

        {/* Arena Section — LIVE */}
        <FriendArenaCard friends={friends} />

        {/* Sanctuary Section */}
        <Card className="bg-card border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#BF94E5]/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-[#BF94E5]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Sanctuary</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <p className="text-xs text-muted-foreground/50">Live sanctuary data coming soon</p>
          </div>
        </Card>

        {/* World Map Section — LIVE */}
        <FriendWorldMapCard friends={friends} />
      </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}