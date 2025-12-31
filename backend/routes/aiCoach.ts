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
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('sessionId').optional().isString()
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { message, sessionId } = req.body;

      // Call AI coach service with Gemini integration
      const response = await aiCoachService.chat({
        userId: req.user._id.toString(),
        message,
        sessionId
      });

      res.json({
        status: 'success',
        data: response
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// @route   GET /api/ai-coach/sessions
// @desc    Get user's chat sessions
// @access  Private
router.get('/sessions', async (req: AuthRequest, res, next) => {
  try {
    const sessions = await aiCoachService.getChatSessions(req.user._id.toString());

    res.json({
      status: 'success',
      data: sessions
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   DELETE /api/ai-coach/sessions/:sessionId
// @desc    Delete a chat session
// @access  Private
router.delete('/sessions/:sessionId', async (req: AuthRequest, res, next) => {
  try {
    const { sessionId } = req.params;
    
    const success = await aiCoachService.deleteChatSession(
      req.user._id.toString(),
      sessionId
    );

    if (!success) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat session not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Chat session deleted successfully'
    });
  } catch (error: any) {
    next(error);
  }
});

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
      data: recommendations
    });
  } catch (error: any) {
    next(error);
  }
});

export { router as aiCoachRoutes };

