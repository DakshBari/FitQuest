"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, RotateCcw, CheckCircle, AlertCircle } from "lucide-react"

type DemoState = "idle" | "scanning" | "active"

const JOINT_POSITIONS = [
  { id: "head",       x: 50,  y: 8,  label: "Head" },
  { id: "sh-l",      x: 34,  y: 20, label: "Left Shoulder" },
  { id: "sh-r",      x: 66,  y: 20, label: "Right Shoulder" },
  { id: "elb-l",     x: 18,  y: 38, label: "Left Elbow" },
  { id: "elb-r",     x: 82,  y: 38, label: "Right Elbow" },
  { id: "hip-l",     x: 40,  y: 50, label: "Left Hip" },
  { id: "hip-r",     x: 60,  y: 50, label: "Right Hip" },
  { id: "knee-l",    x: 37,  y: 70, label: "Left Knee" },
  { id: "knee-r",    x: 63,  y: 70, label: "Right Knee" },
  { id: "ankle-l",   x: 35,  y: 88, label: "Left Ankle" },
  { id: "ankle-r",   x: 65,  y: 88, label: "Right Ankle" },
]

const ANGLES = [
  { label: "Left Knee",    target: 94.2,  status: "good",   statusLabel: "Good" },
  { label: "Right Knee",   target: 91.8,  status: "good",   statusLabel: "Good" },
  { label: "Hip Flexion",  target: 87.5,  status: "warn",   statusLabel: "Adjust" },
  { label: "Spine Align",  target: 179.1, status: "good",   statusLabel: "Good" },
]

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) { setVal(0); return }
    const start = Date.now()
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1)
      setVal(parseFloat((target * t).toFixed(1)))
      if (t < 1) requestAnimationFrame(tick)
      else setVal(target)
    }
    const raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target, duration])
  return val
}

function AngleRow({ label, target, status, statusLabel, active, delay }: {
  label: string; target: number; status: string; statusLabel: string; active: boolean; delay: number
}) {
  const val = useCountUp(target, active, 1400)
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: 8 }}
      transition={{ delay, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
    >
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-24">{label}</span>
      <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{val.toFixed(1)}°</span>
      <span className={[
        "inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5",
        status === "good"
          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
          : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400",
      ].join(" ")}>
        {status === "good"
          ? <CheckCircle className="h-2.5 w-2.5" />
          : <AlertCircle className="h-2.5 w-2.5" />}
        {statusLabel}
      </span>
    </motion.div>
  )
}

export default function TechDemoSection() {
  const [demo, setDemo] = useState<DemoState>("idle")
  const [visibleJoints, setVisibleJoints] = useState<string[]>([])
  const [repCount, setRepCount] = useState(0)
  const [formScore, setFormScore] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startDemo = () => {
    setDemo("scanning")
    setVisibleJoints([])
    setRepCount(0)
    setFormScore(0)

    // After scan completes, show joints one by one
    timerRef.current = setTimeout(() => {
      setDemo("active")
      JOINT_POSITIONS.forEach((j, i) => {
        setTimeout(() => {
          setVisibleJoints(prev => [...prev, j.id])
        }, i * 120)
      })
      // Count reps
      let r = 0
      const repInterval = setInterval(() => {
        r += 1
        setRepCount(r)
        if (r >= 3) clearInterval(repInterval)
      }, 900)
      // Animate form score
      let s = 0
      const scoreInterval = setInterval(() => {
        s = Math.min(s + 2, 87)
        setFormScore(s)
        if (s >= 87) clearInterval(scoreInterval)
      }, 22)
    }, 2000)
  }

  const resetDemo = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setDemo("idle")
    setVisibleJoints([])
    setRepCount(0)
    setFormScore(0)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const circumference = 2 * Math.PI * 26
  const dashOffset = circumference - (formScore / 100) * circumference

  return (
    <section id="technology" className="px-6 py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-600/20 dark:border-indigo-400/20 bg-indigo-600/5 dark:bg-indigo-400/5 px-4 py-1.5 mb-5">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">Technology in Action</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-4">
            See the AI work in real time
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Click below to simulate AI-powered pose calibration — joint detection, angle analysis, and form scoring, all running locally.
          </p>
        </motion.div>

        {/* Demo card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-xl shadow-slate-900/8 dark:shadow-slate-950/60 overflow-hidden"
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400/70" />
              <div className="h-3 w-3 rounded-full bg-amber-400/70" />
              <div className="h-3 w-3 rounded-full bg-emerald-400/70" />
            </div>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">fitquest — ai-pose-estimator</span>
            <div className="w-14" />
          </div>

          <AnimatePresence mode="wait">
            {demo === "idle" ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-24 px-6 gap-6"
              >
                <div className="h-16 w-16 rounded-2xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center">
                  <Play className="h-8 w-8 text-indigo-600 dark:text-indigo-400 ml-1" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">Ready to calibrate</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">No camera needed — this is a simulation</p>
                </div>
                <button
                  onClick={startDemo}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 dark:bg-indigo-500 px-7 py-3 text-sm font-semibold text-white hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-colors duration-200 shadow-md shadow-indigo-600/20"
                >
                  <Play className="h-4 w-4" />
                  Start Demo
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-[1fr_140px_200px] divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800"
              >
                {/* Viewport simulation */}
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Camera Feed</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] font-mono text-slate-400">LIVE</span>
                    </div>
                  </div>
                  {/* The canvas */}
                  <div className="relative aspect-[4/3] rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Scan line */}
                    {demo === "scanning" && (
                      <div className="absolute left-0 right-0 h-px bg-indigo-500/70 animate-scan-line" />
                    )}
                    {/* Skeleton joints */}
                    {demo === "active" && (
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                        {/* Bones */}
                        {[
                          [50, 8, 50, 17], [50, 17, 40, 50], [50, 17, 60, 50],
                          [34, 20, 18, 38], [66, 20, 82, 38],
                          [34, 20, 66, 20], [40, 50, 60, 50],
                          [40, 50, 37, 70], [60, 50, 63, 70],
                          [37, 70, 35, 88], [63, 70, 65, 88],
                        ].map(([x1, y1, x2, y2], i) => (
                          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"
                            className="text-indigo-400/50 dark:text-indigo-400/40" />
                        ))}
                        {JOINT_POSITIONS.map((j) =>
                          visibleJoints.includes(j.id) && (
                            <motion.g key={j.id}
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 18 }}
                              style={{ originX: `${j.x}%`, originY: `${j.y}%` }}>
                              <circle cx={j.x} cy={j.y} r="2.8" className="fill-indigo-500 dark:fill-indigo-400" />
                              <circle cx={j.x} cy={j.y} r="1" className="fill-white" />
                              <circle cx={j.x} cy={j.y} r="4.5" fill="none"
                                stroke="currentColor" strokeWidth="0.5" opacity="0.4"
                                className="text-indigo-500 dark:text-indigo-400" />
                            </motion.g>
                          )
                        )}
                      </svg>
                    )}
                    {/* Scan label */}
                    <div className="absolute bottom-2 left-2">
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                        {demo === "scanning" ? "Calibrating..." : "Tracking active"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center — metrics */}
                <div className="p-5 flex flex-col gap-5 items-center justify-center">
                  {/* Form score gauge */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Form Score</span>
                    <svg width="72" height="72" className="-rotate-90">
                      <circle cx="36" cy="36" r="26" fill="none" stroke="currentColor"
                        strokeWidth="4" className="text-slate-200 dark:text-slate-800" />
                      <circle cx="36" cy="36" r="26" fill="none" stroke="currentColor"
                        strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        className="text-indigo-500 dark:text-indigo-400 transition-all duration-75" />
                    </svg>
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-50 -mt-14 mb-8 tabular-nums">
                      {formScore}%
                    </span>
                  </div>
                  {/* Rep counter */}
                  <div className="flex flex-col items-center gap-1 w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Reps</span>
                    <motion.span
                      key={repCount}
                      initial={{ scale: 1.3, opacity: 0.6 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="text-3xl font-bold text-slate-900 dark:text-slate-50 tabular-nums"
                    >{repCount}</motion.span>
                  </div>
                </div>

                {/* Right — angles */}
                <div className="p-5 flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Joint Angles</span>
                  {ANGLES.map((a, i) => (
                    <AngleRow key={a.label} {...a} active={demo === "active"} delay={i * 0.15 + 0.3} />
                  ))}
                  <div className="mt-auto pt-4">
                    <button onClick={resetDemo}
                      className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset demo
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
