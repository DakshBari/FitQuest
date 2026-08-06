"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sun, Moon, Zap, ArrowRight } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Technology", href: "#technology" },
  { label: "Privacy", href: "#privacy" },
]

export default function LandingNav() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  const isDark = resolvedTheme === "dark"

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "backdrop-blur-xl shadow-sm"
          : "bg-transparent",
      ].join(" ")}
      style={scrolled ? {
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(9,13,22,0.92)",
        boxShadow: "0 1px 24px rgba(0,0,0,0.4)"
      } : undefined}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 dark:bg-indigo-500 shadow-md shadow-indigo-600/20 dark:shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            FitQuest
          </span>
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors duration-200" style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              {isDark ? (
                <Sun className="h-4.5 w-4.5" />
              ) : (
                <Moon className="h-4.5 w-4.5" />
              )}
            </button>
          )}

          {isAuthenticated ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-colors duration-200"
            >
              Open App
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200 hidden sm:block"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-colors duration-200"
              >
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  )
}
