import express from 'express';
import { body, validationResult } from 'express-validator';
import Workout from '../models/Workout';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/workouts
// @desc    Create a new workout
// @access  Private
router.post(
  '/',
  [
    body('exercise').trim().notEmpty().withMessage('Exercise name is required'),
    body('muscleGroup').isIn(['Chest', 'Triceps', 'Back', 'Biceps', 'Shoulders', 'Legs', 'Core', 'Cardio']),
    body('weightType').isIn(['dumbbell', 'barbell', 'bodyweight', 'machine', 'cable', 'kettlebell', 'resistance_band']),
    body('sets').isArray({ min: 1 }).withMessage('At least one set is required'),
    body('sets.*.reps').isInt({ min: 0 }),
    body('sets.*.weight').isFloat({ min: 0 }),
    body('sets.*.unit').isIn(['kg', 'lb']),
    body('rpe').isInt({ min: 1, max: 10 }),
    body('date').optional().isISO8601()
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const workoutData = {
        ...req.body,
        userId: req.user._id,
        date: req.body.date ? new Date(req.body.date) : new Date()
      };

      const workout = await Workout.create(workoutData);

      // Award XP for workout completion
      const xpGained = workout.sets.length * 10; // 10 XP per set
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { xp: xpGained }
      });

      res.status(201).json({
        status: 'success',
        workout,
        xpGained
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/workouts
// @desc    Get all workouts for current user
// @access  Private
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const query: any = { userId: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const workouts = await Workout.find(query)
      .sort({ date: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Workout.countDocuments(query);

    res.json({
      status: 'success',
      results: workouts.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      workouts
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   GET /api/workouts/:id
// @desc    Get a single workout
// @access  Private
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!workout) {
      return next(new AppError('Workout not found', 404));
    }

    res.json({
      status: 'success',
      workout
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   PUT /api/workouts/:id
// @desc    Update a workout
// @access  Private
router.put(
  '/:id',
  [
    body('exercise').optional().trim().notEmpty(),
    body('muscleGroup').optional().isIn(['Chest', 'Triceps', 'Back', 'Biceps', 'Shoulders', 'Legs', 'Core', 'Cardio']),
    body('weightType').optional().isIn(['dumbbell', 'barbell', 'bodyweight', 'machine', 'cable', 'kettlebell', 'resistance_band']),
    body('sets').optional().isArray({ min: 1 }),
    body('rpe').optional().isInt({ min: 1, max: 10 })
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const workout = await Workout.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        req.body,
        { new: true, runValidators: true }
      );

      if (!workout) {
        return next(new AppError('Workout not found', 404));
      }

      res.json({
        status: 'success',
        workout
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   DELETE /api/workouts/:id
// @desc    Delete a workout
// @access  Private
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!workout) {
      return next(new AppError('Workout not found', 404));
    }

    res.json({
      status: 'success',
      message: 'Workout deleted successfully'
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   GET /api/workouts/analytics/stats
// @desc    Get workout analytics
// @access  Private
router.get('/analytics/stats', async (req: AuthRequest, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query: any = { userId: req.user._id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const workouts = await Workout.find(query);

    const stats = {
      totalWorkouts: workouts.length,
      totalSets: workouts.reduce((sum, w) => sum + w.sets.length, 0),
      muscleGroupDistribution: {} as Record<string, number>,
      averageRPE: workouts.length > 0
        ? workouts.reduce((sum, w) => sum + w.rpe, 0) / workouts.length
        : 0,
      totalVolume: workouts.reduce((sum, w) => {
        return sum + w.sets.reduce((setSum, set) => {
          const weightInKg = set.unit === 'lb' ? set.weight * 0.453592 : set.weight;
          return setSum + (set.reps * weightInKg);
        }, 0);
      }, 0)
    };

    workouts.forEach(workout => {
      stats.muscleGroupDistribution[workout.muscleGroup] =
        (stats.muscleGroupDistribution[workout.muscleGroup] || 0) + 1;
    });

    res.json({
      status: 'success',
      stats
    });
  } catch (error: any) {
    next(error);
  }
});

export { router as workoutRoutes };

