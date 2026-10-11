"""
test_api.py - Verify all FastAPI endpoints return model_used=True
"""
import sys
import json

try:
    import urllib.request
    import urllib.error
except ImportError:
    print("urllib not available")
    sys.exit(1)

BASE = "http://localhost:8000"
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

def get(path):
    with urllib.request.urlopen(BASE + path, timeout=10) as r:
        return json.loads(r.read())

def post(path, payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        BASE + path, data=data,
        headers={"Content-Type": "application/json"}, method="POST"
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

# ─── 1. Health ───
print("=" * 55)
print("TEST 1: GET /health")
print("=" * 55)
try:
    r = get("/health")
    print("  Response:", json.dumps(r, indent=4))
    if r.get("status") == "healthy":
        ok("status=healthy")
    else:
        fail(f"status={r.get('status')}")
    total = r.get("total_loaded", 0)
    if total == 5:
        ok(f"total_loaded={total} (all 5 models)")
    else:
        fail(f"total_loaded={total} (expected 5)")
    for model, loaded in r.get("models_loaded", {}).items():
        if loaded:
            ok(f"model '{model}' loaded=True")
        else:
            fail(f"model '{model}' loaded=False")
except Exception as e:
    fail(f"/health failed: {e}")

# ─── 2. BMI ───
print()
print("=" * 55)
print("TEST 2: POST /predict-bmi  (model_used must be True)")
print("=" * 55)
try:
    r = post("/predict-bmi", {"gender": "Male", "height": 175, "weight": 75})
    print("  Response:", json.dumps(r, indent=4))
    if r.get("model_used") == True:
        ok(f"model_used=True  bmi_value={r['bmi_value']}  category={r['category']}")
    else:
        fail(f"model_used=False — still using fallback formula!")
    if r.get("bmi_value") and 10 < r["bmi_value"] < 60:
        ok(f"bmi_value={r['bmi_value']} in plausible range")
    else:
        fail(f"bmi_value={r.get('bmi_value')} out of range")
except Exception as e:
    fail(f"/predict-bmi failed: {e}")

# ─── 3. Calories ───
print()
print("=" * 55)
print("TEST 3: POST /predict-calories  (model_used must be True)")
print("=" * 55)
try:
    payload = {
        "gender": "Male", "age": 25, "height": 175,
        "weight": 75, "duration": 30, "heart_rate": 145, "body_temp": 37.0
    }
    r = post("/predict-calories", payload)
    print("  Response:", json.dumps(r, indent=4))
    if r.get("model_used") == True:
        ok(f"model_used=True  calories={r['calories_burned']} kcal")
    else:
        fail("model_used=False — still using MET fallback formula!")
    if 1 <= r.get("calories_burned", 0) <= 5000:
        ok(f"calories_burned={r['calories_burned']} in plausible range")
    else:
        fail(f"calories_burned={r.get('calories_burned')} out of range")
except Exception as e:
    fail(f"/predict-calories failed: {e}")

# ─── 4. Workout ───
print()
print("=" * 55)
print("TEST 4: POST /recommend-workout  (model_used must be True)")
print("=" * 55)
try:
    payload = {
        "age": 25, "gender": "Male", "weight": 75, "height": 175,
        "fitness_goal": "muscle_gain", "experience_level": "intermediate"
    }
    r = post("/recommend-workout", payload)
    print("  Response (truncated):")
    preview = dict(r)
    preview["exercises"] = f"[{len(r.get('exercises',[]))} exercises]"
    preview["weekly_plan"] = f"[{len(r.get('weekly_plan',[]))} days]"
    preview["recommendation"] = r.get("recommendation","")[:120] + "..."
    print("  ", json.dumps(preview, indent=4))
    if r.get("model_used") == True:
        ok(f"model_used=True  workout_type={r['workout_type']}")
    else:
        fail("model_used=False — still using Node.js fallback rules!")
    rec = r.get("recommendation", "")
    if "Node.js fallback" not in rec and len(rec) > 10:
        ok(f"recommendation is from real DataFrame: '{rec[:80]}...'")
    else:
        fail(f"recommendation looks like fallback: '{rec[:80]}'")
except Exception as e:
    fail(f"/recommend-workout failed: {e}")

# ─── 5. Docs ───
print()
print("=" * 55)
print("TEST 5: GET /docs  (Swagger UI)")
print("=" * 55)
try:
    with urllib.request.urlopen(BASE + "/docs", timeout=10) as r:
        body = r.read().decode()
        if "swagger" in body.lower() or "openapi" in body.lower():
            ok("Swagger UI loaded at /docs")
        else:
            fail("Unexpected /docs response")
except Exception as e:
    fail(f"/docs failed: {e}")

# ─── Summary ───
print()
print("=" * 55)
total = PASS + FAIL
print(f"RESULT: {PASS}/{total} checks passed  |  {FAIL} failed")
print("=" * 55)
if FAIL == 0:
    print("ALL API TESTS PASSED -- FastAPI ML backend fully verified")
    print("Predictions are coming from the actual .pkl models, NOT fallback formulas.")
else:
    print(f"{FAIL} test(s) failed.")
    sys.exit(1)
