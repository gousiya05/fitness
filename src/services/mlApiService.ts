/// <reference types="vite/client" />
/**
 * ML API Service — connects React frontend to FastAPI Python backend
 * via the Express proxy at /api/ml/*.
 *
 * This works in all environments:
 *   - Local dev   → Express proxies /api/ml/* to http://localhost:8000
 *   - Vercel      → vercel.json routes /api/* to the Express serverless fn
 *   - Direct mode → set VITE_ML_API_URL=http://localhost:8000 to hit FastAPI directly
 *
 * NEVER exposes API keys — all sensitive operations go through server.ts.
 */

// Default: use Express proxy so it works on Vercel and local dev without CORS issues.
// Set VITE_ML_API_URL to override (e.g. for direct FastAPI access in dev).
const ML_API_BASE = import.meta.env.VITE_ML_API_URL
  ? `${import.meta.env.VITE_ML_API_URL}`
  : '/api/ml';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

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
  endpoints?: string[];
}

export interface MLBackendError {
  error: string;
  detail?: string;
  ml_url?: string;
}

// ─────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────

class MLApiError extends Error {
  status: number;
  isOffline: boolean;
  constructor(message: string, status: number, isOffline = false) {
    super(message);
    this.name = 'MLApiError';
    this.status = status;
    this.isOffline = isOffline;
  }
}

async function apiCall<T>(endpoint: string, body: unknown, method: 'POST' | 'GET' = 'POST'): Promise<T> {
  const url = `${ML_API_BASE}${endpoint}`;

  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (method === 'POST') opts.body = JSON.stringify(body);

  let response: Response;
  try {
    response = await fetch(url, opts);
  } catch (networkErr) {
    // fetch() itself throws when network is unreachable
    throw new MLApiError(
      `Cannot reach ML backend at ${url}. Is the server running?`,
      0,
      true
    );
  }

  // Always parse as JSON — server.ts guarantees JSON even for errors
  let data: any;
  const ct = response.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    throw new MLApiError(
      `ML backend returned non-JSON response (${response.status}): ${text.slice(0, 200)}`,
      response.status
    );
  }

  if (!response.ok) {
    const msg = data?.detail || data?.error || `HTTP ${response.status}`;
    throw new MLApiError(msg, response.status, response.status === 503);
  }

  return data as T;
}

async function apiGet<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, undefined, 'GET');
}

// ─────────────────────────────────────────────────────────
// Public API — PKL model predictions
// ─────────────────────────────────────────────────────────

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
  return apiGet<HealthResponse>('/health');
}

// ─────────────────────────────────────────────────────────
// Public API — Algorithm Lab (scikit-learn real datasets)
// ─────────────────────────────────────────────────────────

export async function labListDatasets() {
  return apiGet<any>('/lab/datasets');
}

export async function labListAlgorithms() {
  return apiGet<any>('/lab/algorithms');
}

export async function labTrain(payload: {
  dataset: string;
  algorithm: string;
  test_size?: number;
  scale_features?: boolean;
  hyperparams?: Record<string, any>;
}) {
  return apiCall<any>('/lab/train', payload);
}

export async function labListModels() {
  return apiGet<any>('/lab/models');
}

export async function labPredict(model_id: string, features: number[]) {
  return apiCall<any>('/lab/predict', { model_id, features });
}

export async function labCompare() {
  return apiGet<any>('/lab/compare');
}
