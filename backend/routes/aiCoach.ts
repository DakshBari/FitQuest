import express from 'express';
import { body, validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler';
import { protect, AuthRequest } from '../middleware/auth';
import { motionDetectionService } from '../services/motionDetectionService';
import { aiCoachService } from '../services/aiCoachService';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/ai-coach/analyze-form
// @desc    Analyze exercise form using motion detection AI
// @access  Private
router.post(
  '/analyze-form',
  [
    body('exerciseType').notEmpty().withMessage('Exercise type is required'),
    body('videoData').optional().isString()
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { exerciseType, videoData } = req.body;

      // Call motion detection service (placeholder for future ML service)
      const analysis = await motionDetectionService.analyzeForm({
        userId: req.user._id.toString(),
        exerciseType,
        videoData
      });

      res.json({
        status: 'success',
        analysis
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   POST /api/ai-coach/chat
// @desc    Chat with AI coach
// @access  Private
router.post(
  '/chat',
  [
    body('message').trim().notEmpty().withMessage('Message is required')
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { message } = req.body;

      // Call AI coach service (placeholder for future ML service)
      const response = await aiCoachService.chat({
        userId: req.user._id.toString(),
        message
      });

      res.json({
        status: 'success',
        response
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/ai-coach/recommendations
// @desc    Get AI coach recommendations
// @access  Private
router.get('/recommendations', async (req: AuthRequest, res, next) => {
  try {
    // Call AI coach service for recommendations
    const recommendations = await aiCoachService.getRecommendations({
      userId: req.user._id.toString()
    });

    res.json({
      status: 'success',
      recommendations
    });
  } catch (error: any) {
    next(error);
  }
});

export { router as aiCoachRoutes };

