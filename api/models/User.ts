import mongoose, { Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  photoURL: string;
  onboarded: boolean;
  createdAt: Date;
  
  // Profile Data
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  goalWeight?: number;
  fitnessGoal?: string;
  activityLevel?: string;
  dietPreference?: string;
  allergies?: string;
  workoutExperience?: string;
  dailyWaterIntake?: number;
  stepsGoal?: number;
}

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  photoURL: { type: String, default: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&h=200&auto=format&fit=crop' },
  onboarded: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  
  // Profile Data
  age: { type: Number },
  gender: { type: String },
  height: { type: Number },
  weight: { type: Number },
  goalWeight: { type: Number },
  fitnessGoal: { type: String },
  activityLevel: { type: String },
  dietPreference: { type: String },
  allergies: { type: String },
  workoutExperience: { type: String },
  dailyWaterIntake: { type: Number },
  stepsGoal: { type: Number },
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
