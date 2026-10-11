import mongoose, { Document, Model } from 'mongoose';

export interface IWorkoutHistory extends Document {
  email: string;
  date: Date;
  workoutType: string;
  durationMinutes: number;
  caloriesBurned: number;
  notes?: string;
}

const WorkoutHistorySchema = new mongoose.Schema({
  email: { type: String, required: true },
  date: { type: Date, default: Date.now },
  workoutType: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  caloriesBurned: { type: Number, required: true },
  notes: { type: String },
});

export const WorkoutHistory: Model<IWorkoutHistory> = mongoose.models.WorkoutHistory || mongoose.model<IWorkoutHistory>('WorkoutHistory', WorkoutHistorySchema);
