# FitQuest Backend API Documentation

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Authentication Endpoints

### Sign Up
**POST** `/api/auth/signup`

**Request Body:**
```json
{
  "username": "string (3-20 chars)",
  "email": "valid email",
  "password": "string (min 6 chars)"
}
```

**Response:**
```json
{
  "status": "success",
  "token": "jwt_token",
  "user": { ... }
}
```

### Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "token": "jwt_token",
  "user": { ... }
}
```

### Get Current User
**GET** `/api/auth/me` (Protected)

**Response:**
```json
{
  "status": "success",
  "user": {
    "id": "user_id",
    "username": "string",
    "email": "string",
    "level": 1,
    "xp": 0,
    "stats": { ... }
  }
}
```

---

## User Endpoints

### Get Profile
**GET** `/api/users/profile` (Protected)

### Update Profile
**PUT** `/api/users/profile` (Protected)

**Request Body:**
```json
{
  "profile": {
    "weight": 75,
    "height": 180,
    "bodyType": "mesomorph",
    "goal": "muscle-gain"
  },
  "goals": {
    "calories": 2000,
    "protein": 150,
    "carbs": 200,
    "fats": 65
  }
}
```

---

## Workout Endpoints

### Create Workout
**POST** `/api/workouts` (Protected)

**Request Body:**
```json
{
  "exercise": "Incline Dumbbell Press",
  "muscleGroup": "Chest",
  "sets": [
    { "reps": 12, "weight": 25, "unit": "kg" },
    { "reps": 10, "weight": 27.5, "unit": "kg" }
  ],
  "rpe": 7,
  "restTime": "90s",
  "notes": "Felt strong today",
  "date": "2024-01-15T10:30:00Z"
}
```

**Muscle Groups:** `Chest`, `Triceps`, `Back`, `Biceps`, `Shoulders`, `Legs`, `Core`, `Cardio`

### Get All Workouts
**GET** `/api/workouts` (Protected)

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `startDate` - ISO date string
- `endDate` - ISO date string

### Get Single Workout
**GET** `/api/workouts/:id` (Protected)

### Update Workout
**PUT** `/api/workouts/:id` (Protected)

### Delete Workout
**DELETE** `/api/workouts/:id` (Protected)

### Get Workout Analytics
**GET** `/api/workouts/analytics/stats` (Protected)

**Query Parameters:**
- `startDate` - ISO date string
- `endDate` - ISO date string

---

## Meal Endpoints

### Create Meal
**POST** `/api/meals` (Protected)

**Request Body:**
```json
{
  "name": "Grilled Salmon",
  "calories": 350,
  "protein": 40,
  "carbs": 0,
  "fats": 18,
  "time": "12:30",
  "date": "2024-01-15"
}
```

### Get All Meals
**GET** `/api/meals` (Protected)

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `startDate` - ISO date string
- `endDate` - ISO date string

### Get Daily Summary
**GET** `/api/meals/summary` (Protected)

**Query Parameters:**
- `date` - ISO date string (default: today)

**Response:**
```json
{
  "status": "success",
  "summary": {
    "date": "2024-01-15",
    "totalCalories": 1850,
    "totalProtein": 120,
    "totalCarbs": 180,
    "totalFats": 55,
    "hydration": 2000,
    "goals": { ... },
    "progress": { ... }
  }
}
```

### Get Single Meal
**GET** `/api/meals/:id` (Protected)

### Update Meal
**PUT** `/api/meals/:id` (Protected)

### Delete Meal
**DELETE** `/api/meals/:id` (Protected)

---

## Hydration Endpoints

### Add Hydration
**POST** `/api/hydration` (Protected)

**Request Body:**
```json
{
  "amount": 250,
  "date": "2024-01-15"
}
```

### Get Hydration Data
**GET** `/api/hydration` (Protected)

**Query Parameters:**
- `date` - ISO date string
- `startDate` - ISO date string
- `endDate` - ISO date string

### Get Today's Hydration
**GET** `/api/hydration/today` (Protected)

### Update Hydration
**PUT** `/api/hydration/:id` (Protected)

### Delete Hydration
**DELETE** `/api/hydration/:id` (Protected)

---

## Activity Endpoints

### Create Activity
**POST** `/api/activities` (Protected)

**Request Body:**
```json
{
  "type": "run",
  "path": [[40.7128, -74.0060], [40.7130, -74.0058]],
  "distance": 5000,
  "duration": 1800,
  "averageSpeed": 2.78,
  "maxSpeed": 3.5,
  "calories": 350
}
```

**Types:** `run`, `walk`, `cycle`, `other`

### Get All Activities
**GET** `/api/activities` (Protected)

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `startDate` - ISO date string
- `endDate` - ISO date string

### Get Nearby Territories
**GET** `/api/activities/territories` (Protected)

**Query Parameters:**
- `lat` - Latitude (required)
- `lng` - Longitude (required)
- `radius` - Radius in meters (default: 5000)

### Get Single Activity
**GET** `/api/activities/:id` (Protected)

### Update Activity
**PUT** `/api/activities/:id` (Protected)

---

## Guild & Social Endpoints

### Create Guild
**POST** `/api/guilds` (Protected)

**Request Body:**
```json
{
  "name": "Warriors United",
  "description": "A guild for dedicated warriors"
}
```

### Get All Guilds
**GET** `/api/guilds` (Protected)

### Get Leaderboard
**GET** `/api/guilds/leaderboard` (Protected)

### Get Friends
**GET** `/api/guilds/friends` (Protected)

### Send Friend Request
**POST** `/api/guilds/friends/request` (Protected)

**Request Body:**
```json
{
  "userId": "user_id_string"
}
```

### Get Raid Boss
**GET** `/api/guilds/raid-boss` (Protected)

### Deal Damage to Raid Boss
**POST** `/api/guilds/raid-boss/damage` (Protected)

**Request Body:**
```json
{
  "damage": 1000
}
```

---

## Dashboard Endpoints

### Get Dashboard Stats
**GET** `/api/dashboard/stats` (Protected)

**Response includes:**
- Daily activity (calories, move minutes, stand hours)
- Streak information
- Today's stats (quests, reps, form score)
- Avatar stats
- Weekly summary

### Get Current Quests
**GET** `/api/dashboard/quests` (Protected)

---

## AI Coach Endpoints

### Analyze Exercise Form
**POST** `/api/ai-coach/analyze-form` (Protected)

**Request Body:**
```json
{
  "exerciseType": "squat",
  "videoData": "base64_encoded_video_or_url"
}
```

**Note:** Currently returns mock data. Will integrate with motion detection service when available.

### Chat with AI Coach
**POST** `/api/ai-coach/chat` (Protected)

**Request Body:**
```json
{
  "message": "Analyze my squat form"
}
```

**Note:** Currently returns mock responses. Will integrate with AI coach service when available.

### Get Recommendations
**GET** `/api/ai-coach/recommendations` (Protected)

**Note:** Currently returns mock recommendations. Will integrate with AI coach service when available.

---

## Error Responses

All errors follow this format:

```json
{
  "status": "error",
  "message": "Error message here"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

1. **Motion Detection AI**: The motion detection service endpoints are prepared but currently return mock data. See `src/services/motionDetectionService.ts` for integration points.

2. **AI Coach**: The AI coach endpoints are prepared but currently return mock responses. See `src/services/aiCoachService.ts` for integration points.

3. **XP System**: Users earn XP for:
   - Completing workouts (10 XP per set)
   - Completing activities (1 XP per 100 meters)
   - Capturing territories (territory reward XP)
   - Dealing damage to raid bosses (damage = XP)

4. **Streak System**: Streaks are tracked based on workout completion. The system checks for consecutive days of activity.

