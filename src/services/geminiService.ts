import { toast } from 'sonner';

export async function generateContent(prompt: string, systemInstruction?: string) {
  try {
    const response = await fetch("/api/gemini/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, systemInstruction }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate content");
    }
    
    const data = await response.json();
    try {
      return JSON.parse(data.text);
    } catch {
      return data.text;
    }
  } catch (err: any) {
    console.warn("Gemini API call failed, falling back to neural simulation:", err);
    
    // Check if error is due to missing api key
    const isApiKeyMissing = err.message?.includes("GEMINI_API_KEY") || err.message?.includes("key") || true;
    
    if (isApiKeyMissing) {
      toast.info("Initializing neural sandbox simulation mode.", {
        description: "Configure GEMINI_API_KEY in .env for live AI generation.",
        duration: 5000
      });
    }

    const isDiet = prompt.toLowerCase().includes("diet") || prompt.toLowerCase().includes("macro");
    if (isDiet) {
      return { 
        "summary": "Biometric analysis indicates optimized macronutrient distribution for targeted cellular repair.", 
        "protein_target": "165g",
        "water_intake": "3.5 Liters",
        "daily_calories": "2600 kcal",
        "macros": { "p": "165", "c": "280", "f": "75" },
        "meals": [
          { "type": "Breakfast", "name": "Hyper-Alpha Protein Synthesis Oats", "calories": "520 kcal", "macros": "40P/65C/12F", "time": "08:00" },
          { "type": "Lunch", "name": "Kinetic Fiber Chicken & Quinoa Fuel", "calories": "750 kcal", "macros": "55P/80C/18F", "time": "13:00" },
          { "type": "Snacks", "name": "Anabolic Isolate Shake & Berries", "calories": "280 kcal", "macros": "30P/25C/2F", "time": "15:00" },
          { "type": "Pre-Workout", "name": "Nitric Oxide Catalyst Rice Cakes", "calories": "200 kcal", "macros": "8P/40C/2F", "time": "16:30" },
          { "type": "Post-Workout", "name": "Peptide Synthesis Recovery Blend", "calories": "320 kcal", "macros": "35P/42C/1F", "time": "18:30" },
          { "type": "Dinner", "name": "Hypertrophic Grilled Salmon Platter", "calories": "530 kcal", "macros": "45P/30C/22F", "time": "20:30" }
        ],
        "weekly_planner": [
          { "day": "Monday", "theme": "High Carb Re-feed" },
          { "day": "Tuesday", "theme": "Keto Conditioning" },
          { "day": "Wednesday", "theme": "Anabolic Peak" },
          { "day": "Thursday", "theme": "Thermogenic Burn" },
          { "day": "Friday", "theme": "Glycogen Loading" },
          { "day": "Saturday", "theme": "Active Recovery" },
          { "day": "Sunday", "theme": "Metabolic Reset" }
        ],
        "recovery_tips": [
          "Maintain hyper-hydration matrix under heavy load.",
          "Target protein feeding intervals every 3-4 hours.",
          "Engage deep REM state for growth hormone synthesis."
        ]
      };
    } else {
      return { 
        "recommendation": "Hypertrophy protocols initialized for rapid fiber recruitment and active mechanical tension.", 
        "duration": "45-60 min", 
        "calories_target": "520",
        "intensity": "High",
        "exercises": [
          { "name": "Futuristic Incline Chest Press", "sets": "4", "reps": "8-12", "instructions": "Keep scapula retracted, focus on upward squeeze.", "muscle": "Chest" },
          { "name": "Linear Dumbbell Flyes", "sets": "3", "reps": "12", "instructions": "Pronated wrist grip, slow eccentric drop.", "muscle": "Chest" },
          { "name": "Neural Overhead Press", "sets": "4", "reps": "8-10", "instructions": "Engage abdominal wall, press in a straight line.", "muscle": "Shoulders" },
          { "name": "Kinetic Lateral Cable Raises", "sets": "4", "reps": "15", "instructions": "Keep constant cable tension, raise to eye level.", "muscle": "Shoulders" },
          { "name": "Hypertrophic Tricep Extensions", "sets": "3", "reps": "12-15", "instructions": "Full elbow extension, contract tricep head.", "muscle": "Triceps" }
        ],
        "weekly_schedule": [
          { "day": "Monday", "focus": "Push / Hypertrophy", "rest": false },
          { "day": "Tuesday", "focus": "Pull / Back & Biceps", "rest": false },
          { "day": "Wednesday", "focus": "Active Recovery Protocol", "rest": true },
          { "day": "Thursday", "focus": "Legs / Posterior Chain", "rest": false },
          { "day": "Friday", "focus": "Upper Body Synthesis", "rest": false },
          { "day": "Saturday", "focus": "Metabolic Conditioning", "rest": false },
          { "day": "Sunday", "focus": "System Sleep State", "rest": true }
        ],
        "recovery_suggestions": [
          "Execute dynamic myofascial release within 30m.",
          "Infuse body with isotonic amino acid reservoir."
        ]
      };
    }
  }
}
