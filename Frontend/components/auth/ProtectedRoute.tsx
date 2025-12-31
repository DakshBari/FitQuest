"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { validateToken } from '@/services/authService'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, token, logout } = useAuth()
  const [isValidating, setIsValidating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Temporarily disable token validation to prevent logout issues
    // This will be re-enabled once we confirm the basic auth flow works
    console.log('ProtectedRoute: Token validation temporarily disabled for debugging')
    
    /*
    const checkTokenValidity = async () => {
      if (!isLoading && token && isAuthenticated) {
        setIsValidating(true)
        try {
          const isValid = await validateToken(token)
          if (!isValid) {
            console.warn('Token is invalid, logging out')
            logout()
            return
          }
        } catch (error) {
          console.error('Token validation failed, but keeping user logged in:', error)
          // Don't logout on validation error - could be network issue or backend down
          // Better to keep user logged in than force logout on every API failure
        } finally {
          setIsValidating(false)
        }
      }
    }

    // Only validate token on mount, not on every token change to prevent loops
    if (!isLoading && token && isAuthenticated && !isValidating) {
      checkTokenValidity()
    }
    */
  }, [isLoading, isAuthenticated]) // Removed token and logout from dependencies to prevent loops

  useEffect(() => {
    console.log('ProtectedRoute: Auth state check...')
    console.log('isLoading:', isLoading)
    console.log('isAuthenticated:', isAuthenticated)
    console.log('token exists:', !!token)
    
    if (!isLoading && !isAuthenticated) {
      console.log('ProtectedRoute: User not authenticated, redirecting to login')
      const currentPath = window.location.pathname
      const loginUrl = `/login${currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : ''}`
      router.push(loginUrl)
    } else if (!isLoading && isAuthenticated) {
      console.log('ProtectedRoute: User authenticated, allowing access')
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading spinner while checking auth or validating token
  if (isLoading || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">
            {isLoading ? 'Loading...' : 'Validating session...'}
          </p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}