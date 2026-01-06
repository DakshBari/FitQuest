import express from 'express'
import { authenticateToken } from '../middleware/auth'
import Territory from '../models/Territory'
import Activity from '../models/Activity'
import User from '../models/User'

const router = express.Router()

// Get user's captured areas
router.get('/captured-areas', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const territories = await Territory.find({ userId, captured: true })
    
    const capturedAreas = {
      type: "FeatureCollection",
      features: territories.map(territory => ({
        type: "Feature",
        geometry: territory.geometry,
        properties: {
          id: territory._id,
          capturedAt: territory.capturedAt,
          area: territory.area,
          sessionId: territory.sessionId
        }
      }))
    }

    res.json(capturedAreas)
  } catch (error) {
    console.error('Error fetching captured areas:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Save captured area
router.post('/captured-areas', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { geometry, properties } = req.body

    const territory = new Territory({
      userId,
      geometry,
      area: properties.area,
      capturedAt: new Date(properties.capturedAt),
      sessionId: properties.sessionId,
      captured: true
    })

    await territory.save()
    res.status(201).json({ success: true, territoryId: territory._id })
  } catch (error) {
    console.error('Error saving captured area:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's session history
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const activities = await Activity.find({ 
      userId, 
      type: { $in: ['run', 'cycle'] },
      worldMapData: { $exists: true }
    }).sort({ createdAt: -1 })

    const sessions = activities.map(activity => ({
      id: activity._id,
      type: activity.type,
      mode: activity.worldMapData?.mode || 'explorer',
      startTime: activity.createdAt,
      endTime: activity.worldMapData?.endTime,
      path: activity.worldMapData?.path || [],
      distance: activity.worldMapData?.distance || 0,
      duration: activity.worldMapData?.duration || 0,
      averageSpeed: activity.worldMapData?.averageSpeed || 0,
      maxSpeed: activity.worldMapData?.maxSpeed || 0,
      capturedAreas: activity.worldMapData?.capturedAreas || { type: "FeatureCollection", features: [] },
      isActive: false
    }))

    res.json(sessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Start new session
router.post('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { sessionId, type, mode, startLocation, plannedRoute } = req.body

    const activity = new Activity({
      userId,
      type,
      startTime: new Date(),
      endTime: null,
      duration: 0,
      distance: 0,
      path: [startLocation],
      averageSpeed: 0,
      maxSpeed: 0,
      calories: 0,
      capturedTerritories: [],
      worldMapData: {
        sessionId,
        mode,
        startLocation,
        plannedRoute,
        path: [startLocation],
        distance: 0,
        duration: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        capturedAreas: { type: "FeatureCollection", features: [] },
        isActive: true
      }
    })

    await activity.save()
    res.status(201).json({ success: true, activityId: activity._id })
  } catch (error) {
    console.error('Error starting session:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update/complete session
router.put('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const { sessionId } = req.params
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const sessionData = req.body

    const activity = await Activity.findOne({ 
      userId, 
      'worldMapData.sessionId': sessionId 
    })

    if (!activity) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Update the activity with completed session data
    activity.endTime = sessionData.endTime
    activity.duration = sessionData.duration || 0
    activity.distance = sessionData.distance || 0
    activity.averageSpeed = sessionData.averageSpeed || 0
    activity.maxSpeed = sessionData.maxSpeed || 0
    activity.path = sessionData.path || []
    
    activity.worldMapData = {
      ...activity.worldMapData,
      ...sessionData,
      isActive: false,
      endTime: sessionData.endTime
    }

    await activity.save()
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating session:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get session statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const [totalTerritories, totalActivities, totalDistance] = await Promise.all([
      Territory.countDocuments({ userId, captured: true }),
      Activity.countDocuments({ userId, type: { $in: ['run', 'cycle'] } }),
      Activity.aggregate([
        { $match: { userId, type: { $in: ['run', 'cycle'] } } },
        { $group: { _id: null, totalDistance: { $sum: '$worldMapData.distance' } } }
      ])
    ])

    res.json({
      totalTerritories,
      totalActivities,
      totalDistance: totalDistance[0]?.totalDistance || 0
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router