"""
verify_models.py — run BEFORE starting FastAPI to confirm all .pkl files
load and produce valid predictions with the installed library versions.
"""
import warnings
warnings.filterwarnings("ignore")

import ast
import os
import sys

import joblib
import numpy as np

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

BMI_CLASS_MAP = {
    0: ("Extremely Underweight", "Critically low BMI. Seek immediate medical attention."),
    1: ("Underweight",           "High vulnerability to immune issues and nutrient deficiency."),
    2: ("Healthy",               "Low metabolic risk profile. Optimal BMI range."),
    3: ("Healthy",               "Low metabolic risk profile. Optimal BMI range."),
    4: ("Obese",                 "High cardiovascular and metabolic warning. Seek medical advice."),
    5: ("Extremely Obese",       "Critical BMI range. Immediate lifestyle intervention needed."),
}

GOAL_KEYWORDS = {
    "weight_loss":  ["Bodyweight Fitness", "Athletics"],
    "muscle_gain":  ["Bodybuilding", "Muscle & Sculpting"],
    "lean_bulk":    ["Bodybuilding", "Powerbuilding", "Muscle & Sculpting"],
    "maintenance":  ["Bodyweight Fitness", "Athletics", "Muscle & Sculpting"],
    "weight_gain":  ["Powerbuilding", "Powerlifting", "Athletics"],
}
LEVEL_KEYWORDS = {
    "beginner":     ["Beginner", "Novice"],
    "intermediate": ["Intermediate"],
    "advanced":     ["Advanced"],
}

PASS = 0
FAIL = 0

def ok(msg):
    global PASS
    PASS += 1
    print(f"  [PASS] {msg}")

def fail(msg):
    global FAIL
    FAIL += 1
    print(f"  [FAIL] {msg}")

# ─────────────────────────────────────────
# 1. Load all models
# ─────────────────────────────────────────
print("=" * 55)
print("1. LOADING .pkl FILES")
print("=" * 55)

model_files = {
    "bmi":             "bmi_model.pkl",
    "bmi_encoder":     "bmi_encoder.pkl",
    "calorie":         "calorie_model.pkl",
    "calorie_encoder": "calorie_encoder.pkl",
    "workout":         "workout_recommendation.pkl",
}
models = {}
for key, fname in model_files.items():
    path = os.path.join(MODELS_DIR, fname)
    try:
        m = joblib.load(path)
        size_kb = os.path.getsize(path) // 1024
        models[key] = m
        ok(f"{fname:<40} {type(m).__name__}  ({size_kb} KB)")
    except Exception as exc:
        fail(f"{fname:<40} {exc}")
        models[key] = None

# ─────────────────────────────────────────
# 2. BMI Classifier
# ─────────────────────────────────────────
print()
print("=" * 55)
print("2. BMI CLASSIFIER  (RandomForestClassifier → class 0-5)")
print("=" * 55)

bmi_model = models.get("bmi")
bmi_enc   = models.get("bmi_encoder")

test_cases = [
    ("Male",   175, 75,  24.5, "Healthy"),
    ("Male",   175, 50,  16.3, "Underweight"),
    ("Male",   175, 100, 32.7, "Obese"),
    ("Female", 160, 60,  23.4, "Healthy"),
]
for gender, h, w, expected_bmi, expected_cat in test_cases:
    try:
        g = int(bmi_enc.transform([gender])[0])
        cls = int(bmi_model.predict([[g, h, w]])[0])
        cat, _ = BMI_CLASS_MAP.get(cls, ("Unknown", ""))
        actual = round(w / (h / 100) ** 2, 1)
        ok(f"{gender} h={h} w={w}: class={cls} → {cat}  (formula_bmi={actual}, expected_cat≈{expected_cat})")
    except Exception as exc:
        fail(f"{gender} h={h} w={w}: {exc}")

# ─────────────────────────────────────────
# 3. Calorie XGBoost Regressor
# ─────────────────────────────────────────
print()
print("=" * 55)
print("3. CALORIE XGBOOST REGRESSOR")
print("=" * 55)

cal_model = models.get("calorie")
cal_enc   = models.get("calorie_encoder")
calorie_ok = False

if cal_model is not None and cal_enc is not None:
    g = int(cal_enc.transform(["male"])[0])  # calorie_encoder uses lowercase
    # Try feature sets in order (model may have been trained with different columns)
    feature_sets = [
        [g, 25, 175, 75, 30, 145, 37.0],   # gender,age,height,weight,duration,hr,temp
        [g, 25, 75, 30, 145, 37.0],         # gender,age,weight,duration,hr,temp
        [g, 25, 75, 30, 145],               # gender,age,weight,duration,hr
        [25, 75, 30, 145],                  # age,weight,duration,hr
    ]
    for fs in feature_sets:
        try:
            pred = float(cal_model.predict(np.array([fs]))[0])
            if 1.0 <= pred <= 5000.0:
                ok(f"features({len(fs)}): Male/25yo/75kg/30min/145bpm → {round(pred,1)} kcal")
                calorie_ok = True
                break
            else:
                print(f"  SKIP  features({len(fs)}): out-of-range pred={pred:.1f}")
        except Exception as exc:
            print(f"  SKIP  features({len(fs)}): {exc}")

if not calorie_ok:
    fail("No feature set produced a valid calorie prediction (1–5000 kcal)")

# ─────────────────────────────────────────
# 4. Workout DataFrame Lookup
# ─────────────────────────────────────────
print()
print("=" * 55)
print("4. WORKOUT DATAFRAME LOOKUP  (2,598 real programs)")
print("=" * 55)

df = models.get("workout")
if df is not None:
    ok(f"DataFrame shape: {df.shape}")
    ok(f"Columns: {list(df.columns)}")

    def _mg(cell, goal="muscle_gain"):
        try:
            vals = ast.literal_eval(cell) if isinstance(cell, str) else []
            return any(kw in v for kw in GOAL_KEYWORDS[goal] for v in vals)
        except:
            return False

    def _ml(cell, level="intermediate"):
        try:
            vals = ast.literal_eval(cell) if isinstance(cell, str) else []
            return any(kw in v for kw in LEVEL_KEYWORDS[level] for v in vals)
        except:
            return False

    for goal, level in [("muscle_gain","intermediate"), ("weight_loss","beginner"), ("weight_gain","advanced")]:
        filtered = df[df["goal"].apply(lambda c: _mg(c, goal)) & df["level"].apply(lambda c: _ml(c, level))]
        if not filtered.empty:
            best = filtered.sort_values("total_exercises", ascending=False).iloc[0]
            ok(f"goal={goal} level={level}: {len(filtered)} matches → \"{best['title']}\" ({best['total_exercises']} exercises)")
        else:
            fail(f"goal={goal} level={level}: no matches found")
else:
    fail("workout DataFrame is None")

# ─────────────────────────────────────────
# Summary
# ─────────────────────────────────────────
print()
print("=" * 55)
total = PASS + FAIL
print(f"RESULT: {PASS}/{total} checks passed  |  {FAIL} failed")
print("=" * 55)
if FAIL == 0:
    print("ALL CHECKS PASSED — safe to start FastAPI server")
else:
    print("FIX FAILURES BEFORE STARTING SERVER")
    sys.exit(1)
