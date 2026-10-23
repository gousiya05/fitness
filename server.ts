import express from "express";
import path from "path";
import fs from "fs";
import http from "http";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { User } from "./api/models/User";
import { Progress } from "./api/models/Progress";
import { WorkoutHistory } from "./api/models/WorkoutHistory";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "flexai-secret-key-2026";
const USE_MONGODB = !!process.env.MONGODB_URI;
// Use 127.0.0.1 explicitly — on Windows, Node 18+ resolves 'localhost' to ::1 (IPv6)
// but FastAPI binds to 0.0.0.0 (IPv4 only), causing ECONNREFUSED on the proxy.
const ML_BACKEND_URL = process.env.ML_BACKEND_URL || "http://127.0.0.1:8000";

if (USE_MONGODB) {
  mongoose.connect(process.env.MONGODB_URI as string)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB error:", err));
}
const upload = multer({ storage: multer.memoryStorage() });

let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured. Please add it to your .env file.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.userId;
    next();
  } catch (err) { res.status(401).json({ error: "Invalid token" }); }
};

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional()
});

// ──────────────────────────────────────────────────────────
// FastAPI proxy helper — uses Node http module (always works)
// Returns clean JSON 503 if FastAPI is unreachable
// ──────────────────────────────────────────────────────────
function proxyToFastAPI(
  req: express.Request,
  res: express.Response,
  targetPath: string,
  method: 'GET' | 'POST' | 'DELETE' = 'POST'
): void {
  const parsed = new URL(`${ML_BACKEND_URL}${targetPath}`);
  const bodyStr = (method !== 'GET' && req.body && Object.keys(req.body).length > 0)
    ? JSON.stringify(req.body)
    : '';

  const options: http.RequestOptions = {
    hostname: parsed.hostname,
    port: parseInt(parsed.port || '8000', 10),
    path: parsed.pathname + (parsed.search || ''),
    method,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr),
    },
  };

  const upstream = http.request(options, (upRes) => {
    let data = '';
    upRes.on('data', (chunk) => { data += chunk; });
    upRes.on('end', () => {
      try {
        const json = JSON.parse(data);
        res.status(upRes.statusCode || 200).json(json);
      } catch {
        res.status(upRes.statusCode || 500).json({ error: data || 'Upstream non-JSON response' });
      }
    });
  });

  upstream.on('error', (err: any) => {
    // Connection refused / ECONNREFUSED — FastAPI not running
    res.status(503).json({
      error: 'ML backend unavailable',
      detail: `Cannot connect to FastAPI at ${ML_BACKEND_URL}. Start it: cd backend && python -m uvicorn main:app --port 8000`,
      ml_url: ML_BACKEND_URL,
    });
  });

  if (bodyStr) upstream.write(bodyStr);
  upstream.end();
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json({ limit: '20mb' }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: "Too many requests, please try again after 15 minutes" }
  });

  app.use("/api/auth", apiLimiter);
  app.use("/api/gemini", apiLimiter);

  // ────────────────────────────────────────────────────────
  // Auth Routes
  // ────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const validated = registerSchema.parse(req.body);
      const { email, password, firstName, lastName } = validated;
      if (USE_MONGODB) {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ email, password: hashedPassword, firstName, lastName, onboarded: false });
        const token = jwt.sign({ userId: email }, JWT_SECRET);
        res.json({ token, user: { email, firstName, lastName, onboarded: false } });
      } else {
        const token = jwt.sign({ userId: email }, JWT_SECRET);
        res.json({ token, user: { email, firstName, lastName, onboarded: false } });
      }
    } catch (error: any) { next(error); }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (USE_MONGODB) {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });
        if (!user.password || !await bcrypt.compare(password, user.password)) return res.status(400).json({ error: "Invalid credentials" });
        const token = jwt.sign({ userId: email }, JWT_SECRET);
        const userObj = user.toObject();
        delete userObj.password;
        res.json({ token, user: userObj });
      } else {
        const token = jwt.sign({ userId: email }, JWT_SECRET);
        res.json({ token, user: { email, firstName: 'User', onboarded: true } });
      }
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/user/profile", authenticate, async (req: any, res) => {
    try {
      if (USE_MONGODB) {
        const user = await User.findOne({ email: req.userId });
        res.json(user ? user : {});
      } else { res.json({ email: req.userId }); }
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/user/profile", authenticate, async (req: any, res) => {
    try {
      if (USE_MONGODB) await User.findOneAndUpdate({ email: req.userId }, { ...req.body, onboarded: true });
      res.json({ success: true });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // ────────────────────────────────────────────────────────
  // Progress & Workout History
  // ────────────────────────────────────────────────────────
  app.get("/api/progress", authenticate, async (req: any, res) => {
    try {
      if (USE_MONGODB) {
        const progress = await Progress.find({ email: req.userId }).sort({ date: 1 }).limit(30);
        res.json(progress);
      } else { res.json([]); }
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/progress", authenticate, async (req: any, res) => {
    try {
      if (USE_MONGODB) {
        const newProgress = await Progress.create({ email: req.userId, ...req.body });
        res.json(newProgress);
      } else { res.json({ success: true }); }
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/workout-history", authenticate, async (req: any, res) => {
    try {
      if (USE_MONGODB) {
        const history = await WorkoutHistory.find({ email: req.userId }).sort({ date: -1 }).limit(50);
        res.json(history);
      } else { res.json([]); }
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/workout-history", authenticate, async (req: any, res) => {
    try {
      if (USE_MONGODB) {
        const newWorkout = await WorkoutHistory.create({ email: req.userId, ...req.body });
        res.json(newWorkout);
      } else { res.json({ success: true }); }
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // ────────────────────────────────────────────────────────
  // Food Scanner — requires Gemini
  // ────────────────────────────────────────────────────────
  app.post("/api/food/scan", authenticate, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No image provided" });

      // Check Gemini availability first — return clear error, not crash
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(503).json({
          error: "Gemini API key not configured",
          detail: "Food scanning requires GEMINI_API_KEY. Add it to your .env file to enable this feature.",
          gemini_required: true
        });
      }

      const ai = getAiClient();
      const prompt = `Analyze this food image. Return ONLY strict JSON (no markdown):
{
  "foodItems": [{"name":"string","calories":number,"protein":"Xg","carbs":"Xg","fat":"Xg","fiber":"Xg","sugar":"Xg","portion":"serving description"}],
  "totalCalories": number,
  "recommendation": "brief health tip string",
  "isHealthy": boolean,
  "confidence": "estimated|database|image-analysis",
  "disclaimer": "Nutritional values are estimates based on visual analysis"
}`;
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [prompt, { inlineData: { data: req.file.buffer.toString("base64"), mimeType: req.file.mimetype } }]
      });
      const text = result.text || '';
      const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI returned invalid JSON structure");
      const data = JSON.parse(jsonMatch[0]);
      res.json(data);
    } catch (error: any) {
      console.error("Scanner Error:", error);
      res.status(500).json({ error: error.message || "Analysis failed" });
    }
  });

  // ────────────────────────────────────────────────────────
  // App health check
  // ────────────────────────────────────────────────────────
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      apiKeyConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY",
      dbConfigured: USE_MONGODB,
      mlBackend: ML_BACKEND_URL
    });
  });

  // ────────────────────────────────────────────────────────
  // Gemini Proxy — server-side only, key never exposed
  // ────────────────────────────────────────────────────────
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const ai = getAiClient();
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: systemInstruction || "You are a fitness expert."
        }
      });
      res.json({ text: result.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ════════════════════════════════════════════════════════
  // ML PROXY — forwards /api/ml/* to FastAPI on port 8000
  // This fixes the "Unexpected token 'A'" JSON parse error
  // caused by Vite returning HTML for unmatched /api/ml/* routes.
  // ════════════════════════════════════════════════════════

  // Health check for ML backend
  app.get("/api/ml/health", async (req, res) => {
    proxyToFastAPI(req, res, "/health", "GET");
  });

  // Predict BMI
  app.post("/api/ml/predict-bmi", async (req, res) => {
    proxyToFastAPI(req, res, "/predict-bmi", "POST");
  });

  // Predict calories burned
  app.post("/api/ml/predict-calories", async (req, res) => {
    proxyToFastAPI(req, res, "/predict-calories", "POST");
  });

  // Recommend workout
  app.post("/api/ml/recommend-workout", async (req, res) => {
    proxyToFastAPI(req, res, "/recommend-workout", "POST");
  });

  // Algorithm Lab — list datasets
  app.get("/api/ml/lab/datasets", async (req, res) => {
    proxyToFastAPI(req, res, "/lab/datasets", "GET");
  });

  // Algorithm Lab — list algorithms
  app.get("/api/ml/lab/algorithms", async (req, res) => {
    proxyToFastAPI(req, res, "/lab/algorithms", "GET");
  });

  // Algorithm Lab — train model
  app.post("/api/ml/lab/train", async (req, res) => {
    proxyToFastAPI(req, res, "/lab/train", "POST");
  });

  // Algorithm Lab — list trained models
  app.get("/api/ml/lab/models", async (req, res) => {
    proxyToFastAPI(req, res, "/lab/models", "GET");
  });

  // Algorithm Lab — predict with trained model
  app.post("/api/ml/lab/predict", async (req, res) => {
    proxyToFastAPI(req, res, "/lab/predict", "POST");
  });

  // Algorithm Lab — compare models
  app.get("/api/ml/lab/compare", async (req, res) => {
    proxyToFastAPI(req, res, "/lab/compare", "GET");
  });

  // Algorithm Lab — delete model
  app.delete("/api/ml/lab/model/:id", async (req, res) => {
    proxyToFastAPI(req, res, `/lab/model/${req.params.id}`, "DELETE");
  });

  // Algorithm Lab — dataset info
  app.get("/api/ml/lab/dataset/:name", async (req, res) => {
    proxyToFastAPI(req, res, `/lab/dataset/${req.params.name}`, "GET");
  });

  // ════════════════════════════════════════════════════════
  // Legacy Express ML routes (dataset upload/train/predict)
  // kept for backward compatibility
  // ════════════════════════════════════════════════════════
  const mlBase = path.join(process.cwd(), 'ml');
  const datasetsDir = path.join(mlBase, 'datasets');
  if (!fs.existsSync(datasetsDir)) fs.mkdirSync(datasetsDir, { recursive: true });

  app.post('/api/ml/dataset', upload.single('file'), (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file provided' });
      const filename = Date.now() + '_' + req.file.originalname;
      const dest = path.join(datasetsDir, filename);
      fs.writeFileSync(dest, req.file.buffer);
      res.json({ ok: true, filename });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to upload dataset' });
    }
  });

  app.get('/api/ml/datasets', async (req, res) => {
    // Return built-in datasets from FastAPI + uploaded datasets
    try {
      const files = fs.readdirSync(datasetsDir).filter((f: string) => f.includes('_'));
      res.json({ datasets: files, note: 'Use /api/ml/lab/datasets for scikit-learn built-in datasets' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to list datasets' });
    }
  });

  app.delete('/api/ml/dataset/:name', (req, res) => {
    const filePath = path.join(datasetsDir, req.params.name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ deleted: true });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  app.post('/api/ml/train', (req, res) => {
    const datasetName = req.body?.dataset;
    const cmd = datasetName
      ? `npx tsx ml/train.ts "${datasetName}"`
      : `npx tsx ml/train.ts`;
    exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: 'Training failed', details: stderr });
      }
      res.json({ ok: true, output: stdout });
    });
  });

  app.post('/api/ml/predict', (req, res) => {
    try {
      const { input } = req.body;
      const weight = Array.isArray(input) ? input[0] : input;
      const modelPath = path.join(mlBase, 'model.json');
      if (!fs.existsSync(modelPath)) {
        const estimatedCalories = Math.round(weight * 15 + 500);
        return res.json({ prediction: estimatedCalories, source: 'formula-estimate' });
      }
      const model = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
      const predicted = model.slope * weight + model.intercept;
      return res.json({ prediction: Math.round(predicted), source: 'trained-model' });
    } catch (err: any) {
      res.status(500).json({ error: 'Prediction failed' });
    }
  });

  // ────────────────────────────────────────────────────────
  // Vite dev middleware / Static production build
  // ────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  // Centralized Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack || err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: err.issues ?? err.message });
    }
    res.status(500).json({ error: "Internal Server Error" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`ML backend proxied from ${ML_BACKEND_URL}`);
  });
}

startServer();
