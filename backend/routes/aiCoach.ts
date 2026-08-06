import express from 'express';
import { body, validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler';
import { protect, AuthRequest } from '../middleware/auth';
import { motionDetectionService } from '../services/motionDetectionService';
import { aiCoachService } from '../services/aiCoachService';
import { mealAIService } from '../services/mealAIService';

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

// @route   POST /api/ai-coach/analyze-food
// @desc    Analyze food nutrition using Gemini AI
// @access  Private
router.post(
  '/analyze-food',
  [
    body('foodName').trim().notEmpty().withMessage('Food name is required'),
    body('weight').isNumeric().withMessage('Weight must be a number'),
    body('quantityType').optional().isIn(['weight', 'units']).withMessage('Quantity type must be weight or units')
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { foodName, weight, quantityType = 'weight' } = req.body;

      console.log('Analyzing food:', foodName, weight, quantityType);

      // Build description based on quantity type
      const description = quantityType === 'units' 
        ? `${weight} piece(s) of ${foodName}`
        : `${weight}g of ${foodName}`;

      // Call meal AI service for food analysis
      const analysis = await mealAIService.analyzeMeal({
        userId: req.user._id.toString(),
        mealDescription: description
      });

      console.log('Analysis result:', analysis);

      // Calculate nutrition based on quantity
      // For weight: ratio based on 100g
      // For units: AI already analyzed per piece, so multiply by count
      const ratio = quantityType === 'units' ? Number(weight) : Number(weight) / 100;
      
      res.json({
        status: 'success',
        nutrition: {
          calories: Math.round(analysis.calories * ratio),
          protein: Math.round(analysis.protein * ratio),
          carbs: Math.round(analysis.carbs * ratio),
          fats: Math.round(analysis.fats * ratio),
          confidence: analysis.confidence
        }
      });
    } catch (error: any) {
      console.error('Error analyzing food:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to analyze food'
      });
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

      console.log('Chat request:', { userId: req.user._id, message, sessionId });

      // Call AI coach service with Gemini integration
      const response = await aiCoachService.chat({
        userId: req.user._id.toString(),
        message,
        sessionId
      });

      console.log('Chat response received');

      res.json({
        status: 'success',
        data: response
      });
    } catch (error: any) {
      console.error('Error in chat route:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to process chat message'
      });
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



