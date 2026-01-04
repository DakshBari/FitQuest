"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

// Types
import type { Map, LngLat, GeoJSONSource } from "maplibre-gl"

interface MapLibreMapProps {
  userCoordinates: number[][]
  capturedAreas: GeoJSON.FeatureCollection
  strongholds: any[]
  initialCenter?: [number, number] | null
}

export function MapLibreMap({ userCoordinates, capturedAreas, strongholds, initialCenter }: MapLibreMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!mapContainer.current) return

    // Determine initial center - use user location if available, otherwise default
    const center: [number, number] = initialCenter || [-74.006, 40.7128]

    // Initialize MapLibre Map with OpenStreetMap tiles
    // Using a simple, reliable style that works without API keys
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
        // Ensure map resizes properly
        initializeMap.resize()

        // 1. Add Data Sources
        initializeMap.addSource("route", {
            type: "geojson",
            data: {
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: userCoordinates }
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

        initializeMap.addSource("strongholds", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: strongholds.map(s => ({
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [s.lng || -74.006, s.lat || 40.7128] },
                    properties: { ...s }
                }))
            }
        })

        // 2. Add Layers
        
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

        // Strongholds - Circle markers
        initializeMap.addLayer({
            id: "strongholds-layer",
            type: "circle",
            source: "strongholds",
            paint: {
                "circle-radius": 8,
                "circle-color": "#ef4444",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff"
            }
        })

        // User Route - Glowing Cyan Line
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

        // User Location - Pulsing Dot
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
    })

    // Clean up on unmount
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

  return (
    <div 
      ref={mapContainer} 
      className="absolute inset-0 w-full h-full rounded-xl overflow-hidden bg-muted/20"
    />
  )
}