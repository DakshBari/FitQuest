const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

const fetcher = async (url: string, options?: RequestInit) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...options?.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_URL}${url}`, { ...options, headers }).then(handleResponse);
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