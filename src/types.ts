export interface UserProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // in cm
  weight: number; // in kg
  fitnessGoal: 'muscle_gain' | 'fat_loss' | 'maintenance' | 'endurance' | 'strength';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dietPreference: 'omnivore' | 'vegan' | 'vegetarian' | 'keto' | 'paleo';
  allergies: string;
  workoutExperience: 'beginner' | 'intermediate' | 'advanced';
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
