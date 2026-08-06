"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Map, Loader2, Activity, Zap, X, Route, MapPin, Clock, Gauge, TrendingUp } from "lucide-react"
import "leaflet/dist/leaflet.css"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface FriendSession {
  id: string
  type: "run" | "cycle"
  mode: "explorer" | "navigator"
  startTime: string
  endTime?: string
  path: number[][]
  distance: number
  duration: number
  averageSpeed: number
  maxSpeed: number
  capturedAreas: GeoJSON.FeatureCollection
  isActive: boolean
}

interface Friend {
  id: string
  name: string
  avatar: string
  level: number
  online: boolean
}

const getHeaders = () => {
  const token = localStorage.getItem("token")
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

// ── Mini Leaflet path map (reusable inside the modal) ──────
function PathMap({ session, friendName }: { session: FriendSession; friendName: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || mapRef.current) return

    import("leaflet").then(mod => {
      const L = mod.default ?? mod
      if (!containerRef.current || mapRef.current) return

      const first = session.path[0]
      const center: [number, number] = first ? [first[1], first[0]] : [40.7128, -74.006]

      const map = L.map(containerRef.current, {
        center, zoom: 14,
        zoomControl: true, attributionControl: false, scrollWheelZoom: true,
      })
      mapRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map)

      if (session.path.length > 1) {
        const latlngs = session.path.map(c => [c[1], c[0]] as [number, number])
        const poly = L.polyline(latlngs, {
          color: session.type === "run" ? "#10b981" : "#8b5cf6",
          weight: 4, opacity: 0.85,
        }).addTo(map)
        map.fitBounds(poly.getBounds(), { padding: [28, 28] })
      }

      // Start marker
      if (session.path.length > 0) {
        const s = session.path[0]
        L.circleMarker([s[1], s[0]], { radius: 9, fillColor: "#10b981", color: "#fff", weight: 3, fillOpacity: 1 })
          .bindTooltip("Start").addTo(map)
      }

      // End marker
      if (session.path.length > 1) {
        const e = session.path[session.path.length - 1]
        L.circleMarker([e[1], e[0]], { radius: 9, fillColor: "#ef4444", color: "#fff", weight: 3, fillOpacity: 1 })
          .bindTooltip("End").addTo(map)
      }

      // Captured zones
      if (session.capturedAreas?.features?.length > 0) {
        L.geoJSON(session.capturedAreas, {
          style: () => ({ fillColor: "#10b981", fillOpacity: 0.22, color: "#34d399", weight: 1.5 }),
        }).addTo(map)
      }

      setTimeout(() => map.invalidateSize(), 80)
    })

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [session])

  return <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" style={{ minHeight: 260 }} />
}

// ── Stat chip ──────────────────────────────────────────────
function Stat({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string
}) {
  return (
    <div className="flex flex-col gap-0.5 p-2.5 rounded-xl border border-border/30 bg-muted/20">
      <div className="flex items-center gap-1">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">{label}</span>
      </div>
      <span className="text-xs font-black tabular-nums" style={{ color }}>{value}</span>
    </div>
  )
}

function FriendSessionsModal({
  friend,
  sessions,
  onClose,
}: {
  friend: Friend
  sessions: FriendSession[]
  onClose: () => void
}) {
  // null = sessions list, non-null = map view for that session
  const [activeSession, setActiveSession] = useState<FriendSession | null>(null)

  const typeColor = (t: string) => t === "run" ? "#10b981" : "#8b5cf6"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl max-h-[88vh] flex flex-col rounded-3xl border border-border/50 bg-card overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeSession && (
              <button
                onClick={() => setActiveSession(null)}
                className="w-7 h-7 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all mr-1"
              >
                ←
              </button>
            )}
            <div className="w-9 h-9 rounded-2xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center">
              <Map className="w-4 h-4 text-[#8b5cf6]" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {activeSession ? `${friend.name}'s Route` : `${friend.name}'s Activities`}
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                {activeSession
                  ? `${formatDate(activeSession.startTime)} · ${formatTime(activeSession.startTime)} · Read only`
                  : `${sessions.length} session${sessions.length !== 1 ? "s" : ""} today · Click to view map`}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── VIEW 1: Sessions list ── */}
        {!activeSession && (
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border/20">
            {sessions.map(s => {
              const color = typeColor(s.type)
              const TypeIcon = s.type === "run" ? Activity : Zap
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className="w-full text-left px-5 py-4 hover:bg-muted/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                      <TypeIcon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold text-foreground capitalize">{s.type} · {s.mode}</p>
                        {s.capturedAreas?.features?.length > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-bold">
                            {s.capturedAreas.features.length} zone{s.capturedAreas.features.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground/60">
                        {formatDate(s.startTime)} · {formatTime(s.startTime)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <div className="flex gap-1.5">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md"
                          style={{ color: "#8b5cf6", background: "#8b5cf615" }}>
                          {(s.distance * 1000).toFixed(0)} m
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-muted/40 text-muted-foreground/70">
                          {formatDuration(s.duration)}
                        </span>
                      </div>
                      <span className="text-[9px] text-muted-foreground/40 group-hover:text-[#8b5cf6] transition-colors font-medium">
                        Tap to view map →
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* ── VIEW 2: Map + stats ── */}
        {activeSession && (
          <>
            <div className="flex-shrink-0 relative" style={{ height: 300 }}>
              {activeSession.path.length > 0 ? (
                <PathMap key={activeSession.id} session={activeSession} friendName={friend.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/20">
                  <div className="text-center">
                    <Route className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground/50">No path recorded for this session</p>
                  </div>
                </div>
              )}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase text-white"
                style={{ background: typeColor(activeSession.type) }}>
                {activeSession.type} · {activeSession.mode}
              </div>
              {activeSession.capturedAreas?.features?.length > 0 && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-xl text-[10px] font-bold bg-emerald-500/90 text-white">
                  {activeSession.capturedAreas.features.length} zone{activeSession.capturedAreas.features.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 px-5 py-4 border-t border-border/30">
              <div className="grid grid-cols-4 gap-2">
                <Stat icon={MapPin} label="Distance" value={`${(activeSession.distance * 1000).toFixed(0)} m`} color="#8b5cf6" />
                <Stat icon={Clock} label="Duration" value={formatDuration(activeSession.duration)} color="#f59e0b" />
                <Stat icon={Gauge} label="Avg Speed" value={`${activeSession.averageSpeed.toFixed(1)} km/h`} color={typeColor(activeSession.type)} />
                <Stat icon={TrendingUp} label="Max Speed" value={`${activeSession.maxSpeed.toFixed(1)} km/h`} color="#ef4444" />
              </div>
              <p className="text-[9px] text-muted-foreground/35 text-center mt-3">
                Read-only view · {friend.name}'s activity data
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Single friend row (in the card) ───────────────────────
function FriendWorldMapRow({
  friend,
  sessions,
  onClick,
}: {
  friend: Friend
  sessions: FriendSession[]
  onClick: () => void
}) {
  const latest = sessions[0]
  const color = latest.type === "run" ? "#10b981" : "#8b5cf6"
  const TypeIcon = latest.type === "run" ? Activity : Zap

  return (
    <button onClick={onClick}
      className="w-full text-left p-3 rounded-xl border border-border/30 hover:border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/5 transition-all duration-150 group">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center">
            <span className="text-[10px] font-black text-[#8b5cf6]">{friend.avatar.substring(0, 2).toUpperCase()}</span>
          </div>
          {friend.online && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-card" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{friend.name}</p>
          <p className="text-[9px] text-[#8b5cf6] font-medium">{sessions.length} session{sessions.length !== 1 ? "s" : ""} today</p>
        </div>
        <Map className="w-3 h-3 text-[#8b5cf6] opacity-60 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Latest session preview */}
      <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-bold">
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ color, background: `${color}18` }}>
          <TypeIcon className="w-2.5 h-2.5" />
          <span className="capitalize">{latest.type}</span>
        </div>
        <span className="px-1.5 py-0.5 rounded-md bg-[#8b5cf6]/10 text-[#8b5cf6]">
          {(latest.distance * 1000).toFixed(0)}m
        </span>
        <span className="px-1.5 py-0.5 rounded-md bg-muted/40 text-muted-foreground/70">
          {formatDuration(latest.duration)}
        </span>
        <span className="px-1.5 py-0.5 rounded-md bg-muted/30 text-muted-foreground/60">
          {formatDate(latest.startTime)}
        </span>
      </div>
    </button>
  )
}

// ── Main export ────────────────────────────────────────────
export function FriendWorldMapCard({ friends }: { friends: Friend[] }) {
  const [sessionMap, setSessionMap] = useState<Record<string, FriendSession[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)

  const fetchAll = useCallback(async () => {
    if (friends.length === 0) { setLoading(false); return }
    setLoading(true)
    const results: Record<string, FriendSession[]> = {}
    await Promise.all(
      friends.map(async f => {
        try {
          const res = await fetch(`${API_URL}/api/world-map/friend/${f.id}/sessions`, {
            headers: getHeaders()
          })
          if (!res.ok) return
          const data = await res.json()
          if (data.status === "success" && data.sessions?.length > 0) {
            results[f.id] = data.sessions
          }
        } catch { }
      })
    )
    setSessionMap(results)
    setLoading(false)
  }, [friends])

  useEffect(() => { fetchAll() }, [fetchAll])

  const activeFriends = friends.filter(f => sessionMap[f.id]?.length > 0)

  return (
    <>
      <div className="rounded-2xl border border-border/40 bg-card/70 p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center">
            <Map className="w-4 h-4 text-[#8b5cf6]" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Friends Activity</p>
            <h3 className="text-sm font-bold text-foreground">World Map</h3>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
          </div>
        ) : activeFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <Route className="w-6 h-6 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/50">No friends have logged activities today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeFriends.map(f => (
              <FriendWorldMapRow
                key={f.id}
                friend={f}
                sessions={sessionMap[f.id]}
                onClick={() => setSelectedFriend(f)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedFriend && sessionMap[selectedFriend.id] && (
        <FriendSessionsModal
          friend={selectedFriend}
          sessions={sessionMap[selectedFriend.id]}
          onClose={() => setSelectedFriend(null)}
        />
      )}
    </>
  )
}
