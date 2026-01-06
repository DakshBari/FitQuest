"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Search, 
  UserPlus, 
  Users, 
  Loader2,
  Check
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Friend {
  id: string
  name: string
  avatar: string
  level: number
  online: boolean
  lastActive?: string
}

interface SearchResult {
  _id: string
  username: string
  avatar: string
  level: number
  isOnline: boolean
}

export default function FriendsComponent() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  
  // Add Friend Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set())
  const [requestStatus, setRequestStatus] = useState<Record<string, "sent" | "error">>({})

  // Helper to get auth config
  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log("[Auth] Token found, attaching to request.");
    } else {
      console.warn("[Auth] WARNING: No token found in localStorage!");
    }

    return {
      headers,
      credentials: 'include' // Included for safety, but Backend expects Bearer Token
    };
  };

  // Fetch Friends on Mount
  useEffect(() => {
    fetchFriends()
  }, [])

  const fetchFriends = async () => {
    try {
      setLoading(true)
      console.log("Fetching friends from:", `${API_URL}/api/guilds/friends`);
      
      const res = await fetch(`${API_URL}/api/guilds/friends`, {
        method: 'GET',
        ...getAuthConfig()
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(`[Friends Error] Status: ${res.status}`, errorData);
        throw new Error(`Failed to fetch friends: ${res.status}`);
      }
      
      const data = await res.json()
      if (data.status === 'success') {
        const mappedFriends = data.friends.map((f: any) => ({
          id: f.id,
          name: f.name,
          avatar: f.avatar,
          level: f.level,
          online: f.online || false, 
          lastActive: f.lastActive
        }))
        setFriends(mappedFriends)
      }
    } catch (error: any) {
      console.error("Fetch Friends Error:", error.message);
    } finally {
      setLoading(false)
    }
  }

  // Search Users functionality
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (userSearchQuery.trim().length > 0) {
        searchUsers(userSearchQuery)
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [userSearchQuery])

  const searchUsers = async (query: string) => {
    try {
      setSearchLoading(true)
      const url = `${API_URL}/api/users/search?q=${encodeURIComponent(query)}`;
      console.log("Searching users at:", url);

      const res = await fetch(url, {
        method: 'GET',
        ...getAuthConfig()
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(`[Search Error] Status: ${res.status}`, errorData);
        setSearchResults([])
        return;
      }

      const data = await res.json()
      if (data.status === 'success') {
        const friendIds = new Set(friends.map(f => f.id))
        const newUsers = data.users.filter((u: SearchResult) => !friendIds.has(u._id))
        setSearchResults(newUsers)
      }
    } catch (error: any) {
      console.error("Search Users Error:", error.message);
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const sendFriendRequest = async (userId: string) => {
    setPendingRequests(prev => new Set(prev).add(userId))
    
    try {
      const res = await fetch(`${API_URL}/api/guilds/friends/request`, {
        method: 'POST',
        ...getAuthConfig(),
        body: JSON.stringify({ userId })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(`[Request Error] Status: ${res.status}`, errorData);
        throw new Error('Failed to send request');
      }

      setRequestStatus(prev => ({ ...prev, [userId]: "sent" }))
      setSearchResults(prev => prev.filter(u => u._id !== userId))
    } catch (error: any) {
      console.error("Send Request Error:", error.message);
      setRequestStatus(prev => ({ ...prev, [userId]: "error" }))
    } finally {
      setPendingRequests(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Card className="bg-card border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-[#00BBA7]" />
            Friends ({friends.length})
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative w-64 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-border focus:border-[#00BBA7] focus:ring-[#00BBA7]/20"
              />
            </div>

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-[#00BBA7] hover:bg-[#009688] text-white font-medium"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Friend
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Friend</DialogTitle>
                  <DialogDescription>
                    Search for players by username to send a friend request.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search players..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {searchLoading && (
                      <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    
                    {!searchLoading && searchResults.length === 0 && userSearchQuery && (
                      <p className="text-sm text-muted-foreground text-center p-4">
                        No users found.
                      </p>
                    )}

                    {searchResults.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-[#00BBA7]/10 text-[#00BBA7] text-xs font-semibold">
                                {user.avatar || user.username.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {user.isOnline && (
                              <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.username}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                              {user.isOnline ? 'Online' : 'Offline'} • Lvl {user.level}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={requestStatus[user._id] === "sent" ? "secondary" : "default"}
                          className="h-8 px-3"
                          onClick={() => sendFriendRequest(user._id)}
                          disabled={pendingRequests.has(user._id) || requestStatus[user._id] === "sent"}
                        >
                          {pendingRequests.has(user._id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : requestStatus[user._id] === "sent" ? (
                            <>
                              <Check className="h-3 w-3 mr-1" /> Sent
                            </>
                          ) : (
                            "Add"
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="p-4 bg-muted/50 rounded-lg border border-border hover:border-[#00BBA7]/50 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#00BBA7]/10 text-[#00BBA7] font-semibold">
                        {friend.avatar}
                      </AvatarFallback>
                    </Avatar>
                    {friend.online && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{friend.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${friend.online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      <p className="text-xs text-muted-foreground truncate">
                        {friend.online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-background rounded border border-border">
                    Lvl {friend.level}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-[#00BBA7]/30 text-[#00BBA7] hover:bg-[#00BBA7]/10"
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            ))}
            
            {!loading && filteredFriends.length === 0 && (
              <div className="col-span-full py-8 text-center text-muted-foreground">
                No friends found. Add some friends to see them here!
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  )
}