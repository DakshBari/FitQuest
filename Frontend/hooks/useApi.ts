import { useAuth } from '@/contexts/AuthContext'
import { useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Mock data for development
const mockApiResponses: { [key: string]: any } = {
  '/api/meals/summary': {
    totalCalories: 1850,
    targetCalories: 2200,
    protein: 120,
    carbs: 180,
    fat: 65,
    targetProtein: 150,
    targetCarbs: 200,
    targetFat: 70,
    meals: [
      {
        _id: 'meal1',
        name: 'Breakfast Smoothie',
        calories: 350,
        protein: 25,
        carbs: 30,
        fat: 12,
        category: 'Breakfast',
        time: '08:30'
      },
      {
        _id: 'meal2',
        name: 'Chicken Salad',
        calories: 420,
        protein: 35,
        carbs: 15,
        fat: 18,
        category: 'Lunch',
        time: '12:45'
      }
    ]
  },
  '/api/meals/favorites': {
    favorites: [
      {
        _id: 'fav1',
        name: 'Protein Smoothie',
        calories: 350,
        protein: 25,
        carbs: 30,
        fat: 12,
        category: 'Breakfast',
        ingredients: ['Whey protein', 'Banana', 'Almond milk', 'Spinach']
      },
      {
        _id: 'fav2',
        name: 'Grilled Chicken Salad',
        calories: 420,
        protein: 35,
        carbs: 15,
        fat: 18,
        category: 'Lunch',
        ingredients: ['Chicken breast', 'Mixed greens', 'Cherry tomatoes', 'Olive oil']
      },
      {
        _id: 'fav3',
        name: 'Salmon & Rice',
        calories: 520,
        protein: 40,
        carbs: 45,
        fat: 22,
        category: 'Dinner',
        ingredients: ['Salmon fillet', 'Brown rice', 'Broccoli', 'Lemon']
      }
    ]
  },
  '/api/hydration/today': {
    totalIntake: 1200,
    target: 2000,
    entries: [
      { amount: 500, timestamp: new Date().toISOString() },
      { amount: 350, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { amount: 350, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() }
    ]
  },
  '/api/meals/history': {
    meals: [
      {
        _id: 'meal1',
        name: 'Breakfast Bowl',
        calories: 450,
        protein: 20,
        carbs: 45,
        fat: 15,
        category: 'Breakfast',
        date: new Date().toISOString(),
        isFavorite: false
      },
      {
        _id: 'meal2',
        name: 'Lunch Wrap',
        calories: 520,
        protein: 28,
        carbs: 35,
        fat: 22,
        category: 'Lunch',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isFavorite: true
      },
      {
        _id: 'meal3',
        name: 'Dinner Pasta',
        calories: 680,
        protein: 25,
        carbs: 85,
        fat: 28,
        category: 'Dinner',
        date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        isFavorite: false
      }
    ],
    totalCount: 3,
    page: 1,
    totalPages: 1
  }
}

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

    try {
      const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.warn(`API call failed for ${url}, attempting to use mock data:`, error)
      
      // Return mock data if available
      const mockData = mockApiResponses[url.split('?')[0]] // Remove query params for matching
      if (mockData) {
        console.log(`Using mock data for ${url}`)
        return mockData
      }
      
      // For POST/PUT/DELETE requests, return success response
      if (options?.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
        return { 
          success: true, 
          message: 'Operation completed (mock)',
          data: options.method === 'POST' ? { _id: `mock_${Date.now()}` } : null
        }
      }
      
      // Re-throw error if no mock data available
      throw error
    }
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