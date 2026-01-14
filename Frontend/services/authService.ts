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

// NEW: Function to update Online Status
export const updateStatus = async (isOnline: boolean): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/api/users/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
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