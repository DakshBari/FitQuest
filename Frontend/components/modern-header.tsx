"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { 
  Bell, 
  Search, 
  User, 
  Menu, 
  Settings, 
  HelpCircle, 
  Download,
  Share2,
  Moon,
  Sun,
  Globe,
  Heart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/sidebar-context"

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/kitchen": "Kitchen",
  "/arena": "Arena", 
  "/sanctuary": "Sanctuary",
  "/world-map": "World Map",
  "/guilds": "Guilds",
  "/ai-coach": "AI Coach",
  "/settings": "Settings"
}

export function ModernHeader() {
  const pathname = usePathname()
  const { collapsed, setCollapsed } = useSidebar()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const currentPage = pageNames[pathname] || "FitQuest"
  
  // User data - in real app this would come from auth context
  const user = {
    name: "Alex Johnson",
    email: "alex@fitquest.com",
    initials: "AJ",
    level: 42,
    title: "Warrior"
  }

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="h-16 glass-header px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle - Always visible */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="btn-glass rounded-xl transition-all duration-200"
          title="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white font-orbitron tracking-tight">
            {currentPage}
          </h1>
          {pathname === "/dashboard" && (
            <Badge variant="secondary" className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 rounded-full px-2 py-1 text-xs animate-pulse">
              Live
            </Badge>
          )}
        </div>
      </div>

      {/* Center Section - Enhanced Search */}
      <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-cyan-400 transition-colors" />
          <Input
            placeholder="Search workouts, quests, nutrition, or ask AI..."
            className="pl-12 pr-4 py-2.5 glass-card-light border border-white/10 text-white placeholder:text-muted-foreground focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 rounded-xl transition-all duration-200 group-focus-within:glow-cyan"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <kbd className="px-2 py-1 text-xs text-muted-foreground bg-white/5 border border-white/10 rounded-md">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Section - Modern Action Buttons */}
      <div className="flex items-center gap-2">
        
        {/* Quick Actions */}
        <div className="hidden lg:flex items-center gap-2 mr-2">
          {/* Share */}
          <Button
            variant="ghost"
            size="icon"
            className="btn-glass text-muted-foreground hover:text-green-400 hover:bg-green-500/10 rounded-xl transition-all duration-200 group"
            title="Share Progress"
          >
            <Share2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="btn-glass text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10 rounded-xl transition-all duration-200 group"
            title="Toggle Theme"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4 group-hover:scale-110 transition-transform" />
            ) : (
              <Moon className="h-4 w-4 group-hover:scale-110 transition-transform" />
            )}
          </Button>
        </div>

        {/* Notifications with enhanced design */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative btn-glass text-muted-foreground hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
            >
              <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full border-2 border-background animate-pulse" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass-card border border-white/10 rounded-xl p-2 w-80 animate-scale-in" align="end">
            <div className="px-3 py-2 border-b border-white/10">
              <h3 className="font-semibold text-white">Notifications</h3>
              <p className="text-xs text-muted-foreground">3 new updates</p>
            </div>
            <DropdownMenuItem className="rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-start gap-3 p-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2" />
                <div>
                  <p className="text-sm text-white">New quest available!</p>
                  <p className="text-xs text-muted-foreground">Leg Day Destruction is ready</p>
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help & Support */}
        <Button
          variant="ghost"
          size="icon"
          className="btn-glass text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all duration-200 group"
          title="Help & Support"
        >
          <HelpCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
        </Button>

        {/* Settings Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="btn-glass text-muted-foreground hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
            >
              <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass-card border border-white/10 rounded-xl p-2 animate-scale-in" align="end">
            <DropdownMenuItem className="rounded-lg hover:bg-white/5 transition-colors">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg hover:bg-white/5 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg hover:bg-white/5 transition-colors">
              <Globe className="h-4 w-4 mr-2" />
              Language
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              className="rounded-lg hover:bg-white/5 transition-colors"
              onClick={toggleTheme}
            >
              {mounted && theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown with User Initials */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="btn-glass flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center glow-cyan group-hover:scale-110 transition-transform">
                <span className="text-white text-sm font-semibold font-orbitron">
                  {user.initials}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium">{user.name.split(' ')[0]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass-card border border-white/10 rounded-xl p-2 animate-scale-in" align="end">
            <div className="px-3 py-2 border-b border-white/10">
              <p className="font-semibold text-white">{user.name}</p>
              <p className="text-xs text-muted-foreground">Level {user.level} {user.title}</p>
              <p className="text-xs text-muted-foreground opacity-70">{user.email}</p>
            </div>
            <DropdownMenuItem className="rounded-lg hover:bg-white/5 transition-colors">
              <User className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg hover:bg-white/5 transition-colors">
              <Heart className="h-4 w-4 mr-2" />
              Health Stats
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg hover:bg-white/5 transition-colors">
              <Settings className="h-4 w-4 mr-2" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}