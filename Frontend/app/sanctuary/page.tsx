"use client"

import { usePathname } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MeditationSection } from "@/components/sanctuary/MeditationSection"
import { StretchingSection } from "@/components/sanctuary/StretchingSection"
import { Sparkles, Moon, Flower2 } from "lucide-react"
import { getThemeClasses } from "@/lib/pageThemes"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { ThemedTabsTrigger } from "@/components/themed-tabs"

export default function SanctuaryPage() {
  const pathname = usePathname()
  const themeClasses = getThemeClasses(pathname)
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      
      {/* Modern Header */}
      <PageHeader 
        icon={Sparkles}
        title="The Sanctuary"
        subtitle="Your peaceful retreat for mind and body"
        actions={
          <span className="px-3 py-1 bg-card/80 backdrop-blur-xl border border-border/50 rounded-full text-xs text-muted-foreground font-mono shadow-sm">
            v1.0.0
          </span>
        }
        className="pt-6 pb-4"
      />

      {/* Main Content */}
      <div className="flex-1 px-6 pb-6">
        {/* Tabs */}
        <Tabs defaultValue="meditation" className="w-full">
          <TabsList className="bg-card/80 backdrop-blur-xl border border-border/50 p-1 rounded-2xl w-full md:w-auto shadow-lg shadow-primary/5 mb-6">
            <ThemedTabsTrigger value="meditation" icon={Sparkles}>
              Meditation
            </ThemedTabsTrigger>
            <ThemedTabsTrigger value="stretching" icon={Moon}>
              Stretching
            </ThemedTabsTrigger>
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

