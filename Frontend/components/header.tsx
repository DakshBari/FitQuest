"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Moon, Sun, Bell, Search, Menu, X, Settings, LogOut, User } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { getThemeClasses } from "@/lib/pageThemes"
import { cn } from "@/lib/utils"

export function Header() {
  const { theme, setTheme } = useTheme()
  const { collapsed, setCollapsed } = useSidebar()
  const router = useRouter()
  const { user, logout, isAuthenticated } = useAuth() // Added isAuthenticated
  const pathname = usePathname()
  const themeClasses = getThemeClasses(pathname)
  const [notifications, setNotifications] = useState(3)

  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(n => n[0].toUpperCase())
      .join("")
  }

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault()
    logout()
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-xl border-b border-border z-50 px-4 transition-all duration-300">
      <div className="flex items-center justify-between h-full">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-300", themeClasses.hoverItem)}
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </Button>
          
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workouts, meals..."
              className="pl-10 w-80 bg-muted/50 border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Center - Page Title */}
        <div className="hidden lg:block">
          <h1 
            className={cn("text-xl font-semibold", themeClasses.theme.primary)}
            style={themeClasses.textGradientStyle || undefined}
          >
            {pathname === '/kitchen' && 'The Kitchen'}
            {pathname === '/arena' && 'The Arena'}
            {pathname === '/sanctuary' && 'The Sanctuary'}
            {pathname === '/ai-coach' && 'FitQuest AI'}
            {pathname === '/dashboard' && 'Dashboard'}
            {pathname === '/world-map' && 'World Map'}
            {pathname === '/guilds' && 'Guilds'}
            {pathname === '/settings' && 'Settings'}
          </h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications (Hide if not logged in) */}
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              className={cn("relative text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-300", themeClasses.hoverItem)}
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span 
                  className={cn("absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-bold text-white flex items-center justify-center shadow-lg", themeClasses.buttonGradient)}
                  style={themeClasses.buttonGradientStyle || undefined}
                >
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </Button>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-300"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* PROFILE SECTION - LOGIC CHANGE */}
          {isAuthenticated ? (
            // Logged In -> Show Dropdown
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full">
                  <Avatar className={cn("h-9 w-9 border-2 cursor-pointer hover:border-primary transition-all duration-300", `border-${themeClasses.theme.primary?.replace('text-', '') || 'primary'}/50`)}>
                    {user?.avatar ? (
                      <AvatarImage
                        src={user.avatar}
                        alt={user?.username || "User"}
                      />
                    ) : null}
                    <AvatarFallback 
                      className={cn("bg-muted font-semibold text-sm", themeClasses.theme.primary)}
                    >
                      {getInitials(user?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background shadow-sm" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl">
                <div className="px-3 py-2">
                  <div className="text-sm font-semibold text-foreground">
                    {user?.username || 'User'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user?.email || 'user@fitquest.com'}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/settings")}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Logged Out -> Show Login Button
            <Button 
              onClick={() => router.push('/login')}
              className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-medium"
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}