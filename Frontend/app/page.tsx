"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Zap, Target, Users, Brain, Trophy, ChevronRight } from "lucide-react"

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true)

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-xl" style={{ backgroundColor: 'hsl(var(--background) / 0.95)' }}>
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/50">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                  FitQuest
                </span>
              </span>
            </div>

            <div className="hidden items-center gap-8 md:flex">
              <a
                href="#features"
                className="text-sm font-medium text-muted-foreground hover:text-cyan-400 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-muted-foreground hover:text-cyan-400 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#ai-coach"
                className="text-sm font-medium text-muted-foreground hover:text-purple-400 transition-colors"
              >
                AI Coach
              </a>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card hover:bg-accent transition-all hover:scale-105"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-cyan-400" />}
              </button>
              <Link href="/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-cyan-400">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700 shadow-lg shadow-cyan-500/50">
                  Start Quest
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-32 pb-20">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-600/10" />
          <div className="absolute inset-0 bg-[url('/cyberpunk-digital-grid.png')] bg-center opacity-5" />

          <div className="relative mx-auto max-w-6xl">
            <div className="text-center">
              <div className="inline-block mb-4 rounded-full border border-cyan-500/50 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-400">
                AI-Powered Fitness Revolution
              </div>

              <h1 className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl text-balance">
                <span className="block mb-2">Level Up Your</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-pulse-glow">
                  Fitness Journey
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty leading-relaxed">
                Transform your workouts into an epic adventure. Track form with AI, complete quests, capture
                territories, and unlock achievements in the most immersive fitness ecosystem ever created.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="group bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700 shadow-xl shadow-cyan-500/50 hover:shadow-2xl hover:shadow-purple-500/50 transition-all"
                  >
                    Begin Your Quest
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-cyan-500/50 hover:bg-cyan-500/10 hover:border-cyan-500 bg-transparent"
                >
                  Watch Demo
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
                <div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-2xl" />
                  <div className="relative text-3xl font-bold text-cyan-400">50K+</div>
                  <div className="relative text-sm text-muted-foreground mt-1">Active Players</div>
                </div>
                <div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent rounded-2xl" />
                  <div className="relative text-3xl font-bold text-purple-400">2M+</div>
                  <div className="relative text-sm text-muted-foreground mt-1">Workouts Tracked</div>
                </div>
                <div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent rounded-2xl" />
                  <div className="relative text-3xl font-bold text-green-400">98%</div>
                  <div className="relative text-sm text-muted-foreground mt-1">Form Accuracy</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-4xl font-bold tracking-tight sm:text-5xl mb-4">
              Your Fitness{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                Arsenal
              </span>
            </h2>
            <p className="text-center text-muted-foreground mb-16 text-lg">
              Game-changing features that make fitness addictive
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="group relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 hover:bg-card hover:shadow-xl hover:shadow-cyan-500/10 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                    <Target className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-balance">AI Form Analysis</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Real-time motion tracking analyzes your form, prevents injuries, and provides instant feedback like
                    a personal trainer.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 hover:bg-card hover:shadow-xl hover:shadow-purple-500/10 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-balance">Quest System</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Complete daily missions, unlock legendary achievements, and earn XP to level up your character with
                    every workout.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 hover:bg-card hover:shadow-xl hover:shadow-green-500/10 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-400 mb-4 group-hover:scale-110 transition-transform">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-balance">Territory Conquest</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Explore your city, capture strongholds, and compete with friends to dominate the map through runs
                    and rides.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="group relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 hover:bg-card hover:shadow-xl hover:shadow-pink-500/10 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 mb-4 group-hover:scale-110 transition-transform">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-balance">Smart Nutrition</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Gamified macro tracking with visual fuel gauges. Scan meals instantly and get AI-powered nutrition
                    recommendations.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="group relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 hover:bg-card hover:shadow-xl hover:shadow-cyan-500/10 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-balance">Guild Raids</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Join forces with friends to defeat global raid bosses. Compete on leaderboards and challenge rivals
                    to fitness duels.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="group relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 hover:bg-card hover:shadow-xl hover:shadow-purple-500/10 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                    <Brain className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-balance">AI Coach Oracle</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Your personal AI fitness oracle analyzes recovery, suggests workouts, and answers questions about
                    form and nutrition.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="px-6 py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />

          <div className="relative mx-auto max-w-6xl">
            <h2 className="text-center text-4xl font-bold tracking-tight sm:text-5xl mb-16">
              Three Steps to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Glory</span>
            </h2>

            <div className="grid gap-12 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-xl shadow-cyan-500/50">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Create Your Avatar</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Customize your character and set your fitness goals. Choose your path: Strength, Agility, or
                  Endurance.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-xl shadow-purple-500/50">
                  <span className="text-3xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Complete Quests</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Enter the Arena for AI-tracked workouts, explore the World Map, or optimize your nutrition in the
                  Kitchen.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-xl shadow-pink-500/50">
                  <span className="text-3xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Level Up & Dominate</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Gain XP, unlock achievements, climb leaderboards, and become a legend in the FitQuest community.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI Coach CTA */}
        <section id="ai-coach" className="px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-purple-500/20 via-card/50 to-cyan-500/20 backdrop-blur-sm p-12">
              <div className="absolute inset-0 bg-[url('/digital-neural-network-pattern.jpg')] bg-center opacity-10" />

              <div className="relative text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-xl shadow-purple-500/50">
                  <Brain className="h-8 w-8 text-white" />
                </div>

                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Meet Your AI Fitness Oracle</h2>
                <p className="text-lg text-muted-foreground mb-8 text-pretty leading-relaxed max-w-2xl mx-auto">
                  Get personalized insights, form analysis, recovery recommendations, and nutrition advice from an AI
                  that learns your body and adapts to your journey.
                </p>

                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-xl shadow-purple-500/50"
                >
                  Consult the Oracle
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              Ready to Start Your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                Epic Fitness Quest?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 text-pretty leading-relaxed">
              Join thousands of players transforming their fitness into an adventure.
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700 shadow-xl shadow-cyan-500/50 text-lg px-8 py-6"
              >
                Begin Your Journey Now
                <ChevronRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-card/50 backdrop-blur-sm px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                  FitQuest
                </span>
              </div>

              <div className="flex gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  Terms
                </a>
                <a href="#" className="hover:text-cyan-400 transition-colors">
                  Support
                </a>
              </div>

              <p className="text-sm text-muted-foreground">© 2025 FitQuest. Level up your life.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
