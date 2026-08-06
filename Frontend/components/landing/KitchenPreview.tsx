"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flame, Star, Plus, Clock } from "lucide-react"

const TARGET_CAL = 3020
const TARGET = { protein: 165, carbs: 302, fats: 101 }

const MEALS_PRESET = [
  { id: "grilled-chicken", name: "Grilled Chicken", emoji: "🍗", kcal: 300, protein: 24, carbs: 3,  fats: 5,  qty: "100g" },
  { id: "brown-rice",      name: "Brown Rice",      emoji: "🍚", kcal: 400, protein: 2,  carbs: 60, fats: 15, qty: "100g" },
  { id: "veggie-bowl",     name: "Veggie Bowl",     emoji: "🥗", kcal: 250, protein: 8,  carbs: 30, fats: 10, qty: "200g" },
  { id: "eggs",            name: "Scrambled Eggs",  emoji: "🥚", kcal: 180, protein: 13, carbs: 2,  fats: 12, qty: "2 eggs" },
]

interface MacroState { calories: number; protein: number; carbs: number; fats: number }
interface LogEntry { id: string; name: string; emoji: string; kcal: number; time: string }

function VerticalBar({ pct, color, label, grams, target }: {
  pct: number; color: string; label: string; grams: number; target: number
}) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{Math.round(pct)}%</span>
      <div className="relative w-12 flex-1 min-h-[120px] rounded-xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <motion.div
          className="absolute bottom-0 left-0 right-0 rounded-xl"
          style={{ background: `linear-gradient(to top, ${color}, ${color}88)` }}
          initial={{ height: 0 }}
          animate={{ height: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-[10px] font-bold tabular-nums" style={{ color }}>
        {grams}<span className="text-[8px] text-slate-500">g</span>
      </span>
      <span className="text-[9px] text-slate-600">/{target}g</span>
    </div>
  )
}

export default function KitchenPreview() {
  const [macros, setMacros] = useState<MacroState>({ calories: 700, protein: 26, carbs: 63, fats: 20 })
  const [log, setLog] = useState<LogEntry[]>([
    { id: "gc", name: "Grilled Chicken", emoji: "🍗", kcal: 300, time: "19:54" },
    { id: "br", name: "Brown Rice",      emoji: "🍚", kcal: 400, time: "19:54" },
  ])

  const goalReached = macros.calories >= TARGET_CAL
  const calPct = Math.min((macros.calories / TARGET_CAL) * 100, 100)

  const addMeal = (meal: typeof MEALS_PRESET[0]) => {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
    setLog(prev => [
      ...prev,
      { id: `${meal.id}-${Date.now()}`, name: meal.name, emoji: meal.emoji, kcal: meal.kcal, time }
    ])
    setMacros(prev => ({
      calories: Math.min(prev.calories + meal.kcal, TARGET_CAL + 200),
      protein:  Math.min(prev.protein  + meal.protein,  TARGET.protein + 20),
      carbs:    Math.min(prev.carbs    + meal.carbs,    TARGET.carbs + 30),
      fats:     Math.min(prev.fats     + meal.fats,     TARGET.fats + 20),
    }))
  }

  const proteinPct = Math.min((macros.protein / TARGET.protein) * 100, 100)
  const carbsPct   = Math.min((macros.carbs   / TARGET.carbs)   * 100, 100)
  const fatsPct    = Math.min((macros.fats    / TARGET.fats)    * 100, 100)

  return (
    <section className="px-6 py-24" style={{ background: "#090D16" }}>
      <div className="mx-auto max-w-6xl">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
            style={{ border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.08)" }}>
            <Flame className="h-3.5 w-3.5" style={{ color: "#a78bfa" }} />
            <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#a78bfa" }}>The Kitchen</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Track every macro, fuel every rep
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Click any meal below to watch your Fuel Gauge fill up in real time. Reach your daily target and watch the Energy indicator ignite.
          </p>
        </motion.div>

        {/* Main demo card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.07)", background: "#0F172A" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">

            {/* LEFT — Meal log */}
            <div className="p-6 border-b lg:border-b-0 lg:border-r" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {/* Log header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Today&apos;s Log</h3>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#8b5cf6,#a855f7)" }}>
                  <Plus className="h-4 w-4" />Add Meal
                </button>
              </div>

              {/* Logged meals */}
              <div className="space-y-0 mb-6 rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                <AnimatePresence initial={false}>
                  {log.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between px-5 py-3.5"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{entry.emoji}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-white">{entry.name}</span>
                            <Star className="h-3 w-3 text-slate-600" />
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <Clock className="h-2.5 w-2.5" />{entry.time} · 100g
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold text-white"
                        style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
                        <Flame className="h-3.5 w-3.5" />{entry.kcal} kcal
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Meal buttons */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Quick Add</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {MEALS_PRESET.map((meal) => (
                    <motion.button
                      key={meal.id}
                      onClick={() => addMeal(meal)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-all duration-200"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <span className="text-2xl">{meal.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white leading-none truncate">{meal.name}</p>
                        <p className="text-xs mt-0.5 font-bold" style={{ color: "#f97316" }}>
                          +{meal.kcal} kcal
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — Fuel Gauge */}
            <div className="p-6 flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl" style={{ background: "rgba(139,92,246,0.15)" }}>
                    <Flame className="h-4 w-4" style={{ color: "#a78bfa" }} />
                  </div>
                  <span className="text-sm font-semibold text-white">Fuel Gauge</span>
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today</span>
              </div>

              {/* 3 vertical macro bars */}
              <div className="flex gap-3 h-48">
                <VerticalBar pct={proteinPct} color="#ef4444" label="Protein" grams={macros.protein} target={TARGET.protein} />
                <VerticalBar pct={carbsPct}   color="#06b6d4" label="Carbs"   grams={macros.carbs}   target={TARGET.carbs} />
                <VerticalBar pct={fatsPct}    color="#f59e0b" label="Fats"    grams={macros.fats}    target={TARGET.fats} />
              </div>

              {/* Energy card */}
              <div className="rounded-2xl p-4 flex flex-col items-center gap-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <motion.div
                  animate={goalReached ? {
                    filter: ["drop-shadow(0 0 0px #f97316)", "drop-shadow(0 0 12px #f97316)", "drop-shadow(0 0 0px #f97316)"],
                  } : { filter: "drop-shadow(0 0 0px transparent)" }}
                  transition={{ duration: 1.5, repeat: goalReached ? Infinity : 0, ease: "easeInOut" }}
                >
                  <Flame className="h-9 w-9" style={{ color: goalReached ? "#f97316" : "#4b5563" }} />
                </motion.div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Energy</p>
                <motion.p
                  className="text-4xl font-black tabular-nums"
                  animate={{ color: goalReached ? "#10b981" : "#ffffff" }}
                  transition={{ duration: 0.5 }}
                >
                  {macros.calories}
                </motion.p>
                <p className="text-xs text-slate-500">kcal</p>
                {/* Cal progress bar */}
                <div className="w-full">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="font-bold tabular-nums" style={{ color: goalReached ? "#10b981" : "#f97316" }}>
                      {Math.round(calPct)}%
                    </span>
                    <span className="text-slate-600">/ {TARGET_CAL}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: goalReached ? "#10b981" : "linear-gradient(90deg,#f97316,#fbbf24)" }}
                      animate={{ width: `${calPct}%` }}
                      transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                  </div>
                </div>

                {/* Celebration */}
                <AnimatePresence>
                  {goalReached && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-xs font-bold text-center px-3 py-1.5 rounded-full"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}
                    >
                      🎯 Daily goal reached!
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
