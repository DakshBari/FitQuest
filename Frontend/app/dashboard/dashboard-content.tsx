"use client"

import type React from "react"

import { useSidebar } from "@/components/sidebar-context"
import { cn } from "@/lib/utils"

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <main className={cn("pt-16 min-h-screen transition-all duration-300", collapsed ? "ml-16" : "ml-64")}>
      {children}
    </main>
  )
}
