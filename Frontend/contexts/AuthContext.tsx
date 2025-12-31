"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string
  email: string
  level: number
  xp: number
  stats: any
  avatar?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper functions for cookie management
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`
}

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored auth data on mount
    const storedToken = getCookie('fitquest_token') || localStorage.getItem('fitquest_token')
    const storedUser = localStorage.getItem('fitquest_user')

    console.log('AuthProvider: Checking stored auth data...')
    console.log('Stored token:', storedToken ? 'Found' : 'Not found')
    console.log('Stored user:', storedUser ? 'Found' : 'Not found')

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(parsedUser)
        
        // Ensure token is in both localStorage and cookies
        localStorage.setItem('fitquest_token', storedToken)
        setCookie('fitquest_token', storedToken)
        
        console.log('AuthProvider: User restored from storage:', parsedUser.username)
      } catch (error) {
        console.error('AuthProvider: Error parsing stored user data:', error)
        // Clear invalid stored data
        localStorage.removeItem('fitquest_token')
        localStorage.removeItem('fitquest_user')
        deleteCookie('fitquest_token')
      }
    } else {
      console.log('AuthProvider: No stored auth data found')
    }
    
    setIsLoading(false)
    console.log('AuthProvider: Initialization complete')
  }, [])

  const login = (newToken: string, newUser: User) => {
    console.log('AuthContext: Login called with:', { token: newToken ? 'Present' : 'Missing', user: newUser.username })
    
    setToken(newToken)
    setUser(newUser)
    
    // Store in both localStorage and cookies for better security
    localStorage.setItem('fitquest_token', newToken)
    localStorage.setItem('fitquest_user', JSON.stringify(newUser))
    setCookie('fitquest_token', newToken, 7) // 7 days expiry
    
    console.log('AuthContext: User logged in successfully:', newUser.username)
    console.log('AuthContext: Token stored in localStorage and cookies')
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    
    // Clear all stored data
    localStorage.removeItem('fitquest_token')
    localStorage.removeItem('fitquest_user')
    deleteCookie('fitquest_token')
    
    console.log('User logged out')
    router.push('/login')
  }

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!token && !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}