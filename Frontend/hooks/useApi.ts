import { useAuth } from '@/contexts/AuthContext'
import { useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export function useApi() {
  const { token } = useAuth()

  const apiCall = useCallback(async (url: string, options?: RequestInit) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }, [token])

  return {
    // Meals API
    meals: {
      getDaily: (date?: string) => apiCall(`/api/meals/summary${date ? `?date=${date}` : ''}`),
      getFavorites: () => apiCall('/api/meals/favorites'),
      getHistory: (limit = 100, page = 1) => apiCall(`/api/meals/history?limit=${limit}&page=${page}`),
      add: (data: any) => apiCall('/api/meals', { method: 'POST', body: JSON.stringify(data) }),
      addFavoriteToLog: (favoriteId: string, data: any) => apiCall('/api/meals/favorites/add-to-log', { 
        method: 'POST', 
        body: JSON.stringify({ favoriteId, ...data }) 
      }),
      update: (id: string, data: any) => apiCall(`/api/meals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: string) => apiCall(`/api/meals/${id}`, { method: 'DELETE' }),
      toggleFavorite: (id: string) => apiCall(`/api/meals/${id}/favorite`, { method: 'PUT' })
    },

    // Hydration API
    hydration: {
      getToday: () => apiCall('/api/hydration/today'),
      add: (amount: number) => apiCall('/api/hydration', { method: 'POST', body: JSON.stringify({ amount }) })
    },

    // Generic API call
    call: apiCall
  }
}