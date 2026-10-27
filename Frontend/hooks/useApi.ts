import { useAuth } from '@/contexts/AuthContext'
import { useCallback } from 'react'
import { getApiUrl } from '@/lib/config'

export function useApi() {
  const { token, logout } = useAuth()

  const apiCall = useCallback(async (url: string, options?: RequestInit) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>)
    }

    if (token && token !== 'undefined' && token !== 'null') {
      headers['Authorization'] = `Bearer ${token}`
    }

    const apiUrl = getApiUrl()
    const response = await fetch(`${apiUrl}${url}`, {
      ...options,
      headers
    })

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('API returned 401 Unauthorized — clearing stale session')
        logout()
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }, [token, logout])

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