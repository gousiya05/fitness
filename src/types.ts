export interface UserProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // in cm
  weight: number; // in kg
  goalWeight: number; // in kg
  fitnessGoal: 'weight_loss' | 'weight_gain' | 'lean_bulk' | 'muscle_gain' | 'maintenance';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dietPreference: 'veg' | 'non-veg' | 'vegan' | 'vegetarian' | 'keto' | 'paleo';
  allergies: string;
  workoutExperience: 'beginner' | 'intermediate' | 'advanced';
  dailyWaterIntake: number; // in liters
  stepsGoal: number;
}

export interface BodyMetrics {
  bmi: number;
  bmr: number;
  tdee: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  water: number; // Liters
}
