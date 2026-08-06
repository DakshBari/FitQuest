"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Activity, Zap, Play, Square, MapPin, Route as RouteIcon,
  History, Navigation, Loader2, RefreshCw, Clock, Gauge, TrendingUp, Target
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapLibreMap } from "@/components/world-map/MapLibreMap"
import { SessionMapModal } from "@/components/world-map/SessionMapModal"
import { worldMapService, type RunSession } from "@/services/worldMapService"
import { routingService, type RouteOption } from "@/services/routingService"
import { ProtectedLayout } from "@/components/layouts/ProtectedLayout"
import { PageHeader } from "@/components/page-header"
import * as turf from "@turf/turf"
import { cn } from "@/lib/utils"

interface RoutePoint {
  lat: number
  lng: number
  name?: string
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`
  return `${m}:${s.toString().padStart(2, "0")}`
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

// ── Live stats banner ──────────────────────────────────────
function LiveStatsBanner({ session }: { session: any }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [session.startTime])

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-5 px-6 py-3 rounded-2xl border border-white/20 dark:border-white/10 bg-white/40 dark:bg-zinc-900/65 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(139,92,246,0.15)] ring-1 ring-white/10">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
        </span>
        <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest font-sans">TRACKING</span>
      </div>
      
      <div className="w-px h-5 bg-white/20 dark:bg-white/10" />
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-violet-400" />
          <div className="text-left">
            <div className="text-sm font-bold text-foreground font-sans tabular-nums leading-none">{formatDuration(elapsed)}</div>
            <div className="text-[8px] text-muted-foreground/60 uppercase font-semibold tracking-wider mt-0.5">Time</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-violet-400 rotate-45" />
          <div className="text-left">
            <div className="text-sm font-bold text-foreground font-sans tabular-nums leading-none">{(session.distance * 1000).toFixed(0)}m</div>
            <div className="text-[8px] text-muted-foreground/60 uppercase font-semibold tracking-wider mt-0.5">Distance</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-violet-400" />
          <div className="text-left">
            <div className="text-sm font-bold text-foreground font-sans tabular-nums leading-none">{session.averageSpeed.toFixed(1)}</div>
            <div className="text-[8px] text-muted-foreground/60 uppercase font-semibold tracking-wider mt-0.5">km/h</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Session card ───────────────────────────────────────────
function SessionCard({ session, onClick }: { session: RunSession; onClick: () => void }) {
  const typeColor = session.type === "run" ? "#10b981" : "#8b5cf6"
  const TypeIcon = session.type === "run" ? Activity : Zap

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-xl border border-border hover:border-[#8b5cf6]/40 bg-card hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg" style={{ background: `${typeColor}18` }}>
            <TypeIcon className="w-4 h-4" style={{ color: typeColor }} />
          </div>
          <div>
            <p className="text-sm font-semibold capitalize">
              {session.type} · <span className="text-muted-foreground text-xs font-normal">{session.mode}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(session.startTime)} · {formatTime(session.startTime)}
            </p>
          </div>
        </div>
        <div className="text-[9px] text-muted-foreground/50 hidden group-hover:block">View map →</div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs">Distance</span>
            <span className="font-medium">{(session.distance * 1000).toFixed(0)}m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs">Duration</span>
            <span className="font-medium">{formatDuration(session.duration)}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs">Avg Speed</span>
            <span className="font-medium">{session.averageSpeed.toFixed(1)} km/h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs">Max Speed</span>
            <span className="font-medium">{session.maxSpeed.toFixed(1)} km/h</span>
          </div>
        </div>
      </div>

      {session.capturedAreas?.features?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-emerald-600 font-medium">
            {session.capturedAreas.features.length} territory zone{session.capturedAreas.features.length !== 1 ? "s" : ""} captured
          </span>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border text-center">
        <span className="text-xs text-muted-foreground">Click to view route on map</span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function WorldMapPage() {
  const [activeTab, setActiveTab]       = useState<string>("train")
  const [selectedMode, setSelectedMode] = useState<"explorer" | "navigator">("explorer")
  const [isTracking, setIsTracking]     = useState(false)
  const [watchId, setWatchId]           = useState<number | null>(null)
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [sessions, setSessions]         = useState<RunSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [capturedAreas, setCapturedAreas] = useState<GeoJSON.FeatureCollection>({
    type: "FeatureCollection", features: []
  })
  const [selectedSession, setSelectedSession] = useState<RunSession | null>(null)

  // Navigator only
  const [routePoints, setRoutePoints]       = useState<RoutePoint[]>([])
  const [routeOptions, setRouteOptions]     = useState<RouteOption[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState("")
  const [plannedRoute, setPlannedRoute]     = useState<number[][]>([])
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false)
  // Which point to reassign on next click (null = auto-assign)
  const [overrideMode, setOverrideMode] = useState<"start" | "end" | null>(null)

  // ── User location ────────────────────────────────────────
  useEffect(() => {
    if (!("geolocation" in navigator)) { setUserLocation([-74.006, 40.7128]); return }
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation([pos.coords.longitude, pos.coords.latitude]),
      ()  => setUserLocation([-74.006, 40.7128]),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  // ── Load data ────────────────────────────────────────────
  useEffect(() => { loadUserData() }, [])
  useEffect(() => { if (activeTab === "history") loadUserData() }, [activeTab])

  const loadUserData = async () => {
    setSessionsLoading(true)
    try {
      const [areas, hist] = await Promise.all([
        worldMapService.getCapturedAreas(),
        worldMapService.getSessionHistory(),
      ])
      setCapturedAreas(areas)
      setSessions(hist)
    } catch (e) { console.error("loadUserData:", e) }
    finally { setSessionsLoading(false) }
  }

  // ── Start tracking ────────────────────────────────────────
  const startTracking = async (type: "run" | "cycle") => {
    if (!userLocation) { alert("Unable to get your location. Please enable location services."); return }

    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const newSession = {
      id: sessionId, type, mode: selectedMode,
      startTime: new Date(),
      path: [userLocation],
      distance: 0, duration: 0, averageSpeed: 0, maxSpeed: 0,
      capturedAreas: { type: "FeatureCollection" as const, features: [] },
      isActive: true,
    }

    setCurrentSession(newSession)
    setIsTracking(true)
    setSessions(prev => [newSession as any, ...prev])

    try {
      await worldMapService.startSession({
        sessionId, type, mode: selectedMode, startLocation: userLocation,
        plannedRoute: selectedMode === "navigator" ? plannedRoute : undefined,
      })
    } catch (e) { console.error("startSession:", e) }

    const id = navigator.geolocation.watchPosition(pos => {
      const { latitude, longitude, speed } = pos.coords
      const newCoord = [longitude, latitude]
      const speedKmh = (speed || 0) * 3.6
      if (speedKmh > (type === "run" ? 45 : 60)) return

      setCurrentSession((prev: any) => {
        if (!prev) return null
        const newPath = [...prev.path, newCoord]
        const distanceKm = newPath.length > 1 ? turf.length(turf.lineString(newPath), { units: "kilometers" }) : 0
        const duration = (Date.now() - new Date(prev.startTime).getTime()) / 1000
        const averageSpeed = duration > 0 ? distanceKm / (duration / 3600) : 0
        const updated = { ...prev, path: newPath, distance: distanceKm, duration, averageSpeed, maxSpeed: Math.max(prev.maxSpeed, speedKmh) }

        setSessions(s => s.map(x => x.id === prev.id ? updated as any : x))

        // Area capture check
        if (newPath.length > 10) {
          const distToStart = turf.distance(turf.point(newPath[0]), turf.point(newCoord), { units: "meters" })
          if (distToStart < 50) {
            const poly = turf.polygon([[...newPath, newPath[0]]])
            const area = turf.area(poly)
            if (area > 100) {
              const newArea = { type: "Feature" as const, geometry: poly.geometry, properties: { capturedAt: new Date().toISOString(), area, sessionId: prev.id } }
              setCapturedAreas(a => ({ type: "FeatureCollection", features: [...a.features, newArea] }))
              updated.capturedAreas = { type: "FeatureCollection", features: [...prev.capturedAreas.features, newArea] }
              worldMapService.saveCapturedArea(newArea as any).catch(console.error)
            }
          }
        }
        if (newPath.length % 10 === 0) worldMapService.updateSession(prev.id, updated).catch(console.error)
        return updated
      })
    }, err => {
      console.warn("Geolocation watchPosition warning:", err);
    }, { enableHighAccuracy: true, maximumAge: 5000 })

    setWatchId(id)
  }

  // ── Stop tracking ─────────────────────────────────────────
  const stopTracking = async () => {
    if (watchId !== null) { navigator.geolocation.clearWatch(watchId); setWatchId(null) }
    if (currentSession) {
      const ended = { ...currentSession, endTime: new Date(), isActive: false }
      setSessions(prev => prev.map(s => s.id === currentSession.id ? ended as any : s))
      try { await worldMapService.updateSession(currentSession.id, ended) } catch (e) { console.error("stop:", e) }
      setCurrentSession(null)
    }
    setIsTracking(false)
  }

  // ── Map click — Navigator smart assignment ─────────────────
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    if (selectedMode !== "navigator" || isTracking) return

    setRoutePoints(prev => {
      let next: RoutePoint[]

      if (overrideMode) {
        // User explicitly chose start or end reassignment
        const label = overrideMode === "start" ? "Start" : "End"
        next = [...prev.filter(p => p.name !== label), { lat, lng, name: label }]
        setOverrideMode(null)
      } else if (prev.length === 0) {
        // First click ← auto start
        next = [{ lat, lng, name: "Start" }]
      } else if (prev.length === 1 && prev[0].name === "Start") {
        // Second click ← auto end
        next = [...prev, { lat, lng, name: "End" }]
      } else {
        // Both placed — next click replaces the end
        next = [prev.find(p => p.name === "Start")!, { lat, lng, name: "End" }]
      }

      // Generate route when both points exist
      if (next.length === 2 && next.find(p => p.name === "Start") && next.find(p => p.name === "End")) {
        const start = next.find(p => p.name === "Start")!
        const end   = next.find(p => p.name === "End")!
        generateRoutes(start, end)
      }

      return next
    })
  }, [selectedMode, isTracking, overrideMode])

  const generateRoutes = async (start: RoutePoint, end: RoutePoint) => {
    setIsGeneratingRoute(true)
    try {
      const res = await routingService.getRoutes([start.lng, start.lat], [end.lng, end.lat], "foot-walking")
      setRouteOptions(res.routes)
      setSelectedRouteId(res.selectedRouteId)
      const sel = res.routes.find(r => r.id === res.selectedRouteId)
      if (sel) setPlannedRoute(sel.coordinates)
    } catch {
      setPlannedRoute([[start.lng, start.lat], [end.lng, end.lat]])
    } finally {
      setIsGeneratingRoute(false)
    }
  }

  const selectRoute = (routeId: string) => {
    const r = routeOptions.find(x => x.id === routeId)
    if (r) { setSelectedRouteId(routeId); setPlannedRoute(r.coordinates) }
  }

  const clearRoute = () => {
    setRoutePoints([]); setRouteOptions([]); setSelectedRouteId(""); setPlannedRoute([]); setOverrideMode(null)
  }

  const liveCoords = isTracking && currentSession
    ? currentSession.path
    : userLocation ? [userLocation] : []

  const canStart = !isTracking && (selectedMode === "explorer" || plannedRoute.length > 0)

  return (
    <ProtectedLayout>
      <div className="min-h-screen flex flex-col bg-background">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 flex-1 flex flex-col pb-8">
          {/* Modern Header */}
          <PageHeader 
            className="px-0"
            title="World Map"
            subtitle="Territory and Route Exploration"
          />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="train" className="flex items-center gap-2">
            <Play className="h-4 w-4" /> Train
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" /> History
          </TabsTrigger>
        </TabsList>

        {/* ── TRAIN ─────────────────────────────────────── */}
        <TabsContent value="train" className="space-y-6">

          {/* Mode selector */}
          {!isTracking && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(["explorer", "navigator"] as const).map(mode => (
                <Card
                  key={mode}
                  className={cn(
                    "p-6 cursor-pointer transition-all border-2",
                    selectedMode === mode ? "border-[#8b5cf6] bg-[#8b5cf6]/5" : "border-border hover:border-[#8b5cf6]/50"
                  )}
                  onClick={() => { setSelectedMode(mode); clearRoute() }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-[#8b5cf6]/10 rounded-lg">
                      {mode === "explorer" ? <Activity className="h-5 w-5 text-[#8b5cf6]" /> : <RouteIcon className="h-5 w-5 text-[#8b5cf6]" />}
                    </div>
                    <h3 className="text-lg font-semibold capitalize">{mode} Mode</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {mode === "explorer"
                      ? "Free exploration — run or cycle anywhere and discover new territories"
                      : "Plan your route — click the map to place start & end points, then follow the path"}
                  </p>
                </Card>
              ))}
            </div>
          )}

          {/* Navigator planner */}
          {selectedMode === "navigator" && !isTracking && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Route Planning</h3>
                {isGeneratingRoute && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating routes…
                  </div>
                )}
              </div>

              {/* Instruction */}
              <div className="p-3 bg-muted/30 rounded-lg mb-4">
                {routePoints.length === 0 && (
                  <p className="text-sm text-muted-foreground">🗺️ Click anywhere on the map to set your <strong>Start</strong> point</p>
                )}
                {routePoints.length === 1 && (
                  <p className="text-sm text-[#8b5cf6] font-medium">🗺️ Now click the map to set your <strong>End</strong> point</p>
                )}
                {routePoints.length >= 2 && !isGeneratingRoute && (
                  <p className="text-sm text-emerald-600 font-medium">✓ Route points set! Click map again to move the End point</p>
                )}
              </div>

              {/* Reassign buttons */}
              {routePoints.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <p className="text-sm font-medium w-full mb-1">Reassign a point:</p>
                  <Button
                    size="sm"
                    variant={overrideMode === "start" ? "default" : "outline"}
                    onClick={() => setOverrideMode(prev => prev === "start" ? null : "start")}
                    className={cn(
                      "flex items-center gap-2",
                      overrideMode === "start" && "bg-green-600 hover:bg-green-700 text-white"
                    )}
                    disabled={isGeneratingRoute}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    {routePoints.find(p => p.name === "Start") ? "✓ Start set" : "Set Start"}
                    {overrideMode === "start" && " (click map)"}
                  </Button>
                  <Button
                    size="sm"
                    variant={overrideMode === "end" ? "default" : "outline"}
                    onClick={() => setOverrideMode(prev => prev === "end" ? null : "end")}
                    className={cn(
                      "flex items-center gap-2",
                      overrideMode === "end" && "bg-red-600 hover:bg-red-700 text-white"
                    )}
                    disabled={isGeneratingRoute}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    {routePoints.find(p => p.name === "End") ? "✓ End set" : "Set End"}
                    {overrideMode === "end" && " (click map)"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearRoute} disabled={isGeneratingRoute}>
                    Clear All
                  </Button>
                </div>
              )}

              {/* Selected points */}
              {routePoints.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-sm font-medium">Selected Points:</p>
                  {routePoints.map((pt, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", pt.name === "Start" ? "bg-green-500" : "bg-red-500")} />
                        <span className="font-medium">{pt.name}:</span>
                        <span className="text-muted-foreground">{pt.lat.toFixed(4)}, {pt.lng.toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Route options */}
              {routeOptions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Choose Your Route:</h4>
                  <div className="grid gap-2">
                    {routeOptions.map(route => (
                      <div
                        key={route.id}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all",
                          selectedRouteId === route.id ? "border-[#8b5cf6] bg-[#8b5cf6]/5" : "border-border hover:border-[#8b5cf6]/50"
                        )}
                        onClick={() => selectRoute(route.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{route.name}</p>
                            <p className="text-xs text-muted-foreground">{route.summary}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{(route.distance / 1000).toFixed(1)} km</p>
                            <p className="text-xs text-muted-foreground">{Math.round(route.duration / 60)} min</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Start / Stop */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => startTracking("run")}
              disabled={!canStart}
              className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3"
            >
              <Activity className="h-4 w-4 mr-2" /> Start Run
            </Button>
            <Button
              onClick={() => startTracking("cycle")}
              disabled={!canStart}
              className="bg-[#8b5cf6] hover:bg-[#7c3aed] px-6 py-3"
            >
              <Zap className="h-4 w-4 mr-2" /> Start Cycle
            </Button>
            {isTracking && (
              <Button onClick={stopTracking} variant="destructive" className="px-6 py-3">
                <Square className="h-4 w-4 mr-2" /> Stop Activity
              </Button>
            )}
          </div>

          {/* Map + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-20rem)]">
            <div className="lg:col-span-3 relative h-full rounded-2xl overflow-hidden border border-border" style={{ minHeight: 360 }}>
              <MapLibreMap
                userCoordinates={liveCoords}
                capturedAreas={capturedAreas}
                plannedRoute={plannedRoute}
                routeOptions={routeOptions}
                selectedRouteId={selectedRouteId}
                routePoints={routePoints}
                initialCenter={userLocation}
                onMapClick={handleMapClick}
                onRouteClick={selectRoute}
              />
              {isTracking && currentSession && <LiveStatsBanner session={currentSession} />}
            </div>

            {/* Territory sidebar */}
            <div className="lg:col-span-1 h-full">
              <Card className="h-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-5 h-5 text-[#8b5cf6]" />
                  <h3 className="text-lg font-bold">Territory Stats</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">{capturedAreas.features.length}</div>
                    <div className="text-xs text-muted-foreground">Areas Captured</div>
                  </div>
                  {currentSession && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Current Session</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Distance</span>
                          <span className="font-medium">{(currentSession.distance * 1000).toFixed(0)} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Speed</span>
                          <span className="font-medium">{currentSession.averageSpeed.toFixed(1)} km/h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Path Points</span>
                          <span className="font-medium">{currentSession.path.length}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── HISTORY ───────────────────────────────────── */}
        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Activity History</h3>
            <Button variant="outline" size="sm" onClick={loadUserData} disabled={sessionsLoading} className="flex items-center gap-2">
              <RefreshCw className={cn("h-4 w-4", sessionsLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {sessionsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
            </div>
          ) : sessions.filter(s => !s.isActive).length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No activities yet</p>
                <p className="text-sm">Start your first run or cycle to see your history here!</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions
                .filter(s => !s.isActive)
                .map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onClick={() => setSelectedSession(session)}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedSession && (
        <SessionMapModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
        </div>
      </div>
    </ProtectedLayout>
  )
}