import mongoose, { Schema, Document } from 'mongoose';

export interface IMicroNutrients {
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  vitA?: number;
  vitC?: number;
  iron?: number;
  calcium?: number;
}

export interface IMeal extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  date: Date;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  micros: IMicroNutrients;
  baseQuantity: number;
  quantity: number;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MicroNutrientsSchema = new Schema<IMicroNutrients>({
  fiber: { type: Number, default: 0 },
  sugar: { type: Number, default: 0 },
  sodium: { type: Number, default: 0 },
  cholesterol: { type: Number, default: 0 },
  vitA: { type: Number, default: 0 },
  vitC: { type: Number, default: 0 },
  iron: { type: Number, default: 0 },
  calcium: { type: Number, default: 0 }
});

const MealSchema = new Schema<IMeal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide a meal name'],
      trim: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    time: {
      type: String,
      required: true
    },
    calories: {
      type: Number,
      required: true,
      min: 0
    },
    protein: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    carbs: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    fats: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    micros: {
      type: MicroNutrientsSchema,
      default: {}
    },
    baseQuantity: {
      type: Number,
      default: 100
    },
    quantity: {
      type: Number,
      default: 100
    },
    isFavorite: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
MealSchema.index({ userId: 1, date: -1 });

export default mongoose.model<IMeal>('Meal', MealSchema);

