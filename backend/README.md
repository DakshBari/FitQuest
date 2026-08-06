# FitQuest Backend API

Backend API for the FitQuest fitness gamification application.

## Features

- **Authentication**: JWT-based user authentication
- **Workout Tracking**: Log exercises, sets, reps, weight, RPE, and notes
- **Nutrition Tracking**: Track meals, calories, macros, and hydration
- **Activity Tracking**: GPS-based activity tracking with territory capture
- **Social Features**: Guilds, friends, leaderboards, and raid bosses
- **AI Coach**: Integration points for AI coaching and form analysis
- **Motion Detection**: Service integration points for motion detection AI/ML

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, bcrypt

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure:
   - `MONGODB_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `FRONTEND_URL`: Frontend application URL
   - `MOTION_DETECTION_SERVICE_URL`: Motion detection AI service URL (optional)
   - `AI_COACH_SERVICE_URL`: AI coach service URL (optional)

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Workouts
- `POST /api/workouts` - Create workout
- `GET /api/workouts` - Get all workouts
- `GET /api/workouts/:id` - Get single workout
- `PUT /api/workouts/:id` - Update workout
- `DELETE /api/workouts/:id` - Delete workout
- `GET /api/workouts/analytics/stats` - Get workout analytics

### Meals
- `POST /api/meals` - Create meal
- `GET /api/meals` - Get all meals
- `GET /api/meals/summary` - Get daily nutrition summary
- `GET /api/meals/:id` - Get single meal
- `PUT /api/meals/:id` - Update meal
- `DELETE /api/meals/:id` - Delete meal

### Activities
- `POST /api/activities` - Create activity
- `GET /api/activities` - Get all activities
- `GET /api/activities/territories` - Get nearby territories
- `GET /api/activities/:id` - Get single activity
- `PUT /api/activities/:id` - Update activity

### Guilds & Social
- `POST /api/guilds` - Create guild
- `GET /api/guilds` - Get all guilds
- `GET /api/guilds/leaderboard` - Get leaderboard
- `GET /api/guilds/friends` - Get friends
- `POST /api/guilds/friends/request` - Send friend request
- `GET /api/guilds/raid-boss` - Get current raid boss
- `POST /api/guilds/raid-boss/damage` - Deal damage to raid boss

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/quests` - Get current quests

### AI Coach
- `POST /api/ai-coach/analyze-form` - Analyze exercise form
- `POST /api/ai-coach/chat` - Chat with AI coach
- `GET /api/ai-coach/recommendations` - Get recommendations

## Database Models

- **User**: User accounts, stats, streaks, goals
- **Workout**: Exercise logs with sets, reps, weight, RPE
- **Meal**: Nutrition tracking with macros and micros
- **Activity**: GPS-based activities with path tracking
- **Territory**: Capturable territories on the map
- **Guild**: Social groups and teams
- **Friendship**: Friend relationships
- **RaidBoss**: Global raid boss events

## Future Integrations

### Motion Detection Service
The motion detection AI/ML service integration is prepared in `src/services/motionDetectionService.ts`. When the service is ready:
1. Set `MOTION_DETECTION_SERVICE_URL` in `.env`
2. Set `MOTION_DETECTION_API_KEY` if required
3. Uncomment the actual API call code in the service

### AI Coach Service
The AI coach service integration is prepared in `src/services/aiCoachService.ts`. When the service is ready:
1. Set `AI_COACH_SERVICE_URL` in `.env`
2. Set `AI_COACH_API_KEY` if required
3. Uncomment the actual API call code in the service

## Development

- Use `npm run dev` for development with hot reload
- Use `npm run build` to compile TypeScript
- Use `npm start` to run the compiled code

## License

ISC



