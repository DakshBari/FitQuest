"use client"

import { useEffect, useState } from "react"
import { Moon, Sun, Zap, Coins, Settings, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/sidebar-context"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

export function Header() {
  const { theme, setTheme } = useTheme()
  const { collapsed } = useSidebar()
  const router = useRouter()
  const { user, logout } = useAuth()

  // Robust Initials Function
  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(n => n[0].toUpperCase())
      .join("")
  }

  // Calculate XP percentage (Simple logic: Level * 1000 = XP needed for next level)
  const currentLevel = user?.level || 1
  const currentXp = user?.xp || 0
  const xpForNextLevel = currentLevel * 1000
  const xpPercentage = Math.min((currentXp / xpForNextLevel) * 100, 100)

  const handleLogout = () => {
    logout() // Use the proper logout function from AuthContext
  }

  // If no user data loaded yet, use defaults
  const stamina = user?.stats?.endurance || 80

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-20 bg-background backdrop-blur-xl border-b border-border z-30 px-6 transition-all duration-300",
        collapsed ? "left-20" : "left-0 md:left-64",
      )}
    >
      <div className="flex items-center justify-between h-full">
        {/* XP Bar - Center */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-primary font-semibold font-orbitron">
                Level {currentLevel}
              </span>
              <span className="text-muted-foreground">
                {currentXp} / {xpForNextLevel} XP
              </span>
            </div>
            <div className="relative h-3 bg-muted rounded-full overflow-hidden border border-primary/30">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full shadow-lg shadow-cyan-500/50 transition-all duration-1000"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Side - Stats & Profile */}
        <div className="flex items-center gap-4">
          {/* Stamina (Mapped from endurance stat) */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-foreground font-semibold">
              {stamina}/100
            </span>
          </div>

          {/* Coins (Mapped to territories) */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border">
            <Coins className="h-4 w-4 text-amber-500" />
            <span className="text-foreground font-semibold">
              {user?.stats?.territories || 0}
            </span>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-primary hover:bg-accent"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* User Avatar with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-primary/50 cursor-pointer hover:border-primary transition-colors">
                  {user?.avatar ? (
                    <AvatarImage
                      src={user.avatar}
                      alt={user?.username || "User"}
                    />
                  ) : null}

                  <AvatarFallback className="bg-muted text-primary font-semibold">
                    {getInitials(user?.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm font-semibold text-foreground">
                {user?.username || 'User'}
              </div>
              <div className="px-2 py-1 text-xs text-muted-foreground">
                {user?.email || 'user@fitquest.com'}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/profile")}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}