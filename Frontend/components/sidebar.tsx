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
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-[hsl(var(--sidebar))]/95 backdrop-blur-xl border-r border-[hsl(var(--sidebar-border))] transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex flex-col h-full p-3">
        {/* Menu Items */}
        <nav className="flex-1 space-y-2 mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative",
                    isActive
                      ? themeClasses.activeItem + " shadow-lg"
                      : `text-muted-foreground hover:text-primary hover:bg-accent/50`,
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="font-medium">{item.name}</span>
                      {isActive && (
                        <div 
                          className={cn("absolute right-2 w-2 h-2 rounded-full", themeClasses.buttonGradient)}
                          style={themeClasses.buttonGradientStyle || undefined}
                        />
                      )}
                    </>
                  )}
                  {collapsed && isActive && (
                    <div 
                      className={cn("absolute right-1 w-2 h-2 rounded-full", themeClasses.buttonGradient)}
                      style={themeClasses.buttonGradientStyle || undefined}
                    />
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* AI Coach - Special Bottom Item */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <Link href={aiCoachItem.href}>
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all border-2 relative group",
                pathname === aiCoachItem.href
                  ? "bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-lg shadow-purple-500/20"
                  : "text-purple-400 border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50",
              )}
            >
              <Brain className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="font-medium">{aiCoachItem.name}</span>
                  <div className="absolute right-2 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                </>
              )}
              {collapsed && (
                <div className="absolute right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              )}
            </div>
          </Link>
        </div>
      </div>
    </aside>
  )
}
