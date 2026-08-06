// OSRM — free, no API key, real road-following routes via OpenStreetMap data
const OSRM_BASE = 'https://router.project-osrm.org'

export interface RouteOption {
  id: string
  name: string
  coordinates: number[][] // [lng, lat] pairs
  distance: number        // metres
  duration: number        // seconds
  summary: string
  geometry: GeoJSON.LineString
}

export interface RoutingResponse {
  routes: RouteOption[]
  selectedRouteId: string
}

// Decode OSRM polyline6 (precision=6) to [lng, lat][]
function decodePolyline6(encoded: string): number[][] {
  const coords: number[][] = []
  let index = 0, lat = 0, lng = 0

  while (index < encoded.length) {
    let b, shift = 0, result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1

    shift = 0; result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1

    coords.push([lng / 1e6, lat / 1e6])
  }
  return coords
}

class RoutingService {
  async getRoutes(
    start: [number, number],  // [lng, lat]
    end: [number, number],    // [lng, lat]
    profile: 'foot-walking' | 'cycling-regular' = 'foot-walking'
  ): Promise<RoutingResponse> {
    const osrmProfile = profile === 'cycling-regular' ? 'bike' : 'foot'

    try {
      // OSRM route endpoint — asks for up to 3 alternatives
      const url = `${OSRM_BASE}/route/v1/${osrmProfile}/${start[0]},${start[1]};${end[0]},${end[1]}?alternatives=3&overview=full&geometries=polyline6`

      const res = await fetch(url)
      if (!res.ok) throw new Error(`OSRM ${res.status}`)
      const data = await res.json()

      if (data.code !== 'Ok' || !data.routes?.length) {
        throw new Error('No routes returned')
      }

      const NAMES = ['Fastest Route', 'Alternative Route', 'Scenic Route']
      const SUMMARIES = [
        'Shortest time via main roads',
        'Alternative path',
        'Quieter roads',
      ]

      const routes: RouteOption[] = data.routes.map((r: any, i: number) => {
        const coords = decodePolyline6(r.geometry)
        return {
          id: `route-${i}`,
          name: NAMES[i] ?? `Route ${i + 1}`,
          coordinates: coords,
          distance: r.distance,
          duration: r.duration,
          summary: SUMMARIES[i] ?? '',
          geometry: { type: 'LineString', coordinates: coords },
        }
      })

      return { routes, selectedRouteId: routes[0].id }
    } catch (err) {
      console.error('Routing error:', err)
      // Hard fallback — straight line so UI doesn't break
      const straight: number[][] = [start, end]
      const dist = this.haversine(start, end)
      const speed = profile === 'cycling-regular' ? 4.17 : 1.39 // m/s
      return {
        routes: [{
          id: 'route-0',
          name: 'Direct Line',
          coordinates: straight,
          distance: dist,
          duration: dist / speed,
          summary: 'Routing unavailable — straight line shown',
          geometry: { type: 'LineString', coordinates: straight },
        }],
        selectedRouteId: 'route-0',
      }
    }
  }

  private haversine(a: [number, number], b: [number, number]): number {
    const R = 6371000
    const dLat = (b[1] - a[1]) * Math.PI / 180
    const dLng = (b[0] - a[0]) * Math.PI / 180
    const x = Math.sin(dLat / 2) ** 2 +
      Math.cos(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  }
}

export const routingService = new RoutingService()