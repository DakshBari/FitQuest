"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MeditationSection } from "@/components/sanctuary/MeditationSection"
import { StretchingSection } from "@/components/sanctuary/StretchingSection"
import { Sparkles, Moon, Flower2 } from "lucide-react"

export default function SanctuaryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      
      {/* Modern Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lavender-500 to-lilac-500 flex items-center justify-center shadow-lg shadow-lavender-500/25 dark:shadow-purple-500/10">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-300 to-rose-300 rounded-full border-2 border-background animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-lavender-500 to-lilac-500 bg-clip-text text-transparent font-inter tracking-tight">
                The Sanctuary
              </h1>
              <p className="text-muted-foreground font-medium">Your peaceful retreat for mind and body</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-card/80 backdrop-blur-xl border border-border/50 rounded-full text-xs text-muted-foreground font-mono shadow-sm">
              v1.0.0
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-6">
        {/* Tabs */}
        <Tabs defaultValue="meditation" className="w-full">
          <TabsList className="bg-card/80 backdrop-blur-xl border border-border/50 p-1 rounded-2xl w-full md:w-auto shadow-lg shadow-primary/5 mb-6">
            <TabsTrigger 
              value="meditation" 
              className="gap-2 rounded-xl font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-lavender-500 data-[state=active]:to-lilac-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-lavender-500/25"
            >
              <Sparkles className="w-4 h-4" />
              Meditation
            </TabsTrigger>
            <TabsTrigger 
              value="stretching" 
              className="gap-2 rounded-xl font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-lavender-500 data-[state=active]:to-lilac-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-lavender-500/25"
            >
              <Flower2 className="w-4 h-4" />
              Stretching
            </TabsTrigger>
          </TabsList>

          {/* Meditation Tab Content */}
          <TabsContent value="meditation" className="mt-0">
            <MeditationSection />
          </TabsContent>

          {/* Stretching Tab Content */}
          <TabsContent value="stretching" className="mt-0">
            <StretchingSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

