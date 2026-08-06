import mongoose, { Schema, Document } from 'mongoose';

export interface IGuild extends Document {
  name: string;
  description?: string;
  leader: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  totalXP: number;
  challengesWon: number;
  createdAt: Date;
  updatedAt: Date;
}

const GuildSchema = new Schema<IGuild>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a guild name'],
      unique: true,
      trim: true,
      minlength: [3, 'Guild name must be at least 3 characters'],
      maxlength: [30, 'Guild name cannot exceed 30 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    leader: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    totalXP: {
      type: Number,
      default: 0
    },
    challengesWon: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IGuild>('Guild', GuildSchema);



