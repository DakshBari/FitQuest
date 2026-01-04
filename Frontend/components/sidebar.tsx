"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, Apple, Swords, Map, Users, Settings, Brain, ChevronLeft, ChevronRight, Zap, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/sidebar-context"
import { getThemeClasses } from "@/lib/pageThemes"

const menuItems = [
  { name: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { name: "Kitchen", icon: Apple, href: "/kitchen" },
  { name: "Arena", icon: Swords, href: "/arena" },
  { name: "Sanctuary", icon: Sparkles, href: "/sanctuary" },
  { name: "World Map", icon: Map, href: "/world-map" },
  { name: "Guilds", icon: Users, href: "/guilds" },
  { name: "Settings", icon: Settings, href: "/settings" },
]

const aiCoachItem = { name: "AI Coach", icon: Brain, href: "/ai-coach" }

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar()
  const pathname = usePathname()
  const themeClasses = getThemeClasses(pathname)

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-[hsl(var(--sidebar))] backdrop-blur-xl border-r border-[hsl(var(--sidebar-border))] transition-all duration-300 z-40",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex flex-col h-full p-4">
        {/* Logo */}
        <div className="flex items-center justify-between mb-8 mt-2">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div 
                className={cn("flex h-8 w-8 items-center justify-center rounded-lg", themeClasses.logoGradient, themeClasses.logoShadow)}
                style={themeClasses.logoGradientStyle ? { 
                  ...themeClasses.logoGradientStyle,
                  ...themeClasses.logoShadowStyle 
                } : undefined}
              >
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h1 
                className={cn("text-2xl font-bold font-orbitron", themeClasses.textGradient)}
                style={themeClasses.textGradientStyle || undefined}
              >
                FitQuest
              </h1>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="flex items-center justify-center w-full">
              <div 
                className={cn("flex h-8 w-8 items-center justify-center rounded-lg", themeClasses.logoGradient, themeClasses.logoShadow)}
                style={themeClasses.logoGradientStyle ? { 
                  ...themeClasses.logoGradientStyle,
                  ...themeClasses.logoShadowStyle 
                } : undefined}
              >
                <Zap className="h-5 w-5 text-white" />
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-primary hover:bg-accent"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                    isActive
                      ? themeClasses.activeItem
                      : `text-muted-foreground hover:text-primary hover:bg-accent`,
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium">{item.name}</span>}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* AI Coach - Special Bottom Item */}
        <Link href={aiCoachItem.href}>
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl transition-all border-2 mt-4",
              pathname === aiCoachItem.href
                ? "bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-lg shadow-purple-500/20"
                : "text-purple-400 border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50",
            )}
          >
            <Brain className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">{aiCoachItem.name}</span>}
          </div>
        </Link>
      </div>
    </aside>
  )
}
