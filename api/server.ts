import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "./models/User";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "flexai-secret-key-2026";
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB Connection Error:", err));
} else {
  console.warn("MONGODB_URI not found. Auth will use in-memory mock for now.");
}

// In-memory mock store for when DB is missing
const mockUsers: any[] = [];

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
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
    
    if (MONGODB_URI) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ error: "User already exists" });
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ email, password: hashedPassword, firstName, lastName });
      
      const token = jwt.sign({ userId: user._id }, JWT_SECRET);
      res.json({ token, user: { email: user.email, firstName: user.firstName, lastName: user.lastName, onboarded: user.onboarded } });
    } else {
      // Mock Register
      if (mockUsers.find(u => u.email === email)) return res.status(400).json({ error: "User already exists" });
      const user = { _id: Date.now().toString(), email, firstName, lastName, onboarded: false };
      mockUsers.push({ ...user, password });
      const token = jwt.sign({ userId: user._id }, JWT_SECRET);
      res.json({ token, user });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (MONGODB_URI) {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: "User not found" });
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
      
      const token = jwt.sign({ userId: user._id }, JWT_SECRET);
      res.json({ token, user: { email: user.email, firstName: user.firstName, lastName: user.lastName, onboarded: user.onboarded } });
    } else {
      // Mock Login
      const user = mockUsers.find(u => u.email === email && u.password === password);
      if (!user) return res.status(400).json({ error: "Invalid credentials" });
      const token = jwt.sign({ userId: user._id }, JWT_SECRET);
      res.json({ token, user: { email: user.email, firstName: user.firstName, lastName: user.lastName, onboarded: user.onboarded } });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/user/profile", authenticate, async (req: any, res) => {
  try {
    if (MONGODB_URI) {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } else {
      const user = mockUsers.find(u => u._id === req.userId);
      res.json(user);
    }
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.post("/api/user/profile", authenticate, async (req: any, res) => {
  try {
    const profileData = req.body;
    if (MONGODB_URI) {
      const user = await User.findByIdAndUpdate(req.userId, { ...profileData, onboarded: true }, { new: true });
      res.json(user);
    } else {
      const index = mockUsers.findIndex(u => u._id === req.userId);
      if (index !== -1) {
        mockUsers[index] = { ...mockUsers[index], ...profileData, onboarded: true };
        res.json(mockUsers[index]);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    }
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Gemini API Proxy
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    const ai = getAiClient();
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || "You are a fitness expert.",
        responseMimeType: "application/json",
      },
    });
    
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate content" });
  }
});

export default app;
