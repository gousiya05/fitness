import { UserProfile, BodyMetrics } from '../types';

export function calculateMetrics(profile: UserProfile): BodyMetrics {
  const age = profile.age || 25;
  const gender = profile.gender || 'male';
  const height = profile.height || 180;
  const weight = profile.weight || 75;
  const activityLevel = profile.activityLevel || 'moderate';
  const fitnessGoal = profile.fitnessGoal || 'maintenance';

  // BMI = kg / m^2
  const heightInMeters = height / 100;
  const bmi = heightInMeters > 0 ? weight / Math.pow(heightInMeters, 2) : 0;

  // BMR (Mifflin-St Jeor Equation)
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // TDEE Activity Multipliers
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const multiplier = multipliers[activityLevel as keyof typeof multipliers] || 1.2;
  const tdee = bmr * multiplier;

  // Adjust calories based on goal
  let targetCalories = tdee;
  if (fitnessGoal === 'muscle_gain') targetCalories += 300;
  if (fitnessGoal === 'fat_loss') targetCalories -= 500;
  if (fitnessGoal === 'strength') targetCalories += 200;

  // Macros Calculation (Rough targets)
  const proteinPerKg = (fitnessGoal === 'muscle_gain' || fitnessGoal === 'strength') ? 2.2 : 1.8;
  const protein = weight * proteinPerKg;
  
  // Fat: 25% of calories
  const fat = (targetCalories * 0.25) / 9;
  
  // Carbs: Remainder
  const carbs = (targetCalories - (protein * 4) - (fat * 9)) / 4;

  // Water: 35ml per kg
  const water = (weight * 35) / 1000;

  return {
    bmi: parseFloat(bmi.toFixed(1)) || 0,
    bmr: Math.round(bmr) || 0,
    tdee: Math.round(targetCalories) || 0,
    macros: {
      protein: Math.round(protein) || 0,
      carbs: Math.round(carbs) || 0,
      fat: Math.round(fat) || 0,
    },
    water: parseFloat(water.toFixed(1)) || 0,
  };
}
