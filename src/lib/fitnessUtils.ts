import { UserProfile, BodyMetrics } from '../types';

export function calculateMetrics(profile: UserProfile): BodyMetrics {
  const { age, gender, height, weight, activityLevel, fitnessGoal } = profile;

  // BMI = kg / m^2
  const bmi = weight / Math.pow(height / 100, 2);

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

  const tdee = bmr * multipliers[activityLevel];

  // Adjust calories based on goal
  let targetCalories = tdee;
  if (fitnessGoal === 'muscle_gain') targetCalories += 300;
  if (fitnessGoal === 'fat_loss') targetCalories -= 500;
  if (fitnessGoal === 'strength') targetCalories += 200;

  // Macros Calculation (Rough targets)
  // Protein: 2g per kg (for muscle/strength), 1.6g otherwise
  const proteinPerKg = (fitnessGoal === 'muscle_gain' || fitnessGoal === 'strength') ? 2.2 : 1.8;
  const protein = weight * proteinPerKg;
  
  // Fat: 25% of calories
  const fat = (targetCalories * 0.25) / 9;
  
  // Carbs: Remainder
  const carbs = (targetCalories - (protein * 4) - (fat * 9)) / 4;

  // Water: 35ml per kg
  const water = (weight * 35) / 1000;

  return {
    bmi: parseFloat(bmi.toFixed(1)),
    bmr: Math.round(bmr),
    tdee: Math.round(targetCalories),
    macros: {
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
    },
    water: parseFloat(water.toFixed(1)),
  };
}
