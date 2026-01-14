"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    console.log('ProtectedRoute: Auth state check...', { isAuthenticated, isLoading })
    
    // If we are done loading auth, and user is NOT authenticated, redirect them.
    if (!isLoading && !isAuthenticated && !isRedirecting) {
      setIsRedirecting(true)
      
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/dashboard'
      // Keep the redirect param so they return to the page they tried to visit
      const loginUrl = `/login${currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : ''}`
      
      console.log("ProtectedRoute: User not authenticated. Redirecting to", loginUrl)
      
      // Use replace to ensure navigation is clean
      router.replace(loginUrl)
    }
  }, [isAuthenticated, isLoading, router, isRedirecting])

  // 1. Initial Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // 2. Redirecting State (Prevents "Blank Screen")
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    )
  }

  // 3. Not Authenticated (Shouldn't render children)
  if (!isAuthenticated) {
    return null
  }

  // 4. Show Content (Dashboard, etc)
  return <>{children}</>
}