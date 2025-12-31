"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PublicRoute } from "@/components/auth/PublicRoute"
import { useAuth } from "@/contexts/AuthContext"
import { login } from "@/services/authService"
import { toast } from "@/components/ui/sonner"

export default function LoginPage() {
  const router = useRouter()
  const { login: authLogin } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const data = await login(email, password)
      authLogin(data.token, data.user)
      toast.success("Welcome back to FitQuest!")
      
      // Check for redirect parameter
      const urlParams = new URLSearchParams(window.location.search)
      const redirectTo = urlParams.get('redirect') || '/dashboard'
      router.push(redirectTo)
    } catch (err: any) {
      toast.error(err.message || 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PublicRoute>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-purple-900/20 pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <Link href="/">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent font-orbitron">
                FitQuest
              </h1>
            </Link>
            <p className="text-muted-foreground mt-2">Enter the Arena</p>
          </div>

          <div className="backdrop-blur-xl bg-card border border-primary/20 rounded-3xl p-8 shadow-2xl shadow-cyan-500/10">
            <h2 className="text-2xl font-bold text-foreground mb-6 font-orbitron">Welcome Back</h2>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="warrior@fitquest.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
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
                  className="bg-muted border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-muted-foreground">
                  <input type="checkbox" className="mr-2 rounded border-border" />
                  Remember me
                </label>
                <Link href="#" className="text-primary hover:text-primary/80">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-cyan-500/30 transition-all"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="mt-6 text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:text-primary/80 font-semibold">
                Sign Up
              </Link>
            </div>
          </div>
          
          {/* Social Login */}
          <div className="mt-6 text-center">
             <p className="text-muted-foreground text-sm mb-4">Or continue with</p>
             <div className="flex gap-4 justify-center">
               <Button variant="outline" className="flex-1 border-border bg-card text-foreground hover:bg-accent hover:border-primary/50">Google</Button>
               <Button variant="outline" className="flex-1 border-border bg-card text-foreground hover:bg-accent hover:border-primary/50">Discord</Button>
             </div>
          </div>
        </div>
      </div>
    </PublicRoute>
  )
}