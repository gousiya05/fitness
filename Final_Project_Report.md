# Final Project Report: AI Fitness Platform (FlexAI)

## 1. Problem Statement
The modern fitness landscape is highly fragmented. Users often juggle multiple applications to track calories, log workouts, predict progress, and receive coaching. Additionally, most generic fitness apps lack personalized, AI-driven insights that adapt dynamically to a user's biometric telemetry and dietary habits. The problem is a lack of a unified, highly aesthetic, and intelligent system capable of acting as a holistic "Neural Link" between human physiology and data-driven progress.

## 2. Objectives
- **Unified Ecosystem:** Provide a single platform merging diet tracking, AI form analysis, workout recommendations, and progress tracking.
- **AI Integration:** Utilize cutting-edge LLMs (Google Gemini 2.5) to provide real-time nutritional scanning and dynamic coaching.
- **Biometric Persistence:** Store and track detailed user profiles, historical weigh-ins, and metabolic data to visualize trends.
- **Machine Learning Pipelines:** Incorporate custom regression models to predict calorie expenditure based on real user datasets.
- **Premium User Experience:** Deliver an immersive, dark-mode "cyber/neural" aesthetic with high-performance animations and seamless responsiveness.

## 3. Dataset Description
The ML pipeline within this platform utilizes CSV-based datasets containing fitness metrics.
Typical columns include:
- `Weight (kg)`: The user's body mass.
- `Duration (min)`: Length of physical activity.
- `Heart_Rate (bpm)`: Average cardiovascular intensity.
- `Calories_Burned`: Target variable representing metabolic output.
These datasets are parsed dynamically and fed into a linear regression model to predict individualized energy expenditure.

## 4. Algorithms Used
- **Computer Vision (MediaPipe):** Used for real-time skeletal tracking and form correction (`PoseDetector`).
- **Generative AI (Gemini 2.5 Flash):** Used for zero-shot image classification (Food Scanner) and conversational agents (AI Coach).
- **Linear Regression (Custom TS Implementation):** Used in the `ml/train.ts` pipeline to predict calorie burns based on independent variables like weight.
- **JWT Authentication:** Cryptographic signing algorithm (HMAC-SHA256) for secure stateless sessions.
- **Bcrypt:** Password hashing algorithm using salt rounds for secure credential storage.

## 5. System Architecture
- **Frontend (Client-Side):** React 19, Vite, Tailwind CSS (v4), Shadcn UI, Motion (Framer Motion). Handles UI, local state, and MediaPipe processing.
- **Backend (Server-Side):** Express.js (Node.js/TS), handling RESTful API routes, file uploads (Multer), and Gemini proxying.
- **Database (Persistence):** MongoDB (Mongoose ORM). Schemas defined for `User`, `Progress`, and `WorkoutHistory`.
- **Infrastructure:** Docker-ready, monolithic repository with an `esbuild` bundled Node server serving the Vite static build.

## 6. Results
The finalized platform successfully achieves its objectives:
- **Authentication:** Users can securely register, log in, and maintain sessions via JWT.
- **Dynamic Profiles:** The application dynamically adjusts baseline calorie targets (TDEE) and macronutrient splits based on age, gender, height, weight, and fitness goals.
- **Intelligent Dashboards:** Users visualize their "Mass Delta" (weight trends) and "Metabolic Intensity" (calorie burn history) populated directly from MongoDB.
- **Computer Vision & AI:** The food scanner accurately identifies nutritional content from raw images, and the Pose tracker provides real-time form feedback.

## 7. Future Scope
- **Wearable Integration:** Syncing directly with Apple HealthKit or Google Fit APIs for automated telemetry collection.
- **Advanced Neural Networks:** Replacing simple linear regression with deep learning models (e.g., LSTMs) for time-series progress forecasting.
- **Social Features:** Allowing users to share "Neural Streaks" and workout templates in a community hub.
- **Push Notifications:** Implementing Service Workers for real-time hydration and meal reminders.
