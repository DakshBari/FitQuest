const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  level: number;
  xp: number;
  stats: {
    strength: number;
    agility: number;
    endurance: number;
  };
  streak: {
    current: number;
    longest: number;
  };
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    water: number;
  };
  profile: {
    weight?: number;
    height?: number;
    bodyType?: 'ectomorph' | 'mesomorph' | 'endomorph';
    goal?: 'muscle-gain' | 'weight-loss' | 'maintenance' | 'endurance';
    workoutSplit?: 'push-pull-legs' | 'upper-lower' | 'full-body' | 'bro-split' | 'custom';
    foodPreference?: 'non-veg' | 'veg' | 'vegan' | 'jain';
  };
}

export const getUserProfile = async (): Promise<UserProfile> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found');
  }

  const response = await fetch(`${API_URL}/api/users/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch profile');
  }

  const data = await response.json();
  return data.user;
};

export const updateUserProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found');
  }

  const response = await fetch(`${API_URL}/api/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update profile');
  }

  const resData = await response.json();
  return resData.user;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<string> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found');
  }

  const response = await fetch(`${API_URL}/api/users/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to change password');
  }

  const resData = await response.json();
  return resData.message;
};
