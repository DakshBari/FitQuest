"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Mic, MicOff, Volume2, VolumeX, MessageSquare, Clock, Trash2, Sparkles, Zap, Brain, Plus, Settings, User } from "lucide-react"
import { aiCoachService, type Message, type ChatSession } from "@/services/aiCoachService"
import { useToast } from "@/hooks/use-toast"

export default function AICoachPage() {
  const [message, setMessage] = useState("")
  const [currentMessages, setCurrentMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "Hello, Warrior! I'm your AI Coach. How can I help optimize your training today?",
      timestamp: new Date(),
    },
  ])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(false)
  const [isTextOutputEnabled, setIsTextOutputEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [aiStatus, setAiStatus] = useState<'online' | 'fallback' | 'offline'>('online')
  const [authError, setAuthError] = useState<string | null>(null)
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null)
  const [displayedContent, setDisplayedContent] = useState<string>("")
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const quickPrompts = [
    "Analyze my squat form",
    "Suggest a post-workout meal", 
    "Why does my knee hurt?",
    "Create a recovery plan",
  ]

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'en-US'
        
        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          setMessage(transcript)
          setIsListening(false)
        }
        
        recognitionRef.current.onerror = () => {
          setIsListening(false)
          toast({
            title: "Voice Recognition Error",
            description: "Could not recognize speech. Please try again.",
            variant: "destructive"
          })
        }
        
        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
      
      // Speech Synthesis
      synthRef.current = window.speechSynthesis
    }

    // Load chat sessions on component mount
    loadChatSessions()
    checkAiStatus()
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages, isLoading])

  // Typewriter effect for AI messages
  useEffect(() => {
    if (typingMessageIndex !== null && currentMessages[typingMessageIndex]) {
      const fullContent = currentMessages[typingMessageIndex].content
      let currentIndex = 0
      setDisplayedContent("")
      
      const typeInterval = setInterval(() => {
        if (currentIndex < fullContent.length) {
          setDisplayedContent(fullContent.slice(0, currentIndex + 1))
          currentIndex++
          
          // Auto-scroll every 20 characters or at the end
          if (currentIndex % 20 === 0 || currentIndex === fullContent.length) {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 10)
          }
        } else {
          clearInterval(typeInterval)
          setTypingMessageIndex(null)
          setDisplayedContent("")
        }
      }, 20) // Adjust speed here (lower = faster)
      
      return () => clearInterval(typeInterval)
    }
  }, [typingMessageIndex, currentMessages])

  const checkAiStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/health`)
      if (response.ok) {
        setAiStatus('online')
      } else {
        setAiStatus('fallback')
      }
    } catch (error) {
      setAiStatus('offline')
    }
  }

  const loadChatSessions = async () => {
    try {
      const sessions = await aiCoachService.getChatSessions()
      setChatSessions(sessions)
      setAuthError(null)
    } catch (error: any) {
      console.error('Error loading chat sessions:', error)
      if (error.message.includes('Authentication required')) {
        setAuthError(error.message)
      } else {
        toast({
          title: "Error",
          description: "Failed to load chat history",
          variant: "destructive"
        })
      }
    }
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const speakText = (text: string) => {
    if (synthRef.current && isVoiceOutputEnabled) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      synthRef.current.speak(utterance)
    }
  }

  const createNewSession = () => {
    setCurrentSessionId(null)
    setTypingMessageIndex(null)
    setDisplayedContent("")
    setCurrentMessages([
      {
        role: "ai",
        content: "Hello, Warrior! I'm your AI Coach. How can I help optimize your training today?",
        timestamp: new Date(),
      },
    ])
  }

  const loadChatSession = (session: ChatSession) => {
    setTypingMessageIndex(null)
    setDisplayedContent("")
    setCurrentMessages(session.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    })))
    setCurrentSessionId(session._id)
  }

  const deleteChatSession = async (sessionId: string) => {
    try {
      await aiCoachService.deleteChatSession(sessionId)
      setChatSessions(prev => prev.filter(s => s._id !== sessionId))
      
      if (currentSessionId === sessionId) {
        createNewSession()
      }
      
      toast({
        title: "Success",
        description: "Chat session deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting chat session:', error)
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive"
      })
    }
  }

  const handleSend = async () => {
    if (!message.trim() || isLoading) return
    
    // Check message limit (10 messages = 20 total including AI responses)
    if (currentMessages.length >= 20) {
      toast({
        title: "Message Limit Reached",
        description: "Please start a new chat to continue the conversation.",
        variant: "destructive"
      })
      return
    }
    
    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date(),
    }
    
    const updatedMessages = [...currentMessages, userMessage]
    setCurrentMessages(updatedMessages)
    setMessage("")
    setIsLoading(true)
    
    try {
      const response = await aiCoachService.sendMessage(message, currentSessionId || undefined)
      
      const aiResponse: Message = {
        role: "ai",
        content: response.message,
        timestamp: new Date(),
      }
      
      const finalMessages = [...updatedMessages, aiResponse]
      setCurrentMessages(finalMessages)
      setCurrentSessionId(response.sessionId)
      setAuthError(null) // Clear any previous auth errors
      
      // Start typewriter effect for the AI response
      setTypingMessageIndex(finalMessages.length - 1)
      
      // Speak AI response if voice output is enabled (after typing is complete)
      if (isVoiceOutputEnabled) {
        setTimeout(() => {
          speakText(aiResponse.content)
        }, aiResponse.content.length * 20 + 500) // Wait for typing to complete
      }
      
      // Reload chat sessions to update the list
      await loadChatSessions()
      
      // Show warning when approaching limit
      if (finalMessages.length >= 18) {
        toast({
          title: "Approaching Message Limit",
          description: "You have 1 message left. Consider starting a new chat soon.",
          variant: "default"
        })
      }
      
    } catch (error: any) {
      console.error('Error sending message:', error)
      
      if (error.message.includes('Authentication required')) {
        setAuthError(error.message)
        toast({
          title: "Authentication Required",
          description: "Please log in to use the AI coach",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive"
        })
        
        // Add fallback AI response
        const fallbackResponse: Message = {
          role: "ai",
          content: "I'm experiencing some technical difficulties right now. Please try again in a moment. In the meantime, remember to stay consistent with your workouts and listen to your body!",
          timestamp: new Date(),
        }
        setCurrentMessages([...updatedMessages, fallbackResponse])
        // Start typewriter effect for fallback response too
        setTimeout(() => {
          setTypingMessageIndex(updatedMessages.length)
        }, 100)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diff = now.getTime() - dateObj.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const formatMessageTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const messageDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())
    
    const timeString = dateObj.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    
    if (messageDate.getTime() === today.getTime()) {
      return timeString // Just time for today
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return `Yesterday ${timeString}`
    } else if (now.getTime() - dateObj.getTime() < 7 * 24 * 60 * 60 * 1000) {
      // Within a week - show day name
      return `${dateObj.toLocaleDateString('en-US', { weekday: 'short' })} ${timeString}`
    } else {
      // Older than a week - show date
      return `${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeString}`
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Modern Header */}
      <div className="mb-4 flex-shrink-0 px-6 pt-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/25 dark:shadow-purple-500/10">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-background animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-purple-500 to-cyan-500 bg-clip-text text-transparent font-inter tracking-tight">
              The Oracle
            </h1>
            <p className="text-muted-foreground font-medium">AI-Powered Fitness Intelligence</p>
          </div>
        </div>
        
        {aiStatus === 'offline' && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl backdrop-blur-sm">
            <p className="text-sm text-destructive flex items-center gap-2">
              <Zap className="w-4 h-4" />
              AI services are currently unavailable. Please try again later.
            </p>
          </div>
        )}
        
        {authError && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Authentication Required</p>
                  <p className="text-xs text-blue-500 dark:text-blue-400/80 mt-1">Please log in to access AI coach features</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => window.location.href = '/login'}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-blue-500/25 rounded-xl font-medium"
              >
                Log In
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-10 gap-6 px-6 pb-6 min-h-0 overflow-hidden">
        {/* Chat Interface */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-0">
          <div className="flex-1 bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-primary/5 flex flex-col overflow-hidden" style={{ minHeight: '600px' }}>
            {/* AI Header */}
            <div className="flex-shrink-0 p-6 border-b border-border bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-background animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground font-inter">The Oracle</h3>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>AI Fitness Coach - Online</span>
                    </div>
                  </div>
                </div>
                
                {/* Output Controls */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground font-medium">Output:</span>
                  <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-xl">
                    <Button
                      variant={isTextOutputEnabled ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setIsTextOutputEnabled(!isTextOutputEnabled)}
                      className={`text-xs font-medium rounded-lg transition-all ${
                        isTextOutputEnabled 
                          ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Text
                    </Button>
                    <Button
                      variant={isVoiceOutputEnabled ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setIsVoiceOutputEnabled(!isVoiceOutputEnabled)}
                      className={`text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                        isVoiceOutputEnabled 
                          ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/25" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {isVoiceOutputEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                      Voice
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Limit Warning */}
            {currentMessages.length >= 19 && (
              <div className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-orange-500/20">
                <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-2 font-medium">
                  <Zap className="w-4 h-4" />
                  Chat limit reached (10 messages). Start a new chat to continue.
                </p>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 min-h-0 relative">
              <div className="absolute inset-0 overflow-y-auto p-6 space-y-6">
                {currentMessages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div
                      className={`max-w-[85%] p-5 rounded-3xl shadow-lg transition-all hover:shadow-xl ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-foreground backdrop-blur-sm"
                          : "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-foreground backdrop-blur-sm"
                      }`}
                    >
                      {isTextOutputEnabled && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-inter">
                          {msg.role === "ai" && typingMessageIndex === index 
                            ? (
                              <>
                                {displayedContent}
                                <span className="inline-block w-2 h-5 bg-purple-400 ml-1 animate-pulse rounded-sm"></span>
                              </>
                            )
                            : msg.content}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-3 font-medium">{formatMessageTime(msg.timestamp)}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-foreground backdrop-blur-sm p-5 rounded-3xl shadow-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-sm font-medium">The Oracle is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Quick Prompts */}
            {currentMessages.length === 1 && (
              <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-background/30">
                <div className="flex flex-wrap gap-3">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      className="border-border/50 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-cyan-500/20 hover:border-purple-500/30 bg-background/30 backdrop-blur-sm text-xs font-medium rounded-xl transition-all duration-200"
                      onClick={() => setMessage(prompt)}
                      disabled={isLoading || currentMessages.length >= 20}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Field */}
            <div className="flex-shrink-0 p-6 border-t border-border bg-background/30">
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className={`border-border/50 hover:bg-background/50 backdrop-blur-sm rounded-xl transition-all duration-200 ${
                    isListening ? "text-red-400 border-red-400/50 bg-red-500/10" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading || currentMessages.length >= 20}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Input
                  type="text"
                  placeholder={currentMessages.length >= 20 ? "Start a new chat to continue..." : "Ask me anything about your fitness..."}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 bg-background/50 border-border/50 focus:border-purple-500/50 text-foreground placeholder:text-muted-foreground rounded-xl backdrop-blur-sm font-inter transition-all duration-200"
                  disabled={isLoading || currentMessages.length >= 20}
                />
                <Button
                  onClick={handleSend}
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-purple-500/25 rounded-xl font-medium transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/30"
                  disabled={isLoading || !message.trim() || currentMessages.length >= 20}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat History */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-0">
          <div className="flex-1 bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl shadow-cyan-500/10 flex flex-col overflow-hidden" style={{ minHeight: '600px' }}>
            {/* History Header */}
            <div className="flex-shrink-0 p-6 border-b border-border/50 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-lg font-bold text-foreground font-inter">Chat History</h3>
                </div>
                <Button
                  size="sm"
                  onClick={createNewSession}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white border-0 shadow-lg shadow-cyan-500/25 rounded-xl font-medium text-xs transition-all duration-200 hover:shadow-xl"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New Chat
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Recent 5 conversations</p>
            </div>

            {/* Chat Sessions */}
            <div className="flex-1 min-h-0 relative">
              <div className="absolute inset-0 overflow-y-auto p-4 space-y-3">
                {chatSessions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-medium">No chat history yet</p>
                    <p className="text-xs opacity-70 mt-1">Start a conversation to see it here</p>
                  </div>
                ) : (
                  chatSessions.map((session) => (
                    <div
                      key={session._id}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-lg group ${
                        currentSessionId === session._id
                          ? "bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-500/30 shadow-lg shadow-purple-500/10"
                          : "bg-background/30 border-border/30 hover:bg-background/50 hover:border-border/50"
                      }`}
                      onClick={() => loadChatSession(session)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate font-inter">{session.title}</h4>
                          <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-2 leading-relaxed">
                            {session.messages[session.messages.length - 1]?.content || "No messages"}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground font-medium">{formatTime(session.lastActivity)}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteChatSession(session._id)
                          }}
                          className="text-muted-foreground hover:text-destructive p-2 h-auto opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground font-medium">
                        {session.messages.length} messages
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}