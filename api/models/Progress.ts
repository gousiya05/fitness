import mongoose, { Document, Model } from 'mongoose';

export interface IProgress extends Document {
  email: string; // Used to link to User (User model uses email as ID for token)
  date: Date;
  weight: number;
  bmi: number;
  caloriesBurned: number;
  caloriesConsumed: number;
}

const ProgressSchema = new mongoose.Schema({
  email: { type: String, required: true },
  date: { type: Date, default: Date.now },
  weight: { type: Number, required: true },
  bmi: { type: Number, required: true },
  caloriesBurned: { type: Number, default: 0 },
  caloriesConsumed: { type: Number, default: 0 },
});

export const Progress: Model<IProgress> = mongoose.models.Progress || mongoose.model<IProgress>('Progress', ProgressSchema);
