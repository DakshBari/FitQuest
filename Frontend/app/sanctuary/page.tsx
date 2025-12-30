"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MeditationSection } from "@/components/sanctuary/MeditationSection"
import { StretchingSection } from "@/components/sanctuary/StretchingSection"
import { Sparkles } from "lucide-react"

export default function SanctuaryPage() {
  return (
    <div className="min-h-screen bg-[#F7F5FF] dark:bg-[#171717] text-foreground p-4 md:p-6 space-y-6 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-black dark:text-white font-orbitron tracking-wider flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            SANCTUARY
          </h1>
          <span className="px-3 py-1 bg-black/5 dark:bg-white/10 rounded-full text-xs text-gray-500 dark:text-gray-400 font-mono">
            v1.0.0
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="meditation" className="w-full">
        <TabsList className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-1 rounded-lg w-full md:w-auto">
          <TabsTrigger value="meditation" className="gap-2">
            Meditation
          </TabsTrigger>
          <TabsTrigger value="stretching" className="gap-2">
            Stretching
          </TabsTrigger>
        </TabsList>

        {/* Meditation Tab Content */}
        <TabsContent value="meditation" className="mt-6">
          <MeditationSection />
        </TabsContent>

        {/* Stretching Tab Content */}
        <TabsContent value="stretching" className="mt-6">
          <StretchingSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

