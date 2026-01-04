"use client"

import { usePathname } from "next/navigation"
import { TabsTrigger } from "@/components/ui/tabs"
import { getThemeClasses } from "@/lib/pageThemes"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface ThemedTabsTriggerProps {
  value: string
  icon: LucideIcon
  children: React.ReactNode
  className?: string
}

export function ThemedTabsTrigger({ value, icon: Icon, children, className }: ThemedTabsTriggerProps) {
  const pathname = usePathname()
  const themeClasses = getThemeClasses(pathname)

  return (
    <TabsTrigger 
      value={value} 
      className={cn(
        "gap-2 rounded-xl font-medium transition-all duration-300 data-[state=active]:text-white data-[state=active]:shadow-xl text-muted-foreground hover:text-foreground px-6 py-3", 
        `data-[state=active]:${themeClasses.buttonGradient}`, 
        `data-[state=active]:${themeClasses.shadow}`,
        className
      )}
    >
      <Icon className="w-4 h-4" />
      {children}
    </TabsTrigger>
  )
}

// Re-export other components for convenience
export { Tabs, TabsList, TabsContent } from "@/components/ui/tabs"