"use client"

import { useState, useEffect } from "react"
import { MapLibreMap } from "@/components/world-map/MapLibreMap"
import { ActivityControls } from "@/components/world-map/ActivityControls"
import { LiveStats } from "@/components/world-map/LiveStats"
import { StrongholdSidebar, type Stronghold } from "@/components/world-map/StrongholdSidebar"
import * as turf from "@turf/turf"

export default function WorldMapPage() {
  // --- State ---
  const [isTracking, setIsTracking] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [path, setPath] = useState<number[][]>([])
  const [startTime, setStartTime] = useState<number | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  
  // Metrics
  const [stats, setStats] = useState({ distance: 0, speed: 0, duration: 0, area: 0 })
  
  // Strongholds Data
  const [selectedStronghold, setSelectedStronghold] = useState<number | null>(null)
  const [strongholds, setStrongholds] = useState<Stronghold[]>([
    { id: 1, name: "Central Park Fortress", lat: 40.7829, lng: -73.9654, distance: "0.8 km", challenge: "50 Burpees", reward: 250, captured: false },
    { id: 2, name: "Riverside Arena", lat: 40.7128, lng: -74.0060, distance: "1.2 km", challenge: "5K Run", reward: 500, captured: false },
    { id: 3, name: "Hilltop Citadel", lat: 40.7500, lng: -73.9900, distance: "3.5 km", challenge: "100 Push-ups", reward: 350, captured: false },
  ])

  // Captured Polygons
  const [capturedAreas, setCapturedAreas] = useState<GeoJSON.FeatureCollection>({ type: "FeatureCollection", features: [] })

  // --- Get User Location on Load ---
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      console.warn("Geolocation is not supported by your browser")
      // Default to NYC if geolocation not available
      setUserLocation([-74.006, 40.7128])
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation([longitude, latitude])
        // Initialize path with user location
        setPath([[longitude, latitude]])
      },
      (error) => {
        console.error("Error getting location:", error)
        // Default to NYC on error
        setUserLocation([-74.006, 40.7128])
        setPath([[-74.006, 40.7128]])
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  // --- Core Tracking Logic ---

  const startTracking = (type: 'run' | 'cycle') => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser")
      return
    }

    setPath([])
    setStats({ distance: 0, speed: 0, duration: 0, area: 0 })
    setStartTime(Date.now())
    setIsTracking(true)

    // Anti-Cheat Configs
    const MAX_SPEED = type === 'run' ? 45 : 60
    const MIN_ACCURACY = 20

    // Start Watch
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed } = pos.coords
        const newCoord = [longitude, latitude]
        
        // 1. Anti-Cheat: Speed Check
        const speedKmh = (speed || 0) * 3.6
        if (speedKmh > MAX_SPEED) return

        // 2. Add to Path
        setPath(prev => [...prev, newCoord])

        // 3. Calculate Real-Time Stats
        if (path.length > 1) {
            const line = turf.lineString([...path, newCoord])
            const distanceMeters = turf.length(line, { units: 'kilometers' }) * 1000
            
            setStats(prev => ({
                distance: distanceMeters,
                speed: speedKmh,
                duration: (Date.now() - (startTime || 0)) / 1000,
                area: 0
            }))

            // 4. Check for Loop Closure (Area Capture)
            const lastPoint = path[path.length - 1]
            const startPoint = path[0]
            const startToPoint = turf.point(startPoint)
            const currentToPoint = turf.point(newCoord)
            const distToStart = turf.distance(startToPoint, currentToPoint, { units: 'kilometers' }) * 1000

            if (distToStart < 50 && path.length > 10) {
                 const closedPath = [...path, newCoord, path[0]]
                 const polygon = turf.polygon([closedPath])
                 const areaMeters = turf.area(polygon)
                 
                 const newArea = turf.polygon([closedPath])
                 
                 setCapturedAreas(prev => ({
                     type: "FeatureCollection",
                     features: [...prev.features, newArea]
                 }))

                 setPath([newCoord])
                 
                 alert(`Captured Area! ${(areaMeters).toFixed(0)} m²`)
            }
        }
      },
      (err) => console.error("Geo Error:", err),
      { enableHighAccuracy: true, maximumAge: 10000 }
    )
    
    setWatchId(id)
  }

  const stopTracking = () => {
    if (watchId) navigator.geolocation.clearWatch(watchId)
    setIsTracking(false)
    setWatchId(null)
  }

  return (
    <div className="h-[calc(100vh-80px)] p-4 space-y-4 bg-background">
      {/* Top Bar: Controls */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground font-orbitron tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          TACTICAL MAP
        </h1>
        <ActivityControls 
            isTracking={isTracking} 
            onStart={startTracking} 
            onStop={stopTracking} 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-80px)]">
        
        {/* Map Container (3 cols) */}
        <div className="lg:col-span-3 relative h-full rounded-xl overflow-hidden border border-primary/20 shadow-2xl">
            {/* The MapLibre Map */}
            <MapLibreMap 
                userCoordinates={path.length > 0 ? path : (userLocation ? [userLocation] : [])}
                capturedAreas={capturedAreas}
                strongholds={strongholds}
                initialCenter={userLocation}
            />

            {/* Live Stats Overlay */}
            {isTracking && (
                <LiveStats 
                    distance={stats.distance}
                    speed={stats.speed}
                    duration={stats.duration}
                    area={stats.area}
                />
            )}
        </div>

        {/* Sidebar (1 col) */}
        <div className="lg:col-span-1 h-full">
            <div className="h-full flex flex-col gap-6">
                <div className="bg-card/80 border border-border rounded-xl p-4 shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-2 font-orbitron">Territory Stats</h3>
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-green-500/10 border border-green-500/20 rounded">
                            <span className="text-xs text-muted-foreground block">Captured</span>
                            <span className="text-xl font-bold text-green-400 font-mono">{capturedAreas.features.length}</span>
                        </div>
                        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                            <span className="text-xs text-muted-foreground block">Active</span>
                            <span className="text-xl font-bold text-red-400 font-mono">{15 - capturedAreas.features.length}</span>
                        </div>
                    </div>
                </div>

                <StrongholdSidebar 
                    strongholds={strongholds}
                    selectedId={selectedStronghold}
                    onSelect={setSelectedStronghold}
                />
            </div>
        </div>
      </div>
    </div>
  )
}