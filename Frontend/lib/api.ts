const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

// Get token from multiple possible sources
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Try different token storage keys
  return localStorage.getItem('fitquest_token') || 
         localStorage.getItem('token') || 
         null;
};

// Mock API responses for development when backend is not available
const createMockResponse = (data: any) => ({
  ok: true,
  json: async () => data,
  status: 200,
  statusText: 'OK'
});

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
    meals: []
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
        category: 'Breakfast'
      },
      {
        _id: 'fav2', 
        name: 'Grilled Chicken Salad',
        calories: 420,
        protein: 35,
        carbs: 15,
        fat: 18,
        category: 'Lunch'
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
      }
    ],
    totalCount: 2,
    page: 1,
    totalPages: 1
  }
};

const fetcher = async (url: string, options?: RequestInit) => {
  const token = getAuthToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...options?.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  try {
    const response = await fetch(`${API_URL}${url}`, { ...options, headers });
    return handleResponse(response);
  } catch (error) {
    console.warn(`API call failed for ${url}, using mock data:`, error);
    
    // Return mock data if available
    const mockData = mockApiResponses[url.split('?')[0]]; // Remove query params for matching
    if (mockData) {
      return mockData;
    }
    
    // For POST/PUT/DELETE requests, return success response
    if (options?.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
      return { success: true, message: 'Operation completed (mock)' };
    }
    
    // Re-throw error if no mock data available
    throw error;
  }
};

export const authApi = {
  login: (email: string, password: string) => fetcher('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (username: string, email: string, password: string) => fetcher('/api/auth/signup', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
  getMe: () => fetcher('/api/auth/me'),
};

export const userApi = {
  updateProfile: (data: any) => fetcher('/api/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

export const mealsApi = {
  getDaily: (date?: string) => fetcher(`/api/meals/summary${date ? `?date=${date}` : ''}`),
  getWeekly: () => {
    const timezoneOffset = new Date().getTimezoneOffset();
    return fetcher(`/api/meals/weekly?timezoneOffset=${timezoneOffset}`);
  },
  getWeeklyDetailed: () => {
    const timezoneOffset = new Date().getTimezoneOffset();
    return fetcher(`/api/meals/weekly-detailed?timezoneOffset=${timezoneOffset}`);
  },
  getFavorites: () => fetcher('/api/meals/favorites'),
  getHistory: (limit = 100, page = 1) => fetcher(`/api/meals/history?limit=${limit}&page=${page}`),
  getDailyEntries: () => fetcher('/api/meals/daily-entries'),
  add: (data: any) => fetcher('/api/meals', { method: 'POST', body: JSON.stringify(data) }),
  addFavoriteToLog: (favoriteId: string, data: any) => fetcher('/api/meals/favorites/add-to-log', { 
    method: 'POST', 
    body: JSON.stringify({ favoriteId, ...data }) 
  }),
  update: (id: string, data: any) => fetcher(`/api/meals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleFavorite: (id: string) => fetcher(`/api/meals/${id}/favorite`, { method: 'PUT' }),
  delete: (id: string) => fetcher(`/api/meals/${id}`, { method: 'DELETE' }),
};

export const hydrationApi = {
  getToday: () => fetcher('/api/hydration/today'),
  getWeekly: () => {
    const timezoneOffset = new Date().getTimezoneOffset();
    return fetcher(`/api/hydration/weekly?timezoneOffset=${timezoneOffset}`);
  },
  add: (amount: number) => fetcher('/api/hydration', { method: 'POST', body: JSON.stringify({ amount }) }),
};