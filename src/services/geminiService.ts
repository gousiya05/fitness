import { toast } from 'sonner';

let _geminiUnavailableToastShown = false;

export async function generateContent(prompt: string, systemInstruction?: string): Promise<any> {
  try {
    const response = await fetch("/api/gemini/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, systemInstruction }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    _geminiUnavailableToastShown = false; // reset if it works

    try {
      // Strip markdown code fences if present
      const cleaned = (data.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return data.text;
    }
  } catch (err: any) {
    const msg: string = err?.message || '';
    const isApiKeyMissing =
      msg.includes('GEMINI_API_KEY') ||
      msg.includes('API_KEY_INVALID') ||
      msg.includes('not configured') ||
      msg.includes('API key');

    // Only show the configuration toast once per session
    if (isApiKeyMissing && !_geminiUnavailableToastShown) {
      _geminiUnavailableToastShown = true;
      toast.warning('Gemini AI Unavailable', {
        description: 'Add GEMINI_API_KEY to your .env to enable live AI generation. Using neural simulation fallback.',
        duration: 6000,
      });
    } else if (!isApiKeyMissing && !_geminiUnavailableToastShown) {
      _geminiUnavailableToastShown = true;
      toast.error('AI Backend Error', { description: msg || 'Could not reach Gemini service.' });
    }

    console.warn('[geminiService] Falling back to simulation:', msg);

    // Return realistic fallback data based on prompt context
    const isDiet = prompt.toLowerCase().includes('diet') ||
      prompt.toLowerCase().includes('macro') ||
      prompt.toLowerCase().includes('meal');
    const isChat = prompt.toLowerCase().includes('user asks');

    if (isChat) {
      // Chatbot fallback — structured response
      return {
        content: "I'm currently running in offline simulation mode. For live AI responses, configure your GEMINI_API_KEY in the server's .env file. In the meantime, I can tell you that for muscle gain, aim for 1.6–2.2g of protein per kg of bodyweight, train with progressive overload 4–5 days per week, and prioritize sleep for recovery.",
        type: 'text'
      };
    }

    if (isDiet) {
      return {
        "summary": "Simulation mode — configure GEMINI_API_KEY for personalized AI-generated plans.",
        "protein_target": "165g",
        "water_intake": "3.5 Liters",
        "daily_calories": "2600 kcal",
        "macros": { "p": "165", "c": "280", "f": "75" },
        "meals": [
          { "type": "Breakfast", "name": "Oats with Protein Powder & Banana", "calories": "520 kcal", "macros": "40P/65C/12F", "time": "08:00" },
          { "type": "Lunch", "name": "Grilled Chicken, Brown Rice & Broccoli", "calories": "750 kcal", "macros": "55P/80C/18F", "time": "13:00" },
          { "type": "Snack", "name": "Whey Shake & Apple", "calories": "280 kcal", "macros": "30P/25C/2F", "time": "15:00" },
          { "type": "Pre-Workout", "name": "Banana & Rice Cakes", "calories": "200 kcal", "macros": "8P/40C/2F", "time": "16:30" },
          { "type": "Post-Workout", "name": "Whey Isolate & Dextrose", "calories": "320 kcal", "macros": "35P/42C/1F", "time": "18:30" },
          { "type": "Dinner", "name": "Salmon, Sweet Potato & Green Beans", "calories": "530 kcal", "macros": "45P/30C/22F", "time": "20:30" }
        ],
        "weekly_planner": [
          { "day": "Monday", "theme": "High Carb Re-feed" },
          { "day": "Tuesday", "theme": "Moderate Carb" },
          { "day": "Wednesday", "theme": "High Protein" },
          { "day": "Thursday", "theme": "Low Carb" },
          { "day": "Friday", "theme": "Glycogen Loading" },
          { "day": "Saturday", "theme": "Active Recovery" },
          { "day": "Sunday", "theme": "Rest & Refuel" }
        ],
        "recovery_tips": [
          "Stay hydrated — aim for 3–4L of water daily.",
          "Space protein meals 3–4 hours apart for optimal MPS.",
          "7–9 hours of sleep is critical for muscle growth hormone release."
        ]
      };
    }

    // Workout fallback
    return {
      "recommendation": "Simulation mode — configure GEMINI_API_KEY for personalized AI-generated workout plans.",
      "duration": "45-60 min",
      "calories_target": "450",
      "intensity": "High",
      "exercises": [
        { "name": "Barbell Bench Press", "sets": "4", "reps": "8-10", "instructions": "Control the eccentric, full ROM, retract scapula.", "muscle": "Chest" },
        { "name": "Incline Dumbbell Press", "sets": "3", "reps": "10-12", "instructions": "30-degree incline, squeeze at top.", "muscle": "Upper Chest" },
        { "name": "Overhead Press", "sets": "4", "reps": "8-10", "instructions": "Core braced, press in a straight line.", "muscle": "Shoulders" },
        { "name": "Lateral Cable Raises", "sets": "3", "reps": "15", "instructions": "Constant tension, raise to eye level.", "muscle": "Lateral Delts" },
        { "name": "Tricep Pushdowns", "sets": "3", "reps": "12-15", "instructions": "Full elbow extension, contract at bottom.", "muscle": "Triceps" }
      ],
      "weekly_schedule": [
        { "day": "Monday", "focus": "Push — Chest & Shoulders", "rest": false },
        { "day": "Tuesday", "focus": "Pull — Back & Biceps", "rest": false },
        { "day": "Wednesday", "focus": "Active Recovery", "rest": true },
        { "day": "Thursday", "focus": "Legs & Core", "rest": false },
        { "day": "Friday", "focus": "Upper Body Volume", "rest": false },
        { "day": "Saturday", "focus": "Cardio & Conditioning", "rest": false },
        { "day": "Sunday", "focus": "Rest", "rest": true }
      ],
      "recovery_suggestions": [
        "Dynamic stretch within 30 min post-workout.",
        "Consume protein + carbs within 2 hours of training."
      ]
    };
  }
}
