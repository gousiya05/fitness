"""
FitAI — FastAPI ML Backend
Loads pre-trained scikit-learn .pkl models once at startup via joblib.
Exposes:  POST /predict-bmi
          POST /predict-calories
          POST /recommend-workout
          GET  /health
          GET  /api-docs  (JSON sample request/response reference)
"""

import logging
import os
import traceback
from contextlib import asynccontextmanager
from typing import Optional

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Logging — structured, timestamped
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("fitai")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# ---------------------------------------------------------------------------
# Global model registry — populated once at startup, reused for all requests
# ---------------------------------------------------------------------------
models: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all .pkl models ONCE at startup. Never reload per request."""
    log.info("=" * 60)
    log.info("🚀  FitAI ML Backend starting up …")
    log.info(f"📁  Models directory: {MODELS_DIR}")
    log.info("=" * 60)

    model_files = {
        "bmi":             "bmi_model.pkl",
        "bmi_encoder":     "bmi_encoder.pkl",
        "calorie":         "calorie_model.pkl",
        "calorie_encoder": "calorie_encoder.pkl",
        "workout":         "workout_recommendation.pkl",
    }

    for key, filename in model_files.items():
        filepath = os.path.join(MODELS_DIR, filename)
        if os.path.exists(filepath):
            try:
                models[key] = joblib.load(filepath)
                size_kb = os.path.getsize(filepath) // 1024
                log.info(f"  ✅  {filename:<40} loaded  ({size_kb} KB)")
            except Exception as exc:
                log.warning(f"  ⚠️  {filename:<40} FAILED — {exc}")
                models[key] = None
        else:
            log.warning(f"  ❌  {filename:<40} NOT FOUND at {filepath}")
            models[key] = None

    loaded_count = sum(1 for v in models.values() if v is not None)
    log.info("=" * 60)
    log.info(f"📊  {loaded_count}/{len(model_files)} models ready")
    log.info("🌐  API docs → http://localhost:8000/docs")
    log.info("💚  Health   → http://localhost:8000/health")
    log.info("=" * 60)
    yield
    models.clear()
    log.info("🛑  Server shutdown — models cleared.")


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="FitAI ML Backend",
    version="2.0.0",
    description=(
        "Pre-trained scikit-learn ML prediction APIs for BMI, Calorie Burn "
        "and Workout Recommendations. All models are loaded once at startup."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — allow all localhost ports + wildcard for cloud deployments
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global Exception Handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error(f"Unhandled error on {request.method} {request.url.path}: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "path": str(request.url.path)},
    )


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class BMIRequest(BaseModel):
    gender: str = Field(..., description="'Male' or 'Female'", example="Male")
    height: float = Field(..., gt=0, le=300, description="Height in cm", example=175)
    weight: float = Field(..., gt=0, le=500, description="Weight in kg", example=75)

class BMIResponse(BaseModel):
    bmi_value: float
    category: str
    risk: str
    calorie_intake: int
    model_used: bool

# ----

class CalorieRequest(BaseModel):
    gender: str    = Field(..., description="'Male' or 'Female'",        example="Male")
    age:    float  = Field(..., gt=0, le=120, description="Age in years", example=25)
    height: float  = Field(..., gt=0, le=300, description="Height in cm", example=175)
    weight: float  = Field(..., gt=0, le=500, description="Weight in kg", example=75)
    duration: float = Field(..., gt=0, description="Exercise duration in minutes", example=30)
    heart_rate: float = Field(..., gt=0, le=250, description="Average heart rate (bpm)", example=145)
    body_temp: float  = Field(default=37.0, description="Body temperature in °C", example=37.0)

class CalorieResponse(BaseModel):
    calories_burned: float
    fat_burn_grams:  float
    intensity:       str
    model_used:      bool

# ----

class WorkoutRequest(BaseModel):
    age:              int   = Field(..., gt=0, le=120, description="Age in years", example=25)
    gender:           str   = Field(..., description="'Male' or 'Female'",          example="Male")
    weight:           float = Field(..., gt=0, le=500, description="Weight in kg",  example=75)
    height:           float = Field(..., gt=0, le=300, description="Height in cm",  example=175)
    fitness_goal:     str   = Field(..., description="weight_loss | muscle_gain | lean_bulk | maintenance | weight_gain", example="muscle_gain")
    experience_level: str   = Field(..., description="beginner | intermediate | advanced", example="intermediate")
    bmi: Optional[float]    = Field(default=None, description="BMI (auto-calculated if omitted)")

class WorkoutExercise(BaseModel):
    name:         str
    sets:         str
    reps:         str
    muscle:       str
    instructions: str

class WeeklyPlanDay(BaseModel):
    day:   str
    focus: str
    rest:  bool

class WorkoutResponse(BaseModel):
    recommendation: str
    workout_type:   str
    intensity:      str
    exercises:      list
    weekly_plan:    list
    model_used:     bool


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe_predict(model, features: list) -> float:
    """Run model.predict() safely, returning a scalar float."""
    arr = np.array(features, dtype=float).reshape(1, -1)
    prediction = model.predict(arr)
    result = prediction[0] if hasattr(prediction, "__len__") else prediction
    if hasattr(result, "__len__"):
        result = result[0]
    return float(result)


def _encode_gender(encoder, gender: str) -> int:
    """Encode gender using the saved LabelEncoder, with numeric fallback."""
    try:
        if encoder is not None:
            return int(encoder.transform([gender])[0])
    except (ValueError, KeyError, AttributeError):
        pass
    return 0 if gender.strip().lower() == "male" else 1


def _bmi_category(bmi: float) -> tuple[str, str]:
    if bmi < 18.5:
        return "Underweight", "High vulnerability to immune issues and nutrient deficiency."
    elif bmi < 25.0:
        return "Healthy", "Low metabolic risk profile. Optimal BMI range."
    elif bmi < 30.0:
        return "Overweight", "Increased hypertension and cardiovascular risk."
    else:
        return "Obese", "High cardiovascular and metabolic warning. Seek medical advice."


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------
@app.get("/health", summary="Backend health and model status")
async def health():
    loaded = {k: (v is not None) for k, v in models.items()}
    return {
        "status": "healthy",
        "models_loaded": loaded,
        "total_loaded": sum(1 for v in loaded.values() if v),
        "endpoints": ["/predict-bmi", "/predict-calories", "/recommend-workout"],
    }


# ---------------------------------------------------------------------------
# GET /api-docs  — reference payloads for every endpoint
# ---------------------------------------------------------------------------
@app.get("/api-docs", summary="Sample request & response JSON for all endpoints")
async def api_docs():
    return {
        "predict_bmi": {
            "endpoint": "POST /predict-bmi",
            "sample_request": {"gender": "Male", "height": 175, "weight": 75},
            "sample_response": {
                "bmi_value": 24.5,
                "category": "Healthy",
                "risk": "Low metabolic risk profile. Optimal BMI range.",
                "calorie_intake": 2480,
                "model_used": True,
            },
        },
        "predict_calories": {
            "endpoint": "POST /predict-calories",
            "sample_request": {
                "gender": "Male", "age": 25, "height": 175, "weight": 75,
                "duration": 30, "heart_rate": 145, "body_temp": 37.0,
            },
            "sample_response": {
                "calories_burned": 312.5,
                "fat_burn_grams": 46.9,
                "intensity": "CARDIO",
                "model_used": True,
            },
        },
        "recommend_workout": {
            "endpoint": "POST /recommend-workout",
            "sample_request": {
                "age": 25, "gender": "Male", "weight": 75, "height": 175,
                "fitness_goal": "muscle_gain", "experience_level": "intermediate",
            },
            "sample_response": {
                "recommendation": "Based on your muscle gain goal and intermediate level",
                "workout_type": "Strength Training",
                "intensity": "High",
                "exercises": [
                    {"name": "Barbell Bench Press", "sets": "4", "reps": "8-10",
                     "muscle": "Chest", "instructions": "Full ROM, controlled eccentric"},
                ],
                "weekly_plan": [
                    {"day": "Monday", "focus": "Chest & Triceps", "rest": False},
                ],
                "model_used": True,
            },
        },
    }


# ---------------------------------------------------------------------------
# POST /predict-bmi
# ---------------------------------------------------------------------------
@app.post("/predict-bmi", response_model=BMIResponse, summary="Predict BMI using ML model")
async def predict_bmi(req: BMIRequest):
    log.info(f"[/predict-bmi] gender={req.gender} height={req.height} weight={req.weight}")
    try:
        model   = models.get("bmi")
        encoder = models.get("bmi_encoder")

        # Canonical BMI (always calculated as reference)
        h_m = req.height / 100.0
        canonical_bmi = round(req.weight / (h_m * h_m), 1)

        bmi_value  = canonical_bmi
        used_model = False

        if model is not None:
            g_enc = _encode_gender(encoder, req.gender)
            # Try feature combos in order of likelihood
            for features in [
                [g_enc, req.height, req.weight],
                [req.height, req.weight],
                [g_enc, req.weight, req.height],
            ]:
                try:
                    pred = round(_safe_predict(model, features), 1)
                    # Sanity-check: ML result should be in plausible BMI range
                    if 10.0 <= pred <= 60.0:
                        bmi_value  = pred
                        used_model = True
                        break
                    else:
                        log.warning(f"  ML BMI={pred} out of plausible range — trying next feature set")
                except Exception as exc:
                    log.warning(f"  Feature set {features} failed: {exc}")
            if not used_model:
                log.info("  Falling back to canonical BMI formula")

        category, risk = _bmi_category(bmi_value)
        bmr = 10 * req.weight + 6.25 * req.height - 5 * 25 + (5 if req.gender.lower() == "male" else -161)
        calorie_intake = int(bmr * 1.55)

        log.info(f"  → BMI={bmi_value} category={category} model_used={used_model}")
        return BMIResponse(
            bmi_value=bmi_value,
            category=category,
            risk=risk,
            calorie_intake=calorie_intake,
            model_used=used_model,
        )

    except HTTPException:
        raise
    except Exception as exc:
        log.error(f"[/predict-bmi] ERROR: {exc}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"BMI prediction failed: {exc}")


# ---------------------------------------------------------------------------
# POST /predict-calories
# ---------------------------------------------------------------------------
@app.post("/predict-calories", response_model=CalorieResponse, summary="Predict calories burned using ML model")
async def predict_calories(req: CalorieRequest):
    log.info(
        f"[/predict-calories] gender={req.gender} age={req.age} "
        f"weight={req.weight} duration={req.duration} hr={req.heart_rate}"
    )
    try:
        model   = models.get("calorie")
        encoder = models.get("calorie_encoder")

        calories   = None
        used_model = False

        if model is not None:
            g_enc = _encode_gender(encoder, req.gender)
            for features in [
                [g_enc, req.age, req.height, req.weight, req.duration, req.heart_rate, req.body_temp],
                [g_enc, req.age, req.weight, req.duration, req.heart_rate, req.body_temp],
                [g_enc, req.age, req.weight, req.duration, req.heart_rate],
                [req.age, req.weight, req.duration, req.heart_rate],
            ]:
                try:
                    pred = round(_safe_predict(model, features), 1)
                    if 1.0 <= pred <= 5000.0:
                        calories   = pred
                        used_model = True
                        break
                    else:
                        log.warning(f"  ML calories={pred} out of plausible range")
                except Exception as exc:
                    log.warning(f"  Feature set {features} failed: {exc}")

        if calories is None:
            # Fallback: MET-like approximation
            calories   = round(req.duration * req.heart_rate * req.weight * 0.0005, 1)
            used_model = False
            log.info("  Falling back to formula-based calorie estimate")

        fat_burn = round(calories * 0.15, 1)

        if req.heart_rate > 150:
            intensity = "PEAK"
        elif req.heart_rate > 130:
            intensity = "CARDIO"
        elif req.heart_rate > 110:
            intensity = "FAT BURN"
        else:
            intensity = "LIGHT"

        log.info(f"  → calories={calories} intensity={intensity} model_used={used_model}")
        return CalorieResponse(
            calories_burned=calories,
            fat_burn_grams=fat_burn,
            intensity=intensity,
            model_used=used_model,
        )

    except HTTPException:
        raise
    except Exception as exc:
        log.error(f"[/predict-calories] ERROR: {exc}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Calorie prediction failed: {exc}")


# ---------------------------------------------------------------------------
# POST /recommend-workout
# ---------------------------------------------------------------------------

# Exercise database keyed by fitness goal
_EXERCISES_DB: dict = {
    "weight_loss": [
        {"name": "Burpees",           "sets": "4", "reps": "15",  "muscle": "Full Body",       "instructions": "Explosive movement, maintain form throughout"},
        {"name": "Mountain Climbers", "sets": "4", "reps": "30s", "muscle": "Core/Cardio",     "instructions": "Keep hips level, drive knees to chest"},
        {"name": "Jump Squats",       "sets": "4", "reps": "12",  "muscle": "Legs",            "instructions": "Full depth squat, explode upward"},
        {"name": "Battle Ropes",      "sets": "4", "reps": "30s", "muscle": "Arms/Core",       "instructions": "Alternating waves, engage core"},
        {"name": "Box Jumps",         "sets": "3", "reps": "10",  "muscle": "Legs/Cardio",     "instructions": "Land softly, step down to protect joints"},
        {"name": "Kettlebell Swings", "sets": "4", "reps": "15",  "muscle": "Posterior Chain", "instructions": "Hip hinge movement, not a squat"},
    ],
    "muscle_gain": [
        {"name": "Barbell Bench Press", "sets": "4", "reps": "8-10",  "muscle": "Chest",            "instructions": "Full ROM, controlled eccentric"},
        {"name": "Deadlifts",           "sets": "4", "reps": "6-8",   "muscle": "Back/Legs",        "instructions": "Brace core, maintain neutral spine"},
        {"name": "Barbell Squats",      "sets": "4", "reps": "8-10",  "muscle": "Legs",             "instructions": "Below parallel, drive through heels"},
        {"name": "Overhead Press",      "sets": "4", "reps": "8-10",  "muscle": "Shoulders",        "instructions": "Strict form, no leg drive"},
        {"name": "Barbell Rows",        "sets": "4", "reps": "8-10",  "muscle": "Back",             "instructions": "Pull to lower chest, squeeze lats"},
        {"name": "Weighted Dips",       "sets": "3", "reps": "10-12", "muscle": "Chest/Triceps",    "instructions": "Lean forward slightly for chest emphasis"},
    ],
    "lean_bulk": [
        {"name": "Incline DB Press",        "sets": "4", "reps": "10-12",   "muscle": "Upper Chest",  "instructions": "30° incline, full stretch at bottom"},
        {"name": "Romanian Deadlifts",      "sets": "4", "reps": "10",      "muscle": "Hamstrings",   "instructions": "Slow eccentric, feel the stretch"},
        {"name": "Bulgarian Split Squats",  "sets": "3", "reps": "12 each", "muscle": "Legs",         "instructions": "Rear foot elevated, control descent"},
        {"name": "Cable Flyes",             "sets": "4", "reps": "12-15",   "muscle": "Chest",        "instructions": "Squeeze at peak contraction"},
        {"name": "Face Pulls",              "sets": "4", "reps": "15",      "muscle": "Rear Delts",   "instructions": "Pull to face level, external rotate"},
        {"name": "Leg Press",               "sets": "4", "reps": "12",      "muscle": "Legs",         "instructions": "Full ROM, don't lock knees"},
    ],
    "maintenance": [
        {"name": "Pull-Ups",          "sets": "4", "reps": "8-12",  "muscle": "Back/Biceps",  "instructions": "Full hang, drive elbows down"},
        {"name": "Push-Ups",          "sets": "4", "reps": "15-20", "muscle": "Chest",        "instructions": "Chest to floor, full extension"},
        {"name": "Goblet Squats",     "sets": "4", "reps": "12",    "muscle": "Legs",         "instructions": "Hold dumbbell at chest, squat deep"},
        {"name": "Dumbbell Rows",     "sets": "3", "reps": "12",    "muscle": "Back",         "instructions": "Full ROM, squeeze at top"},
        {"name": "Plank",             "sets": "3", "reps": "45s",   "muscle": "Core",         "instructions": "Neutral spine, breathe steadily"},
        {"name": "Lateral Raises",    "sets": "3", "reps": "15",    "muscle": "Shoulders",    "instructions": "Controlled movement, don't swing"},
    ],
    "weight_gain": [
        {"name": "Squat",             "sets": "5", "reps": "5",    "muscle": "Legs/Core",    "instructions": "Heavy compound — full ROM, brace hard"},
        {"name": "Bench Press",       "sets": "5", "reps": "5",    "muscle": "Chest",        "instructions": "Heavy load, controlled descent"},
        {"name": "Deadlift",          "sets": "5", "reps": "5",    "muscle": "Posterior",    "instructions": "Max effort — keep back flat"},
        {"name": "Dips",              "sets": "4", "reps": "10-12","muscle": "Chest/Tri",    "instructions": "Add weight via belt when possible"},
        {"name": "Barbell Curls",     "sets": "4", "reps": "10",   "muscle": "Biceps",       "instructions": "Supinated grip, full elbow extension"},
        {"name": "Leg Press",         "sets": "4", "reps": "10-12","muscle": "Quads",        "instructions": "High foot placement for more glute engagement"},
    ],
}

_WEEKLY_PLANS: dict = {
    "weight_loss": [
        {"day": "Monday",    "focus": "HIIT Cardio",           "rest": False},
        {"day": "Tuesday",   "focus": "Upper Body Circuit",    "rest": False},
        {"day": "Wednesday", "focus": "Active Recovery / Yoga","rest": True},
        {"day": "Thursday",  "focus": "Lower Body HIIT",       "rest": False},
        {"day": "Friday",    "focus": "Full Body Metabolic",   "rest": False},
        {"day": "Saturday",  "focus": "Steady State Cardio",   "rest": False},
        {"day": "Sunday",    "focus": "Complete Rest",         "rest": True},
    ],
    "muscle_gain": [
        {"day": "Monday",    "focus": "Chest & Triceps",       "rest": False},
        {"day": "Tuesday",   "focus": "Back & Biceps",         "rest": False},
        {"day": "Wednesday", "focus": "Rest / Light Cardio",   "rest": True},
        {"day": "Thursday",  "focus": "Legs & Core",           "rest": False},
        {"day": "Friday",    "focus": "Shoulders & Arms",      "rest": False},
        {"day": "Saturday",  "focus": "Full Body Power",       "rest": False},
        {"day": "Sunday",    "focus": "Complete Rest",         "rest": True},
    ],
    "lean_bulk": [
        {"day": "Monday",    "focus": "Push (Chest/Shoulders)","rest": False},
        {"day": "Tuesday",   "focus": "Pull (Back/Biceps)",    "rest": False},
        {"day": "Wednesday", "focus": "Legs & Core",           "rest": False},
        {"day": "Thursday",  "focus": "Active Recovery",       "rest": True},
        {"day": "Friday",    "focus": "Upper Body Hypertrophy","rest": False},
        {"day": "Saturday",  "focus": "Lower Body Hypertrophy","rest": False},
        {"day": "Sunday",    "focus": "Complete Rest",         "rest": True},
    ],
    "maintenance": [
        {"day": "Monday",    "focus": "Full Body Strength",    "rest": False},
        {"day": "Tuesday",   "focus": "Cardio / Mobility",     "rest": False},
        {"day": "Wednesday", "focus": "Rest",                  "rest": True},
        {"day": "Thursday",  "focus": "Full Body Strength",    "rest": False},
        {"day": "Friday",    "focus": "Cardio / Core",         "rest": False},
        {"day": "Saturday",  "focus": "Active Recreation",     "rest": False},
        {"day": "Sunday",    "focus": "Rest",                  "rest": True},
    ],
    "weight_gain": [
        {"day": "Monday",    "focus": "Squat + Press",         "rest": False},
        {"day": "Tuesday",   "focus": "Deadlift + Row",        "rest": False},
        {"day": "Wednesday", "focus": "Rest",                  "rest": True},
        {"day": "Thursday",  "focus": "Squat + Press",         "rest": False},
        {"day": "Friday",    "focus": "Deadlift + Row",        "rest": False},
        {"day": "Saturday",  "focus": "Accessory & Arms",      "rest": False},
        {"day": "Sunday",    "focus": "Rest",                  "rest": True},
    ],
}

_GOAL_META = {
    "weight_loss":  {"type": "Cardio & HIIT",        "intensity": "High"},
    "muscle_gain":  {"type": "Strength Training",    "intensity": "High"},
    "lean_bulk":    {"type": "Hypertrophy + Cardio", "intensity": "Moderate-High"},
    "maintenance":  {"type": "Mixed Training",       "intensity": "Moderate"},
    "weight_gain":  {"type": "Heavy Compounds",      "intensity": "High"},
}


@app.post("/recommend-workout", response_model=WorkoutResponse, summary="Get a personalized workout plan")
async def recommend_workout(req: WorkoutRequest):
    log.info(
        f"[/recommend-workout] age={req.age} gender={req.gender} "
        f"goal={req.fitness_goal} level={req.experience_level}"
    )
    try:
        # Auto-calculate BMI if not supplied
        bmi = req.bmi
        if bmi is None:
            h_m = req.height / 100.0
            bmi = round(req.weight / (h_m * h_m), 1)

        goal_meta = _GOAL_META.get(req.fitness_goal, {"type": "General Fitness", "intensity": "Moderate"})
        exercises  = list(_EXERCISES_DB.get(req.fitness_goal, _EXERCISES_DB["muscle_gain"]))
        weekly_plan = list(_WEEKLY_PLANS.get(req.fitness_goal, _WEEKLY_PLANS["muscle_gain"]))

        # Reduce volume for beginners
        if req.experience_level == "beginner":
            for ex in exercises:
                try:
                    ex["sets"] = str(max(2, int(ex["sets"]) - 1))
                except (ValueError, TypeError):
                    pass

        used_model = False
        ml_note    = ""

        model = models.get("workout")
        if model is not None:
            try:
                g_enc   = 0 if req.gender.lower() == "male" else 1
                exp_map = {"beginner": 0, "intermediate": 1, "advanced": 2}
                goal_map = {"weight_loss": 0, "muscle_gain": 1, "lean_bulk": 2,
                            "maintenance": 3, "weight_gain": 4}
                exp_enc  = exp_map.get(req.experience_level, 1)
                goal_enc = goal_map.get(req.fitness_goal, 3)

                pred = _safe_predict(
                    model,
                    [req.age, g_enc, req.weight, req.height, bmi, exp_enc, goal_enc]
                )
                used_model = True
                ml_note    = f"ML Fitness Score: {round(pred, 2)}"
                log.info(f"  ML prediction: {ml_note}")
            except Exception as exc:
                log.warning(f"  Workout model prediction failed: {exc}")

        recommendation = (
            ml_note if ml_note
            else f"Based on your {req.fitness_goal.replace('_', ' ')} goal and {req.experience_level} level"
        )

        log.info(f"  → type={goal_meta['type']} exercises={len(exercises)} model_used={used_model}")
        return WorkoutResponse(
            recommendation=recommendation,
            workout_type=goal_meta["type"],
            intensity=goal_meta["intensity"],
            exercises=exercises,
            weekly_plan=weekly_plan,
            model_used=used_model,
        )

    except HTTPException:
        raise
    except Exception as exc:
        log.error(f"[/recommend-workout] ERROR: {exc}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Workout recommendation failed: {exc}")


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
