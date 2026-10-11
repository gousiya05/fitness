# FlexAI — Full API Documentation

**Last verified:** 2026-10-11 | All ML endpoints tested with `14/14 PASS`

---

## Architecture Overview

```
Browser (React SPA)
    │
    ├─ /api/*        → Node.js / Express  (port 3000)
    │                  Auth, profiles, progress, Gemini AI, food scanner
    │
    └─ VITE_ML_API_URL → FastAPI (Python, port 8000)
                         BMI · Calorie · Workout ML predictions
```

---

## Node.js Backend — `http://localhost:3000`

All protected routes require:
```
Authorization: Bearer <jwt_token>
```

---

### Authentication

#### POST /api/auth/register
Creates a user and returns a JWT.

**Request:**
```json
{ "email": "user@example.com", "password": "securepassword", "firstName": "John", "lastName": "Doe" }
```
**Response 200:**
```json
{ "token": "<jwt>", "user": { "email": "user@example.com", "firstName": "John", "onboarded": false } }
```

---

#### POST /api/auth/login
**Request:**
```json
{ "email": "user@example.com", "password": "securepassword" }
```
**Response 200:**
```json
{ "token": "<jwt>", "user": { "email": "user@example.com", "firstName": "John", "onboarded": true } }
```

---

### User Profile

#### GET /api/user/profile  🔒
Returns the authenticated user's stored profile.

**Response 200:**
```json
{ "email": "user@example.com", "weight": 75, "height": 175, "fitnessGoal": "muscle_gain" }
```

#### POST /api/user/profile  🔒
Saves/updates the user's onboarding profile.

**Request:** Any profile fields (weight, height, age, gender, fitnessGoal, workoutExperience, activityLevel …)

---

### Progress Tracking

#### GET /api/progress  🔒
Returns up to 30 progress entries sorted ascending by date.

#### POST /api/progress  🔒
**Request:**
```json
{ "weight": 74.5, "date": "2026-10-11", "notes": "Felt strong today" }
```

---

### Workout History

#### GET /api/workout-history  🔒
Returns up to 50 workout entries, most-recent first.

#### POST /api/workout-history  🔒
```json
{ "type": "Strength", "duration": 60, "calories": 400, "date": "2026-10-11" }
```

---

### Food Scanner (Gemini Vision)

#### POST /api/food/scan  🔒
Sends a food image to Gemini 2.5 Flash for nutritional analysis.

**Request:** `multipart/form-data` with field `image` (JPEG/PNG)

**Response 200:**
```json
{
  "foodItems": [
    { "name": "Avocado", "calories": 234, "protein": "3g", "carbs": "12g",
      "fat": "21g", "fiber": "10g", "sugar": "1g", "portion": "1 medium" }
  ],
  "totalCalories": 234,
  "recommendation": "Great source of healthy fats.",
  "isHealthy": true
}
```

---

### Gemini AI

#### POST /api/gemini/generate
Proxies a prompt to Gemini 2.5 Flash and returns JSON.

**Request:**
```json
{ "prompt": "Generate a workout plan for...", "systemInstruction": "You are a fitness expert." }
```
**Response 200:**
```json
{ "text": "{ ... json ... }" }
```

---

### Health Check

#### GET /api/health
```json
{ "status": "ok", "apiKeyConfigured": true, "dbConfigured": false }
```

---

### ML Pipeline (Node.js side — dataset upload & training)

#### POST /api/ml/dataset
Upload a CSV/JSON dataset. `multipart/form-data`, field `file`.

#### GET /api/ml/datasets
List all uploaded datasets.

#### DELETE /api/ml/dataset/:name
Delete a dataset by filename.

#### POST /api/ml/train
Trigger model training on an uploaded dataset.
```json
{ "dataset": "optional_filename.csv" }
```

#### POST /api/ml/predict
Simple prediction using the trained linear regression model.
```json
{ "input": [75] }
```

---
---

## FastAPI ML Backend — `http://localhost:8000`

> **Status (last verified):** `5/5 models loaded` | `14/14 tests PASS`
> 
> **Run:** `cd backend && python -m uvicorn main:app --port 8000`
>
> **Swagger UI:** http://localhost:8000/docs

All three endpoints use real pre-trained `.pkl` models from `backend/models/`.  
No API key or auth required — all predictions are local inference.

---

### GET /health
Returns model load status for all 5 assets.

**Response 200:**
```json
{
  "status": "healthy",
  "models_loaded": {
    "bmi": true,
    "bmi_encoder": true,
    "calorie": true,
    "calorie_encoder": true,
    "workout": true
  },
  "total_loaded": 5,
  "endpoints": ["/predict-bmi", "/predict-calories", "/recommend-workout"]
}
```

---

### POST /predict-bmi
Predicts BMI category using a **RandomForestClassifier** trained on BMI data.

**Request:**
```json
{ "gender": "Male", "height": 175, "weight": 75 }
```

| Field    | Type   | Constraints       |
|----------|--------|-------------------|
| gender   | string | `"Male"` or `"Female"` |
| height   | float  | 0 < height ≤ 300 (cm) |
| weight   | float  | 0 < weight ≤ 500 (kg) |

**Response 200:**
```json
{
  "bmi_value": 24.5,
  "category": "Healthy",
  "risk": "Low metabolic risk profile. Optimal BMI range.",
  "calorie_intake": 2671,
  "model_used": true
}
```

| Category              | BMI Range        |
|-----------------------|------------------|
| Extremely Underweight | < 16             |
| Underweight           | 16 – 18.4        |
| Healthy               | 18.5 – 24.9      |
| Overweight            | 25 – 29.9        |
| Obese                 | 30 – 34.9        |
| Extremely Obese       | ≥ 35             |

---

### POST /predict-calories
Predicts calories burned during exercise using an **XGBRegressor**.

**Request:**
```json
{
  "gender": "Male",
  "age": 25,
  "height": 175,
  "weight": 75,
  "duration": 30,
  "heart_rate": 145,
  "body_temp": 37.0
}
```

| Field       | Type   | Constraints             |
|-------------|--------|-------------------------|
| gender      | string | `"Male"` or `"Female"`  |
| age         | float  | 0 < age ≤ 120           |
| height      | float  | 0 < height ≤ 300 (cm)   |
| weight      | float  | 0 < weight ≤ 500 (kg)   |
| duration    | float  | > 0 (minutes)           |
| heart_rate  | float  | 0 < hr ≤ 250 (bpm)      |
| body_temp   | float  | optional, default 37.0  |

**Response 200:**
```json
{
  "calories_burned": 255.5,
  "fat_burn_grams": 38.3,
  "intensity": "CARDIO",
  "model_used": true
}
```

| Intensity  | Heart Rate    |
|------------|---------------|
| LIGHT      | < 110 bpm     |
| FAT BURN   | 110 – 130 bpm |
| CARDIO     | 130 – 150 bpm |
| PEAK       | > 150 bpm     |

---

### POST /recommend-workout
Returns a personalized workout plan using a **2,598-row real workout DataFrame** lookup.

**Request:**
```json
{
  "age": 25,
  "gender": "Male",
  "weight": 75,
  "height": 175,
  "fitness_goal": "muscle_gain",
  "experience_level": "intermediate"
}
```

| Field            | Valid Values                                                     |
|------------------|------------------------------------------------------------------|
| fitness_goal     | `weight_loss` `muscle_gain` `lean_bulk` `maintenance` `weight_gain` |
| experience_level | `beginner` `intermediate` `advanced`                             |

**Response 200:**
```json
{
  "recommendation": "Webslinger (8.0 weeks) — Program with comprehensive exercises...",
  "workout_type": "Strength Training",
  "intensity": "High",
  "exercises": [
    { "name": "Barbell Bench Press", "sets": "4", "reps": "8-10",
      "muscle": "Chest", "instructions": "Full ROM, controlled eccentric" }
  ],
  "weekly_plan": [
    { "day": "Monday", "focus": "Chest & Triceps", "rest": false }
  ],
  "model_used": true
}
```

---

### GET /api-docs
Returns sample request/response JSON for all three ML endpoints.

---

## Environment Setup

Copy `.env.example` → `.env` and configure:

```env
GEMINI_API_KEY="your_key_here"          # For chatbot & food scanner
JWT_SECRET="your_secret_here"           # For auth tokens
VITE_ML_API_URL="http://localhost:8000" # FastAPI ML backend URL
# MONGODB_URI=                          # Optional — uses localStorage fallback if unset
```

### Start Both Servers

**Terminal 1 — FastAPI ML Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 — Node.js / React Frontend:**
```bash
npm install
npm run dev
# App → http://localhost:3000
```
