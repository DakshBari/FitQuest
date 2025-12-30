import mongoose, { Schema, Document } from 'mongoose';

export interface IRaidBoss extends Document {
  name: string;
  description: string;
  maxHealth: number;
  currentHealth: number;
  startTime: Date;
  endTime: Date;
  rewards: {
    xp: number;
    items?: string[];
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RaidBossSchema = new Schema<IRaidBoss>(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    description: {
      type: String,
      required: true
    },
    maxHealth: {
      type: Number,
      required: true,
      min: 0
    },
    currentHealth: {
      type: Number,
      required: true,
      min: 0
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    rewards: {
      xp: { type: Number, default: 0 },
      items: [String]
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IRaidBoss>('RaidBoss', RaidBossSchema);

