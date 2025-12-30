import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'run' | 'walk' | 'cycle' | 'other';
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  distance: number; // in meters
  path: Array<[number, number]>; // [latitude, longitude]
  averageSpeed: number; // in m/s
  maxSpeed: number; // in m/s
  calories?: number;
  capturedTerritories: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['run', 'walk', 'cycle', 'other'],
      required: true
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number,
      required: true,
      min: 0
    },
    distance: {
      type: Number,
      required: true,
      min: 0
    },
    path: {
      type: [[Number]],
      required: true,
      default: []
    },
    averageSpeed: {
      type: Number,
      required: true,
      min: 0
    },
    maxSpeed: {
      type: Number,
      required: true,
      min: 0
    },
    calories: {
      type: Number,
      min: 0
    },
    capturedTerritories: [{
      type: Schema.Types.ObjectId,
      ref: 'Territory'
    }]
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
ActivitySchema.index({ userId: 1, startTime: -1 });

export default mongoose.model<IActivity>('Activity', ActivitySchema);

