import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "./api/models/User";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "flexai-secret-key-2026";
const USE_MONGODB = !!process.env.MONGODB_URI;
if (USE_MONGODB) {
  mongoose.connect(process.env.MONGODB_URI as string).then(() => console.log("Connected to MongoDB")).catch(err => console.error(err));
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

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);
  app.use(express.json());

  // Auth & Profile Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
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
    } catch (error: any) { res.status(500).json({ error: error.message }); }
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

  // Food Scanner Route
  app.post("/api/food/scan", authenticate, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No image provided" });
      const ai = getAiClient();
      const prompt = `Analyze this food image and provide detailed nutritional information. Return strict JSON: { "foodItems": [{"name":"string","calories":number,"protein":"string","carbs":"string","fat":"string","fiber":"string","sugar":"string","portion":"string"}], "totalCalories": number, "recommendation": "string", "isHealthy": boolean }`;
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [prompt, { inlineData: { data: req.file.buffer.toString("base64"), mimeType: req.file.mimetype } }]
      });
      const text = result.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid AI response");
      const data = JSON.parse(jsonMatch[0]);
      if (USE_MONGODB) {
        try {
          // If we had a scans schema we could use it here. For now, we can omit or push to an array on user if added.
        } catch (e) {}
      }
      res.json(data);
    } catch (error: any) {
      console.error("Scanner Error:", error);
      res.status(500).json({ error: error.message || "Analysis failed" });
    }
  });
  
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      apiKeyConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY",
      dbConfigured: USE_MONGODB
    });
  });

  // Gemini Proxy
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

  // =============================================
  // ML Pipeline Routes (no API keys required)
  // =============================================
  const mlBase = path.join(process.cwd(), 'ml');
  const datasetsDir = path.join(mlBase, 'datasets');
  if (!fs.existsSync(datasetsDir)) fs.mkdirSync(datasetsDir, { recursive: true });

  // Upload dataset (CSV/JSON)
  app.post('/api/ml/dataset', upload.single('file'), (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file provided' });
      const filename = Date.now() + '_' + req.file.originalname;
      const dest = path.join(datasetsDir, filename);
      fs.writeFileSync(dest, req.file.buffer);
      res.json({ ok: true, filename });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to upload dataset' });
    }
  });

  // List uploaded datasets
  app.get('/api/ml/datasets', (req, res) => {
    try {
      const files = fs.readdirSync(datasetsDir).filter((f: string) => !f.endsWith('.json') || f.includes('_'));
      res.json({ datasets: files });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to list datasets' });
    }
  });

  // Delete a dataset
  app.delete('/api/ml/dataset/:name', (req, res) => {
    const filePath = path.join(datasetsDir, req.params.name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ deleted: true });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  // Trigger training
  app.post('/api/ml/train', (req, res) => {
    const datasetName = req.body?.dataset;
    const cmd = datasetName
      ? `npx tsx ml/train.ts "${datasetName}"`
      : `npx tsx ml/train.ts`;
    exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        console.error('Training error:', stderr);
        return res.status(500).json({ error: 'Training failed', details: stderr });
      }
      res.json({ ok: true, output: stdout });
    });
  });

  // Predict using trained model (simple fallback if no model exists)
  app.post('/api/ml/predict', (req, res) => {
    try {
      const { input } = req.body; // e.g. { input: [70] } for weight -> calorie prediction
      const weight = Array.isArray(input) ? input[0] : input;
      const modelPath = path.join(mlBase, 'model.json');

      if (!fs.existsSync(modelPath)) {
        // No trained model yet — return a simple formula-based estimate
        const estimatedCalories = Math.round(weight * 15 + 500);
        return res.json({
          prediction: estimatedCalories,
          source: 'formula-estimate',
          note: 'No trained model found. Upload a dataset and train first for ML predictions.'
        });
      }

      // Load the trained linear regression model
      const model = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
      const predicted = model.slope * weight + model.intercept;
      return res.json({
        prediction: Math.round(predicted),
        source: 'trained-model',
        modelType: model.type,
        trainR2: model.trainR2,
        testR2: model.testR2,
        trainedAt: model.trainedAt,
        dataset: model.dataset,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Prediction failed' });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
}

startServer();
