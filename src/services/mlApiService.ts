/// <reference types="vite/client" />
/**
 * ML API Service — connects React frontend to FastAPI Python backend.
 * All .pkl model predictions are handled server-side by Python/joblib.
 */

const ML_API_BASE = import.meta.env.VITE_ML_API_URL || '/api/ml';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BMIPredictionRequest {
  gender: string;
  height: number;
  weight: number;
}

export interface BMIPredictionResponse {
  bmi_value: number;
  category: string;
  risk: string;
  calorie_intake: number;
  model_used: boolean;
}

export interface CaloriePredictionRequest {
  gender: string;
  age: number;
  height: number;
  weight: number;
  duration: number;
  heart_rate: number;
  body_temp?: number;
}

export interface CaloriePredictionResponse {
  calories_burned: number;
  fat_burn_grams: number;
  intensity: string;
  model_used: boolean;
}

export interface WorkoutRequest {
  age: number;
  gender: string;
  weight: number;
  height: number;
  fitness_goal: string;
  experience_level: string;
  bmi?: number;
}

export interface WorkoutExercise {
  name: string;
  sets: string;
  reps: string;
  muscle: string;
  instructions: string;
}

export interface WeeklyPlanDay {
  day: string;
  focus: string;
  rest: boolean;
}

export interface WorkoutResponse {
  recommendation: string;
  workout_type: string;
  intensity: string;
  exercises: WorkoutExercise[];
  weekly_plan: WeeklyPlanDay[];
  model_used: boolean;
}

export interface HealthResponse {
  status: string;
  models_loaded: Record<string, boolean>;
  total_loaded: number;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

class MLApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'MLApiError';
    this.status = status;
  }
}

async function apiCall<T>(endpoint: string, body: unknown): Promise<T> {
  const url = `${ML_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errData = await response.json();
      detail = errData.detail || detail;
    } catch {
      // ignore parse error
    }
    throw new MLApiError(detail, response.status);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function predictBMI(data: BMIPredictionRequest): Promise<BMIPredictionResponse> {
  return apiCall<BMIPredictionResponse>('/predict-bmi', data);
}

export async function predictCalories(data: CaloriePredictionRequest): Promise<CaloriePredictionResponse> {
  return apiCall<CaloriePredictionResponse>('/predict-calories', data);
}

export async function recommendWorkout(data: WorkoutRequest): Promise<WorkoutResponse> {
  return apiCall<WorkoutResponse>('/recommend-workout', data);
}

export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${ML_API_BASE}/health`);
  if (!response.ok) throw new MLApiError('Backend unreachable', response.status);
  return response.json() as Promise<HealthResponse>;
}
