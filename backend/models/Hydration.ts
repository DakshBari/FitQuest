import mongoose, { Schema, Document } from 'mongoose';

export interface IHydration extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  amount: number; // in milliliters
  createdAt: Date;
  updatedAt: Date;
}

const HydrationSchema = new Schema<IHydration>(
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
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
HydrationSchema.index({ userId: 1, date: -1 });
HydrationSchema.index({ userId: 1, date: 1 }, { unique: true }); // One entry per user per day

export default mongoose.model<IHydration>('Hydration', HydrationSchema);



