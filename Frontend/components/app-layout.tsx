"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider } from "@/components/sidebar-context"
import { ModernSidebar } from "@/components/modern-sidebar"
import { ModernHeader } from "@/components/modern-header"

// Pages that should not have the sidebar/header layout
const noLayoutPages = ["/login", "/register", "/", "/landing"]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Check if current page should have the layout
  const shouldShowLayout = !noLayoutPages.includes(pathname)

  if (!shouldShowLayout) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-modern">
        <ModernSidebar />
        <div className="transition-all duration-300 ml-20 lg:ml-64">
          <ModernHeader />
          <main className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}