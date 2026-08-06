"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Cpu, ChevronRight } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import DashboardPreview from "./DashboardPreview"

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
}
const wordVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
}

const HEADLINE_L1 = "Advanced Form Tracking.".split(" ")
const HEADLINE_L2 = "Intelligent Workouts.".split(" ")
const STATS = [
  { value: "50K+", label: "athletes" },
  { value: "2M+",  label: "workouts" },
  { value: "98%",  label: "accuracy" },
]

export default function HeroSection() {
  const { isAuthenticated } = useAuth()

  return (
    <section
      className="relative min-h-screen flex items-center pt-24 pb-20 px-6 overflow-hidden"
      style={{ background: "#090D16" }}
    >
      {/* Subtle radial glows */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/3 left-1/5 w-96 h-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)" }} />
      </div>

      <div className="mx-auto max-w-7xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* ── Left: text ───────────────────────────────────────── */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-7">
            {/* Eyebrow */}
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
                style={{ border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)" }}>
                <Cpu className="h-3.5 w-3.5" style={{ color: "#818cf8" }} strokeWidth={2} />
                <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#818cf8" }}>
                  Powered by On-Device AI
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <div>
              <motion.h1 variants={containerVariants} initial="hidden" animate="visible"
                className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] text-white">
                <div className="flex flex-wrap gap-x-4 mb-2">
                  {HEADLINE_L1.map((word, i) => (
                    <motion.span key={i} variants={wordVariants}>{word}</motion.span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4">
                  {HEADLINE_L2.map((word, i) => (
                    <motion.span key={i} variants={wordVariants} style={{ color: "#818cf8" }}>{word}</motion.span>
                  ))}
                </div>
              </motion.h1>
            </div>

            {/* Body */}
            <motion.p variants={itemVariants} className="text-lg text-slate-400 leading-relaxed max-w-xl">
              {isAuthenticated
                ? "Welcome back. Your dashboard is ready — track nutrition, log workouts, and explore your territory."
                : "FitQuest combines real-time AI form tracking, gamified fitness quests, territory conquest, and intelligent nutrition — all in one platform built for serious athletes."}
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
              {isAuthenticated ? (
                <Link href="/dashboard" className="group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-colors duration-200"
                  style={{ background: "#4f46e5" }}>
                  Open Dashboard
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-200"
                    style={{ background: "#4f46e5" }}>
                    Get Started Free
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </Link>
                  <a href="#features" className="inline-flex items-center gap-1.5 rounded-xl border px-6 py-3 text-sm font-semibold transition-all duration-200"
                    style={{ borderColor: "rgba(255,255,255,0.12)", color: "#94a3b8", background: "rgba(255,255,255,0.03)" }}>
                    Explore features
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="flex items-center gap-6 pt-2">
              {STATS.map((stat, i) => (
                <div key={i} className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-white tabular-nums">{stat.value}</span>
                  <span className="text-sm text-slate-500">{stat.label}</span>
                  {i < STATS.length - 1 && <div className="ml-4 h-4 w-px" style={{ background: "rgba(255,255,255,0.12)" }} />}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: live dashboard preview ───────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <DashboardPreview />
          </motion.div>

        </div>
      </div>
    </section>
  )
}
