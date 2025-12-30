# FitQuest Backend Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher) - local installation or MongoDB Atlas
- npm or yarn

## Installation Steps

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/fitquest

# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:3000

# Motion Detection AI Service (Future - Optional)
MOTION_DETECTION_SERVICE_URL=http://localhost:8000
MOTION_DETECTION_API_KEY=

# AI Coach Service (Future - Optional)
AI_COACH_SERVICE_URL=http://localhost:8001
AI_COACH_API_KEY=
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
# macOS (using Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
# Start MongoDB service from Services panel
```

**MongoDB Atlas:**
- Create a free cluster at https://www.mongodb.com/cloud/atlas
- Get your connection string and update `MONGODB_URI` in `.env`

### 4. Run the Backend

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:5000` (or the port specified in `.env`).

## Testing the API

### Health Check
```bash
curl http://localhost:5000/health
```

### Sign Up
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `token` from the response for authenticated requests.

### Get User Profile (Authenticated)
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## API Base URL

All API endpoints are prefixed with `/api`:
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Database Schema

The backend uses MongoDB with the following main collections:

- **users** - User accounts and profiles
- **workouts** - Exercise logs
- **meals** - Nutrition tracking
- **hydrations** - Daily hydration tracking
- **activities** - GPS-based activities
- **territories** - Capturable map territories
- **guilds** - Social groups
- **friendships** - Friend relationships
- **raidbosses** - Global raid boss events

## Project Structure

```
backend/
├── src/
│   ├── models/          # MongoDB models
│   ├── routes/          # API route handlers
│   ├── middleware/       # Express middleware
│   ├── services/        # External service integrations
│   └── server.ts        # Main server file
├── dist/                # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Common Issues

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env` is correct
- For MongoDB Atlas, ensure your IP is whitelisted

### Port Already in Use
- Change `PORT` in `.env` to a different port
- Or stop the process using port 5000

### TypeScript Errors
- Run `npm install` to ensure all dependencies are installed
- Check `tsconfig.json` configuration

## Next Steps

1. Connect your frontend to the backend API
2. Implement motion detection AI service (see `src/services/motionDetectionService.ts`)
3. Implement AI coach service (see `src/services/aiCoachService.ts`)
4. Set up production environment variables
5. Configure CORS for production frontend URL

