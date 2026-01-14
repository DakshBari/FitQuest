"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface PublicRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function PublicRoute({ children, redirectTo = '/dashboard' }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // If we are done loading auth, and user IS authenticated, redirect them.
    if (!isLoading && isAuthenticated && !isRedirecting) {
      setIsRedirecting(true)
      console.log("PublicRoute: User is authenticated. Redirecting to", redirectTo)
      
      // Use replace instead of push to avoid "back button" loops and blank screens
      router.replace(redirectTo)
    }
  }, [isAuthenticated, isLoading, redirectTo, router, isRedirecting])

  // 1. Initial Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Checking session...</p>
        </div>
      </div>
    )
  }

  // 2. Redirecting State (Prevents "Blank Black Page" by showing text)
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    )
  }

  // 3. If authenticated but not yet caught by effect (unlikely but safe check)
  if (isAuthenticated) {
    return null
  }

  // 4. Show Content (Login/Signup Form)
  return <>{children}</>
}