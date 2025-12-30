import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req: AuthRequest, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      status: 'success',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        level: user.level,
        xp: user.xp,
        stats: user.stats,
        streak: user.streak,
        goals: user.goals,
        profile: user.profile,
        territories: user.territories,
        challengesWon: user.challengesWon,
        winStreak: user.winStreak
      }
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  protect,
  [
    body('profile.weight').optional().isFloat({ min: 0 }),
    body('profile.height').optional().isFloat({ min: 0 }),
    body('profile.bodyType').optional().isIn(['ectomorph', 'mesomorph', 'endomorph']),
    body('profile.goal').optional().isIn(['muscle-gain', 'weight-loss', 'maintenance', 'endurance']),
    body('goals.calories').optional().isInt({ min: 0 }),
    body('goals.protein').optional().isFloat({ min: 0 }),
    body('goals.carbs').optional().isFloat({ min: 0 }),
    body('goals.fats').optional().isFloat({ min: 0 })
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!user) {
        return next(new AppError('User not found', 404));
      }

      res.json({
        status: 'success',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          level: user.level,
          xp: user.xp,
          stats: user.stats,
          streak: user.streak,
          goals: user.goals,
          profile: user.profile
        }
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export { router as userRoutes };

