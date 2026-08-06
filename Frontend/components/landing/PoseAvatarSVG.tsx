"use client"

import { motion } from "framer-motion"

// Joint definitions: [cx, cy, animDelay, groupLabel]
const JOINTS = [
  // Head
  { id: "head", cx: 100, cy: 32, r: 12, delay: 0 },
  // Shoulders
  { id: "shoulder-l", cx: 64, cy: 72, r: 6, delay: 0.05 },
  { id: "shoulder-r", cx: 136, cy: 72, r: 6, delay: 0.05 },
  // Elbows
  { id: "elbow-l", cx: 38, cy: 120, r: 5, delay: 0.1 },
  { id: "elbow-r", cx: 162, cy: 120, r: 5, delay: 0.1 },
  // Wrists
  { id: "wrist-l", cx: 24, cy: 162, r: 4, delay: 0.15 },
  { id: "wrist-r", cx: 176, cy: 162, r: 4, delay: 0.15 },
  // Hips
  { id: "hip-l", cx: 78, cy: 158, r: 5, delay: 0.08 },
  { id: "hip-r", cx: 122, cy: 158, r: 5, delay: 0.08 },
  // Knees
  { id: "knee-l", cx: 72, cy: 218, r: 5.5, delay: 0.12 },
  { id: "knee-r", cx: 128, cy: 218, r: 5.5, delay: 0.12 },
  // Ankles
  { id: "ankle-l", cx: 68, cy: 278, r: 4.5, delay: 0.18 },
  { id: "ankle-r", cx: 132, cy: 278, r: 4.5, delay: 0.18 },
]

// Skeleton lines: pairs of [x1,y1,x2,y2]
const BONES = [
  // Spine
  [100, 44, 100, 68],
  [100, 68, 78, 158],
  [100, 68, 122, 158],
  // Left arm
  [64, 72, 38, 120],
  [38, 120, 24, 162],
  // Right arm
  [136, 72, 162, 120],
  [162, 120, 176, 162],
  // Shoulders
  [64, 72, 136, 72],
  // Hips
  [78, 158, 122, 158],
  // Left leg
  [78, 158, 72, 218],
  [72, 218, 68, 278],
  // Right leg
  [122, 158, 128, 218],
  [128, 218, 132, 278],
]

// Highlighted joints for colored rings (key analysis points)
const HIGHLIGHTED = ["knee-l", "knee-r", "hip-l", "hip-r", "shoulder-l", "shoulder-r"]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

const jointVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (delay: number) => ({
    scale: 1,
    opacity: 1,
    transition: { delay, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] },
  }),
}

const boneVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: { delay: i * 0.03, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

export default function PoseAvatarSVG() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Background card */}
      <div className="relative w-64 h-80 md:w-72 md:h-96 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 shadow-xl shadow-slate-900/10 dark:shadow-slate-950/60 overflow-hidden">

        {/* Subtle grid overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.06] dark:opacity-[0.08]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" className="text-indigo-600 dark:text-indigo-400" />
        </svg>

        {/* AI badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-indigo-600/10 dark:bg-indigo-400/10 border border-indigo-600/20 dark:border-indigo-400/20 px-2.5 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
            Tracking Active
          </span>
        </div>

        {/* Confidence score */}
        <div className="absolute top-3 right-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 shadow-sm">
          <span className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
            97.4%
          </span>
        </div>

        {/* Main SVG figure */}
        <motion.svg
          viewBox="0 0 200 310"
          className="absolute inset-0 w-full h-full p-6 pt-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <defs>
            <filter id="joint-glow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Skeleton bones */}
          {BONES.map(([x1, y1, x2, y2], i) => (
            <motion.line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="text-slate-400 dark:text-slate-500"
              custom={i}
              variants={boneVariants}
            />
          ))}

          {/* Joints */}
          {JOINTS.map((joint) => {
            const isHighlighted = HIGHLIGHTED.includes(joint.id)
            return (
              <motion.g
                key={joint.id}
                custom={joint.delay}
                variants={jointVariants}
                style={{ originX: `${joint.cx}px`, originY: `${joint.cy}px` }}
              >
                {/* Outer pulse ring for highlighted joints */}
                {isHighlighted && (
                  <circle
                    cx={joint.cx}
                    cy={joint.cy}
                    r={joint.r + 5}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    className={[
                      "text-indigo-500 dark:text-indigo-400",
                      joint.id.startsWith("knee") ? "animate-joint-pulse-slow" : "animate-joint-pulse",
                    ].join(" ")}
                    opacity="0.5"
                  />
                )}
                {/* Inner fill */}
                <circle
                  cx={joint.cx}
                  cy={joint.cy}
                  r={joint.r}
                  className={
                    isHighlighted
                      ? "fill-indigo-500 dark:fill-indigo-400"
                      : "fill-slate-400 dark:fill-slate-500"
                  }
                />
                {/* White center dot for highlighted */}
                {isHighlighted && (
                  <circle
                    cx={joint.cx}
                    cy={joint.cy}
                    r={joint.r * 0.35}
                    className="fill-white dark:fill-white opacity-80"
                  />
                )}
              </motion.g>
            )
          })}
        </motion.svg>

        {/* Bottom label strip */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm px-3 py-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">Joint Nodes</div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">13 / 13 Detected</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">Latency</div>
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">12ms</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
