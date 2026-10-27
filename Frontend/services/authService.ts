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

export interface GoogleAuthPayload {
  credential?: string;
  accessToken?: string;
  token?: string;
  code?: string;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Login failed');
  }

  return await response.json();
};

export const signup = async (username: string, email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Signup failed');
  }

  return await response.json();
};

// Google OAuth Login / Signup API call
export const googleLogin = async (payload: GoogleAuthPayload): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Google authentication failed');
  }

  return await response.json();
};

// Fetch current user using token
export const getCurrentUser = async (token: string): Promise<AuthResponse['user']> => {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch user profile');
  }

  const data = await response.json();
  return data.user;
};

// Function to update Online Status
export const updateStatus = async (isOnline: boolean): Promise<void> => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') return;

    const response = await fetch(`${API_URL}/api/users/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isOnline })
    });

    if (!response.ok) {
      console.warn('Failed to update status:', response.status);
    }
  } catch (error) {
    console.error('Error updating status:', error);
  }
};