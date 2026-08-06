"use client"

import { useState } from "react"
import { MeditationSection } from "@/components/sanctuary/MeditationSection"
import { StretchingSection } from "@/components/sanctuary/StretchingSection"
import { Sparkles, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProtectedLayout } from "@/components/layouts/ProtectedLayout"
import { PageHeader } from "@/components/page-header"

const TABS = [
  { id: "meditation", label: "Meditation", icon: Sparkles, sub: "Mind & breath practices" },
  { id: "stretching", label: "Stretching", icon: Moon,     sub: "Mobility & recovery"   },
] as const

type Tab = typeof TABS[number]["id"]

export default function SanctuaryPage() {
  const [active, setActive] = useState<Tab>("meditation")

  return (
    <ProtectedLayout>
      <div className="min-h-screen flex flex-col bg-background">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 flex-1 flex flex-col pt-4 pb-8 space-y-6">
          
          <PageHeader 
            className="px-0"
            title="The Sanctuary"
            subtitle="Your retreat for mind, breath, and body"
          />

          {/* Underline tab strip */}
          <div className="flex border-b border-border/40">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  "flex flex-col items-start px-5 py-3 border-b-2 -mb-px transition-all duration-150",
                  active === t.id
                    ? "border-[#7F22FE] text-[#7F22FE]"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                )}
              >
                <span className="text-sm font-semibold">{t.label}</span>
                <span className="text-[10px] text-muted-foreground/50 mt-0.5">{t.sub}</span>
              </button>
            ))}
          </div>

          {/* ── Content ──────────────────────────────── */}
          <div className="flex-1 py-2">
            {active === "meditation" && <MeditationSection />}
            {active === "stretching" && <StretchingSection />}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
