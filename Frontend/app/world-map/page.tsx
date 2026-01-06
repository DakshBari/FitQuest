"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Map, Activity, Target, Zap, History, Play, MapPin, Route } from "lucide-react"
import { MapLibreMap } from "@/components/world-map/MapLibreMap"
import { LiveStats } from "@/components/world-map/LiveStats"
import { PageHeader } from "@/components/page-header"
import { getThemeClasses } from "@/lib/pageThemes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { worldMapService } from "@/services/worldMapService"
import { routingService, type RouteOption } from "@/services/routingService"
import * as turf from "@turf/turf"

interface RunSession {
  id: string
  type: 'run' | 'cycle'
  mode: 'explorer' | 'navigator'
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

interface RoutePoint {
  lat: number
  lng: number
  name?: string
}

export default function WorldMapPage() {
  const pathname = usePathname()
  const themeClasses = getThemeClasses(pathname)
  
  // --- State ---
  const [activeTab, setActiveTab] = useState<'train' | 'history'>('train')
  const [isTracking, setIsTracking] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [currentSession, setCurrentSession] = useState<RunSession | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [sessions, setSessions] = useState<RunSession[]>([])
  const [capturedAreas, setCapturedAreas] = useState<GeoJSON.FeatureCollection>({ type: "FeatureCollection", features: [] })
  
  // Route planning state
  const [selectedMode, setSelectedMode] = useState<'explorer' | 'navigator'>('explorer')
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([])
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState<string>('')
  const [plannedRoute, setPlannedRoute] = useState<number[][]>([])
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false)
  const [pointSelectionMode, setPointSelectionMode] = useState<'start' | 'end' | null>(null)

  // --- Get User Location on Load ---
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      console.warn("Geolocation is not supported by your browser")
      setUserLocation([-74.006, 40.7128])
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation([longitude, latitude])
      },
      (error) => {
        console.error("Error getting location:", error)
        setUserLocation([-74.006, 40.7128])
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  // Load user's captured areas and session history
  useEffect(() => {
    loadUserData()
  }, [])

  // Refresh history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history') {
      loadUserData()
    }
  }, [activeTab])

  const loadUserData = async () => {
    console.log('Loading user data from database...')
    try {
      // Load captured areas
      const areas = await worldMapService.getCapturedAreas()
      console.log('Loaded captured areas:', areas)
      setCapturedAreas(areas)

      // Load session history
      const sessionsData = await worldMapService.getSessionHistory()
      console.log('Loaded sessions from database:', sessionsData)
      console.log('Number of sessions loaded:', sessionsData.length)
      setSessions(sessionsData)
    } catch (error) {
      console.error('Error loading user data:', error)
      // Continue with empty data - app will work in offline mode
    }
  }

  const startTracking = async (type: 'run' | 'cycle') => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser")
      return
    }

    if (!userLocation) {
      alert("Unable to get your location. Please enable location services.")
      return
    }

    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newSession: RunSession = {
      id: sessionId,
      type,
      mode: selectedMode,
      startTime: new Date(),
      path: [userLocation],
      distance: 0,
      duration: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      capturedAreas: { type: "FeatureCollection", features: [] },
      isActive: true
    }

    setCurrentSession(newSession)
    setIsTracking(true)

    // Immediately add to local sessions list so it appears in history
    setSessions(prev => [newSession, ...prev])

    // Save session start to backend
    try {
      console.log('Creating new session in database:', newSession)
      const result = await worldMapService.startSession({
        sessionId,
        type,
        mode: selectedMode,
        startLocation: userLocation,
        plannedRoute: selectedMode === 'navigator' ? plannedRoute : undefined
      })
      console.log('Session created in database:', result)
    } catch (error) {
      console.error('Error starting session:', error)
      // Session is still in local state, so it will appear in history
    }

    // Start location tracking
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed } = pos.coords
        const newCoord = [longitude, latitude]
        
        const speedKmh = (speed || 0) * 3.6
        const MAX_SPEED = type === 'run' ? 45 : 60
        
        if (speedKmh > MAX_SPEED) return

        setCurrentSession(prev => {
          if (!prev) return null
          
          const newPath = [...prev.path, newCoord]
          const line = turf.lineString(newPath)
          const distanceKm = turf.length(line, { units: 'kilometers' })
          const duration = (Date.now() - prev.startTime.getTime()) / 1000
          const averageSpeed = duration > 0 ? (distanceKm / (duration / 3600)) : 0

          const updatedSession = {
            ...prev,
            path: newPath,
            distance: distanceKm,
            duration,
            averageSpeed,
            maxSpeed: Math.max(prev.maxSpeed, speedKmh)
          }

          // Update the session in the sessions list as well
          setSessions(prevSessions => prevSessions.map(session => 
            session.id === prev.id ? updatedSession : session
          ))

          // Check for loop closure (area capture)
          if (newPath.length > 10) {
            const startPoint = turf.point(newPath[0])
            const currentPoint = turf.point(newCoord)
            const distToStart = turf.distance(startPoint, currentPoint, { units: 'meters' })

            if (distToStart < 50) {
              const closedPath = [...newPath, newPath[0]]
              const polygon = turf.polygon([closedPath])
              const area = turf.area(polygon)

              if (area > 100) { // Minimum area threshold
                const newArea = {
                  type: "Feature" as const,
                  geometry: polygon.geometry,
                  properties: {
                    capturedAt: new Date().toISOString(),
                    area: area,
                    sessionId: prev.id
                  }
                }

                setCapturedAreas(prevAreas => ({
                  type: "FeatureCollection",
                  features: [...prevAreas.features, newArea]
                }))

                updatedSession.capturedAreas = {
                  type: "FeatureCollection",
                  features: [...prev.capturedAreas.features, newArea]
                }

                // Save captured area to backend
                worldMapService.saveCapturedArea(newArea).catch(console.error)
              }
            }
          }

          // Periodically save session progress (every 10 GPS points)
          if (newPath.length % 10 === 0) {
            worldMapService.updateSession(prev.id, updatedSession).catch(error => {
              console.error('Error saving session progress:', error)
            })
          }

          return updatedSession
        })
      },
      (err) => console.error("Geo Error:", err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    )
    
    setWatchId(id)
  }

  const stopTracking = async () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    
    if (currentSession) {
      const endedSession = {
        ...currentSession,
        endTime: new Date(),
        isActive: false
      }

      console.log('Stopping session. Current session:', currentSession)
      console.log('Ended session data:', endedSession)

      // Update the session in local state immediately
      setSessions(prev => prev.map(session => 
        session.id === currentSession.id ? endedSession : session
      ))

      // Save completed session to backend
      try {
        console.log('Updating session in database:', endedSession)
        const saveResult = await worldMapService.updateSession(currentSession.id, endedSession)
        console.log('Session update result:', saveResult)
      } catch (error) {
        console.error('Error saving session to database:', error)
        // Session is already updated in local state, so it will still appear in history
      }

      setCurrentSession(null)
    }
    
    setIsTracking(false)
  }

  const handleMapClick = async (lat: number, lng: number) => {
    if (selectedMode === 'navigator' && !isTracking && pointSelectionMode) {
      const newPoint = { lat, lng, name: pointSelectionMode === 'start' ? 'Start' : 'End' }
      
      // Remove existing point of the same type if it exists
      const filteredPoints = routePoints.filter(p => p.name !== newPoint.name)
      const newPoints = [...filteredPoints, newPoint]
      
      setRoutePoints(newPoints)
      
      // Clear selection mode after placing point
      setPointSelectionMode(null)
      
      // Auto-generate routes when we have both start and end points
      if (newPoints.length === 2) {
        await generateRoutes(newPoints)
      } else {
        // Clear routes if we don't have both points
        setRouteOptions([])
        setSelectedRouteId('')
        setPlannedRoute([])
      }
    }
  }

  const clearRoute = () => {
    setRoutePoints([])
    setRouteOptions([])
    setSelectedRouteId('')
    setPlannedRoute([])
    setPointSelectionMode(null)
  }

  const generateRoutes = async (points: RoutePoint[]) => {
    if (points.length !== 2) return
    
    setIsGeneratingRoute(true)
    try {
      const start: [number, number] = [points[0].lng, points[0].lat]
      const end: [number, number] = [points[1].lng, points[1].lat]
      
      // Determine profile based on activity type (default to walking)
      const profile = 'foot-walking' // Could be 'cycling-regular' for cycling
      
      const routingResponse = await routingService.getRoutes(start, end, profile)
      
      setRouteOptions(routingResponse.routes)
      setSelectedRouteId(routingResponse.selectedRouteId)
      
      // Set the default selected route
      const selectedRoute = routingResponse.routes.find(r => r.id === routingResponse.selectedRouteId)
      if (selectedRoute) {
        setPlannedRoute(selectedRoute.coordinates)
      }
    } catch (error) {
      console.error('Error generating routes:', error)
      // Fallback to straight line
      const route = [
        [points[0].lng, points[0].lat],
        [points[1].lng, points[1].lat]
      ]
      setPlannedRoute(route)
    } finally {
      setIsGeneratingRoute(false)
    }
  }

  const selectRoute = (routeId: string) => {
    const route = routeOptions.find(r => r.id === routeId)
    if (route) {
      setSelectedRouteId(routeId)
      setPlannedRoute(route.coordinates)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageHeader 
        icon={Map}
        title="World Map"
        subtitle="Explore and conquer territories"
      />

      <div className="flex-1 px-6 pb-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'train' | 'history')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="train" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Train
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="train" className="space-y-6">
            {/* Mode Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={cn(
                  "p-6 cursor-pointer transition-all border-2",
                  selectedMode === 'explorer' 
                    ? "border-[#2C80FF] bg-[#2C80FF]/5" 
                    : "border-border hover:border-[#2C80FF]/50"
                )}
                onClick={() => setSelectedMode('explorer')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-[#2C80FF]/10 rounded-lg">
                    <Activity className="h-5 w-5 text-[#2C80FF]" />
                  </div>
                  <h3 className="text-lg font-semibold">Explorer Mode</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Free exploration - run or cycle anywhere and discover new territories
                </p>
              </Card>

              <Card 
                className={cn(
                  "p-6 cursor-pointer transition-all border-2",
                  selectedMode === 'navigator' 
                    ? "border-[#2C80FF] bg-[#2C80FF]/5" 
                    : "border-border hover:border-[#2C80FF]/50"
                )}
                onClick={() => setSelectedMode('navigator')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-[#2C80FF]/10 rounded-lg">
                    <Route className="h-5 w-5 text-[#2C80FF]" />
                  </div>
                  <h3 className="text-lg font-semibold">Navigator Mode</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Plan your route - set start and end points for guided navigation
                </p>
              </Card>
            </div>

            {/* Route Planning for Navigator Mode */}
            {selectedMode === 'navigator' && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Route Planning</h3>
                
                {/* Point Selection Buttons */}
                <div className="mb-4">
                  <p className="text-sm font-medium mb-3">Step 1: Select which point to place</p>
                  <div className="flex gap-3 mb-4">
                    <Button 
                      onClick={() => setPointSelectionMode('start')}
                      className={cn(
                        "flex items-center gap-2",
                        pointSelectionMode === 'start' 
                          ? "bg-green-600 hover:bg-green-700 text-white" 
                          : "bg-green-100 hover:bg-green-200 text-green-700 border-green-300"
                      )}
                      disabled={isGeneratingRoute}
                    >
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      Set Start Point
                      {routePoints.find(p => p.name === 'Start') && <span className="text-xs">✓</span>}
                    </Button>
                    
                    <Button 
                      onClick={() => setPointSelectionMode('end')}
                      className={cn(
                        "flex items-center gap-2",
                        pointSelectionMode === 'end' 
                          ? "bg-red-600 hover:bg-red-700 text-white" 
                          : "bg-red-100 hover:bg-red-200 text-red-700 border-red-300"
                      )}
                      disabled={isGeneratingRoute}
                    >
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      Set End Point
                      {routePoints.find(p => p.name === 'End') && <span className="text-xs">✓</span>}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={clearRoute}
                      disabled={routePoints.length === 0 || isGeneratingRoute}
                    >
                      Clear All
                    </Button>
                  </div>
                  
                  {/* Instructions */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    {!pointSelectionMode && (
                      <p className="text-sm text-muted-foreground">
                        👆 Click a button above to select which point you want to place
                      </p>
                    )}
                    {pointSelectionMode && (
                      <p className="text-sm text-[#2C80FF] font-medium">
                        🗺️ Now click anywhere on the map to place your {pointSelectionMode.toUpperCase()} point
                      </p>
                    )}
                    {isGeneratingRoute && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-[#2C80FF] border-t-transparent rounded-full animate-spin" />
                        Generating routes...
                      </div>
                    )}
                  </div>
                </div>

                {/* Show selected points */}
                {routePoints.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Selected Points:</p>
                    <div className="space-y-2">
                      {routePoints.map((point, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <div className="flex items-center gap-2 text-xs">
                            <div className={cn(
                              "w-3 h-3 rounded-full",
                              point.name === 'Start' ? "bg-green-500" : "bg-red-500"
                            )} />
                            <span className="font-medium">{point.name}:</span>
                            <span className="text-muted-foreground">
                              {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              const newPoints = routePoints.filter((_, i) => i !== index)
                              setRoutePoints(newPoints)
                              setRouteOptions([])
                              setSelectedRouteId('')
                              setPlannedRoute([])
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Route Options */}
                {routeOptions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Step 2: Choose Your Route</h4>
                    <div className="grid gap-2">
                      {routeOptions.map((route) => (
                        <div
                          key={route.id}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-all",
                            selectedRouteId === route.id
                              ? "border-[#2C80FF] bg-[#2C80FF]/5"
                              : "border-border hover:border-[#2C80FF]/50"
                          )}
                          onClick={() => selectRoute(route.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{route.name}</p>
                              <p className="text-xs text-muted-foreground">{route.summary}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {(route.distance / 1000).toFixed(1)} km
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {Math.round(route.duration / 60)} min
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Activity Controls */}
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => startTracking('run')}
                disabled={isTracking || (selectedMode === 'navigator' && plannedRoute.length === 0)}
                className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3"
              >
                <Activity className="h-4 w-4 mr-2" />
                Start Run
              </Button>
              <Button 
                onClick={() => startTracking('cycle')}
                disabled={isTracking || (selectedMode === 'navigator' && plannedRoute.length === 0)}
                className="bg-purple-500 hover:bg-purple-600 px-6 py-3"
              >
                <Zap className="h-4 w-4 mr-2" />
                Start Cycle
              </Button>
              {isTracking && (
                <Button 
                  onClick={stopTracking}
                  variant="destructive"
                  className="px-6 py-3"
                >
                  Stop Activity
                </Button>
              )}
            </div>

            {/* Map and Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-20rem)]">
              <div className="lg:col-span-3 relative h-full rounded-2xl overflow-hidden border border-border">
                <MapLibreMap 
                  userCoordinates={currentSession?.path || (userLocation ? [userLocation] : [])}
                  capturedAreas={capturedAreas}
                  plannedRoute={plannedRoute}
                  routeOptions={routeOptions}
                  selectedRouteId={selectedRouteId}
                  routePoints={routePoints}
                  initialCenter={userLocation}
                  onMapClick={handleMapClick}
                  onRouteClick={selectRoute}
                />

                {isTracking && currentSession && (
                  <LiveStats 
                    distance={currentSession.distance * 1000}
                    speed={currentSession.averageSpeed}
                    duration={currentSession.duration}
                    area={0}
                  />
                )}
              </div>

              <div className="lg:col-span-1 h-full">
                <Card className="h-full p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-5 h-5 text-[#2C80FF]" />
                    <h3 className="text-lg font-bold">Territory Stats</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {capturedAreas.features.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Areas Captured</div>
                    </div>
                    {currentSession && (
                      <div className="space-y-2">
                        <h4 className="font-semibold">Current Session</h4>
                        <div className="text-sm space-y-1">
                          <p>Distance: {(currentSession.distance * 1000).toFixed(0)}m</p>
                          <p>Duration: {Math.floor(currentSession.duration / 60)}:{(currentSession.duration % 60).toFixed(0).padStart(2, '0')}</p>
                          <p>Avg Speed: {currentSession.averageSpeed.toFixed(1)} km/h</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Activity History</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadUserData}
                className="flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                Refresh
              </Button>
            </div>
            
            {sessions.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No activities yet</p>
                  <p className="text-sm">Start your first run or cycle to see your history here!</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session) => (
                  <Card key={session.id} className={cn(
                    "p-6 hover:shadow-lg transition-shadow cursor-pointer",
                    session.isActive && "ring-2 ring-blue-500 bg-blue-50/50"
                  )}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        session.type === 'run' ? "bg-emerald-500/10" : "bg-purple-500/10"
                      )}>
                        {session.type === 'run' ? 
                          <Activity className="h-4 w-4 text-emerald-500" /> :
                          <Zap className="h-4 w-4 text-purple-500" />
                        }
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold capitalize text-lg">
                            {session.type} - {session.mode}
                          </h3>
                          {session.isActive && (
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full animate-pulse">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p className="font-medium">
                            📅 {new Date(session.startTime).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p>
                            🕐 {new Date(session.startTime).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                            {session.endTime && ` - ${new Date(session.endTime).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}`}
                            {session.isActive && (
                              <span className="text-blue-600 font-medium"> (In Progress)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Distance:</span>
                          <span className="font-medium">{(session.distance * 1000).toFixed(0)}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium">
                            {Math.floor(session.duration / 60)}:{(session.duration % 60).toFixed(0).padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Speed:</span>
                          <span className="font-medium">{session.averageSpeed.toFixed(1)} km/h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Max Speed:</span>
                          <span className="font-medium">{session.maxSpeed.toFixed(1)} km/h</span>
                        </div>
                      </div>
                    </div>
                    
                    {session.capturedAreas.features.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-muted-foreground">Areas Captured:</span>
                          <span className="font-medium text-green-600">
                            {session.capturedAreas.features.length}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground text-center">
                        Click to view detailed route map
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}