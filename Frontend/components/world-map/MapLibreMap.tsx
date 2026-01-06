"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { cn } from "@/lib/utils"

// Types
import type { Map, LngLat, GeoJSONSource } from "maplibre-gl"

import type { RouteOption } from "@/services/routingService"

interface RoutePoint {
  lat: number
  lng: number
  name?: string
}

interface MapLibreMapProps {
  userCoordinates: number[][]
  capturedAreas: GeoJSON.FeatureCollection
  plannedRoute?: number[][]
  routeOptions?: RouteOption[]
  selectedRouteId?: string
  routePoints?: RoutePoint[]
  initialCenter?: [number, number] | null
  onMapClick?: (lat: number, lng: number) => void
  onRouteClick?: (routeId: string) => void
}

export function MapLibreMap({ 
  userCoordinates, 
  capturedAreas, 
  plannedRoute = [], 
  routeOptions = [],
  selectedRouteId = '',
  routePoints = [], 
  initialCenter,
  onMapClick,
  onRouteClick
}: MapLibreMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!mapContainer.current) return

    // Determine initial center - use user location if available, otherwise default
    const center: [number, number] = initialCenter || [-74.006, 40.7128]

    // Initialize MapLibre Map with OpenStreetMap tiles
    const mapStyle: maplibregl.StyleSpecification = {
      version: 8 as const,
      sources: {
        "osm": {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors"
        }
      },
      layers: [
        {
          id: "osm-layer",
          type: "raster",
          source: "osm",
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }

    const initializeMap = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: center,
      zoom: 13,
      pitch: 0
    })

    map.current = initializeMap

    initializeMap.on("load", () => {
        setIsLoaded(true)
        initializeMap.resize()

        // Add Data Sources
        initializeMap.addSource("route", {
            type: "geojson",
            data: {
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: userCoordinates }
            }
        })

        // Route options source (for multiple route alternatives)
        initializeMap.addSource("route-options", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: routeOptions.map(route => ({
                    type: "Feature",
                    geometry: route.geometry,
                    properties: { 
                      routeId: route.id,
                      name: route.name,
                      selected: route.id === selectedRouteId
                    }
                }))
            }
        })

        // Selected route source (highlighted route)
        initializeMap.addSource("selected-route", {
            type: "geojson",
            data: {
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: plannedRoute }
            }
        })

        initializeMap.addSource("route-points", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: routePoints.map((point, index) => ({
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [point.lng, point.lat] },
                    properties: { name: point.name || `Point ${index + 1}`, index }
                }))
            }
        })

        initializeMap.addSource("user-marker", {
            type: "geojson",
            data: {
                type: "Feature",
                properties: {},
                geometry: { type: "Point", coordinates: userCoordinates[userCoordinates.length - 1] || [0, 0] }
            }
        })

        initializeMap.addSource("captured-territory", {
            type: "geojson",
            data: capturedAreas
        })

        // Add Layers
        
        // Territory (Captured Areas)
        initializeMap.addLayer({
            id: "captured-layer",
            type: "fill",
            source: "captured-territory",
            layout: {},
            paint: {
                "fill-color": "#10b981",
                "fill-opacity": 0.3,
                "fill-outline-color": "#34d399"
            }
        })

        // Route options - Semi-transparent lines
        initializeMap.addLayer({
            id: "route-options-layer",
            type: "line",
            source: "route-options",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
                "line-color": "#94a3b8",
                "line-width": 2,
                "line-opacity": 0.6,
                "line-dasharray": [3, 3]
            }
        })

        // Selected route - Highlighted line
        initializeMap.addLayer({
            id: "selected-route-layer",
            type: "line",
            source: "selected-route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
                "line-color": "#8b5cf6",
                "line-width": 4,
                "line-opacity": 0.8
            }
        })

        // Route Points - Different colors for start and end
        initializeMap.addLayer({
            id: "route-points-layer",
            type: "circle",
            source: "route-points",
            paint: {
                "circle-radius": 10,
                "circle-color": [
                    "case",
                    ["==", ["get", "name"], "Start"], "#10b981", // Green for start
                    ["==", ["get", "name"], "End"], "#ef4444",   // Red for end
                    "#8b5cf6" // Default purple
                ],
                "circle-stroke-width": 3,
                "circle-stroke-color": "#ffffff",
                "circle-opacity": 0.9
            }
        })

        // Route Point Labels
        initializeMap.addLayer({
            id: "route-points-labels",
            type: "symbol",
            source: "route-points",
            layout: {
                "text-field": ["get", "name"],
                "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                "text-size": 12,
                "text-offset": [0, -2],
                "text-anchor": "bottom"
            },
            paint: {
                "text-color": "#ffffff",
                "text-halo-color": "#000000",
                "text-halo-width": 1
            }
        })

        // User Route - Solid cyan line
        initializeMap.addLayer({
            id: "route-layer",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
                "line-color": "#06b6d4",
                "line-width": 4,
                "line-opacity": 0.8
            }
        })

        // User Location - Pulsing dot
        initializeMap.addLayer({
            id: "user-marker-layer",
            type: "circle",
            source: "user-marker",
            paint: {
                "circle-radius": 6,
                "circle-color": "#ffffff",
                "circle-stroke-width": 3,
                "circle-stroke-color": "#06b6d4"
            }
        })

        // Add click handlers after layers are created
        if (onMapClick) {
          initializeMap.on('click', (e) => {
            onMapClick(e.lngLat.lat, e.lngLat.lng)
          })
        }

        // Route selection click handler
        if (onRouteClick) {
          initializeMap.on('click', 'route-options-layer', (e) => {
            e.originalEvent.stopPropagation() // Prevent map click
            if (e.features && e.features[0]) {
              const routeId = e.features[0].properties?.routeId
              if (routeId) {
                onRouteClick(routeId)
              }
            }
          })
          
          // Change cursor on hover
          initializeMap.on('mouseenter', 'route-options-layer', () => {
            initializeMap.getCanvas().style.cursor = 'pointer'
          })
          
          initializeMap.on('mouseleave', 'route-options-layer', () => {
            initializeMap.getCanvas().style.cursor = ''
          })
        }
    })

    return () => {
        map.current?.remove()
    }
  }, [initialCenter])

  // Center map on user location when it becomes available
  useEffect(() => {
    if (!map.current || !isLoaded || !initialCenter) return
    
    map.current.easeTo({ 
      center: initialCenter,
      zoom: 13,
      duration: 1000
    })
  }, [initialCenter, isLoaded])

  // Update Route dynamically
  useEffect(() => {
    if (!map.current || !isLoaded) return

    const routeData: GeoJSON.LineString = {
        type: "LineString",
        coordinates: userCoordinates.length > 0 ? userCoordinates : []
    }
    
    const lastCoord = userCoordinates.length > 0 
      ? userCoordinates[userCoordinates.length - 1] 
      : (initialCenter || [0, 0])
    
    const markerData: GeoJSON.Point = {
        type: "Point",
        coordinates: lastCoord
    }

    const routeSource = map.current.getSource("route") as GeoJSONSource
    const markerSource = map.current.getSource("user-marker") as GeoJSONSource
    
    if (routeSource) routeSource.setData(routeData)
    if (markerSource) markerSource.setData(markerData)

    // Auto pan to user if tracking
    if (userCoordinates.length > 0) {
        const coord = userCoordinates[userCoordinates.length - 1]
        if (coord && coord.length === 2) {
            map.current.easeTo({ center: coord as [number, number] })
        }
    }
  }, [userCoordinates, isLoaded, initialCenter])

  // Update route options
  useEffect(() => {
    if (!map.current || !isLoaded) return

    const routeOptionsData: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: routeOptions.map(route => ({
            type: "Feature",
            geometry: route.geometry,
            properties: { 
              routeId: route.id,
              name: route.name,
              selected: route.id === selectedRouteId
            }
        }))
    }

    const routeOptionsSource = map.current.getSource("route-options") as GeoJSONSource
    if (routeOptionsSource) routeOptionsSource.setData(routeOptionsData)
  }, [routeOptions, selectedRouteId, isLoaded])

  // Update selected route
  useEffect(() => {
    if (!map.current || !isLoaded) return

    const selectedRouteData: GeoJSON.LineString = {
        type: "LineString",
        coordinates: plannedRoute
    }

    const selectedRouteSource = map.current.getSource("selected-route") as GeoJSONSource
    if (selectedRouteSource) selectedRouteSource.setData(selectedRouteData)
  }, [plannedRoute, isLoaded])

  // Update route points
  useEffect(() => {
    if (!map.current || !isLoaded) return

    const routePointsData: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: routePoints.map((point, index) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [point.lng, point.lat] },
            properties: { name: point.name || `Point ${index + 1}`, index }
        }))
    }

    const routePointsSource = map.current.getSource("route-points") as GeoJSONSource
    if (routePointsSource) routePointsSource.setData(routePointsData)
  }, [routePoints, isLoaded])

  // Update captured areas
  useEffect(() => {
    if (!map.current || !isLoaded) return

    const capturedSource = map.current.getSource("captured-territory") as GeoJSONSource
    if (capturedSource) capturedSource.setData(capturedAreas)
  }, [capturedAreas, isLoaded])

  return (
    <div 
      ref={mapContainer} 
      className={cn(
        "absolute inset-0 w-full h-full rounded-xl overflow-hidden bg-muted/20",
        onMapClick && "cursor-crosshair"
      )}
      style={{
        cursor: onMapClick ? (
          // Show different cursors based on point selection mode
          'crosshair'
        ) : 'default'
      }}
    />
  )
}