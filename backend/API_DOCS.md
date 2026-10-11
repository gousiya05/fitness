# FitAI ML Backend — API Documentation

**Base URL (local dev):** `http://localhost:8000`  
**Interactive Docs (Swagger):** `http://localhost:8000/docs`  
**Alternative Docs (ReDoc):** `http://localhost:8000/redoc`  
**Sample JSON Reference:** `http://localhost:8000/api-docs`

---

## Authentication
No authentication required. CORS is open to all origins in development mode.

---

## Endpoints

### GET `/health`
Returns backend status and per-model load status.

**Response:**
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

### POST `/predict-bmi`
Predicts BMI using the pre-trained `bmi_model.pkl`.  
Falls back to the canonical BMI formula `weight / height²` if the model produces implausible results.

**Request Body:**
```json
{
  "gender": "Male",
  "height": 175,
  "weight": 75
}
```

| Field    | Type   | Required | Validation          | Example |
|----------|--------|----------|---------------------|---------|
| `gender` | string | ✅       | `"Male"` or `"Female"` | `"Male"` |
| `height` | float  | ✅       | `0 < height ≤ 300` (cm) | `175` |
| `weight` | float  | ✅       | `0 < weight ≤ 500` (kg) | `75`  |

**Response:**
```json
{
  "bmi_value": 24.5,
  "category": "Healthy",
  "risk": "Low metabolic risk profile. Optimal BMI range.",
  "calorie_intake": 2480,
  "model_used": true
}
```

**BMI Categories:**
| Range      | Category    |
|------------|-------------|
| < 18.5     | Underweight |
| 18.5–24.9  | Healthy     |
| 25.0–29.9  | Overweight  |
| ≥ 30.0     | Obese       |

---

### POST `/predict-calories`
Predicts calories burned during exercise using `calorie_model.pkl`.  
Falls back to a MET-derived formula: `duration × heart_rate × weight × 0.0005`.

**Request Body:**
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

| Field        | Type   | Required | Validation               | Example |
|--------------|--------|----------|--------------------------|---------|
| `gender`     | string | ✅       | `"Male"` or `"Female"` | `"Male"` |
| `age`        | float  | ✅       | `0 < age ≤ 120` (years)  | `25`    |
| `height`     | float  | ✅       | `0 < height ≤ 300` (cm)  | `175`   |
| `weight`     | float  | ✅       | `0 < weight ≤ 500` (kg)  | `75`    |
| `duration`   | float  | ✅       | `> 0` (minutes)          | `30`    |
| `heart_rate` | float  | ✅       | `0 < hr ≤ 250` (bpm)     | `145`   |
| `body_temp`  | float  | ❌       | Defaults to `37.0` (°C)  | `37.0`  |

**Response:**
```json
{
  "calories_burned": 312.5,
  "fat_burn_grams": 46.9,
  "intensity": "CARDIO",
  "model_used": true
}
```

**Intensity Zones:**
| Heart Rate  | Zone      |
|-------------|-----------|
| > 150 bpm   | PEAK      |
| 131–150 bpm | CARDIO    |
| 111–130 bpm | FAT BURN  |
| ≤ 110 bpm   | LIGHT     |

---

### POST `/recommend-workout`
Recommends a personalized workout plan using `workout_recommendation.pkl`.  
Returns a full exercise list and 7-day weekly plan.

**Request Body:**
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

| Field              | Type   | Required | Values                                              |
|--------------------|--------|----------|-----------------------------------------------------|
| `age`              | int    | ✅       | `1–120`                                            |
| `gender`           | string | ✅       | `"Male"` or `"Female"`                             |
| `weight`           | float  | ✅       | kg, `0–500`                                        |
| `height`           | float  | ✅       | cm, `0–300`                                        |
| `fitness_goal`     | string | ✅       | `weight_loss`, `muscle_gain`, `lean_bulk`, `maintenance`, `weight_gain` |
| `experience_level` | string | ✅       | `beginner`, `intermediate`, `advanced`              |
| `bmi`              | float  | ❌       | Auto-calculated if omitted                          |

**Response:**
```json
{
  "recommendation": "Based on your muscle gain goal and intermediate level",
  "workout_type": "Strength Training",
  "intensity": "High",
  "exercises": [
    {
      "name": "Barbell Bench Press",
      "sets": "4",
      "reps": "8-10",
      "muscle": "Chest",
      "instructions": "Full ROM, controlled eccentric"
    },
    {
      "name": "Deadlifts",
      "sets": "4",
      "reps": "6-8",
      "muscle": "Back/Legs",
      "instructions": "Brace core, maintain neutral spine"
    }
  ],
  "weekly_plan": [
    { "day": "Monday",    "focus": "Chest & Triceps",     "rest": false },
    { "day": "Tuesday",   "focus": "Back & Biceps",       "rest": false },
    { "day": "Wednesday", "focus": "Rest / Light Cardio", "rest": true  },
    { "day": "Thursday",  "focus": "Legs & Core",         "rest": false },
    { "day": "Friday",    "focus": "Shoulders & Arms",    "rest": false },
    { "day": "Saturday",  "focus": "Full Body Power",     "rest": false },
    { "day": "Sunday",    "focus": "Complete Rest",       "rest": true  }
  ],
  "model_used": true
}
```

---

## Error Responses

All errors return JSON with a `detail` field:

```json
{
  "detail": "BMI prediction failed: <error message>",
  "path": "/predict-bmi"
}
```

| HTTP Status | Meaning                          |
|-------------|----------------------------------|
| `200`       | Success                          |
| `422`       | Validation error (invalid input) |
| `500`       | Internal server error            |

---

## Running Locally

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start the server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 3. Test health endpoint
curl http://localhost:8000/health

# 4. Test BMI prediction
curl -X POST http://localhost:8000/predict-bmi \
  -H "Content-Type: application/json" \
  -d '{"gender":"Male","height":175,"weight":75}'

# 5. Test calorie prediction
curl -X POST http://localhost:8000/predict-calories \
  -H "Content-Type: application/json" \
  -d '{"gender":"Male","age":25,"height":175,"weight":75,"duration":30,"heart_rate":145}'

# 6. Test workout recommendation
curl -X POST http://localhost:8000/recommend-workout \
  -H "Content-Type: application/json" \
  -d '{"age":25,"gender":"Male","weight":75,"height":175,"fitness_goal":"muscle_gain","experience_level":"intermediate"}'
```

---

## Model Files

Place these files in `backend/models/`:

| File                        | Size    | Purpose                         |
|-----------------------------|---------|--------------------------------|
| `bmi_model.pkl`             | ~4.3 MB | BMI regression model           |
| `bmi_encoder.pkl`           | <1 KB   | LabelEncoder for gender (BMI)  |
| `calorie_model.pkl`         | ~447 KB | Calorie burn regression model  |
| `calorie_encoder.pkl`       | <1 KB   | LabelEncoder for gender (cal.) |
| `workout_recommendation.pkl`| ~1 MB   | Workout classifier/regressor   |

---

## Deployment

### Frontend → Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variable in Vercel dashboard:
# VITE_ML_API_URL = https://your-backend.onrender.com
```

### Backend → Render
1. Push code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set **Root Directory** to `backend`
4. Set **Build Command**: `pip install -r requirements.txt`
5. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Deploy — your backend URL will be `https://fitai-ml-backend.onrender.com`
