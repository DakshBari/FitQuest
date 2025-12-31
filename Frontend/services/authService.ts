const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface AuthResponse {
  status: string;
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    level: number;
    xp: number;
    stats: any;
    avatar?: string;
  };
}

// Helper to handle API errors
const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

// Mock authentication for development (when backend is not available)
const mockAuth = async (email: string, password: string): Promise<AuthResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple validation
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  
  // Mock user data
  return {
    status: 'success',
    token: `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user: {
      id: `user_${Math.random().toString(36).substr(2, 9)}`,
      username: email.split('@')[0] || 'Warrior',
      email: email,
      level: Math.floor(Math.random() * 50) + 1,
      xp: Math.floor(Math.random() * 10000),
      stats: {
        workoutsCompleted: Math.floor(Math.random() * 100),
        totalXP: Math.floor(Math.random() * 10000),
        streak: Math.floor(Math.random() * 30),
        achievements: Math.floor(Math.random() * 20)
      },
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
    }
  };
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    // Try real API first
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    return handleResponse(response);
  } catch (error) {
    console.warn('Backend API not available, using mock authentication:', error);
    // Fall back to mock authentication
    return mockAuth(email, password);
  }
};

export const signup = async (username: string, email: string, password: string): Promise<AuthResponse> => {
  try {
    // Try real API first
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    return handleResponse(response);
  } catch (error) {
    console.warn('Backend API not available, using mock authentication:', error);
    // Fall back to mock authentication for signup
    return mockAuth(email, password);
  }
};

// Validate token (for checking if stored token is still valid)
export const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/auth/validate`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
    });

    return response.ok;
  } catch (error) {
    console.warn('Token validation API not available, assuming token is valid for development');
    // If backend is not available, assume all tokens are valid for development
    // This prevents users from being logged out when the backend is down
    return !!token && token.length > 0;
  }
};