import mongoose, { Schema, Document } from 'mongoose';

export interface IWorldMapData {
  sessionId?: string;
  mode?: 'explorer' | 'navigator';
  startLocation?: [number, number];
  plannedRoute?: number[][];
  path?: number[][];
  distance?: number;
  duration?: number;
  averageSpeed?: number;
  maxSpeed?: number;
  capturedAreas?: {
    type: string;
    features: any[];
  };
  isActive?: boolean;
  endTime?: Date;
}

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
  worldMapData?: IWorldMapData;
  createdAt: Date;
  updatedAt: Date;
}

const WorldMapDataSchema = new Schema({
  sessionId: String,
  mode: {
    type: String,
    enum: ['explorer', 'navigator'],
    default: 'explorer'
  },
  startLocation: [Number],
  plannedRoute: [[Number]],
  path: {
    type: [[Number]],
    default: []
  },
  distance: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  averageSpeed: {
    type: Number,
    default: 0
  },
  maxSpeed: {
    type: Number,
    default: 0
  },
  capturedAreas: {
    type: {
      type: String,
      default: 'FeatureCollection'
    },
    features: {
      type: [Schema.Types.Mixed],
      default: []
    }
  },
  isActive: {
    type: Boolean,
    default: false
  },
  endTime: Date
}, { _id: false });

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
    }],
    worldMapData: WorldMapDataSchema
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
ActivitySchema.index({ userId: 1, startTime: -1 });
ActivitySchema.index({ 'worldMapData.sessionId': 1 });

export default mongoose.model<IActivity>('Activity', ActivitySchema);

