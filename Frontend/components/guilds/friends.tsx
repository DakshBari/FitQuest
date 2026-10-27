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
  Check,
  XCircle,
  Inbox,
  UserCheck,
  UserX,
  Trash2
} from "lucide-react"
import { updateStatus } from "@/services/authService"
import { toast } from "@/components/ui/sonner"

import { getApiUrl } from "@/lib/config"

const API_URL = getApiUrl();

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set())
  const [requestStatus, setRequestStatus] = useState<Record<string, "sent" | "error">>({})
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [processingRequestIds, setProcessingRequestIds] = useState<Set<string>>(new Set())
  const [deletingFriendId, setDeletingFriendId] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [friendToDelete, setFriendToDelete] = useState<Friend | null>(null)
  const getHeaders = () => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Fetch Friends on Mount
  useEffect(() => {
    fetchFriends()
    updateStatus(true)
  }, [])

  const fetchFriendRequests = async () => {
    try {
      setRequestsLoading(true)
      const res = await fetch(`${API_URL}/api/guilds/friends/requests`, {
        method: 'GET',
        headers: getHeaders()
      })
      
      if (!res.ok) {
        throw new Error('Failed to fetch friend requests')
      }
      
      const data = await res.json()
      if (data.status === 'success') {
        setFriendRequests(data.requests)
      }
    } catch (error: any) {
      console.error("Fetch Requests Error:", error.message);
    } finally {
      setRequestsLoading(false)
    }
  }

  const handleFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
    setProcessingRequestIds(prev => new Set(prev).add(requestId))
    
    try {
      const res = await fetch(`${API_URL}/api/guilds/friends/requests/${requestId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ action })
      })

      if (!res.ok) {
        throw new Error(`Failed to ${action} request`)
      }

      if (action === 'accept') {
        toast.success("Friend request accepted!")
        // Refresh friends list
        fetchFriends()
      } else {
        toast.success("Friend request rejected")
      }

      // Remove from requests list
      setFriendRequests(prev => prev.filter(r => r.id !== requestId))
      
    } catch (error: any) {
      console.error(`${action} Request Error:`, error.message);
      toast.error(`Failed to ${action} request`)
    } finally {
      setProcessingRequestIds(prev => {
        const next = new Set(prev)
        next.delete(requestId)
        return next
      })
    }
  }

  const openDeleteModal = (friend: Friend) => {
    setFriendToDelete(friend)
    setIsDeleteModalOpen(true)
  }

  const deleteFriend = async () => {
    if (!friendToDelete) return
    
    setDeletingFriendId(friendToDelete.id)
    
    try {
      const res = await fetch(`${API_URL}/api/guilds/friends/${friendToDelete.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })

      if (!res.ok) {
        throw new Error('Failed to remove friend')
      }

      toast.success(`${friendToDelete.name} removed from friends`)
      setFriends(prev => prev.filter(f => f.id !== friendToDelete.id))
      setIsDeleteModalOpen(false)
      setFriendToDelete(null)
      
    } catch (error: any) {
      console.error("Delete Friend Error:", error.message);
      toast.error("Failed to remove friend")
    } finally {
      setDeletingFriendId(null)
    }
  }

  const fetchFriends = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/guilds/friends`, {
        method: 'GET',
        headers: getHeaders()
      })
      
      if (!res.ok) {
        let errorData: any;
        const text = await res.text();
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { message: text };
        }
        console.error(`[Friends Error] Status: ${res.status}`, errorData);
        const msg = errorData.message || res.statusText || 'Failed to fetch friends';
        throw new Error(msg);
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
      // Don't clear friends list on error to prevent "No friends found" flash
      // Only clear on successful fetch
    } finally {
      setLoading(false)
    }
  }

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
      // Call updateStatus to ensure you appear online to people you search
      updateStatus(true)

      const res = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: getHeaders()
      })

      if (!res.ok) {
        let errorData: any;
        const text = await res.text();
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { message: text };
        }
        console.error(`[Search Error] Status: ${res.status}`, errorData);
        setSearchResults([])
        return;
      }

      const data = await res.json()
      if (data.status === 'success') {
        // Filter out users who are already friends
        const friendIds = new Set(friends.map(f => f.id))
        // Also filter out users who have been sent a request (marked as "sent")
        const newUsers = data.users.filter((u: SearchResult) => 
          !friendIds.has(u._id) && requestStatus[u._id] !== "sent"
        )
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
        headers: getHeaders(),
        body: JSON.stringify({ userId })
      })

      let errorMessage = 'Failed to send request';

      if (!res.ok) {
        let errorData: any;
        const text = await res.text();
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { message: text };
        }
        console.error(`[Request Error] Status: ${res.status}`, errorData);
        
        // Extract specific message
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors) {
          errorMessage = errorData.errors[0]?.msg || 'Validation failed';
        }
        
        // Show Toast with specific message (e.g., "Friendship already exists")
        toast.error(errorMessage);
        
        throw new Error(errorMessage);
      }

      // Request succeeded - mark as sent and remove from search results
      setRequestStatus(prev => ({ ...prev, [userId]: "sent" }))
      setSearchResults(prev => prev.filter(u => u._id !== userId))
      
      // Show success toast
      toast.success("Friend request sent!")
      
      // No need to reload friends list since request is pending 
      
    } catch (error: any) {
      console.error("Send Request Error:", error.message);
      setRequestStatus(prev => ({ ...prev, [userId]: "error" }))
      // No setRequestStatus(prev => ...sent...) here on error, so button stays clickable/Retry-able
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
            <Users className="h-5 w-5 text-[#8b5cf6]" />
            Friends ({friends.length})
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative w-64 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-border focus:border-[#8b5cf6] focus:ring-[#8b5cf6]/20"
              />
            </div>

            <Dialog open={isRequestsModalOpen} onOpenChange={(open) => {
              setIsRequestsModalOpen(open)
              if (open) fetchFriendRequests()
            }}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="border-[#8b5cf6]/30 text-[#8b5cf6] hover:bg-[#8b5cf6]/10 font-medium relative"
                >
                  <Inbox className="h-4 w-4 mr-2" />
                  Requests
                  {friendRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {friendRequests.length}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Friend Requests</DialogTitle>
                  <DialogDescription>
                    Accept or reject pending friend requests.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {requestsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto space-y-3">
                      {friendRequests.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                          <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No pending friend requests</p>
                        </div>
                      ) : (
                        friendRequests.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-[#8b5cf6]/10 text-[#8b5cf6] font-semibold">
                                    {request.user.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                {request.user.online && (
                                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{request.user.name}</p>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <span className={`w-1.5 h-1.5 rounded-full ${request.user.online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                  {request.user.online ? 'Online' : 'Offline'} • Lvl {request.user.level}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 border-red-500/30 text-red-500 hover:bg-red-500/10"
                                onClick={() => handleFriendRequest(request.id, 'reject')}
                                disabled={processingRequestIds.has(request.id)}
                              >
                                {processingRequestIds.has(request.id) ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <UserX className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 px-3 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                                onClick={() => handleFriendRequest(request.id, 'accept')}
                                disabled={processingRequestIds.has(request.id)}
                              >
                                {processingRequestIds.has(request.id) ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <UserCheck className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-medium"
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
                              <AvatarFallback className="bg-[#8b5cf6]/10 text-[#8b5cf6] text-xs font-semibold">
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
                          ) : requestStatus[user._id] === "error" ? (
                             // If error, show specific toast (handled in function) and button text
                             "Retry"
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
                className="p-4 bg-muted/50 rounded-lg border border-border hover:border-[#8b5cf6]/50 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#8b5cf6]/10 text-[#8b5cf6] font-semibold">
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
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => openDeleteModal(friend)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-end mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-[#8b5cf6]/30 text-[#8b5cf6] hover:bg-[#8b5cf6]/10"
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

      {/* Delete Friend Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Remove Friend</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {friendToDelete?.name} from your friends list?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setFriendToDelete(null)
              }}
              disabled={deletingFriendId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteFriend}
              disabled={deletingFriendId !== null}
              className="bg-red-500 hover:bg-red-600"
            >
              {deletingFriendId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}