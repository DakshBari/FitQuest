"use client"

import { motion } from "framer-motion"
import { ShieldCheck, WifiOff, EyeOff } from "lucide-react"

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: "On-Device Processing",
    description:
      "ML inference runs entirely in your browser via TensorFlow.js and MediaPipe. No data is uploaded. Ever.",
  },
  {
    icon: WifiOff,
    title: "No Cloud Required",
    description:
      "Pose estimation works fully offline after the initial page load. Zero dependency on a remote inference server.",
  },
  {
    icon: EyeOff,
    title: "Video Never Transmitted",
    description:
      "Your camera feed is processed locally. No frames, no keypoints, no metadata are sent to any external server.",
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } },
}

// SVG data flow diagram — Camera → Local ML → Joint Data → UI (no cloud)
function DataFlowDiagram() {
  const nodes = [
    { label: "Camera",     sub: "Input",        x: 60,  y: 50 },
    { label: "Local ML",   sub: "MediaPipe",    x: 200, y: 50 },
    { label: "Joint Data", sub: "17 keypoints", x: 340, y: 50 },
    { label: "Your UI",   sub: "Real-time",     x: 480, y: 50 },
  ]
  const arrows = [
    { x1: 104, y1: 50, x2: 156, y2: 50 },
    { x1: 244, y1: 50, x2: 296, y2: 50 },
    { x1: 384, y1: 50, x2: 436, y2: 50 },
  ]
  // "No cloud" callout
  const crossedNode = { x: 200, y: 120, label: "Cloud Server", sub: "Never used" }

  return (
    <svg viewBox="0 0 540 160" className="w-full max-w-2xl mx-auto overflow-visible">
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" className="fill-indigo-500 dark:fill-indigo-400" />
        </marker>
        <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgb(239 68 68 / 0.6)" />
        </marker>
      </defs>

      {/* Connection lines */}
      {arrows.map((a, i) => (
        <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
          stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)"
          className="text-indigo-500 dark:text-indigo-400" />
      ))}

      {/* Dashed line from ML to Cloud — with X */}
      <line x1="200" y1="74" x2="200" y2="106"
        stroke="rgb(239 68 68 / 0.5)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow-red)" />

      {/* Main nodes */}
      {nodes.map((n) => (
        <g key={n.label}>
          <rect x={n.x - 44} y={n.y - 22} width="88" height="44" rx="8"
            className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700" strokeWidth="1.5" />
          <text x={n.x} y={n.y - 4} textAnchor="middle"
            className="fill-slate-800 dark:fill-slate-200 font-semibold" style={{ fontSize: 11 }}>
            {n.label}
          </text>
          <text x={n.x} y={n.y + 11} textAnchor="middle"
            className="fill-slate-400 dark:fill-slate-500" style={{ fontSize: 9 }}>
            {n.sub}
          </text>
        </g>
      ))}

      {/* Cloud / crossed node */}
      <rect x={crossedNode.x - 50} y={crossedNode.y - 22} width="100" height="44" rx="8"
        fill="rgb(239 68 68 / 0.06)" stroke="rgb(239 68 68 / 0.35)" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x={crossedNode.x} y={crossedNode.y - 4} textAnchor="middle"
        className="fill-red-500" style={{ fontSize: 11 }}>
        {crossedNode.label}
      </text>
      <text x={crossedNode.x} y={crossedNode.y + 11} textAnchor="middle"
        className="fill-red-400" style={{ fontSize: 9 }}>
        {crossedNode.sub}
      </text>
      {/* X through it */}
      <line x1={crossedNode.x - 46} y1={crossedNode.y - 18} x2={crossedNode.x + 46} y2={crossedNode.y + 18}
        stroke="rgb(239 68 68 / 0.55)" strokeWidth="2" strokeLinecap="round" />
      <line x1={crossedNode.x + 46} y1={crossedNode.y - 18} x2={crossedNode.x - 46} y2={crossedNode.y + 18}
        stroke="rgb(239 68 68 / 0.55)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function PrivacySection() {
  return (
    <section id="privacy" className="px-6 py-24" style={{ background: "#0F172A" }}>
      <div className="mx-auto max-w-5xl">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-600/20 dark:border-indigo-400/20 bg-indigo-600/5 dark:bg-indigo-400/5 px-4 py-1.5 mb-5">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">Privacy-First Architecture</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Your data never leaves your device.
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            FitQuest&apos;s pose estimation model runs entirely in your browser. No video is captured, stored, or transmitted — ever.
          </p>
        </motion.div>

        {/* Data flow SVG diagram */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-14 rounded-2xl border px-8 pt-6 pb-8 shadow-md" style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#0a1628' }}
        >
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">
            Data Flow Architecture
          </p>
          <DataFlowDiagram />
        </motion.div>

        {/* 3-column trust grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
                variants={itemVariants}
                className="rounded-2xl p-7 shadow-sm" style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#0a1628' }}
              >
                <div className="h-10 w-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center mb-5">
                  <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
