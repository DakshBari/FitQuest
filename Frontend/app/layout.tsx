import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Orbitron } from "next/font/google"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" })

export const metadata: Metadata = {
  title: "FitQuest - AI Gamified Fitness Ecosystem",
  description:
    "Transform your workouts into an epic adventure. Track form with AI, complete quests, capture territories, and unlock achievements in the most immersive fitness ecosystem ever created.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${_orbitron.variable}`} suppressHydrationWarning>
      <body className={`font-sans antialiased bg-background text-foreground`} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
