import mongoose, { Schema, Document } from 'mongoose';

export interface ITerritory extends Document {
  userId?: mongoose.Types.ObjectId;
  name?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  geometry?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  radius?: number; // in meters
  area?: number; // in square meters
  challenge?: string;
  reward?: number; // XP reward
  capturedBy?: mongoose.Types.ObjectId;
  capturedAt?: Date;
  captured?: boolean;
  sessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TerritorySchema = new Schema<ITerritory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      trim: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: {
        type: [Number]
      }
    },
    geometry: {
      type: {
        type: String,
        enum: ['Polygon']
      },
      coordinates: {
        type: [[[Number]]]
      }
    },
    radius: {
      type: Number,
      min: 0
    },
    area: {
      type: Number,
      min: 0
    },
    challenge: {
      type: String
    },
    reward: {
      type: Number,
      min: 0
    },
    capturedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    capturedAt: {
      type: Date
    },
    captured: {
      type: Boolean,
      default: false
    },
    sessionId: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Geospatial indexes for efficient location queries
TerritorySchema.index({ location: '2dsphere' });
TerritorySchema.index({ geometry: '2dsphere' });
TerritorySchema.index({ userId: 1, captured: 1 });

export default mongoose.model<ITerritory>('Territory', TerritorySchema);

