"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { CheckCircle, Circle, TrendingUp, Activity, Trophy } from "lucide-react"

// ─── Card A — Line Chart ────────────────────────────────────────────────────

const CHART_DATA = [28, 45, 38, 60, 52, 71, 65]
const CHART_W = 280
const CHART_H = 90
const PAD_X = 10
const PAD_Y = 10

function chartPath(data: number[], w: number, h: number, px: number, py: number) {
  const maxVal = Math.max(...data)
  const minVal = Math.min(...data) - 5
  const xs = data.map((_, i) => px + (i / (data.length - 1)) * (w - px * 2))
  const ys = data.map(v => h - py - ((v - minVal) / (maxVal - minVal)) * (h - py * 2))
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ")
  const area = `${d} L ${xs[xs.length - 1].toFixed(1)} ${h - py} L ${xs[0].toFixed(1)} ${h - py} Z`
  return { line: d, area, points: xs.map((x, i) => ({ x, y: ys[i] })) }
}

function AnalyticsCard() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const { line, area, points } = chartPath(CHART_DATA, CHART_W, CHART_H, PAD_X, PAD_Y)
  const DAYS = ["M", "T", "W", "T", "F", "S", "S"]

  return (
    <div ref={ref} className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Weekly Intensity</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">↑ 14%</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <svg viewBox={`0 0 ${CHART_W} ${CHART_H + 20}`} className="w-full overflow-visible">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="rgb(99 102 241)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="chartGradDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(129 140 248)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="rgb(129 140 248)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Area fill */}
          <motion.path d={area} fill="url(#chartGrad)"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }} className="dark:hidden" />
          <motion.path d={area} fill="url(#chartGradDark)"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }} className="hidden dark:block" />

          {/* Animated line */}
          <motion.path d={line} fill="none" stroke="rgb(99 102 241)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
            className="dark:hidden" />
          <motion.path d={line} fill="none" stroke="rgb(129 140 248)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
            className="hidden dark:block" />

          {/* Data points */}
          {points.map((p, i) => (
            <motion.circle key={i} cx={p.x} cy={p.y} r="3.5"
              className="fill-indigo-600 dark:fill-indigo-400"
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 0.15 + (i / (points.length - 1)) * 1.0, duration: 0.25, type: "spring", stiffness: 280 }}
              style={{ originX: `${p.x}px`, originY: `${p.y}px` }} />
          ))}

          {/* X axis labels */}
          {points.map((p, i) => (
            <text key={i} x={p.x} y={CHART_H + 16} textAnchor="middle"
              className="fill-slate-400 dark:fill-slate-600 text-[8px] font-medium" style={{ fontSize: 9 }}>
              {DAYS[i]}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}

// ─── Card B — Form Precision ─────────────────────────────────────────────────

const JOINTS_DATA = [
  { label: "Hip / Knee Align",   angle: "97.3°", pct: 97 },
  { label: "Left Shoulder",      angle: "89.1°", pct: 89 },
  { label: "Right Shoulder",     angle: "91.2°", pct: 91 },
  { label: "Spine Neutral",      angle: "Active", pct: 100 },
]

function FormPrecisionCard() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <div ref={ref} className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Form Precision</p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Joint Alignment Stream</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center">
          <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>

      <div className="flex flex-col gap-3.5 font-mono text-xs">
        {JOINTS_DATA.map((j, i) => (
          <motion.div key={j.label}
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.12, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-600 dark:text-slate-400">{j.label}</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{j.angle}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400"
                initial={{ width: 0 }}
                animate={inView ? { width: `${j.pct}%` } : { width: 0 }}
                transition={{ delay: i * 0.12 + 0.2, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Card C — Milestones ─────────────────────────────────────────────────────

const MILESTONES = [
  { label: "First 100 workouts",   done: true },
  { label: "30-day streak",        done: true },
  { label: "Perfect form week",    done: true },
  { label: "Elite tier",          done: false },
]

function MilestonesCard() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const [checked, setChecked] = useState<boolean[]>(MILESTONES.map(() => false))

  useEffect(() => {
    if (!inView) return
    MILESTONES.forEach((m, i) => {
      if (!m.done) return
      setTimeout(() => {
        setChecked(prev => { const n = [...prev]; n[i] = true; return n })
      }, i * 320 + 200)
    })
  }, [inView])

  return (
    <div ref={ref} className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Milestones</p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Workout Achievements</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {MILESTONES.map((m, i) => (
          <motion.div key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
          >
            <motion.div
              animate={checked[i] ? { scale: [1.3, 1] } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 14 }}
            >
              {checked[i]
                ? <CheckCircle className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                : <Circle className="h-4.5 w-4.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
              }
            </motion.div>
            <span className={[
              "text-sm font-medium",
              checked[i] ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-600",
            ].join(" ")}>
              {m.label}
            </span>
            {!m.done && (
              <span className="ml-auto text-[10px] font-semibold text-amber-500 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 rounded-full px-2 py-0.5">
                In progress
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Bento Grid wrapper ──────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.55, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

export default function BentoGrid() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-600/20 dark:border-indigo-400/20 bg-indigo-600/5 dark:bg-indigo-400/5 px-4 py-1.5 mb-5">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">Feature Suite</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-4">
            Everything you need to train smarter
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Professional-grade analytics, precise form monitoring, and structured progress tracking — all in one platform.
          </p>
        </motion.div>

        {/* Asymmetric grid: Card A (col-span-2), Cards B+C (col-span-1 each, stacked) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-fr">

          {/* Card A — Analytics (wide) */}
          <motion.div
            custom={0}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
            className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-7 shadow-md shadow-slate-900/5 dark:shadow-slate-950/40 min-h-[280px]"
          >
            <AnalyticsCard />
          </motion.div>

          {/* Right column — B + C stacked */}
          <div className="flex flex-col gap-5">
            {/* Card B — Form Precision */}
            <motion.div
              custom={1}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-7 shadow-md shadow-slate-900/5 dark:shadow-slate-950/40 flex-1"
            >
              <FormPrecisionCard />
            </motion.div>

            {/* Card C — Milestones */}
            <motion.div
              custom={2}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-7 shadow-md shadow-slate-900/5 dark:shadow-slate-950/40 flex-1"
            >
              <MilestonesCard />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
