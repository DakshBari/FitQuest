import mongoose, { Schema, Document } from 'mongoose';

export interface IExerciseSet {
  reps: number;
  weight: number;
  unit: 'kg' | 'lb';
}

export interface IWorkout extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  exercise: string;
  muscleGroup: string;
  weightType: 'dumbbell' | 'barbell' | 'bodyweight' | 'machine' | 'cable' | 'kettlebell' | 'resistance_band';
  sets: IExerciseSet[];
  rpe: number;
  restTime?: string;
  notes?: string;
  tempo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSetSchema = new Schema<IExerciseSet>({
  reps: { type: Number, required: true, min: 0 },
  weight: { type: Number, required: true, min: 0 },
  unit: { type: String, enum: ['kg', 'lb'], default: 'kg' }
});

const WorkoutSchema = new Schema<IWorkout>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    exercise: {
      type: String,
      required: [true, 'Please provide an exercise name'],
      trim: true
    },
    muscleGroup: {
      type: String,
      required: true,
      enum: ['Chest', 'Triceps', 'Back', 'Biceps', 'Shoulders', 'Legs', 'Core', 'Cardio']
    },
    weightType: {
      type: String,
      required: true,
      enum: ['dumbbell', 'barbell', 'bodyweight', 'machine', 'cable', 'kettlebell', 'resistance_band'],
      default: 'dumbbell'
    },
    sets: {
      type: [ExerciseSetSchema],
      required: true,
      validate: {
        validator: (sets: IExerciseSet[]) => sets.length > 0,
        message: 'At least one set is required'
      }
    },
    rpe: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    restTime: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    tempo: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
WorkoutSchema.index({ userId: 1, date: -1 });

export default mongoose.model<IWorkout>('Workout', WorkoutSchema);

