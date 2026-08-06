"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Lock, Users, ShieldCheck } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const TRUST_SIGNALS = [
  { icon: Lock,        label: "No credit card required" },
  { icon: Users,       label: "Join 50K+ athletes" },
  { icon: ShieldCheck, label: "Privacy-first" },
]

export default function CTASection() {
  const { isAuthenticated } = useAuth()

  return (
    <section className="px-6 py-32" style={{ background: "#090D16" }}>
      <div className="mx-auto max-w-3xl text-center">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center gap-8"
        >
          <div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-5 leading-tight">
              Start training smarter
              <br />
              <span className="text-indigo-400">today.</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              {isAuthenticated
                ? "Your AI coach is ready. Open the dashboard to continue your personalized training journey."
                : "Join thousands of athletes using FitQuest's on-device AI to move better, train smarter, and stay injury-free."}
            </p>
          </div>

          {/* CTA button */}
          <motion.div whileHover="hovered" className="inline-block">
            <Link
              href={isAuthenticated ? "/dashboard" : "/signup"}
              className="group inline-flex items-center gap-2.5 rounded-xl bg-indigo-600 dark:bg-indigo-500 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-colors duration-200 shadow-lg shadow-indigo-600/25 dark:shadow-indigo-500/20"
            >
              {isAuthenticated ? "Open Dashboard" : "Create Free Account"}
              <motion.span
                variants={{ hovered: { x: 4 } }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="inline-block"
              >
                <ArrowRight className="h-5 w-5" />
              </motion.span>
            </Link>
          </motion.div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            {TRUST_SIGNALS.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
                >
                  <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  {s.label}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
