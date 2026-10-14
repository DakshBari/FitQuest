"use client"

import React, { useState } from "react"
import { useGoogleLogin } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { googleLogin } from "@/services/authService"
import { toast } from "@/components/ui/sonner"
import { Loader2 } from "lucide-react"

interface GoogleSignInButtonProps {
  label?: string
  className?: string
  disabled?: boolean
  onSuccess?: () => void
}

export function GoogleSignInButton({
  label = "Google",
  className = "",
  disabled = false,
  onSuccess
}: GoogleSignInButtonProps) {
  const { login: authLogin } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const handleOAuthSuccess = async (tokenResponse: { access_token: string }) => {
    setIsLoading(true)
    try {
      toast.loading("Authenticating with Google...", { id: "google-auth" })
      
      const data = await googleLogin({
        accessToken: tokenResponse.access_token
      })

      authLogin(data.token, data.user)
      toast.success("Welcome to FitQuest!", { id: "google-auth" })

      if (onSuccess) {
        onSuccess()
      }

      // Hard redirect to dashboard for fresh state
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 300)
    } catch (err: any) {
      console.error("Google sign in backend error:", err)
      toast.error(err.message || "Failed to authenticate with Google", { id: "google-auth" })
    } finally {
      setIsLoading(false)
    }
  }

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: handleOAuthSuccess,
    onError: (errorResponse) => {
      console.error("Google sign in popup error:", errorResponse)
      toast.error("Google sign in was cancelled or failed.")
      setIsLoading(false)
    }
  })

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    if (!clientId || clientId.includes("your_google_client_id")) {
      toast.error(
        "Google OAuth is not configured yet. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local file.",
        { duration: 6000 }
      )
      return
    }

    setIsLoading(true)
    try {
      triggerGoogleLogin()
    } catch (err: any) {
      console.error("Error triggering google login:", err)
      toast.error("Could not open Google Sign-In popup.")
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={`relative flex items-center justify-center gap-2 border-border bg-card text-foreground hover:bg-accent hover:border-primary/50 transition-all ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
      ) : (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            fill="#EA4335"
          />
        </svg>
      )}
      <span>{label}</span>
    </Button>
  )
}
