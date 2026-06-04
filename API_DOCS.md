# FlexAI API Documentation

Base URL: `http://localhost:3000`

All protected routes require a valid JWT passed in the Authorization header:
`Authorization: Bearer <your_token>`

---

## Authentication Endpoints

### 1. Register User
`POST /api/auth/register`

Creates a new user profile and returns an auth token.

**Request Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
  "user": {
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "onboarded": false
  }
}
```

### 2. Login User
`POST /api/auth/login`

Authenticates a user and returns an auth token. Rate-limited to 100 requests per 15 minutes.

**Request Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

---

## User Endpoints

### 1. Get Profile
`GET /api/user/profile`
*(Protected Route)*

Retrieves the authenticated user's biological telemetry.

**Response (200 OK):**
```json
{
  "email": "user@example.com",
  "age": 25,
  "weight": 75,
  "fitnessGoal": "muscle_gain",
  ...
}
```

### 2. Update Profile
`POST /api/user/profile`
*(Protected Route)*

Updates the authenticated user's metrics.

**Request Body:** (Any subset of user metrics)
```json
{
  "weight": 76,
  "goalWeight": 80
}
```

---

## Machine Learning Endpoints

*(Note: These endpoints are rate-limited to prevent computational exhaustion)*

### 1. Train Model
`POST /api/ml/train`

Triggers the backend TypeScript machine learning pipeline to parse the dataset and output a linear regression model.

**Response (200 OK):**
```json
{
  "ok": true,
  "output": "Training complete. R2 Score: 0.89..."
}
```

### 2. Predict Calorie Burn
`POST /api/ml/predict`

Uses the locally trained model to predict caloric burn based on independent variable input (e.g., body weight).

**Request Body (JSON):**
```json
{
  "input": 80 
}
```

**Response (200 OK):**
```json
{
  "prediction": 1700,
  "source": "trained-model",
  "modelType": "linear-regression",
  "trainR2": 0.89,
  "trainedAt": "2026-05-29T12:00:00Z"
}
```

---

## Computer Vision / Generative AI Endpoints

### 1. Food Scanner
`POST /api/food/scan`
*(Protected Route)*

Uploads an image via `multipart/form-data` for Gemini 2.5 Flash to analyze.

**Request (Form-Data):**
- `image`: [File Blob]

**Response (200 OK):**
```json
{
  "foodItems": [
    {
      "name": "Grilled Salmon",
      "calories": 250,
      "protein": "30g",
      "carbs": "0g",
      "fat": "15g",
      "fiber": "0g",
      "sugar": "0g",
      "portion": "1 fillet"
    }
  ],
  "totalCalories": 250,
  "recommendation": "Excellent source of Omega-3s.",
  "isHealthy": true
}
```
