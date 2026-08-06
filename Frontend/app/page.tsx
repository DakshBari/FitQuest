"use client"

import LandingNav from "@/components/landing/LandingNav"
import HeroSection from "@/components/landing/HeroSection"
import KitchenPreview from "@/components/landing/KitchenPreview"
import BentoGrid from "@/components/landing/BentoGrid"
import MapPreview from "@/components/landing/MapPreview"
import PrivacySection from "@/components/landing/PrivacySection"
import CTASection from "@/components/landing/CTASection"
import { Zap } from "lucide-react"
import Link from "next/link"

function LandingFooter() {
  return (
    <footer className="border-t px-6 py-12" style={{ borderColor: "rgba(255,255,255,0.07)", background: "#090D16" }}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#4f46e5" }}>
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold text-white">FitQuest</span>
          </Link>
          <div className="flex gap-7 text-sm text-slate-500">
            {["Privacy", "Terms", "Support"].map(l => (
              <a key={l} href="#" className="hover:text-slate-300 transition-colors duration-200">{l}</a>
            ))}
          </div>
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} FitQuest. Train intelligently.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    // The root div uses the dark obsidian base; individual sections override as needed.
    // next-themes dark: classes are available for any components that need light/dark variants.
    <div className="min-h-screen" style={{ background: "#090D16" }}>
      <LandingNav />
      <main>
        {/* 1. Hero — two-col: copy + DashboardPreview floating card */}
        <HeroSection />

        {/* 2. Kitchen Fuel Gauge — interactive macro tracker demo */}
        <KitchenPreview />

        {/* 3. Feature Bento Grid */}
        <div style={{ background: "#090D16" }}>
          <BentoGrid />
        </div>

        {/* 4. World Map Runner — click-to-route interactive SVG map */}
        <MapPreview />

        {/* 5. Privacy & Trust */}
        <PrivacySection />

        {/* 6. Final CTA */}
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  )
}