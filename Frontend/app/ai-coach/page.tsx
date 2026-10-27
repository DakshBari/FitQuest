"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Mic, MicOff, Volume2, VolumeX, MessageSquare, Clock, Trash2, Sparkles, Zap, Brain, Plus, User } from "lucide-react"
import { aiCoachService, type Message, type ChatSession } from "@/services/aiCoachService"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { getApiUrl } from "@/lib/config"

// ─── Brand accent ──────────────────────────────────────────
const PURPLE = "#8b5cf6"

// ─── Ripple rings — follow mouse cursor ─────────────────
function SonarRings() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const raf = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    type Ring = { r: number; maxR: number; life: number; maxLife: number; cx: number; cy: number }
    const rings: Ring[] = []
    let W = 0, H = 0, lastSpawn = 0

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth
      H = canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const spawnAt = (x: number, y: number) => {
      rings.push({ r: 0, maxR: 55 + Math.random() * 70, life: 0, maxLife: 80 + Math.random() * 40, cx: x, cy: y })
    }

    // Mouse on the PARENT (canvas is pointer-events-none)
    const onMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastSpawn < 120) return
      lastSpawn = now
      const rect = canvas.getBoundingClientRect()
      spawnAt(e.clientX - rect.left, e.clientY - rect.top)
    }

    // fallback auto-spawn when no mouse
    const auto = setInterval(() => {
      if (Date.now() - lastSpawn > 1500) spawnAt(W * 0.25 + Math.random() * W * 0.5, H * 0.5 + (Math.random() - 0.5) * H * 0.4)
    }, 1800)

    const parent = canvas.parentElement
    parent?.addEventListener("mousemove", onMove)

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i]
        ring.life++
        ring.r = (ring.life / ring.maxLife) * ring.maxR
        const alpha = Math.pow(1 - ring.life / ring.maxLife, 1.5) * 0.4
        ctx.beginPath()
        ctx.arc(ring.cx, ring.cy, ring.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(139,92,246,${alpha.toFixed(3)})`
        ctx.lineWidth = 1.5
        ctx.stroke()
        if (ring.life >= ring.maxLife) rings.splice(i, 1)
      }
      raf.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      clearInterval(auto)
      cancelAnimationFrame(raf.current)
      parent?.removeEventListener("mousemove", onMove)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />
}

// ─── Bright floating particles ────────────────────────────
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const raf = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let W = 0, H = 0
    const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    type Dot = { x: number; y: number; vx: number; vy: number; r: number }
    const dots: Dot[] = Array.from({ length: 22 }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 600,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1 + Math.random() * 2,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0) d.x = W; if (d.x > W) d.x = 0
        if (d.y < 0) d.y = H; if (d.y > H) d.y = 0

        // Soft glow halo
        const grd = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 3)
        grd.addColorStop(0, "rgba(167,139,250,0.18)")
        grd.addColorStop(1, "rgba(167,139,250,0)")
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r * 3, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Core dot
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(196,181,253,0.55)"
        ctx.fill()
      })
      raf.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf.current); ro.disconnect() }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
    />
  )
}

// ─── Thinking dots ────────────────────────────────────────
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-violet-400"
          style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
        />
      ))}
    </div>
  )
}

// ─── Formatted Message with Bullets & Bold ───────────────
function FormattedMessage({ text, isAI }: { text: string; isAI: boolean }) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  let currentList: React.ReactNode[] = []

  const renderBold = (str: string) => {
    const regex = /\*\*(.*?)\*\*/g
    const segments = []
    let lastIdx = 0
    let match
    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIdx) {
        segments.push(str.substring(lastIdx, match.index))
      }
      segments.push(
        <strong key={match.index} className={cn("font-semibold", isAI ? "text-violet-400" : "text-white")}>
          {match[1]}
        </strong>
      )
      lastIdx = regex.lastIndex
    }
    if (lastIdx < str.length) {
      segments.push(str.substring(lastIdx))
    }
    return segments.length > 0 ? segments : str
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    
    // Check for bullet points starting with * or -
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      const content = trimmed.substring(2)
      currentList.push(
        <li key={index} className={cn("mb-1.5 text-sm leading-relaxed", isAI ? "text-foreground/90" : "text-white/90")}>
          {renderBold(content)}
        </li>
      )
    } else {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${index}`} className="list-disc list-outside pl-6 my-2 space-y-0.5">
            {currentList}
          </ul>
        )
        currentList = []
      }
      
      if (trimmed === "") {
        elements.push(<div key={index} className="h-2" />)
      } else {
        elements.push(
          <p key={index} className={cn("mb-1 text-sm leading-relaxed", isAI ? "text-foreground/95" : "text-white")}>
            {renderBold(line)}
          </p>
        )
      }
    }
  })

  if (currentList.length > 0) {
    elements.push(
      <ul key="list-final" className="list-disc list-outside pl-6 my-2 space-y-0.5">
        {currentList}
      </ul>
    )
  }

  return <div className="space-y-0.5">{elements}</div>
}

// ─── Message bubble ───────────────────────────────────────
function Bubble({ msg, isTyping, displayedContent }: {
  msg: Message; isTyping: boolean; displayedContent: string
}) {
  const isAI = msg.role === "ai"
  const text = isTyping ? displayedContent : msg.content
  const time = (() => {
    const d = typeof msg.timestamp === "string" ? new Date(msg.timestamp) : msg.timestamp
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  })()

  return (
    <div className={cn("flex gap-2.5 max-w-[85%]", isAI ? "self-start" : "self-end flex-row-reverse")}>
      {isAI && (
        <div className="w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
        </div>
      )}
      <div>
        <div
          className={cn(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed",
            isAI
              ? "bg-card border border-border/50 text-foreground rounded-tl-sm"
              : "text-white rounded-tr-sm"
          )}
          style={!isAI ? { background: PURPLE } : {}}
        >
          <FormattedMessage text={text} isAI={isAI} />
          {isTyping && (
            <span className="inline-block w-0.5 h-3.5 bg-violet-400 ml-0.5 animate-pulse" />
          )}
        </div>
        <p suppressHydrationWarning className={cn("text-[10px] text-muted-foreground/50 mt-1", isAI ? "text-left pl-1" : "text-right pr-1")}>
          {time}
        </p>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────
export default function AICoachPage() {
  const [message,          setMessage]          = useState("")
  const [currentMessages,  setCurrentMessages]  = useState<Message[]>([{
    role: "ai",
    content: "Hello! I'm your AI Coach. Ask me anything about training, nutrition, recovery, or form — I'm here to help you perform at your best.",
    timestamp: new Date(),
  }])
  const [chatSessions,     setChatSessions]     = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isListening,      setIsListening]      = useState(false)
  const [isVoiceEnabled,   setIsVoiceEnabled]   = useState(false)
  const [isLoading,        setIsLoading]        = useState(false)
  const [aiStatus,         setAiStatus]         = useState<"online" | "offline">("online")
  const [authError,        setAuthError]        = useState<string | null>(null)
  const [typingIdx,        setTypingIdx]        = useState<number | null>(null)
  const [displayedContent, setDisplayedContent] = useState("")

  const recognitionRef  = useRef<SpeechRecognition | null>(null)
  const synthRef        = useRef<SpeechSynthesis | null>(null)
  const messagesEndRef  = useRef<HTMLDivElement>(null)
  const inputRef        = useRef<HTMLInputElement>(null)
  const { toast }       = useToast()

  const quickPrompts = [
    "Suggest a workout for today",
    "Best post-workout meal?",
    "How do I improve my squat?",
    "Create a recovery plan",
  ]

  useEffect(() => {
    if (typeof window === "undefined") return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SR) {
      const r = new SR()
      r.continuous = false; r.interimResults = false; r.lang = "en-US"
      r.onresult = (e: any) => { setMessage(e.results[0][0].transcript); setIsListening(false) }
      r.onerror = () => setIsListening(false)
      r.onend = () => setIsListening(false)
      recognitionRef.current = r
    }
    synthRef.current = window.speechSynthesis
    loadSessions()
    checkStatus()
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [currentMessages, isLoading])

  useEffect(() => {
    if (typingIdx === null || !currentMessages[typingIdx]) return
    const full = currentMessages[typingIdx].content
    let i = 0
    setDisplayedContent("")
    const id = setInterval(() => {
      if (i < full.length) { setDisplayedContent(full.slice(0, ++i)) }
      else { clearInterval(id); setTypingIdx(null); setDisplayedContent("") }
    }, 5)
    return () => clearInterval(id)
  }, [typingIdx])

  const checkStatus = async () => {
    try {
      const r = await fetch(`${getApiUrl()}/health`)
      setAiStatus(r.ok ? "online" : "offline")
    } catch { setAiStatus("offline") }
  }

  const loadSessions = async () => {
    try {
      const s = await aiCoachService.getChatSessions()
      setChatSessions(s); setAuthError(null)
    } catch (e: any) {
      if (e.message?.includes("Authentication")) setAuthError(e.message)
    }
  }

  const createNewSession = () => {
    setCurrentSessionId(null); setTypingIdx(null); setDisplayedContent("")
    setCurrentMessages([{
      role: "ai",
      content: "Hello! I'm your AI Coach. Ask me anything about training, nutrition, recovery, or form — I'm here to help you perform at your best.",
      timestamp: new Date(),
    }])
  }

  const loadSession = (s: ChatSession) => {
    setTypingIdx(null); setDisplayedContent("")
    setCurrentMessages(s.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })))
    setCurrentSessionId(s._id)
  }

  const deleteSession = async (id: string) => {
    try {
      await aiCoachService.deleteChatSession(id)
      setChatSessions(p => p.filter(s => s._id !== id))
      if (currentSessionId === id) createNewSession()
    } catch { toast({ title: "Error", description: "Failed to delete session", variant: "destructive" }) }
  }

  const handleSend = async () => {
    if (!message.trim() || isLoading || currentMessages.length >= 20) return
    const userMsg: Message = { role: "user", content: message, timestamp: new Date() }
    const updated = [...currentMessages, userMsg]
    setCurrentMessages(updated); setMessage(""); setIsLoading(true)
    try {
      const res = await aiCoachService.sendMessage(message, currentSessionId || undefined)
      const aiMsg: Message = { role: "ai", content: res.message, timestamp: new Date() }
      const final = [...updated, aiMsg]
      setCurrentMessages(final); setCurrentSessionId(res.sessionId); setAuthError(null)
      setTypingIdx(final.length - 1)
      if (isVoiceEnabled && synthRef.current) {
        setTimeout(() => {
          const u = new SpeechSynthesisUtterance(aiMsg.content)
          u.rate = 0.9; synthRef.current!.speak(u)
        }, aiMsg.content.length * 5 + 300)
      }
      await loadSessions()
    } catch (e: any) {
      if (e.message?.includes("Authentication")) {
        setAuthError(e.message)
      } else {
        const errMsg: Message = { role: "ai", content: e.message || "Something went wrong. Please try again.", timestamp: new Date() }
        setCurrentMessages([...updated, errMsg])
      }
    } finally { setIsLoading(false) }
  }

  const fmtRelative = (d: Date | string) => {
    const ms = Date.now() - new Date(d).getTime()
    const m = Math.floor(ms / 60000)
    if (m < 1) return "Just now"
    if (m < 60) return `${m}m ago`
    if (m < 1440) return `${Math.floor(m / 60)}h ago`
    return `${Math.floor(m / 1440)}d ago`
  }

  const atLimit = currentMessages.length >= 20

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-background">
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 flex-1 flex flex-col pt-8 pb-8 min-h-0">

      {/* ── Alerts ─────────────────────────────────────── */}
      {aiStatus === "offline" && (
        <div className="mx-0 mb-3 px-4 py-2.5 rounded-xl border border-red-500/25 bg-red-500/8 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-500">AI services unavailable. Please try again later.</p>
        </div>
      )}
      {authError && (
        <div className="mb-3 px-4 py-2.5 rounded-xl border border-border/50 bg-card/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-muted-foreground/60" />
            <p className="text-xs text-muted-foreground">Please log in to access AI Coach features</p>
          </div>
          <button
            onClick={() => window.location.href = "/login"}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors text-foreground"
          >
            Log In
          </button>
        </div>
      )}

      {/* ── Main grid ──────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 min-h-0" style={{ minHeight: 560 }}>

        {/* ── Chat panel ─────────────────────────────── */}
        <div className="flex flex-col min-h-0 rounded-3xl border border-border/50 bg-card overflow-hidden relative">

          {/* Sonar rings — live ambient element */}
          <SonarRings />

          {/* Chat header */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-border/50 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              {/* Avatar with status */}
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </div>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                  aiStatus === "online" ? "bg-emerald-400" : "bg-red-400"
                )} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">The Oracle</h2>
                <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                  <span className={cn("w-1.5 h-1.5 rounded-full", aiStatus === "online" ? "bg-emerald-400" : "bg-red-400")} />
                  {aiStatus === "online" ? "Online · AI Fitness Coach" : "Offline"}
                </p>
              </div>
            </div>

            {/* Output controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsVoiceEnabled(v => !v)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all",
                  isVoiceEnabled
                    ? "bg-violet-500/10 border-violet-500/30 text-violet-500"
                    : "border-border/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {isVoiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                Voice
              </button>
            </div>
          </div>

          {/* Limit warning */}
          {currentMessages.length >= 19 && (
            <div className="flex-shrink-0 px-5 py-2 bg-amber-500/8 border-b border-amber-500/20 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-400">Chat limit reached. Start a new conversation to continue.</p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 min-h-0 relative z-10">
            <div className="absolute inset-0 overflow-y-auto px-6 py-6 flex flex-col gap-5">
              {currentMessages.map((msg, i) => (
                <Bubble
                  key={i}
                  msg={msg}
                  isTyping={typingIdx === i}
                  displayedContent={displayedContent}
                />
              ))}
              {isLoading && (
                <div className="flex gap-2.5 self-start">
                  <div className="w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border/50">
                    <ThinkingDots />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick prompts */}
          {currentMessages.length === 1 && (
            <div className="flex-shrink-0 px-6 py-4 border-t border-border/40 bg-muted/5 relative z-10">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">Suggested</p>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => { setMessage(p); inputRef.current?.focus() }}
                    disabled={atLimit}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:border-violet-500/30 hover:bg-violet-500/5 transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex-shrink-0 px-5 py-5 border-t border-border/40 bg-card relative z-10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => isListening ? recognitionRef.current?.stop() : (setIsListening(true), recognitionRef.current?.start())}
                disabled={atLimit}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center border transition-all flex-shrink-0",
                  isListening
                    ? "bg-red-500/10 border-red-500/30 text-red-500"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                disabled={isLoading || atLimit}
                placeholder={atLimit ? "Start a new chat to continue…" : "Ask me anything about your fitness…"}
                className="flex-1 h-9 rounded-xl border border-border/50 bg-muted/10 px-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40 transition-colors"
              />

              <button
                onClick={handleSend}
                disabled={isLoading || !message.trim() || atLimit}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                  !isLoading && message.trim() && !atLimit
                    ? "text-white shadow-sm"
                    : "bg-muted/20 text-muted-foreground/30 cursor-not-allowed"
                )}
                style={!isLoading && message.trim() && !atLimit ? { background: PURPLE } : {}}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Chat history sidebar ────────────────────── */}
        <div className="flex flex-col min-h-0 rounded-3xl border border-border/50 bg-card overflow-hidden relative">

          {/* Particle field — sidebar ambient element */}
          <ParticleField />

          {/* Header */}
          <div className="flex-shrink-0 px-4 py-4 border-b border-border/50 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground/60" />
              <h3 className="text-sm font-bold text-foreground">History</h3>
            </div>
            <button
              onClick={createNewSession}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border/50 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
            >
              <Plus className="w-3 h-3" /> New
            </button>
          </div>

          {/* Sessions */}
          <div className="flex-1 min-h-0 relative z-10">
            <div className="absolute inset-0 overflow-y-auto px-4 py-4 space-y-2.5">
              {chatSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                  <div className="w-10 h-10 rounded-2xl bg-muted/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                  <p className="text-xs text-muted-foreground/50">No history yet</p>
                  <p className="text-[10px] text-muted-foreground/35">Start chatting to see sessions here</p>
                </div>
              ) : (
                chatSessions.map(s => (
                  <div
                    key={s._id}
                    onClick={() => loadSession(s)}
                    className={cn(
                      "group p-4 rounded-2xl border cursor-pointer transition-all duration-150",
                      currentSessionId === s._id
                        ? "border-violet-500/30 bg-violet-500/8"
                        : "border-border/40 hover:border-border/70 hover:bg-muted/10"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{s.title}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 line-clamp-2 leading-snug">
                          {s.messages[s.messages.length - 1]?.content || "No messages"}
                        </p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <Clock className="w-2.5 h-2.5 text-muted-foreground/40" />
                          <span className="text-[9px] text-muted-foreground/50">{fmtRelative(s.lastActivity)}</span>
                          <span className="text-[9px] text-muted-foreground/35 ml-1">· {s.messages.length} msg</span>
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteSession(s._id) }}
                        className="w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer hint */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-border/40 relative z-10">
            <p className="text-[9px] text-muted-foreground/40 text-center">
              Last 5 conversations · 10 msg/session limit
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}