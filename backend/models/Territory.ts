import mongoose, { Schema, Document } from 'mongoose';

export interface ITerritory extends Document {
  name: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  radius: number; // in meters
  challenge: string;
  reward: number; // XP reward
  capturedBy?: mongoose.Types.ObjectId;
  capturedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TerritorySchema = new Schema<ITerritory>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    radius: {
      type: Number,
      required: true,
      min: 0
    },
    challenge: {
      type: String,
      required: true
    },
    reward: {
      type: Number,
      required: true,
      min: 0
    },
    capturedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    capturedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Geospatial index for efficient location queries
TerritorySchema.index({ location: '2dsphere' });

export default mongoose.model<ITerritory>('Territory', TerritorySchema);

