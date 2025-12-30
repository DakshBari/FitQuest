import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  level: number;
  xp: number;
  stats: {
    strength: number;
    agility: number;
    endurance: number;
  };
  streak: {
    current: number;
    longest: number;
    lastActivityDate?: Date;
  };
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  profile: {
    weight?: number;
    height?: number;
    bodyType?: 'ectomorph' | 'mesomorph' | 'endomorph';
    goal?: 'muscle-gain' | 'weight-loss' | 'maintenance' | 'endurance';
  };
  territories: number;
  challengesWon: number;
  winStreak: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    avatar: {
      type: String,
      default: ''
    },
    level: {
      type: Number,
      default: 1
    },
    xp: {
      type: Number,
      default: 0
    },
    stats: {
      strength: { type: Number, default: 50 },
      agility: { type: Number, default: 50 },
      endurance: { type: Number, default: 50 }
    },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActivityDate: Date
    },
    goals: {
      calories: { type: Number, default: 2000 },
      protein: { type: Number, default: 150 },
      carbs: { type: Number, default: 200 },
      fats: { type: Number, default: 65 }
    },
    profile: {
      weight: Number,
      height: Number,
      bodyType: {
        type: String,
        enum: ['ectomorph', 'mesomorph', 'endomorph']
      },
      goal: {
        type: String,
        enum: ['muscle-gain', 'weight-loss', 'maintenance', 'endurance']
      }
    },
    territories: {
      type: Number,
      default: 0
    },
    challengesWon: {
      type: Number,
      default: 0
    },
    winStreak: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);

