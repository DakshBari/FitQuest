"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Camera, Mic, Activity, TrendingUp, AlertTriangle } from "lucide-react"

export default function AICoachPage() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: "Hello, Warrior! I'm your AI Coach. How can I help optimize your training today?",
    },
  ])

  const quickPrompts = [
    "Analyze my squat form",
    "Suggest a post-workout meal",
    "Why does my knee hurt?",
    "Create a recovery plan",
  ]

  const handleSend = () => {
    if (!message.trim()) return
    setMessages([...messages, { role: "user", content: message }])
    setMessage("")
    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "I've analyzed your recent activity. Based on your form data, I recommend focusing on...",
        },
      ])
    }, 1000)
  }

  return (
    <div className="p-6 h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground font-orbitron mb-2">AI Coach - The Oracle</h1>
        <p className="text-secondary">Your personal fitness intelligence system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Left Panel - Context Data */}
        <div className="space-y-6 overflow-y-auto">
          {/* Live Vitals */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border-secondary/30 backdrop-blur-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-secondary" />
              <h2 className="text-lg font-bold text-foreground font-orbitron">Live Vitals</h2>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Recovery Status</span>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-green-400 font-orbitron">80%</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Last Workout Form</span>
                </div>
                <p className="text-2xl font-bold text-cyan-400 font-orbitron">B-</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Nutrition Score</span>
                </div>
                <p className="text-2xl font-bold text-secondary font-orbitron">85/100</p>
              </div>
            </div>
          </Card>

          {/* Heatmap Thumbnail */}
          <Card className="bg-card/80 border-secondary/20 backdrop-blur-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 font-orbitron">Injury Heatmap</h3>
            <div className="relative aspect-square bg-muted rounded-xl overflow-hidden mb-4">
              <img
                src="/3d-skeleton-body-heatmap-red-zones-injury.jpg"
                alt="Heatmap"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">Right Knee Strain</p>
                <p className="text-xs text-muted-foreground mt-1">Elevated activity detected</p>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card/80 border-secondary/20 backdrop-blur-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 font-orbitron">Recent Activity</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">Leg Day</span>
                <span className="text-cyan-400">2h ago</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">Protein Shake</span>
                <span className="text-cyan-400">3h ago</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">5K Run</span>
                <span className="text-cyan-400">Yesterday</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Panel - Chat Interface */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 bg-card/80 border-secondary/30 backdrop-blur-xl flex flex-col overflow-hidden">
            {/* AI Avatar */}
            <div className="p-6 border-b border-secondary/20 bg-gradient-to-r from-purple-500/10 to-transparent">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center animate-pulse-glow">
                    <div className="h-14 w-14 rounded-full bg-card flex items-center justify-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-cyan-400" />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-card" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground font-orbitron">The Oracle</h3>
                  <p className="text-sm text-secondary">AI Fitness Coach - Online</p>
                </div>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30 text-foreground"
                        : "bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Prompts */}
            <div className="px-6 py-3 border-t border-secondary/20 bg-muted/30">
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    className="border-secondary/30 text-secondary hover:bg-secondary/10 bg-transparent text-xs"
                    onClick={() => setMessage(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input Field */}
            <div className="p-6 border-t border-secondary/20 bg-muted/50">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="border-secondary/30 text-secondary hover:bg-secondary/10 bg-transparent"
                >
                  <Camera className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-secondary/30 text-secondary hover:bg-secondary/10 bg-transparent"
                >
                  <Mic className="h-5 w-5" />
                </Button>
                <Input
                  type="text"
                  placeholder="Ask me anything about your fitness..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 bg-muted border-secondary/30 focus:border-secondary text-foreground placeholder:text-muted-foreground"
                />
                <Button
                  onClick={handleSend}
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
