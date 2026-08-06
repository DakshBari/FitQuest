"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import type { RouteOption } from "@/services/routingService"

import "leaflet/dist/leaflet.css"

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
  selectedRouteId = "",
  routePoints = [],
  initialCenter,
  onMapClick,
  onRouteClick,
}: MapLibreMapProps) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const mapRef         = useRef<any>(null)
  const LRef           = useRef<any>(null)

  // ── Always-fresh callback refs (no stale closures) ──────
  const onMapClickRef  = useRef(onMapClick)
  const onRouteClickRef = useRef(onRouteClick)
  useEffect(() => { onMapClickRef.current  = onMapClick  }, [onMapClick])
  useEffect(() => { onRouteClickRef.current = onRouteClick }, [onRouteClick])

  // Layer refs
  const userPolyRef  = useRef<any>(null)
  const userDotRef   = useRef<any>(null)
  const capturedRef  = useRef<any>(null)
  const plannedRef   = useRef<any>(null)
  const routeOptRefs = useRef<any[]>([])
  const routeMarkers = useRef<any[]>([])
  const routeLabels  = useRef<any[]>([])

  // ── Init map (once, client-side only) ───────────────────
  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current || !containerRef.current) return

    import("leaflet").then((mod) => {
      const L = mod.default ?? mod
      LRef.current = L
      if (!containerRef.current || mapRef.current) return

      // Fix broken default icons in bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const center: [number, number] = initialCenter
        ? [initialCenter[1], initialCenter[0]]
        : [40.7128, -74.006]

      const map = L.map(containerRef.current, {
        center, zoom: 13,
        zoomControl: true,
        attributionControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
      }).addTo(map)

      mapRef.current = map

      // Click handler reads from ref → always gets the latest prop value
      map.on("click", (e: any) => {
        if (onMapClickRef.current) {
          onMapClickRef.current(e.latlng.lat, e.latlng.lng)
        }
      })

      renderLayers(L, map)
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-center when location changes ─────────────────────
  useEffect(() => {
    if (!mapRef.current || !initialCenter || !LRef.current) return
    mapRef.current.setView([initialCenter[1], initialCenter[0]], 13)
  }, [initialCenter])

  // ── Re-render layers on prop change ─────────────────────
  useEffect(() => {
    if (!mapRef.current || !LRef.current) return
    renderLayers(LRef.current, mapRef.current)
  }, [userCoordinates, capturedAreas, plannedRoute, routeOptions, selectedRouteId, routePoints])

  function renderLayers(L: any, map: any) {
    // ── User route ────────────────────────────────────────
    if (userPolyRef.current) { map.removeLayer(userPolyRef.current); userPolyRef.current = null }
    if (userCoordinates.length > 1) {
      const latlngs = userCoordinates.map(c => [c[1], c[0]])
      userPolyRef.current = L.polyline(latlngs, { color: "#8b5cf6", weight: 4, opacity: 0.85 }).addTo(map)
    }

    // ── User dot ─────────────────────────────────────────
    if (userDotRef.current) { map.removeLayer(userDotRef.current); userDotRef.current = null }
    const last = userCoordinates.length > 0 ? userCoordinates[userCoordinates.length - 1] : null
    if (last) {
      userDotRef.current = L.circleMarker([last[1], last[0]], {
        radius: 8, fillColor: "#ffffff", color: "#8b5cf6", weight: 3, fillOpacity: 1,
      }).addTo(map)
      map.panTo([last[1], last[0]])
    }

    // ── Captured territories ──────────────────────────────
    if (capturedRef.current) { map.removeLayer(capturedRef.current); capturedRef.current = null }
    if (capturedAreas.features.length > 0) {
      capturedRef.current = L.geoJSON(capturedAreas, {
        style: () => ({ fillColor: "#10b981", fillOpacity: 0.28, color: "#34d399", weight: 1.5 }),
      }).addTo(map)
    }

    // ── Route options ─────────────────────────────────────
    routeOptRefs.current.forEach(p => map.removeLayer(p))
    routeOptRefs.current = []
    routeOptions.forEach(route => {
      const isSelected = route.id === selectedRouteId
      const coords = (route.geometry.coordinates as number[][]).map(c => [c[1], c[0]])
      const poly = L.polyline(coords, {
        color:     isSelected ? "#8b5cf6" : "#94a3b8",
        weight:    isSelected ? 4 : 2,
        opacity:   isSelected ? 0.9 : 0.55,
        dashArray: isSelected ? undefined : "6 6",
      }).addTo(map)

      poly.on("click", (e: any) => {
        e.originalEvent.stopPropagation()
        if (onRouteClickRef.current) onRouteClickRef.current(route.id)
      })
      poly.on("mouseover", () => { map.getContainer().style.cursor = "pointer" })
      poly.on("mouseout",  () => { map.getContainer().style.cursor = "" })
      routeOptRefs.current.push(poly)
    })

    // ── Planned route ─────────────────────────────────────
    if (plannedRef.current) { map.removeLayer(plannedRef.current); plannedRef.current = null }
    if (plannedRoute.length > 1) {
      const latlngs = plannedRoute.map(c => [c[1], c[0]])
      plannedRef.current = L.polyline(latlngs, { color: "#8b5cf6", weight: 4, opacity: 0.85 }).addTo(map)
    }

    // ── Route point markers + labels ──────────────────────
    routeMarkers.current.forEach(m => map.removeLayer(m))
    routeLabels.current.forEach(m => map.removeLayer(m))
    routeMarkers.current = []
    routeLabels.current = []

    routePoints.forEach((pt, i) => {
      const color = pt.name === "Start" ? "#10b981" : pt.name === "End" ? "#ef4444" : "#8b5cf6"
      const dot = L.circleMarker([pt.lat, pt.lng], {
        radius: 10, fillColor: color, color: "#ffffff", weight: 3, fillOpacity: 0.9,
      }).addTo(map)
      routeMarkers.current.push(dot)

      const label = L.marker([pt.lat, pt.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="
            position:relative;background:${color};color:#fff;
            font-size:10px;font-weight:700;padding:2px 7px;
            border-radius:5px;white-space:nowrap;
            transform:translate(-50%,-220%);
            box-shadow:0 2px 8px rgba(0,0,0,0.4);
            pointer-events:none;
          ">${pt.name ?? `Point ${i + 1}`}</div>`,
          iconSize: [0, 0], iconAnchor: [0, 0],
        }),
        interactive: false, zIndexOffset: 1000,
      }).addTo(map)
      routeLabels.current.push(label)
    })
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 w-full h-full rounded-xl overflow-hidden bg-muted/20",
        onMapClick && "cursor-crosshair"
      )}
    />
  )
}