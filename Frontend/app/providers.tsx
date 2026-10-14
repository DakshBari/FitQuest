"use client"

import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { GoogleOAuthProvider } from "@react-oauth/google"
import type React from "react"

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </GoogleOAuthProvider>
      {process.env.NEXT_PUBLIC_VERCEL_ENV && <Analytics />}
    </ThemeProvider>
  )
}
