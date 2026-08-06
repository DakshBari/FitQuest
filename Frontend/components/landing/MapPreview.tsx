"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Play, RotateCcw, Trophy, Loader2 } from "lucide-react"

// ── Constants ──────────────────────────────────────────────────────────────────
// Default center: South Bombay, Mumbai
const DEFAULT_CENTER: [number, number] = [18.9220, 72.8347]
const DEFAULT_ZOOM = 14

// Purple polyline route style
const ROUTE_STYLE = {
  color: "#7c3aed",
  weight: 4,
  opacity: 0.9,
  dashArray: "10 6",
  lineCap: "round" as const,
  lineJoin: "round" as const,
}

type RunState = "idle" | "placed-start" | "placed-end" | "running" | "done"

export default function MapPreview() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<any>(null)           // L.Map
  const startMarkerRef  = useRef<any>(null)           // L.Marker
  const endMarkerRef    = useRef<any>(null)           // L.Marker
  const routeLineRef    = useRef<any>(null)           // L.Polyline
  const runnerMarkerRef = useRef<any>(null)           // L.Marker (animated)
  const rafRef          = useRef<number | null>(null)

  const [state, setState]   = useState<RunState>("idle")
  const [startLL, setStartLL] = useState<[number, number] | null>(null)
  const [endLL,   setEndLL]   = useState<[number, number] | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // ── Leaflet bootstrap (client-only) ──────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return

    // Dynamic import keeps SSR safe
    import("leaflet").then((LModule) => {
      const L = LModule.default

      // Fix Leaflet's broken icon paths in bundlers
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      // Inject Leaflet CSS only once
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id   = "leaflet-css"
        link.rel  = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      const map = L.map(mapContainerRef.current!, {
        center: DEFAULT_CENTER,
        zoom:   DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: false,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map)

      // Attribution in corner (tiny)
      L.control.attribution({ position: "bottomright", prefix: "© OSM" }).addTo(map)

      mapRef.current = map
      setMapReady(true)

      // Geolocation — center on user if allowed
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            map.setView([pos.coords.latitude, pos.coords.longitude], DEFAULT_ZOOM)
          },
          () => { /* fallback already set */ },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        )
      }
    })

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // ── Custom SVG marker factory ─────────────────────────────────────────────────
  const makeIcon = useCallback((L: any, label: string, bg: string) => {
    return L.divIcon({
      className: "",
      html: `
        <div style="
          width:32px; height:32px; border-radius:50%;
          background:${bg}; border:3px solid white;
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:900; color:white;
          box-shadow:0 0 0 4px ${bg}44, 0 4px 12px rgba(0,0,0,0.5);
          font-family:system-ui,sans-serif;
        ">${label}</div>`,
      iconSize:   [32, 32],
      iconAnchor: [16, 16],
    })
  }, [])

  const makeRunnerIcon = useCallback((L: any) => {
    return L.divIcon({
      className: "",
      html: `
        <div style="
          width:28px; height:28px; border-radius:50%;
          background:linear-gradient(135deg,#7c3aed,#6366f1);
          border:3px solid white;
          display:flex; align-items:center; justify-content:center;
          font-size:12px; color:white;
          box-shadow:0 0 0 6px rgba(124,58,237,0.35), 0 4px 16px rgba(124,58,237,0.6);
          animation: runner-pulse 1s ease-in-out infinite alternate;
          font-family:system-ui,sans-serif;
        ">▶</div>`,
      iconSize:   [28, 28],
      iconAnchor: [14, 14],
    })
  }, [])

  // ── Map click handler ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    import("leaflet").then((LModule) => {
      const L = LModule.default

      const handleClick = (e: any) => {
        if (state === "running" || state === "done") return
        const lat = e.latlng.lat as number
        const lng = e.latlng.lng as number

        if (state === "idle" || state === "placed-end") {
          // Place / replace start marker
          if (startMarkerRef.current) startMarkerRef.current.remove()
          if (endMarkerRef.current)   { endMarkerRef.current.remove(); endMarkerRef.current = null }
          if (routeLineRef.current)   { routeLineRef.current.remove(); routeLineRef.current = null }

          const icon = makeIcon(L, "S", "#10b981")
          startMarkerRef.current = L.marker([lat, lng], { icon }).addTo(map)
          setStartLL([lat, lng])
          setEndLL(null)
          setState("placed-start")

        } else if (state === "placed-start") {
          // Check distance from start (at least ~60m apart in screen terms)
          if (startLL) {
            const dLat = lat - startLL[0], dLng = lng - startLL[1]
            const approxMeters = Math.sqrt(dLat * dLat + dLng * dLng) * 111_000
            if (approxMeters < 300) return // too close
          }

          // Place end marker
          if (endMarkerRef.current) endMarkerRef.current.remove()
          if (routeLineRef.current) routeLineRef.current.remove()

          const icon = makeIcon(L, "E", "#ef4444")
          endMarkerRef.current = L.marker([lat, lng], { icon }).addTo(map)
          setEndLL([lat, lng])

          // Draw dashed route
          if (startLL) {
            routeLineRef.current = L.polyline([[startLL[0], startLL[1]], [lat, lng]], ROUTE_STYLE).addTo(map)
            map.fitBounds(routeLineRef.current.getBounds(), { padding: [60, 60] })
          }
          setState("placed-end")
        }
      }

      map.on("click", handleClick)
      return () => { map.off("click", handleClick) }
    })
  }, [mapReady, state, startLL, makeIcon])

  // ── Start Run animation ───────────────────────────────────────────────────────
  const startRun = useCallback(() => {
    if (!startLL || !endLL || !mapRef.current) return

    import("leaflet").then((LModule) => {
      const L = LModule.default
      const map = mapRef.current

      // Remove existing runner
      if (runnerMarkerRef.current) { runnerMarkerRef.current.remove(); runnerMarkerRef.current = null }

      const icon = makeRunnerIcon(L)
      runnerMarkerRef.current = L.marker([startLL[0], startLL[1]], { icon, zIndexOffset: 1000 }).addTo(map)
      setState("running")

      const duration = 4000
      const startTime = performance.now()
      const [sLat, sLng] = startLL
      const [eLat, eLng] = endLL

      const animate = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1)
        // ease-in-out cubic
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

        const lat = sLat + (eLat - sLat) * eased
        const lng = sLng + (eLng - sLng) * eased

        runnerMarkerRef.current?.setLatLng([lat, lng])

        if (t < 1) {
          rafRef.current = requestAnimationFrame(animate)
        } else {
          setState("done")
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    })
  }, [startLL, endLL, makeRunnerIcon])

  // ── Reset ─────────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startMarkerRef.current?.remove();  startMarkerRef.current  = null
    endMarkerRef.current?.remove();    endMarkerRef.current    = null
    routeLineRef.current?.remove();    routeLineRef.current    = null
    runnerMarkerRef.current?.remove(); runnerMarkerRef.current = null
    setStartLL(null); setEndLL(null)
    setState("idle")
  }, [])

  return (
    <section className="px-6 py-24" style={{ background: "#090D16" }}>
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
            style={{ border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.08)" }}>
            <MapPin className="h-3.5 w-3.5" style={{ color: "#60a5fa" }} />
            <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#60a5fa" }}>World Map</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Conquer your territory
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Click two points on the live map to set your route, hit Start Run, and watch your tracker traverse the real streets.
          </p>
        </motion.div>

        {/* Map card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.07)", background: "#0F172A" }}
        >
          {/* Title bar */}
          <div className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ background: "#ef4444", opacity: 0.7 }} />
              <div className="h-3 w-3 rounded-full" style={{ background: "#f59e0b", opacity: 0.7 }} />
              <div className="h-3 w-3 rounded-full" style={{ background: "#10b981", opacity: 0.7 }} />
            </div>
            <span className="text-xs font-mono text-slate-500">fitquest — world-map</span>
            <div>
              {state !== "idle" && (
                <button onClick={reset}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  <RotateCcw className="h-3 w-3" />Reset
                </button>
              )}
            </div>
          </div>

          {/* Instruction + Start Run bar */}
          <div className="px-5 py-2.5 flex items-center justify-between flex-wrap gap-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-5 text-xs text-slate-500">
              {[
                { dot: "#10b981", label: "1. Click to set Start", active: state === "idle" },
                { dot: "#ef4444", label: "2. Click to set End",   active: state === "placed-start" },
                { dot: "#6366f1", label: "3. Start Run",          active: state === "placed-end" || state === "running" || state === "done" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full transition-all duration-300"
                    style={{ background: s.active ? s.dot : `${s.dot}44` }} />
                  <span style={{ color: s.active ? s.dot : undefined }}>{s.label}</span>
                </div>
              ))}
            </div>

            <AnimatePresence>
              {state === "placed-end" && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  onClick={startRun}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}
                >
                  <Play className="h-4 w-4" />Start Run
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Real Leaflet Map */}
          <div className="relative" style={{ height: 420 }}>
            {/* Dark-theme filter overlay */}
            <div
              ref={mapContainerRef}
              className="w-full h-full"
              style={{
                cursor: state === "running" || state === "done" ? "default" : "crosshair",
                // Invert+hue-rotate gives a rich dark map on OpenStreetMap tiles
                filter: "invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)",
              }}
            />

            {/* Loading overlay */}
            {!mapReady && (
              <div className="absolute inset-0 flex items-center justify-center z-10"
                style={{ background: "#0a1628" }}>
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#6366f1" }} />
                  <span className="text-sm text-slate-400">Loading map…</span>
                </div>
              </div>
            )}

            {/* Territory Captured banner */}
            <AnimatePresence>
              {state === "done" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-x-0 bottom-5 flex items-center justify-center z-[1000] pointer-events-none"
                >
                  <div className="flex items-center gap-3 px-6 py-3 rounded-2xl text-white font-bold text-base"
                    style={{
                      background: "linear-gradient(135deg,rgba(16,185,129,0.92),rgba(5,150,105,0.92))",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(16,185,129,0.5)",
                      boxShadow: "0 0 30px rgba(16,185,129,0.4)",
                      // counter the dark-filter on the parent
                      filter: "invert(100%) hue-rotate(180deg) brightness(1.1)",
                    }}>
                    <Trophy className="h-5 w-5" />
                    Territory Captured! 🎯
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-5 rounded-full" style={{ background: "#7c3aed" }} />
                Your Route
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#10b981" }} />
                Start (S)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444" }} />
                End (E)
              </div>
            </div>
            <span className="text-xs text-slate-600">
              {state === "idle"        && "Click the map to begin"}
              {state === "placed-start" && "Now click a second spot to set your End point"}
              {state === "placed-end"   && "Route ready — click Start Run!"}
              {state === "running"      && "Running…"}
              {state === "done"         && "Zone captured! Click Reset to try again."}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Inject runner pulse keyframe */}
      <style>{`
        @keyframes runner-pulse {
          0%   { box-shadow: 0 0 0 4px rgba(124,58,237,0.35), 0 4px 16px rgba(124,58,237,0.5); }
          100% { box-shadow: 0 0 0 10px rgba(124,58,237,0.1), 0 4px 24px rgba(124,58,237,0.7); }
        }
      `}</style>
    </section>
  )
}
