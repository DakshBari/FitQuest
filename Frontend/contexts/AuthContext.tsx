"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { updateStatus, getCurrentUser } from '@/services/authService'

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

import { getApiUrl } from '@/lib/config'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Fire-and-forget: survives page navigation / tab close */
function beaconOffline() {
  try {
    const blob = new Blob([JSON.stringify({ isOnline: false })], { type: 'application/json' })
    navigator.sendBeacon(`${getApiUrl()}/api/users/status`, blob)
  } catch {
    updateStatus(false)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const purgeAuthStorage = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = 'token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;'
  }

  // ── Init and validate session from backend ─────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUserRaw = localStorage.getItem('user')

    if (!storedToken || storedToken === 'undefined' || storedToken === 'null' || !storedUserRaw) {
      purgeAuthStorage()
      setToken(null)
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const parsedUser = JSON.parse(storedUserRaw)

      if (parsedUser.email === 'user@fitquest.com' || !parsedUser.id) {
        console.warn('Mock/invalid user detected — clearing storage')
        purgeAuthStorage()
        setToken(null)
        setUser(null)
        setIsLoading(false)
        return
      }

      // Optimistically restore session so UI doesn't flash
      setToken(storedToken)
      setUser(parsedUser)

      // Actively verify token with the backend /api/auth/me
      getCurrentUser(storedToken)
        .then((freshUser) => {
          setToken(storedToken)
          setUser(freshUser)
          localStorage.setItem('user', JSON.stringify(freshUser))
          updateStatus(true)
          console.log('Session verified and active for:', freshUser.username)
        })
        .catch((err) => {
          console.warn('Stored token is invalid/expired on backend — purging zombie session:', err.message)
          purgeAuthStorage()
          setToken(null)
          setUser(null)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } catch (e) {
      console.error('Error parsing stored user:', e)
      purgeAuthStorage()
      setToken(null)
      setUser(null)
      setIsLoading(false)
    }
  }, [])

  // ── Heartbeat: refresh lastSeen every 3 min ────────────
  useEffect(() => {
    if (!token) return
    const id = setInterval(() => updateStatus(true), 3 * 60 * 1000)
    return () => clearInterval(id)
  }, [token])

  // ── Tab hide / close → mark offline ───────────────────
  useEffect(() => {
    if (!token) return

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') beaconOffline()
      else updateStatus(true)
    }
    const onUnload = () => beaconOffline()

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', onUnload)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [token])

  // ── Login ───────────────────────────────────────────────
  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    const exp = new Date(); exp.setDate(exp.getDate() + 7)
    document.cookie = `token=${newToken};expires=${exp.toUTCString()};path=/;SameSite=Lax`
    updateStatus(true)
    console.log('Logged in:', newUser.username)
  }

  // ── Logout ──────────────────────────────────────────────
  const logout = () => {
    beaconOffline()   // beacon survives the redirect
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = `token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, isAuthenticated: !!token && !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}