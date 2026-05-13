import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { db } from "./api/lib/firebase";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "flexai-secret-key-2026";
const USE_FIRESTORE = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_SERVICE_ACCOUNT;
const upload = multer({ storage: multer.memoryStorage() });

let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
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
  const PORT = 3000;
  app.use(express.json());

  // Auth & Profile Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      if (USE_FIRESTORE) {
        const doc = await db.collection('users').doc(email).get();
        if (doc.exists) return res.status(400).json({ error: "User already exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('users').doc(email).set({ email, password: hashedPassword, firstName, lastName, onboarded: false, createdAt: new Date().toISOString() });
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
      if (USE_FIRESTORE) {
        const doc = await db.collection('users').doc(email).get();
        if (!doc.exists) return res.status(400).json({ error: "User not found" });
        const user = doc.data()!;
        if (!await bcrypt.compare(password, user.password)) return res.status(400).json({ error: "Invalid credentials" });
        const token = jwt.sign({ userId: email }, JWT_SECRET);
        res.json({ token, user: { ...user, password: '' } });
      } else {
        const token = jwt.sign({ userId: email }, JWT_SECRET);
        res.json({ token, user: { email, firstName: 'User', onboarded: true } });
      }
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.get("/api/user/profile", authenticate, async (req: any, res) => {
    try {
      if (USE_FIRESTORE) {
        const doc = await db.collection('users').doc(req.userId).get();
        res.json(doc.data());
      } else { res.json({ email: req.userId }); }
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/user/profile", authenticate, async (req: any, res) => {
    try {
      if (USE_FIRESTORE) await db.collection('users').doc(req.userId).update({ ...req.body, onboarded: true });
      res.json({ success: true });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // Food Scanner Route
  app.post("/api/food/scan", authenticate, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No image provided" });
      const ai = getAiClient();
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Analyze this food image and provide detailed nutritional information. Return strict JSON: { "foodItems": [{"name":"string","calories":number,"protein":"string","carbs":"string","fat":"string","fiber":"string","sugar":"string","portion":"string"}], "totalCalories": number, "recommendation": "string", "isHealthy": boolean }`;
      const result = await model.generateContent([prompt, { inlineData: { data: req.file.buffer.toString("base64"), mimeType: req.file.mimetype } }]);
      const text = (await result.response).text().replace(/```json|```/g, "").trim();
      const data = JSON.parse(text);
      if (USE_FIRESTORE) await db.collection('users').doc(req.userId).collection('scans').add({ ...data, timestamp: new Date().toISOString() });
      res.json(data);
    } catch (error: any) { res.status(500).json({ error: "Analysis failed" }); }
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
