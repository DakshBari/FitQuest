"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getThemeClasses } from "@/lib/pageThemes"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ 
  icon: Icon, 
  title, 
  subtitle, 
  actions, 
  className 
}: PageHeaderProps) {
  const pathname = usePathname()
  const themeClasses = getThemeClasses(pathname)

  return (
    <div className={cn("flex-shrink-0 px-6 pt-8 pb-6", className)}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div 
              className={cn("w-14 h-14 rounded-3xl flex items-center justify-center shadow-2xl ring-1", themeClasses.logoGradient, themeClasses.logoShadow)}
              style={themeClasses.logoGradientStyle ? { 
                ...themeClasses.logoGradientStyle,
                ...themeClasses.logoShadowStyle 
              } : undefined}
            >
              <Icon className="w-7 h-7 text-white drop-shadow-sm" />
            </div>
            <div className={cn("absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 animate-pulse shadow-lg border-background", themeClasses.logoGradient)}></div>
          </div>
          <div>
            <h1 
              className={cn("text-5xl font-bold font-inter tracking-tight drop-shadow-sm", themeClasses.textGradient)}
              style={themeClasses.textGradientStyle || undefined}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground font-medium text-lg mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

// Themed Button component for use in page headers
interface ThemedButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode
}

export function ThemedButton({ children, className, ...props }: ThemedButtonProps) {
  const pathname = usePathname()
  const themeClasses = getThemeClasses(pathname)

  return (
    <Button 
      className={cn("border-border/50 text-muted-foreground hover:text-foreground bg-card backdrop-blur-sm font-medium rounded-xl transition-all duration-300 shadow-lg", themeClasses.hoverItem, className)}
      {...props}
    >
      {children}
    </Button>
  )
}