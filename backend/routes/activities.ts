import express from 'express';
import { body, validationResult } from 'express-validator';
import Activity from '../models/Activity';
import Territory from '../models/Territory';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/activities
// @desc    Create a new activity
// @access  Private
router.post(
  '/',
  [
    body('type').isIn(['run', 'walk', 'cycle', 'other']),
    body('path').isArray().withMessage('Path must be an array of coordinates'),
    body('distance').isFloat({ min: 0 }),
    body('duration').isInt({ min: 0 }),
    body('averageSpeed').isFloat({ min: 0 }),
    body('maxSpeed').isFloat({ min: 0 })
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const activityData = {
        ...req.body,
        userId: req.user._id,
        startTime: req.body.startTime ? new Date(req.body.startTime) : new Date()
      };

      const activity = await Activity.create(activityData);

      // Check for territory captures
      const capturedTerritories = [];
      if (activity.path && activity.path.length > 0) {
        const territories = await Territory.find({
          location: {
            $geoWithin: {
              $centerSphere: [
                [activity.path[0][1], activity.path[0][0]], // [lng, lat]
                1000 / 6378100 // radius in radians (1000 meters)
              ]
            }
          },
          capturedBy: { $exists: false }
        });

        for (const territory of territories) {
          territory.capturedBy = req.user._id;
          territory.capturedAt = new Date();
          await territory.save();
          capturedTerritories.push(territory._id);

          // Award XP and update user stats
          await User.findByIdAndUpdate(req.user._id, {
            $inc: { xp: territory.reward, territories: 1 }
          });
        }
      }

      // Award XP for activity completion
      const xpGained = Math.floor(activity.distance / 100); // 1 XP per 100 meters
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { xp: xpGained }
      });

      res.status(201).json({
        status: 'success',
        activity,
        capturedTerritories,
        xpGained
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/activities
// @desc    Get all activities for current user
// @access  Private
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const query: any = { userId: req.user._id };

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate as string);
      if (endDate) query.startTime.$lte = new Date(endDate as string);
    }

    const activities = await Activity.find(query)
      .sort({ startTime: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .populate('capturedTerritories');

    const total = await Activity.countDocuments(query);

    res.json({
      status: 'success',
      results: activities.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      activities
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   GET /api/activities/territories
// @desc    Get available territories near a location
// @access  Private
router.get('/territories', async (req: AuthRequest, res, next) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    if (!lat || !lng) {
      return next(new AppError('Latitude and longitude are required', 400));
    }

    const territories = await Territory.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: Number(radius)
        }
      }
    });

    res.json({
      status: 'success',
      results: territories.length,
      territories
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   GET /api/activities/:id
// @desc    Get a single activity
// @access  Private
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('capturedTerritories');

    if (!activity) {
      return next(new AppError('Activity not found', 404));
    }

    res.json({
      status: 'success',
      activity
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   PUT /api/activities/:id
// @desc    Update an activity (e.g., end time)
// @access  Private
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const activity = await Activity.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!activity) {
      return next(new AppError('Activity not found', 404));
    }

    res.json({
      status: 'success',
      activity
    });
  } catch (error: any) {
    next(error);
  }
});

export { router as activityRoutes };

