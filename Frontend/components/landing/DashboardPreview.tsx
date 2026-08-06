"use client"

import { motion } from "framer-motion"
import { Apple, Swords, Map, Sparkles, Clock, Flame, Dumbbell, MapPin, Brain, ArrowUpRight } from "lucide-react"

// ── Tiny radial progress ring (faithful to dashboard RadialProgress) ──────────
function MiniRing({ pct, color, bg, size = 56, stroke = 5, children }: {
  pct: number; color: string; bg: string; size?: number; stroke?: number; children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

// ── Thin bar ─────────────────────────────────────────────────────────────────
function TinyBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1 w-full rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// ── Sparkline (Training card) ─────────────────────────────────────────────────
const SPARK = [2, 4, 3, 5, 4, 6, 5, 7, 6, 8]
function Sparkline() {
  const max = 8, min = 2, h = 28, w = 80
  const pts = SPARK.map((v, i) =>
    `${(i / (SPARK.length - 1)) * w},${h - ((v - min) / (max - min)) * (h - 4) - 2}`
  ).join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: h }}>
      <polyline points={pts} fill="none" stroke="#ef4444" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function DashboardPreview() {
  return (
    <div className="relative w-full flex items-center justify-center lg:justify-end">
      {/* Outer decorative rings */}
      <div className="absolute -inset-6 rounded-3xl border border-dashed border-emerald-500/10 dark:border-emerald-400/10 pointer-events-none" />

      {/* Floating wrapper */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        className="w-full max-w-[560px] origin-top"
        style={{ transform: "scale(0.88)", transformOrigin: "top center" }}
      >
        {/* ── Dashboard shell ────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 shadow-2xl shadow-black/30"
          style={{ background: "#090D16" }}>

          {/* ── HERO HEADER CARD ─────────────────────────────────── */}
          <div className="relative overflow-hidden px-5 py-4"
            style={{ background: "linear-gradient(135deg, #0f172a 0%, #111827 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {/* gradient blobs */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)" }} />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />

            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 flex items-center gap-1.5 mb-0.5">
                  <span className="inline-block w-3 h-px bg-slate-600" />GOOD EVENING
                </p>
                <h2 className="text-lg font-bold text-white leading-tight">
                  Welcome back, <span style={{ color: "#10b981" }}>Warrior</span>
                </h2>
                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Clock className="h-2.5 w-2.5" />Wednesday, July 15, 2026
                </p>
                <p className="text-[10px] text-slate-500 italic mt-0.5">Consistency beats perfection, every time.</p>
              </div>
              <div className="flex flex-col gap-1.5 items-end shrink-0">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                  style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
                  <Flame className="h-2.5 w-2.5" />23% Cal Goal
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                  <Dumbbell className="h-2.5 w-2.5" />5 Workouts
                </div>
              </div>
            </div>
          </div>

          {/* ── 4-CARD BENTO GRID ────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-2 p-3">

            {/* 1 — Nutrition */}
            <div className="rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden col-span-1"
              style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 70%)" }} />
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md" style={{ background: "rgba(16,185,129,0.15)" }}>
                  <Apple className="h-2.5 w-2.5" style={{ color: "#10b981" }} />
                </div>
                <span className="text-[9px] font-semibold text-white">Nutrition</span>
                <span className="ml-auto text-[8px] uppercase tracking-wider text-slate-500">Today</span>
              </div>
              {/* Calorie ring */}
              <div className="flex items-center gap-2">
                <MiniRing pct={23} color="#10b981" bg="rgba(16,185,129,0.12)" size={48} stroke={4}>
                  <span className="text-[9px] font-black leading-none" style={{ color: "#10b981" }}>700</span>
                  <span className="text-[7px] text-slate-500">kcal</span>
                </MiniRing>
                <div className="flex-1 min-w-0">
                  <p className="text-[8px] text-slate-500">Goal</p>
                  <p className="text-xs font-black text-white leading-none">3020<span className="text-[8px] font-normal text-slate-500 ml-0.5">kcal</span></p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <TinyBar pct={23} color="#10b981" />
                    <span className="text-[8px] font-bold shrink-0" style={{ color: "#10b981" }}>23%</span>
                  </div>
                </div>
              </div>
              {/* Macros */}
              <div className="space-y-1">
                {[
                  { label: "Protein", val: "0g / 815g", color: "#ef4444", pct: 0 },
                  { label: "Carbs",   val: "0g / 1208g", color: "#06b6d4", pct: 0 },
                  { label: "Fats",    val: "0g / 755g",  color: "#f59e0b", pct: 0 },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between text-[8px] mb-0.5">
                      <span className="text-slate-500">{m.label}</span>
                      <span className="font-bold" style={{ color: m.color }}>{m.val}</span>
                    </div>
                    <TinyBar pct={m.pct} color={m.color} />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 justify-center px-2 py-1.5 rounded-lg text-[9px] font-semibold text-white mt-auto"
                style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)" }}>
                <Apple className="h-2.5 w-2.5" />Open Kitchen<ArrowUpRight className="h-2.5 w-2.5 ml-auto opacity-70" />
              </div>
            </div>

            {/* 2 — Training */}
            <div className="rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden col-span-1"
              style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)" }} />
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md" style={{ background: "rgba(239,68,68,0.15)" }}>
                  <Swords className="h-2.5 w-2.5" style={{ color: "#ef4444" }} />
                </div>
                <span className="text-[9px] font-semibold text-white">Training</span>
                <div className="ml-auto px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>5 total</div>
              </div>
              <div className="opacity-60"><Sparkline /></div>
              {[
                { name: "Seated Calf Raises", date: "Jan 17", sets: "1×", reps: "14 reps" },
                { name: "Seated Calf Raises", date: "Jan 17", sets: "1×", reps: "15 reps" },
              ].map((w, i) => (
                <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg"
                  style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}>
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded" style={{ background: "rgba(239,68,68,0.15)" }}>
                      <Dumbbell className="h-2 w-2" style={{ color: "#ef4444" }} />
                    </div>
                    <div>
                      <p className="text-[8px] font-semibold text-white leading-none">{w.name}</p>
                      <p className="text-[7px] text-slate-500">{w.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-white">{w.sets}</p>
                    <p className="text-[7px] text-slate-500">{w.reps}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-1 mt-auto">
                <div className="flex-1 flex items-center justify-center py-1.5 rounded-lg text-[9px] font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#ef4444,#f97316)" }}>Log Workout</div>
                <div className="px-2.5 py-1.5 rounded-lg text-[9px] font-semibold"
                  style={{ border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>History</div>
              </div>
            </div>

            {/* 3 — World Map */}
            <div className="rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden col-span-1"
              style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)" }} />
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md" style={{ background: "rgba(59,130,246,0.15)" }}>
                  <Map className="h-2.5 w-2.5" style={{ color: "#3b82f6" }} />
                </div>
                <span className="text-[9px] font-semibold text-white">World Map</span>
                <span className="relative flex h-2 w-2 ml-auto">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "#3b82f6" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#3b82f6" }} />
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex flex-col items-center justify-center py-2 rounded-lg"
                  style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <span className="text-lg font-black leading-none" style={{ color: "#3b82f6" }}>0</span>
                  <span className="text-[7px] text-slate-500 uppercase tracking-wide mt-0.5">Zones</span>
                </div>
                <div className="flex flex-col items-center justify-center py-2 rounded-lg"
                  style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}>
                  <span className="text-lg font-black leading-none" style={{ color: "#06b6d4" }}>0.0</span>
                  <span className="text-[7px] text-slate-500 uppercase tracking-wide mt-0.5">KM</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[8px]">
                  <span className="text-slate-500">Distance this month</span>
                  <span className="font-bold" style={{ color: "#3b82f6" }}>0.0 km</span>
                </div>
                <TinyBar pct={0} color="#3b82f6" />
              </div>
              <div className="flex items-center gap-1 justify-center px-2 py-1.5 rounded-lg text-[9px] font-semibold text-white mt-auto"
                style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)" }}>
                <MapPin className="h-2.5 w-2.5" />View Map<ArrowUpRight className="h-2.5 w-2.5 ml-auto opacity-70" />
              </div>
            </div>

            {/* 4 — Sanctuary */}
            <div className="rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden col-span-1"
              style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)" }} />
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md" style={{ background: "rgba(139,92,246,0.15)" }}>
                  <Sparkles className="h-2.5 w-2.5" style={{ color: "#8b5cf6" }} />
                </div>
                <span className="text-[9px] font-semibold text-white">Sanctuary</span>
                <span className="ml-auto text-[8px] font-semibold uppercase tracking-wider" style={{ color: "#a78bfa" }}>Zen</span>
              </div>
              {/* Breathing ring */}
              <div className="flex items-center justify-center py-1">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-violet-400/30 animate-ping" style={{ animationDuration: "3s" }} />
                  <div className="absolute inset-1.5 rounded-full border border-violet-400/20 animate-ping" style={{ animationDuration: "3s", animationDelay: "0.5s" }} />
                  <div className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(168,85,247,0.2))" }}>
                    <Brain className="h-4 w-4" style={{ color: "#a78bfa" }} />
                  </div>
                </div>
              </div>
              {/* Session suggestions */}
              <div className="space-y-1">
                {["5-min breathing", "10-min meditation", "Full body stretch"].map(s => (
                  <div key={s} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] text-slate-400"
                    style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.1)" }}>
                    <Sparkles className="h-2 w-2 shrink-0" style={{ color: "#a78bfa" }} />{s}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 justify-center px-2 py-1.5 rounded-lg text-[9px] font-semibold text-white mt-auto"
                style={{ background: "linear-gradient(135deg,#8b5cf6,#a855f7)" }}>
                <Sparkles className="h-2.5 w-2.5" />Enter Sanctuary
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
