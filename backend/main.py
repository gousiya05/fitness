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
    exercises:      list[WorkoutExercise]
    weekly_plan:    list[WeeklyPlanDay]
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
    """Encode gender using the saved LabelEncoder, with numeric fallback.
    Normalises to lowercase to handle encoders trained on 'male'/'female'.
    """
    try:
        if encoder is not None:
            return int(encoder.transform([gender.strip().lower()])[0])
    except (ValueError, KeyError, AttributeError):
        pass
    # Numeric fallback (male→0, female→1 by sklearn default alphabetical order)
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


# BMI model class → (category, risk)
# Verified by testing RandomForestClassifier output against known BMI values.
_BMI_CLASS_MAP: dict = {
    0: ("Extremely Underweight", "Critically low BMI. Seek immediate medical attention."),
    1: ("Underweight",           "High vulnerability to immune issues and nutrient deficiency."),
    2: ("Healthy",               "Low metabolic risk profile. Optimal BMI range."),
    3: ("Healthy",               "Low metabolic risk profile. Optimal BMI range."),
    4: ("Obese",                 "High cardiovascular and metabolic warning. Seek medical advice."),
    5: ("Extremely Obese",       "Critical BMI range. Immediate lifestyle intervention needed."),
}


# Workout DataFrame goal/level keyword maps
# Tag vocabulary confirmed from the 2,598-row dataset:
# Bodybuilding, Muscle & Sculpting, Powerbuilding, Athletics,
# Powerlifting, Bodyweight Fitness, Olympic Weightlifting
_WORKOUT_GOAL_KEYWORDS: dict = {
    "weight_loss":  ["Bodyweight Fitness", "Athletics"],
    "muscle_gain":  ["Bodybuilding", "Muscle & Sculpting"],
    "lean_bulk":    ["Bodybuilding", "Powerbuilding", "Muscle & Sculpting"],
    "maintenance":  ["Bodyweight Fitness", "Athletics", "Muscle & Sculpting"],
    "weight_gain":  ["Powerbuilding", "Powerlifting", "Athletics"],
}
_WORKOUT_LEVEL_KEYWORDS: dict = {
    "beginner":     ["Beginner", "Novice"],
    "intermediate": ["Intermediate"],
    "advanced":     ["Advanced"],
}


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
            try:
                g_enc = _encode_gender(encoder, req.gender)
                # bmi_model is a RandomForestClassifier returning a category class (0–5),
                # NOT a raw BMI float. Features: [gender_enc, height_cm, weight_kg]
                arr  = np.array([[g_enc, req.height, req.weight]], dtype=float)
                pred_class = int(model.predict(arr)[0])
                if pred_class in _BMI_CLASS_MAP:
                    used_model = True
                    log.info(f"  ML classifier → class={pred_class}")
                else:
                    log.warning(f"  ML classifier returned unknown class={pred_class}")
            except Exception as exc:
                log.warning(f"  BMI classifier failed: {exc}")

        # Always use formula for the numeric BMI value; use model for category when available
        if used_model:
            category, risk = _BMI_CLASS_MAP[pred_class]
        else:
            category, risk = _bmi_category(bmi_value)
            log.info("  Falling back to canonical BMI category")
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
            # calorie_model was trained on exactly 7 features:
            # Gender(enc), Age, Height, Weight, Duration, Heart_Rate, Body_Temp
            feature_sets = [
                [g_enc, req.age, req.height, req.weight, req.duration, req.heart_rate, req.body_temp],
                [g_enc, req.age, req.weight, req.duration, req.heart_rate, req.body_temp],
                [g_enc, req.age, req.weight, req.duration, req.heart_rate],
                [req.age, req.weight, req.duration, req.heart_rate],
            ]
            for features in feature_sets:
                try:
                    pred = round(_safe_predict(model, features), 1)
                    if 1.0 <= pred <= 5000.0:
                        calories   = pred
                        used_model = True
                        log.info(f"  XGBoost pred={calories} kcal (features={len(features)})")
                        break
                    else:
                        log.warning(f"  XGBoost features({len(features)}): out-of-range pred={pred:.1f}")
                except Exception as exc:
                    log.warning(f"  XGBoost features({len(features)}): {exc}")

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

        # workout model is a pandas DataFrame of 2,598 real workout programs.
        # Filter by goal keywords and experience level to find the best match.
        df = models.get("workout")
        if df is not None:
            try:
                import ast
                goal_keywords  = _WORKOUT_GOAL_KEYWORDS.get(req.fitness_goal, [])
                level_keywords = _WORKOUT_LEVEL_KEYWORDS.get(req.experience_level, ["Intermediate"])

                def _matches_goal(cell: str) -> bool:
                    try:
                        vals = ast.literal_eval(cell) if isinstance(cell, str) else []
                        return any(kw in v for kw in goal_keywords for v in vals)
                    except Exception:
                        return False

                def _matches_level(cell: str) -> bool:
                    try:
                        vals = ast.literal_eval(cell) if isinstance(cell, str) else []
                        return any(kw in v for kw in level_keywords for v in vals)
                    except Exception:
                        return False

                mask_goal  = df["goal"].apply(_matches_goal)
                mask_level = df["level"].apply(_matches_level)

                # Priority: goal + level match → goal-only match → any match
                filtered = df[mask_goal & mask_level]
                if filtered.empty:
                    filtered = df[mask_goal]
                if filtered.empty:
                    filtered = df

                # Pick the program with the most exercises (most comprehensive)
                best = filtered.sort_values("total_exercises", ascending=False).iloc[0]
                title = str(best["title"]).strip()
                desc  = str(best["description"]).strip()[:200]
                prog_len = best.get("program_length", "N/A")
                ml_note = f"{title} ({prog_len} weeks) — {desc}..."
                used_model = True
                log.info(f"  DataFrame lookup → '{title}' (from {len(filtered)} matches)")
            except Exception as exc:
                log.warning(f"  Workout DataFrame lookup failed: {exc}")

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


# ===========================================================================
# TRADITIONAL ML ALGORITHM LAB
# Classification & Regression using scikit-learn on real built-in datasets
# All results are real — no fabricated metrics.
# ===========================================================================

import uuid
import time
import warnings
from typing import Any, Dict, List, Optional as Opt

warnings.filterwarnings("ignore")

try:
    import pandas as pd
    from sklearn.datasets import (
        load_breast_cancer, load_iris, load_wine,
        fetch_california_housing, make_classification, make_regression
    )
    from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge
    from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
    from sklearn.ensemble import (
        RandomForestClassifier, RandomForestRegressor,
        GradientBoostingRegressor, GradientBoostingClassifier
    )
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.svm import SVC
    from sklearn.naive_bayes import GaussianNB
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler, LabelEncoder
    from sklearn.pipeline import Pipeline
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score,
        confusion_matrix, mean_absolute_error, mean_squared_error, r2_score,
        roc_auc_score
    )
    ML_LAB_AVAILABLE = True
    log.info("  ML Lab: scikit-learn & pandas available.")
except ImportError as e:
    ML_LAB_AVAILABLE = False
    log.warning(f"  ML Lab unavailable: {e}")

# ── In-memory trained model registry ──────────────────────────────────────
_lab_models: Dict[str, Dict] = {}

# ── Dataset registry ──────────────────────────────────────────────────────

def _load_dataset(name: str) -> Dict:
    """Load a dataset by name. Returns {X, y, feature_names, target_names, task}."""
    if not ML_LAB_AVAILABLE:
        raise HTTPException(503, "scikit-learn not installed on server")

    if name == "breast_cancer":
        d = load_breast_cancer()
        return {
            "X": d.data, "y": d.target,
            "feature_names": list(d.feature_names),
            "target_names": list(d.target_names),
            "task": "classification", "n_classes": len(d.target_names),
            "description": f"Binary classification — {d.data.shape[0]} samples, {d.data.shape[1]} features."
        }
    elif name == "iris":
        d = load_iris()
        return {
            "X": d.data, "y": d.target,
            "feature_names": list(d.feature_names),
            "target_names": list(d.target_names),
            "task": "classification", "n_classes": len(d.target_names),
            "description": f"Multi-class classification — {d.data.shape[0]} samples, {d.data.shape[1]} features."
        }
    elif name == "wine":
        d = load_wine()
        return {
            "X": d.data, "y": d.target,
            "feature_names": list(d.feature_names),
            "target_names": list(d.target_names),
            "task": "classification", "n_classes": len(d.target_names),
            "description": f"Multi-class classification — {d.data.shape[0]} samples, {d.data.shape[1]} features."
        }
    elif name == "california_housing":
        d = fetch_california_housing()
        return {
            "X": d.data, "y": d.target,
            "feature_names": list(d.feature_names),
            "target_names": ["MedHouseVal"],
            "task": "regression", "n_classes": 1,
            "description": f"Regression — {d.data.shape[0]} samples, {d.data.shape[1]} features. Predict median house value."
        }
    elif name == "synthetic_classification":
        X, y = make_classification(n_samples=1000, n_features=10, n_informative=6,
                                   n_classes=2, random_state=42)
        return {
            "X": X, "y": y,
            "feature_names": [f"feature_{i}" for i in range(10)],
            "target_names": ["class_0", "class_1"],
            "task": "classification", "n_classes": 2,
            "description": "Synthetic binary classification — 1000 samples, 10 features (6 informative)."
        }
    elif name == "synthetic_regression":
        X, y = make_regression(n_samples=1000, n_features=10, n_informative=6,
                               noise=10.0, random_state=42)
        return {
            "X": X, "y": y,
            "feature_names": [f"feature_{i}" for i in range(10)],
            "target_names": ["target"],
            "task": "regression", "n_classes": 1,
            "description": "Synthetic regression — 1000 samples, 10 features (6 informative)."
        }
    else:
        raise HTTPException(404, f"Dataset '{name}' not found.")


def _build_model(algorithm: str, task: str, hyperparams: Dict) -> Any:
    """Instantiate a scikit-learn model by algorithm name."""
    hp = hyperparams or {}
    if task == "classification":
        if algorithm == "logistic_regression":
            return LogisticRegression(
                C=float(hp.get("C", 1.0)),
                max_iter=int(hp.get("max_iter", 1000)),
                random_state=42
            )
        elif algorithm == "decision_tree":
            return DecisionTreeClassifier(
                max_depth=int(hp.get("max_depth", 5)) or None,
                min_samples_split=int(hp.get("min_samples_split", 2)),
                random_state=42
            )
        elif algorithm == "random_forest":
            return RandomForestClassifier(
                n_estimators=int(hp.get("n_estimators", 100)),
                max_depth=int(hp.get("max_depth", 0)) or None,
                random_state=42, n_jobs=-1
            )
        elif algorithm == "knn":
            return KNeighborsClassifier(
                n_neighbors=int(hp.get("n_neighbors", 5)),
                weights=hp.get("weights", "uniform")
            )
        elif algorithm == "svm":
            return SVC(
                C=float(hp.get("C", 1.0)),
                kernel=hp.get("kernel", "rbf"),
                probability=True, random_state=42
            )
        elif algorithm == "naive_bayes":
            return GaussianNB()
        elif algorithm == "gradient_boosting":
            return GradientBoostingClassifier(
                n_estimators=int(hp.get("n_estimators", 100)),
                learning_rate=float(hp.get("learning_rate", 0.1)),
                max_depth=int(hp.get("max_depth", 3)),
                random_state=42
            )
    elif task == "regression":
        if algorithm == "linear_regression":
            return LinearRegression()
        elif algorithm == "ridge":
            return Ridge(alpha=float(hp.get("alpha", 1.0)))
        elif algorithm == "decision_tree":
            return DecisionTreeRegressor(
                max_depth=int(hp.get("max_depth", 5)) or None,
                random_state=42
            )
        elif algorithm == "random_forest":
            return RandomForestRegressor(
                n_estimators=int(hp.get("n_estimators", 100)),
                max_depth=int(hp.get("max_depth", 0)) or None,
                random_state=42, n_jobs=-1
            )
        elif algorithm == "gradient_boosting":
            return GradientBoostingRegressor(
                n_estimators=int(hp.get("n_estimators", 100)),
                learning_rate=float(hp.get("learning_rate", 0.1)),
                max_depth=int(hp.get("max_depth", 3)),
                random_state=42
            )
    raise HTTPException(400, f"Unknown algorithm '{algorithm}' for task '{task}'.")


# ── Pydantic schemas ───────────────────────────────────────────────────────

class TrainRequest(BaseModel):
    dataset: str = Field(..., example="iris")
    algorithm: str = Field(..., example="random_forest")
    test_size: float = Field(default=0.2, ge=0.05, le=0.5)
    random_seed: int = Field(default=42)
    hyperparams: Dict[str, Any] = Field(default_factory=dict)
    scale_features: bool = Field(default=True)

class PredictLabRequest(BaseModel):
    model_id: str
    features: List[float]


# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/lab/datasets", summary="List available datasets for the ML lab")
async def lab_datasets():
    if not ML_LAB_AVAILABLE:
        raise HTTPException(503, "scikit-learn not installed")
    return {
        "datasets": [
            {"id": "breast_cancer",           "name": "Breast Cancer Wisconsin",     "task": "classification", "samples": 569,  "features": 30},
            {"id": "iris",                     "name": "Iris",                        "task": "classification", "samples": 150,  "features": 4},
            {"id": "wine",                     "name": "Wine",                        "task": "classification", "samples": 178,  "features": 13},
            {"id": "california_housing",       "name": "California Housing",          "task": "regression",     "samples": 20640,"features": 8},
            {"id": "synthetic_classification", "name": "Synthetic Classification",   "task": "classification", "samples": 1000, "features": 10},
            {"id": "synthetic_regression",     "name": "Synthetic Regression",        "task": "regression",     "samples": 1000, "features": 10},
        ]
    }


@app.get("/lab/dataset/{name}", summary="Get feature names and statistics for a dataset")
async def lab_dataset_info(name: str):
    d = _load_dataset(name)
    X, y = d["X"], d["y"]
    df = pd.DataFrame(X, columns=d["feature_names"])
    stats = df.describe().round(4).to_dict()
    class_dist: Dict = {}
    if d["task"] == "classification":
        unique, counts = np.unique(y, return_counts=True)
        class_dist = {d["target_names"][int(u)]: int(c) for u, c in zip(unique, counts)}
    return {
        "name": name,
        "task": d["task"],
        "n_samples": int(X.shape[0]),
        "n_features": int(X.shape[1]),
        "feature_names": d["feature_names"],
        "target_names": d["target_names"],
        "n_classes": d["n_classes"],
        "description": d["description"],
        "class_distribution": class_dist,
        "feature_stats": stats,
    }


@app.get("/lab/algorithms", summary="List available ML algorithms")
async def lab_algorithms():
    return {
        "classification": [
            {"id": "logistic_regression", "name": "Logistic Regression",     "hyperparams": ["C", "max_iter"]},
            {"id": "decision_tree",       "name": "Decision Tree",           "hyperparams": ["max_depth", "min_samples_split"]},
            {"id": "random_forest",       "name": "Random Forest",           "hyperparams": ["n_estimators", "max_depth"]},
            {"id": "knn",                 "name": "K-Nearest Neighbors",     "hyperparams": ["n_neighbors", "weights"]},
            {"id": "svm",                 "name": "Support Vector Machine",  "hyperparams": ["C", "kernel"]},
            {"id": "naive_bayes",         "name": "Gaussian Naive Bayes",    "hyperparams": []},
            {"id": "gradient_boosting",   "name": "Gradient Boosting",       "hyperparams": ["n_estimators", "learning_rate", "max_depth"]},
        ],
        "regression": [
            {"id": "linear_regression",  "name": "Linear Regression",       "hyperparams": []},
            {"id": "ridge",              "name": "Ridge Regression",        "hyperparams": ["alpha"]},
            {"id": "decision_tree",      "name": "Decision Tree Regressor", "hyperparams": ["max_depth"]},
            {"id": "random_forest",      "name": "Random Forest Regressor", "hyperparams": ["n_estimators", "max_depth"]},
            {"id": "gradient_boosting",  "name": "Gradient Boosting",       "hyperparams": ["n_estimators", "learning_rate", "max_depth"]},
        ]
    }


@app.post("/lab/train", summary="Train a model on a real dataset and return metrics")
async def lab_train(req: TrainRequest):
    if not ML_LAB_AVAILABLE:
        raise HTTPException(503, "scikit-learn not installed on server")
    t0 = time.time()
    try:
        d = _load_dataset(req.dataset)
        X, y = d["X"], d["y"]
        task = d["task"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=req.test_size, random_state=req.random_seed, stratify=(y if task == "classification" else None)
        )

        estimator = _build_model(req.algorithm, task, req.hyperparams)

        if req.scale_features:
            pipeline = Pipeline([("scaler", StandardScaler()), ("model", estimator)])
        else:
            pipeline = Pipeline([("model", estimator)])

        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)
        elapsed = round(time.time() - t0, 3)

        metrics: Dict = {}
        if task == "classification":
            metrics["accuracy"]  = round(float(accuracy_score(y_test, y_pred)), 4)
            avg = "binary" if d["n_classes"] == 2 else "weighted"
            metrics["precision"] = round(float(precision_score(y_test, y_pred, average=avg, zero_division=0)), 4)
            metrics["recall"]    = round(float(recall_score(y_test, y_pred, average=avg, zero_division=0)), 4)
            metrics["f1_score"]  = round(float(f1_score(y_test, y_pred, average=avg, zero_division=0)), 4)
            cm = confusion_matrix(y_test, y_pred)
            metrics["confusion_matrix"] = cm.tolist()
            try:
                if d["n_classes"] == 2:
                    y_prob = pipeline.predict_proba(X_test)[:, 1]
                    metrics["roc_auc"] = round(float(roc_auc_score(y_test, y_prob)), 4)
                else:
                    y_prob = pipeline.predict_proba(X_test)
                    metrics["roc_auc"] = round(float(roc_auc_score(y_test, y_prob, multi_class="ovr", average="weighted")), 4)
            except Exception:
                metrics["roc_auc"] = None
        else:
            metrics["mae"]  = round(float(mean_absolute_error(y_test, y_pred)), 4)
            metrics["mse"]  = round(float(mean_squared_error(y_test, y_pred)), 4)
            metrics["rmse"] = round(float(np.sqrt(metrics["mse"])), 4)
            metrics["r2"]   = round(float(r2_score(y_test, y_pred)), 4)

        model_id = str(uuid.uuid4())[:8]
        _lab_models[model_id] = {
            "id": model_id,
            "dataset": req.dataset,
            "algorithm": req.algorithm,
            "task": task,
            "feature_names": d["feature_names"],
            "target_names": d["target_names"],
            "pipeline": pipeline,
            "metrics": metrics,
            "hyperparams": req.hyperparams,
            "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "train_size": int(len(X_train)),
            "test_size": int(len(X_test)),
            "training_time_s": elapsed,
        }

        return {
            "model_id": model_id,
            "dataset": req.dataset,
            "algorithm": req.algorithm,
            "task": task,
            "metrics": metrics,
            "train_samples": int(len(X_train)),
            "test_samples": int(len(X_test)),
            "training_time_s": elapsed,
            "feature_names": d["feature_names"],
            "target_names": d["target_names"],
        }
    except HTTPException:
        raise
    except Exception as exc:
        log.error(f"[/lab/train] {exc}")
        traceback.print_exc()
        raise HTTPException(500, f"Training failed: {exc}")


@app.get("/lab/models", summary="List all trained models in the session registry")
async def lab_model_list():
    return {
        "models": [
            {k: v for k, v in m.items() if k != "pipeline"}
            for m in _lab_models.values()
        ]
    }


@app.delete("/lab/model/{model_id}", summary="Delete a trained model from the registry")
async def lab_model_delete(model_id: str):
    if model_id not in _lab_models:
        raise HTTPException(404, f"Model '{model_id}' not found")
    del _lab_models[model_id]
    return {"deleted": model_id}


@app.post("/lab/predict", summary="Make a prediction using a trained lab model")
async def lab_predict(req: PredictLabRequest):
    if req.model_id not in _lab_models:
        raise HTTPException(404, f"Model '{req.model_id}' not found. Train a model first.")
    entry = _lab_models[req.model_id]
    pipeline = entry["pipeline"]
    feature_names = entry["feature_names"]
    task = entry["task"]

    if len(req.features) != len(feature_names):
        raise HTTPException(400, f"Expected {len(feature_names)} features, got {len(req.features)}")

    try:
        arr = np.array([req.features], dtype=float)
        prediction = pipeline.predict(arr)
        result_val = float(prediction[0]) if task == "regression" else int(prediction[0])

        response: Dict = {
            "model_id": req.model_id,
            "prediction": result_val,
            "task": task,
        }

        if task == "classification":
            target_names = entry.get("target_names", [])
            if target_names and 0 <= result_val < len(target_names):
                response["predicted_class"] = target_names[int(result_val)]
            try:
                proba = pipeline.predict_proba(arr)[0]
                response["probabilities"] = {
                    (target_names[i] if i < len(target_names) else f"class_{i}"): round(float(p), 4)
                    for i, p in enumerate(proba)
                }
            except Exception:
                pass

        return response
    except HTTPException:
        raise
    except Exception as exc:
        log.error(f"[/lab/predict] {exc}")
        raise HTTPException(500, f"Prediction failed: {exc}")


@app.get("/lab/compare", summary="Compare all trained models on their evaluation metrics")
async def lab_compare():
    if not _lab_models:
        return {"models": [], "message": "No models trained yet."}
    rows = []
    for entry in _lab_models.values():
        row = {
            "model_id": entry["id"],
            "dataset": entry["dataset"],
            "algorithm": entry["algorithm"],
            "task": entry["task"],
            "trained_at": entry["trained_at"],
            "training_time_s": entry["training_time_s"],
        }
        row.update(entry["metrics"])
        rows.append(row)
    return {"models": rows}


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
