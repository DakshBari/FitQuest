import type React from "react"
import { Suspense } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/sidebar-context"
import { DashboardContent } from "./dashboard-content"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SidebarProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <Sidebar />
          <Suspense fallback={null}>
            <DashboardContent>{children}</DashboardContent>
          </Suspense>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}
