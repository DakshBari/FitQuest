"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateStatus } from '@/services/authService' // Import this

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem('token')
      const storedUserRaw = localStorage.getItem('user')

      if (!storedToken || !storedUserRaw) {
        console.log('Incomplete auth data found. Clearing...')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setIsLoading(false)
        return
      }

      try {
        const parsedUser = JSON.parse(storedUserRaw)

        if (parsedUser.email === 'user@fitquest.com' || !parsedUser.id) {
          console.warn('!!! MOCK/INVALID USER DETECTED !!!')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setIsLoading(false)
          return
        }

        setToken(storedToken)
        setUser(parsedUser)
        
        // CRITICAL: Set status to online when app loads
        updateStatus(true) 
        
        console.log('Session Restored for user:', parsedUser.username)
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = (newToken: string, newUser: User) => {
    console.log('AuthContext: Logging in...')
    setToken(newToken)
    setUser(newUser)
    
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)
    document.cookie = `token=${newToken};expires=${expires.toUTCString()};path=/;SameSite=Lax`
    
    // CRITICAL: Set status to online when logging in
    updateStatus(true)
    
    console.log('User logged in:', newUser.username)
  }

  const logout = () => {
    console.log('AuthContext: Logging out...')
    
    // Set status to offline before logging out
    updateStatus(false)
    
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = `token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
    
    console.log('Storage cleared. Redirecting...')
    window.location.href = '/login'
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