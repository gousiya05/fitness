import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { db } from "./lib/firebase";

dotenv.config();

const app = express();
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const JWT_SECRET = process.env.JWT_SECRET || "flexai-secret-key-2026";
const USE_FIRESTORE = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_SERVICE_ACCOUNT;

// In-memory mock store for when DB is missing
const mockUsers: any[] = [];

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (USE_FIRESTORE) {
      const userRef = db.collection('users').doc(email);
      const doc = await userRef.get();
      if (doc.exists) return res.status(400).json({ error: "User already exists" });
      const hashedPassword = await bcrypt.hash(password, 10);
      await userRef.set({ email, password: hashedPassword, firstName, lastName, onboarded: false, createdAt: new Date().toISOString() });
      const token = jwt.sign({ userId: email }, JWT_SECRET);
      res.json({ token, user: { email, firstName, lastName, onboarded: false } });
    } else {
      if (mockUsers.find(u => u.email === email)) return res.status(400).json({ error: "User already exists" });
      const user = { _id: Date.now().toString(), email, firstName, lastName, onboarded: false };
      mockUsers.push({ ...user, password });
      const token = jwt.sign({ userId: user._id }, JWT_SECRET);
      res.json({ token, user });
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
      res.json({ token, user: { ...user, password: Buffer.from('') } });
    } else {
      const user = mockUsers.find(u => u.email === email && u.password === password);
      if (!user) return res.status(400).json({ error: "Invalid credentials" });
      const token = jwt.sign({ userId: user._id }, JWT_SECRET);
      res.json({ token, user });
    }
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Profile Routes
app.get("/api/user/profile", authenticate, async (req: any, res) => {
  try {
    if (USE_FIRESTORE) {
      const doc = await db.collection('users').doc(req.userId).get();
      res.json(doc.data());
    } else {
      res.json(mockUsers.find(u => u._id === req.userId || u.email === req.userId));
    }
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.post("/api/user/profile", authenticate, async (req: any, res) => {
  try {
    const data = req.body;
    if (USE_FIRESTORE) {
      await db.collection('users').doc(req.userId).update({ ...data, onboarded: true });
      res.json({ success: true });
    } else {
      const idx = mockUsers.findIndex(u => u._id === req.userId || u.email === req.userId);
      if (idx !== -1) mockUsers[idx] = { ...mockUsers[idx], ...data, onboarded: true };
      res.json({ success: true });
    }
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Food Scanner Route
app.post("/api/food/scan", authenticate, upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided" });
    
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        prompt,
        {
          inlineData: {
            data: req.file.buffer.toString("base64"),
            mimeType: req.file.mimetype
          }
        }
      ]
    });

    const text = result.text;
    
    const prompt = `
      Analyze this food image and provide detailed nutritional information.
      Return the result in strict JSON format:
      {
        "foodItems": [
          {
            "name": "string",
            "calories": number,
            "protein": "string",
            "carbs": "string",
            "fat": "string",
            "fiber": "string",
            "sugar": "string",
            "portion": "string"
          }
        ],
        "totalCalories": number,
        "recommendation": "string (Why should I eat this or not, based on a general fitness perspective)",
        "isHealthy": boolean
      }
    `;


    
    // Robust JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in AI response:", text);
      throw new Error("Invalid AI response format");
    }
    
    const nutritionData = JSON.parse(jsonMatch[0]);

    // Save to history if Firestore is active
    if (USE_FIRESTORE) {
      try {
        await db.collection('users').doc(req.userId).collection('scans').add({
          ...nutritionData,
          timestamp: new Date().toISOString()
        });
      } catch (dbErr) {
        console.error("Failed to save scan to Firestore:", dbErr);
      }
    }

    res.json(nutritionData);
  } catch (error: any) {
    console.error("Scanner Error:", error);
    res.status(500).json({ error: "Failed to analyze food image" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    apiKeyConfigured: !!process.env.GEMINI_API_KEY,
    dbConfigured: !!process.env.FIREBASE_PROJECT_ID || !!process.env.FIREBASE_SERVICE_ACCOUNT
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
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

export default app;
