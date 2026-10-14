"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PublicRoute } from "@/components/auth/PublicRoute"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { useAuth } from "@/contexts/AuthContext"
import { signup } from "@/services/authService"
import { toast } from "@/components/ui/sonner"

export default function SignupPage() {
  const router = useRouter()
  const { login: authLogin } = useAuth()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!")
      return
    }

    setIsLoading(true)

    try {
      const data = await signup(username, email, password)
      authLogin(data.token, data.user)
      toast.success("Welcome to FitQuest! Your adventure begins now!")
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PublicRoute>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-cyan-900/20 pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-orbitron">
                FitQuest
              </h1>
            </Link>
            <p className="text-muted-foreground mt-2">Begin Your Journey</p>
          </div>

          <div className="backdrop-blur-xl bg-card border border-secondary/20 rounded-3xl p-8 shadow-2xl shadow-purple-500/10">
            <h2 className="text-2xl font-bold text-foreground mb-6 font-orbitron">Create Account</h2>

            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="WarriorX"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-muted border-border focus:border-secondary text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="warrior@fitquest.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted border-border focus:border-secondary text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted border-border focus:border-secondary text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-muted border-border focus:border-secondary text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>

              <div className="flex items-start text-sm">
                <input type="checkbox" className="mr-2 mt-1 rounded border-border" required />
                <label className="text-muted-foreground">
                  I agree to the{" "}
                  <Link href="#" className="text-secondary hover:text-secondary/80">Terms of Service</Link>{" "}
                  and{" "}
                  <Link href="#" className="text-secondary hover:text-secondary/80">Privacy Policy</Link>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-purple-500/30 transition-all"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-secondary hover:text-secondary/80 font-semibold">
                Login
              </Link>
            </div>
          </div>
          
          {/* Social Signup */}
          <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm mb-4">Or sign up with</p>
              <div className="flex gap-4 justify-center">
                <GoogleSignInButton className="flex-1 hover:border-secondary/50" label="Google" />
                <Button variant="outline" className="flex-1 border-border bg-card text-foreground hover:bg-accent hover:border-secondary/50">Discord</Button>
              </div>
          </div>
        </div>
      </div>
    </PublicRoute>
  )
}