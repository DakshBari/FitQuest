"use client"

import { useEffect, useRef } from "react"
import { X, Activity, Zap, MapPin, Clock, Gauge, TrendingUp, Route } from "lucide-react"
import "leaflet/dist/leaflet.css"

interface RunSession {
  id: string
  type: "run" | "cycle"
  mode: "explorer" | "navigator"
  startTime: Date
  endTime?: Date
  path: number[][]
  distance: number
  duration: number
  averageSpeed: number
  maxSpeed: number
  capturedAreas: GeoJSON.FeatureCollection
  isActive: boolean
}

interface SessionMapModalProps {
  session: RunSession
  onClose: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  if (m >= 60) {
    const h = Math.floor(m / 60)
    return `${h}h ${m % 60}m`
  }
  return `${m}m ${s.toString().padStart(2, "0")}s`
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

// ── Mini Leaflet path map ─────────────────────────────────
function SessionPathMap({ session }: { session: RunSession }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || mapRef.current) return

    import("leaflet").then((mod) => {
      const L = mod.default ?? mod
      if (!containerRef.current || mapRef.current) return

      // Default center: session's first point or NYC
      const first = session.path[0]
      const center: [number, number] = first ? [first[1], first[0]] : [40.7128, -74.006]

      const map = L.map(containerRef.current, {
        center,
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
      })
      mapRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map)

      // Draw path
      if (session.path.length > 1) {
        const latlngs = session.path.map(c => [c[1], c[0]] as [number, number])
        const poly = L.polyline(latlngs, {
          color: session.type === "run" ? "#10b981" : "#8b5cf6",
          weight: 4,
          opacity: 0.85,
        }).addTo(map)

        // Fit bounds to the path
        map.fitBounds(poly.getBounds(), { padding: [24, 24] })
      }

      // Start marker
      if (session.path.length > 0) {
        const startCoord = session.path[0]
        L.circleMarker([startCoord[1], startCoord[0]], {
          radius: 9,
          fillColor: "#10b981",
          color: "#fff",
          weight: 3,
          fillOpacity: 1,
        }).bindTooltip("Start", { permanent: false }).addTo(map)
      }

      // End marker
      if (session.path.length > 1) {
        const endCoord = session.path[session.path.length - 1]
        L.circleMarker([endCoord[1], endCoord[0]], {
          radius: 9,
          fillColor: "#ef4444",
          color: "#fff",
          weight: 3,
          fillOpacity: 1,
        }).bindTooltip("End", { permanent: false }).addTo(map)
      }

      // Captured areas
      if (session.capturedAreas?.features?.length > 0) {
        L.geoJSON(session.capturedAreas, {
          style: () => ({
            fillColor: "#10b981",
            fillOpacity: 0.25,
            color: "#34d399",
            weight: 1.5,
          }),
        }).addTo(map)
      }

      // Invalidate size after render
      setTimeout(() => map.invalidateSize(), 100)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [session])

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ minHeight: "260px" }}
    />
  )
}

// ── Stat chip ─────────────────────────────────────────────
function Stat({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string
}) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl border border-border/30 bg-muted/20">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">{label}</span>
      </div>
      <span className="text-sm font-black tabular-nums" style={{ color }}>{value}</span>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────
export function SessionMapModal({ session, onClose }: SessionMapModalProps) {
  const typeColor = session.type === "run" ? "#10b981" : "#8b5cf6"
  const TypeIcon  = session.type === "run" ? Activity : Zap

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-border/50 bg-card overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: `${typeColor}18`, border: `1px solid ${typeColor}30` }}
            >
              <TypeIcon className="w-4 h-4" style={{ color: typeColor }} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground capitalize">
                {session.type} · {session.mode} mode
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                {formatDate(session.startTime)} · {formatTime(session.startTime)}
                {session.endTime && ` → ${formatTime(session.endTime)}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Map */}
        <div className="flex-shrink-0 relative" style={{ height: "280px" }}>
          {session.path.length > 0 ? (
            <SessionPathMap session={session} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <Route className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground/50">No path recorded</p>
              </div>
            </div>
          )}

          {/* Type badge overlay */}
          <div
            className="absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ background: typeColor }}
          >
            {session.type} · {session.mode}
          </div>

          {session.capturedAreas?.features?.length > 0 && (
            <div className="absolute top-3 right-3 px-2 py-1 rounded-xl text-[10px] font-bold bg-emerald-500/90 text-white">
              {session.capturedAreas.features.length} zone{session.capturedAreas.features.length !== 1 ? "s" : ""} captured
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-border/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat icon={MapPin}     label="Distance"  value={`${(session.distance * 1000).toFixed(0)} m`}    color="#8b5cf6" />
            <Stat icon={Clock}      label="Duration"  value={formatDuration(session.duration)}                color="#f59e0b" />
            <Stat icon={Gauge}      label="Avg Speed" value={`${session.averageSpeed.toFixed(1)} km/h`}       color={typeColor} />
            <Stat icon={TrendingUp} label="Max Speed" value={`${session.maxSpeed.toFixed(1)} km/h`}           color="#ef4444" />
          </div>
        </div>
      </div>
    </div>
  )
}
