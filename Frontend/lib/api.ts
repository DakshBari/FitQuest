import { getApiUrl } from '@/lib/config';
const API_URL = getApiUrl();

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

// Get token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

const fetcher = async (url: string, options?: RequestInit) => {
  const token = getAuthToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...options?.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const response = await fetch(`${API_URL}${url}`, { ...options, headers });
  return handleResponse(response);
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