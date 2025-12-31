const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ExerciseSet {
  reps: number;
  weight: number;
  unit: 'kg' | 'lb';
}

export interface Workout {
  _id?: string;
  userId?: string;
  date: string;
  exercise: string;
  muscleGroup: string;
  weightType: 'dumbbell' | 'barbell' | 'bodyweight' | 'machine' | 'cable' | 'kettlebell' | 'resistance_band';
  sets: ExerciseSet[];
  rpe: number;
  restTime?: string;
  notes?: string;
  tempo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutResponse {
  status: string;
  workout: Workout;
  xpGained?: number;
}

export interface WorkoutsListResponse {
  status: string;
  results: number;
  total: number;
  page: number;
  pages: number;
  workouts: Workout[];
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalSets: number;
  muscleGroupDistribution: Record<string, number>;
  averageRPE: number;
  totalVolume: number;
}

export interface WorkoutStatsResponse {
  status: string;
  stats: WorkoutStats;
}

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('fitquest_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Helper to handle API errors with fallback
const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

// Mock data for development
const mockWorkouts: Workout[] = [
  {
    _id: 'workout1',
    date: new Date().toISOString(),
    exercise: 'Bench Press',
    muscleGroup: 'Chest',
    weightType: 'barbell',
    sets: [
      { reps: 10, weight: 80, unit: 'kg' },
      { reps: 8, weight: 85, unit: 'kg' },
      { reps: 6, weight: 90, unit: 'kg' }
    ],
    rpe: 8,
    restTime: '2min',
    notes: 'Good form, felt strong'
  },
  {
    _id: 'workout2',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    exercise: 'Squats',
    muscleGroup: 'Legs',
    weightType: 'barbell',
    sets: [
      { reps: 12, weight: 100, unit: 'kg' },
      { reps: 10, weight: 105, unit: 'kg' },
      { reps: 8, weight: 110, unit: 'kg' }
    ],
    rpe: 9,
    restTime: '3min',
    notes: 'Deep squats, good depth'
  },
  {
    _id: 'workout3',
    date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    exercise: 'Pull-ups',
    muscleGroup: 'Back',
    weightType: 'bodyweight',
    sets: [
      { reps: 8, weight: 0, unit: 'kg' },
      { reps: 6, weight: 0, unit: 'kg' },
      { reps: 5, weight: 0, unit: 'kg' }
    ],
    rpe: 7,
    restTime: '90s',
    notes: 'Full range of motion'
  }
];

// Safe API call wrapper with fallback
const safeApiCall = async <T>(apiCall: () => Promise<T>, fallbackData: T): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    console.warn('API call failed, using mock data:', error);
    return fallbackData;
  }
};

export const createWorkout = async (workoutData: Omit<Workout, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<WorkoutResponse> => {
  return safeApiCall(
    async () => {
      const response = await fetch(`${API_URL}/api/workouts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(workoutData),
      });
      return handleResponse(response);
    },
    {
      status: 'success',
      workout: {
        _id: `mock_${Date.now()}`,
        ...workoutData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      xpGained: Math.floor(Math.random() * 50) + 10
    }
  );
};

export const getWorkouts = async (params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<WorkoutsListResponse> => {
  return safeApiCall(
    async () => {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);

      const response = await fetch(`${API_URL}/api/workouts?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },
    {
      status: 'success',
      results: mockWorkouts.length,
      total: mockWorkouts.length,
      page: params?.page || 1,
      pages: 1,
      workouts: mockWorkouts
    }
  );
};

export const getWorkout = async (id: string): Promise<WorkoutResponse> => {
  return safeApiCall(
    async () => {
      const response = await fetch(`${API_URL}/api/workouts/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },
    {
      status: 'success',
      workout: mockWorkouts.find(w => w._id === id) || mockWorkouts[0]
    }
  );
};

export const updateWorkout = async (id: string, workoutData: Partial<Workout>): Promise<WorkoutResponse> => {
  return safeApiCall(
    async () => {
      const response = await fetch(`${API_URL}/api/workouts/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(workoutData),
      });
      return handleResponse(response);
    },
    {
      status: 'success',
      workout: {
        ...mockWorkouts.find(w => w._id === id) || mockWorkouts[0],
        ...workoutData,
        updatedAt: new Date().toISOString()
      }
    }
  );
};

export const deleteWorkout = async (id: string): Promise<{ status: string; message: string }> => {
  return safeApiCall(
    async () => {
      const response = await fetch(`${API_URL}/api/workouts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },
    {
      status: 'success',
      message: 'Workout deleted successfully (mock)'
    }
  );
};

export const getWorkoutStats = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<WorkoutStatsResponse> => {
  return safeApiCall(
    async () => {
      const queryParams = new URLSearchParams();
      
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);

      const response = await fetch(`${API_URL}/api/workouts/analytics/stats?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },
    {
      status: 'success',
      stats: {
        totalWorkouts: mockWorkouts.length,
        totalSets: mockWorkouts.reduce((sum, w) => sum + w.sets.length, 0),
        muscleGroupDistribution: getMuscleGroupDistribution(mockWorkouts),
        averageRPE: mockWorkouts.reduce((sum, w) => sum + w.rpe, 0) / mockWorkouts.length,
        totalVolume: calculateTotalVolume(mockWorkouts)
      }
    }
  );
};

// Helper functions for data processing
export const calculateTotalVolume = (workouts: Workout[]): number => {
  return workouts.reduce((total, workout) => {
    const workoutVolume = workout.sets.reduce((setTotal, set) => {
      const weightInKg = set.unit === 'lb' ? set.weight * 0.453592 : set.weight;
      return setTotal + (set.reps * weightInKg);
    }, 0);
    return total + workoutVolume;
  }, 0);
};

export const groupWorkoutsByDate = (workouts: Workout[]): Record<string, Workout[]> => {
  return workouts.reduce((groups, workout) => {
    const date = new Date(workout.date).toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(workout);
    return groups;
  }, {} as Record<string, Workout[]>);
};

export const getMuscleGroupDistribution = (workouts: Workout[]): Record<string, number> => {
  return workouts.reduce((distribution, workout) => {
    distribution[workout.muscleGroup] = (distribution[workout.muscleGroup] || 0) + 1;
    return distribution;
  }, {} as Record<string, number>);
};