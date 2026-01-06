# World Map Setup Guide

## Backend Setup

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   
   The server should start on `http://localhost:5000`

2. **Environment Variables**
   Make sure your `backend/.env` file contains:
   ```
   MONGODB_URI=mongodb://localhost:27017/fitquest
   JWT_SECRET=your-jwt-secret-key
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```

3. **Database Connection**
   - Ensure MongoDB is running locally or update the connection string
   - The app will create the necessary collections automatically

## Frontend Setup

1. **Start the Frontend**
   ```bash
   cd Frontend
   npm run dev
   ```
   
   The frontend should start on `http://localhost:3000`

2. **Environment Variables**
   Create `Frontend/.env.local` with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_ORS_API_KEY=your-ors-api-key  # Optional for real routing
   ```

## Features Available

### Explorer Mode
- Free exploration running/cycling
- Real-time GPS tracking
- Area capture when completing loops
- Live statistics display

### Navigator Mode
- Click map to set start and end points (2 points only)
- Automatic route generation with 3 options:
  - Direct Route (shortest)
  - Scenic Route (more interesting)
  - Alternative Route (quieter streets)
- Click route cards or map lines to select routes
- Road-based routing (not straight lines)

### History Tab
- View all past sessions
- Session statistics and captured areas
- Filter by activity type

## Troubleshooting

### "Failed to fetch" Errors
1. Ensure backend server is running on port 5000
2. Check CORS configuration in backend
3. Verify API_URL in frontend environment

### Authentication Issues
1. Make sure you're logged in
2. Check JWT token in localStorage
3. Verify JWT_SECRET in backend .env

### Route Generation Issues
1. Routes work without API key (uses fallback)
2. For real routing, get free API key from https://openrouteservice.org/
3. Add API key to NEXT_PUBLIC_ORS_API_KEY

### Database Issues
1. Ensure MongoDB is running
2. Check connection string in backend .env
3. Collections are created automatically

## API Endpoints

- `GET /api/world-map/captured-areas` - Get user's captured territories
- `POST /api/world-map/captured-areas` - Save new captured area
- `GET /api/world-map/sessions` - Get session history
- `POST /api/world-map/sessions` - Start new session
- `PUT /api/world-map/sessions/:id` - Update/complete session
- `GET /api/world-map/stats` - Get user statistics

All endpoints require authentication via Bearer token.