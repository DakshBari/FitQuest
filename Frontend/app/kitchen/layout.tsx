import type React from "react"
import { Suspense } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/sidebar-context"
import { PageContent } from "@/components/page-content"

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <SidebarProvider>
        <div className="min-h-screen bg-background">
          <Sidebar />
          <Header />
          <Suspense fallback={null}>
            <PageContent>{children}</PageContent>
          </Suspense>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}