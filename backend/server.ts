// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { workoutRoutes } from './routes/workouts';
import { mealRoutes } from './routes/meals';
import { activityRoutes } from './routes/activities';
import { guildRoutes } from './routes/guilds';
import { dashboardRoutes } from './routes/dashboard';
import { aiCoachRoutes } from './routes/aiCoach';
import { userRoutes } from './routes/users';
import { hydrationRoutes } from './routes/hydration';
import worldMapRoutes from './routes/worldMap';

// Debug: Check if env vars are loaded
console.log('Environment check:');
console.log('- PORT:', process.env.PORT);
console.log('- GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('- GEMINI_API_KEY value:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');
console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('- MONGODB_URI target:', process.env.MONGODB_URI ? (process.env.MONGODB_URI.startsWith('mongodb+srv://') ? 'MongoDB Atlas (Cloud)' : 'Custom MongoDB URI') : 'DEFAULT LOCALHOST (mongodb://localhost:27017/fitquest)');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitquest';

// Middleware
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'FitQuest API is running', health: '/health' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/guilds', guildRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai-coach', aiCoachRoutes);
app.use('/api/hydration', hydrationRoutes);
app.use('/api/world-map', worldMapRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server immediately so Render detects the port
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Connect to MongoDB
console.log(`⏳ Connecting to MongoDB at ${MONGODB_URI.startsWith('mongodb+srv://') ? 'MongoDB Atlas (Cloud)...' : MONGODB_URI}...`);
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message || error);
  });

export default app;



