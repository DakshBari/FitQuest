// Using OpenRouteService for free routing - you can also use Mapbox, Google, or other services
const ORS_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY || 'your-ors-api-key'
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2'

export interface RouteOption {
  id: string
  name: string
  coordinates: number[][]
  distance: number // in meters
  duration: number // in seconds
  summary: string
  geometry: GeoJSON.LineString
}

export interface RoutingResponse {
  routes: RouteOption[]
  selectedRouteId: string
}

class RoutingService {
  async getRoutes(
    start: [number, number], // [lng, lat]
    end: [number, number],   // [lng, lat]
    profile: 'foot-walking' | 'cycling-regular' = 'foot-walking'
  ): Promise<RoutingResponse> {
    try {
      // For demo purposes, I'll create a fallback that generates multiple route options
      // In production, you'd use a real routing service
      
      if (ORS_API_KEY === 'your-ors-api-key') {
        // Fallback: Generate multiple route variations
        return this.generateFallbackRoutes(start, end, profile)
      }

      const response = await fetch(`${ORS_BASE_URL}/directions/${profile}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ORS_API_KEY
        },
        body: JSON.stringify({
          coordinates: [start, end],
          alternative_routes: {
            target_count: 3,
            weight_factor: 1.4
          },
          format: 'geojson',
          instructions: false
        })
      })

      if (!response.ok) {
        throw new Error('Routing service error')
      }

      const data = await response.json()
      return this.parseORSResponse(data)
    } catch (error) {
      console.error('Routing error:', error)
      return this.generateFallbackRoutes(start, end, profile)
    }
  }

  private parseORSResponse(data: any): RoutingResponse {
    const routes: RouteOption[] = data.features.map((feature: any, index: number) => {
      const props = feature.properties
      return {
        id: `route-${index}`,
        name: index === 0 ? 'Fastest Route' : `Alternative ${index}`,
        coordinates: feature.geometry.coordinates,
        distance: props.segments?.[0]?.distance || 0,
        duration: props.segments?.[0]?.duration || 0,
        summary: this.generateRouteSummary(props.segments?.[0]?.distance || 0, props.segments?.[0]?.duration || 0),
        geometry: feature.geometry
      }
    })

    return {
      routes,
      selectedRouteId: routes[0]?.id || ''
    }
  }

  private generateFallbackRoutes(
    start: [number, number],
    end: [number, number],
    profile: string
  ): RoutingResponse {
    // Generate 3 different route variations for demo
    const baseRoute = this.createDirectRoute(start, end)
    const routes: RouteOption[] = []

    // Route 1: Direct route (shortest)
    routes.push({
      id: 'route-0',
      name: 'Direct Route',
      coordinates: baseRoute,
      distance: this.calculateDistance(baseRoute),
      duration: this.estimateDuration(baseRoute, profile),
      summary: 'Shortest distance',
      geometry: {
        type: 'LineString',
        coordinates: baseRoute
      }
    })

    // Route 2: Slightly curved route (scenic)
    const scenicRoute = this.createSceniceRoute(start, end)
    routes.push({
      id: 'route-1',
      name: 'Scenic Route',
      coordinates: scenicRoute,
      distance: this.calculateDistance(scenicRoute),
      duration: this.estimateDuration(scenicRoute, profile),
      summary: 'More scenic path',
      geometry: {
        type: 'LineString',
        coordinates: scenicRoute
      }
    })

    // Route 3: Alternative route (avoiding main roads)
    const alternativeRoute = this.createAlternativeRoute(start, end)
    routes.push({
      id: 'route-2',
      name: 'Alternative Route',
      coordinates: alternativeRoute,
      distance: this.calculateDistance(alternativeRoute),
      duration: this.estimateDuration(alternativeRoute, profile),
      summary: 'Quieter streets',
      geometry: {
        type: 'LineString',
        coordinates: alternativeRoute
      }
    })

    return {
      routes,
      selectedRouteId: 'route-0'
    }
  }

  private createDirectRoute(start: [number, number], end: [number, number]): number[][] {
    // Create a route with some intermediate points to simulate road following
    const points = []
    const steps = 5
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps
      const lng = start[0] + (end[0] - start[0]) * ratio
      const lat = start[1] + (end[1] - start[1]) * ratio
      
      // Add small random offset to simulate road following
      const offset = 0.0005
      const offsetLng = lng + (Math.random() - 0.5) * offset
      const offsetLat = lat + (Math.random() - 0.5) * offset
      
      points.push([offsetLng, offsetLat])
    }
    
    return points
  }

  private createSceniceRoute(start: [number, number], end: [number, number]): number[][] {
    const points = []
    const steps = 8
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps
      let lng = start[0] + (end[0] - start[0]) * ratio
      let lat = start[1] + (end[1] - start[1]) * ratio
      
      // Add curve to make it scenic
      const curve = Math.sin(ratio * Math.PI) * 0.002
      lng += curve
      lat += curve * 0.5
      
      points.push([lng, lat])
    }
    
    return points
  }

  private createAlternativeRoute(start: [number, number], end: [number, number]): number[][] {
    const points = []
    const steps = 6
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps
      let lng = start[0] + (end[0] - start[0]) * ratio
      let lat = start[1] + (end[1] - start[1]) * ratio
      
      // Add different curve pattern
      const curve = Math.cos(ratio * Math.PI * 2) * 0.001
      lng += curve
      lat -= curve * 0.3
      
      points.push([lng, lat])
    }
    
    return points
  }

  private calculateDistance(coordinates: number[][]): number {
    let distance = 0
    for (let i = 1; i < coordinates.length; i++) {
      const [lng1, lat1] = coordinates[i - 1]
      const [lng2, lat2] = coordinates[i]
      
      // Haversine formula for distance calculation
      const R = 6371000 // Earth's radius in meters
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLng = (lng2 - lng1) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      distance += R * c
    }
    return distance
  }

  private estimateDuration(coordinates: number[][], profile: string): number {
    const distance = this.calculateDistance(coordinates)
    const speed = profile === 'cycling-regular' ? 15 : 5 // km/h
    return (distance / 1000) / speed * 3600 // seconds
  }

  private generateRouteSummary(distance: number, duration: number): string {
    const km = (distance / 1000).toFixed(1)
    const minutes = Math.round(duration / 60)
    return `${km} km • ${minutes} min`
  }
}

export const routingService = new RoutingService()