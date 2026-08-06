const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api`

export interface RunSession {
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

export interface CapturedArea {
  type: "Feature"
  geometry: {
    type: "Polygon"
    coordinates: number[][][]
  }
  properties: {
    id?: string
    capturedAt: string
    area: number
    sessionId: string
  }
}

class WorldMapService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  async getCapturedAreas(): Promise<GeoJSON.FeatureCollection> {
    try {
      const response = await fetch(`${API_BASE_URL}/world-map/captured-areas`, {
        headers: this.getAuthHeaders()
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('User not authenticated for captured areas')
          return { type: "FeatureCollection", features: [] }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching captured areas:', error)
      // Return empty collection as fallback
      return { type: "FeatureCollection", features: [] }
    }
  }

  async saveCapturedArea(area: CapturedArea): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/world-map/captured-areas`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(area)
      })
      
      return response.ok
    } catch (error) {
      console.error('Error saving captured area:', error)
      return false
    }
  }

  async getSessionHistory(): Promise<RunSession[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/world-map/sessions`, {
        headers: this.getAuthHeaders()
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('User not authenticated for session history')
          return []
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const sessions = await response.json()
      return sessions.map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined
      }))
    } catch (error) {
      console.error('Error fetching session history:', error)
      // Return empty array as fallback
      return []
    }
  }

  async startSession(sessionData: {
    sessionId: string
    type: 'run' | 'cycle'
    mode: 'explorer' | 'navigator'
    startLocation: [number, number]
    plannedRoute?: number[][]
  }): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/world-map/sessions`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(sessionData)
      })
      
      return response.ok
    } catch (error) {
      console.error('Error starting session:', error)
      return false
    }
  }

  async updateSession(sessionId: string, sessionData: Partial<RunSession>): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/world-map/sessions/${sessionId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(sessionData)
      })
      
      return response.ok
    } catch (error) {
      console.error('Error updating session:', error)
      return false
    }
  }

  async getStats(): Promise<{
    totalTerritories: number
    totalActivities: number
    totalDistance: number
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/world-map/stats`, {
        headers: this.getAuthHeaders()
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching stats:', error)
      return {
        totalTerritories: 0,
        totalActivities: 0,
        totalDistance: 0
      }
    }
  }
}

export const worldMapService = new WorldMapService()