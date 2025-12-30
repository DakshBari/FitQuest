"use client"

import type React from "react"
import { useSidebar } from "@/components/sidebar-context"
import { cn } from "@/lib/utils"

export function PageContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <main className={cn("pt-20 min-h-screen transition-all duration-300", collapsed ? "ml-20" : "ml-0 md:ml-64")}>
      {children}
    </main>
  )
}
