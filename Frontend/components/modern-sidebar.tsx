"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  Apple,
  Swords,
  Map,
  Users,
  Settings,
  Brain,
  ChevronLeft,
  ChevronRight,
  Zap,
  Sparkles,
  Home,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/sidebar-context"

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

export function ModernSidebar() {
  const { collapsed, setCollapsed } = useSidebar()
  const pathname = usePathname()

  return (
    <>
      {/* Backdrop for mobile */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen glass-card border-r border-white/10 transition-all duration-300 z-40",
          "flex flex-col",
          collapsed ? "w-20" : "w-64",
          // Hide on mobile when collapsed, show when expanded
          collapsed ? "lg:translate-x-0 -translate-x-full" : "translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 shadow-lg glow-cyan">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-orbitron">
                  FitQuest
                </h1>
                <p className="text-xs text-muted-foreground">v2.0</p>
              </div>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="flex items-center justify-center w-full">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 shadow-lg glow-cyan">
                <Zap className="h-6 w-6 text-white" />
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const isPurpleHighlight = item.name === "Settings" || item.name === "Sanctuary"
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? isPurpleHighlight
                        ? "bg-[#7F22FE]/20 text-white border border-[#7F22FE]/40 glow-purple"
                        : "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30 glow-hover"
                      : isPurpleHighlight
                        ? "text-muted-foreground hover:text-white hover:bg-white/5 hover:border-white/10 border border-transparent"
                        : "text-muted-foreground hover:text-white hover:bg-white/5 hover:border-white/10 border border-transparent",
                  )}
                >
                  {isActive && (
                    <div className={cn(
                      "absolute inset-0 animate-shimmer",
                      isPurpleHighlight
                        ? "bg-gradient-to-r from-[#7F22FE]/10 to-purple-500/10"
                        : "bg-gradient-to-r from-cyan-500/10 to-purple-500/10"
                    )} />
                  )}
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors relative z-10",
                    isPurpleHighlight
                      ? isActive ? "text-[#7F22FE]" : "group-hover:text-[#7F22FE]"
                      : isActive ? "text-cyan-400" : "group-hover:text-cyan-400"
                  )} />
                  {!collapsed && (
                    <span className="font-medium relative z-10">{item.name}</span>
                  )}
                  {isActive && !collapsed && (
                    <div className={cn(
                      "ml-auto w-2 h-2 rounded-full animate-pulse",
                      isPurpleHighlight ? "bg-[#7F22FE]" : "bg-cyan-400"
                    )} />
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* AI Coach - Special Item */}
        <div className="p-4 border-t border-white/10">
          <Link href={aiCoachItem.href}>
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                pathname === aiCoachItem.href
                  ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white border border-purple-500/50 glow-purple"
                  : "text-purple-400 hover:text-white hover:bg-purple-500/10 hover:border-purple-500/30 border border-purple-500/20",
              )}
            >
              {pathname === aiCoachItem.href && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-shimmer" />
              )}
              <Brain className="h-5 w-5 flex-shrink-0 relative z-10" />
              {!collapsed && (
                <span className="font-medium relative z-10">{aiCoachItem.name}</span>
              )}
              {!collapsed && (
                <div className="ml-auto">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                </div>
              )}
            </div>
          </Link>
        </div>
      </aside>
    </>
  )
}