import { getApiUrl } from '@/lib/config';
const API_URL = getApiUrl();

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
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Helper to handle API errors
const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

export const createWorkout = async (workoutData: Omit<Workout, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<WorkoutResponse> => {
  const response = await fetch(`${API_URL}/api/workouts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(workoutData),
  });
  return handleResponse(response);
};

export const getWorkouts = async (params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<WorkoutsListResponse> => {
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
};

export const getWorkout = async (id: string): Promise<WorkoutResponse> => {
  const response = await fetch(`${API_URL}/api/workouts/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const updateWorkout = async (id: string, workoutData: Partial<Workout>): Promise<WorkoutResponse> => {
  const response = await fetch(`${API_URL}/api/workouts/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(workoutData),
  });
  return handleResponse(response);
};

export const deleteWorkout = async (id: string): Promise<{ status: string; message: string }> => {
  const response = await fetch(`${API_URL}/api/workouts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getWorkoutStats = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<WorkoutStatsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const response = await fetch(`${API_URL}/api/workouts/analytics/stats?${queryParams}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
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