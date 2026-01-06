import express from 'express';
import { body, validationResult, query } from 'express-validator';
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

// @route   GET /api/users/search
// @desc    Search for users by username
// @access  Private
router.get(
  '/search',
  protect, // Ensure this is present
  [
    query('q').notEmpty().withMessage('Search query is required')
  ],
  async (req: AuthRequest, res, next) => {
    try {
      console.log("--- SEARCH ROUTE HIT ---");
      
      // Debugging User
      console.log("User ID:", req.user?._id);

      const { q } = req.query;
      
      // Ensure query is a string (TypeScript safety)
      const searchQuery = typeof q === 'string' ? q : (Array.isArray(q) ? q[0] : '');

      if (!searchQuery) {
        return res.status(400).json({ message: 'Query is missing' });
      }

      console.log("Searching for:", searchQuery);

      // Search logic
      const users = await User.find({
        _id: { $ne: req.user._id }, 
        username: { $regex: searchQuery, $options: 'i' } 
      })
      .select('username avatar level isOnline') 
      .limit(10);

      console.log("Found users:", users.length);

      res.json({
        status: 'success',
        users
      });
    } catch (error: any) {
      // DEBUGGING: Log error to backend console AND send it to frontend
      console.error("!!! SEARCH ERROR !!!", error);
      console.error("Error Name:", error.name);
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);
      
      // Return the error message to the frontend so you can see it in Browser Console
      res.status(500).json({ 
        message: "Search Failed", 
        error: error.message, 
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      });
    }
  }
);

// @route   PUT /api/users/status
// @desc    Update online status (true/false)
// @access  Private
router.put('/status', protect, async (req: AuthRequest, res, next) => {
  try {
    const { isOnline } = req.body;

    const updateData: any = { isOnline };
    if (isOnline === false) {
      updateData.lastSeen = new Date();
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    );

    res.json({
      status: 'success',
      user
    });
  } catch (error: any) {
    next(error);
  }
});

export { router as userRoutes };