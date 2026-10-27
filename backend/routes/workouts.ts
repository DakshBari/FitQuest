import express from 'express';
import { body, validationResult } from 'express-validator';
import Workout from '../models/Workout';
import User from '../models/User';
import Friendship from '../models/Friendship';
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

// @route   GET /api/workouts/ai-suggestions
// @desc    Get AI-powered workout suggestions
// @access  Private
router.get('/ai-suggestions', async (req: AuthRequest, res, next) => {
  try {
    const { type } = req.query;
    const { mealAIService } = await import('../services/mealAIService');
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    let suggestions: any = {};

    if (type === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayWorkouts = await Workout.find({
        userId: req.user._id,
        date: { $gte: today, $lt: tomorrow }
      }).sort({ createdAt: 1 });

      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
      const workoutSplit = user.profile?.workoutSplit || 'push-pull-legs';
      
      // Calculate detailed stats
      const totalSets = todayWorkouts.reduce((sum, w) => sum + w.sets.length, 0);
      const totalVolume = todayWorkouts.reduce((sum, w) => {
        return sum + w.sets.reduce((setSum, set) => {
          const weightInKg = set.unit === 'lb' ? set.weight * 0.453592 : set.weight;
          return setSum + (set.reps * weightInKg);
        }, 0);
      }, 0);
      const avgRPE = todayWorkouts.length > 0 
        ? (todayWorkouts.reduce((sum, w) => sum + w.rpe, 0) / todayWorkouts.length).toFixed(1)
        : 0;
      
      // Group by muscle group
      const muscleGroups = todayWorkouts.reduce((acc, w) => {
        acc[w.muscleGroup] = (acc[w.muscleGroup] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const workoutDetails = todayWorkouts.map(w => {
        const setsInfo = w.sets.map(s => `${s.reps}x${s.weight}${s.unit}`).join(', ');
        return `- ${w.exercise} (${w.muscleGroup}): ${w.sets.length} sets [${setsInfo}], RPE: ${w.rpe}/10`;
      }).join('\n');

      const prompt = `You are a fitness expert AI. Analyze today's training and provide specific suggestions.

User Profile:
- Weight: ${user.profile?.weight || 75}kg
- Body Type: ${user.profile?.bodyType || 'mesomorph'}
- Workout Split: ${workoutSplit}
- Day: ${dayOfWeek}

Today's Training Summary:
- Total Exercises: ${todayWorkouts.length}
- Total Sets: ${totalSets}
- Total Volume: ${Math.round(totalVolume)}kg
- Average RPE: ${avgRPE}/10
- Muscle Groups Trained: ${Object.keys(muscleGroups).join(', ') || 'None'}

Detailed Workout Log:
${todayWorkouts.length > 0 ? workoutDetails : 'No workouts logged yet today'}

Based on the ${workoutSplit} split and it being ${dayOfWeek}:
1. Analyze what muscle groups should be trained today
2. Evaluate if current volume and intensity are appropriate
3. Suggest additional exercises if needed or if training is complete
4. Provide 2-3 specific workout recommendations with exercises

Format:
SUMMARY: [2-3 sentences analyzing today's training and what should be done]
RECOMMENDATIONS:
- [specific recommendation 1]
- [specific recommendation 2]
- [specific recommendation 3]
WORKOUTS:
[Workout Name]|[Description]|[Muscle Group]|[Exercise1,Exercise2,Exercise3]`;

      if (mealAIService.isGeminiAvailable && mealAIService.model) {
        try {
          const aiResponse = await mealAIService.model.generateContent(prompt);
          suggestions = parseWorkoutSuggestions(aiResponse.response.text());
        } catch (geminiError) {
          console.error('Gemini error for today workout insights, using fallback:', geminiError);
          suggestions = {
            summary: `Today is ${dayOfWeek}. You've logged ${todayWorkouts.length} exercise(s) with ${totalSets} total sets and a volume of ${Math.round(totalVolume)}kg. ${todayWorkouts.length === 0 ? 'No workouts logged yet — start training to track your progress!' : 'Keep going, you are making great progress!'} `,
            recommendations: [
              `Focus on your ${workoutSplit} split for today.`,
              'Warm up for 5-10 minutes with dynamic stretching before your main lifts.',
              'Aim for an RPE of 7-8 on your working sets for optimal stimulus.',
              'Stay hydrated and track every set to maximize progress insights.'
            ],
            workoutSuggestions: [],
            stats: {}
          };
        }
      } else {
        suggestions = {
          summary: `Today is ${dayOfWeek}. You've logged ${todayWorkouts.length} exercise(s) with ${totalSets} total sets. Focus on your ${workoutSplit} split and train with intent!`,
          recommendations: [
            `Follow your ${workoutSplit} split for today.`,
            'Warm up properly before heavy compound movements.',
            'Track your RPE to monitor intensity and avoid overtraining.',
            'Rest 2-3 minutes between heavy compound sets.'
          ],
          workoutSuggestions: [],
          stats: {}
        };
      }

    } else if (type === 'weekly') {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      const workouts = await Workout.find({
        userId: req.user._id,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });

      const totalSets = workouts.reduce((sum, w) => sum + w.sets.length, 0);
      const avgDuration = workouts.length > 0 ? Math.round(workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / workouts.length) : 0;
      const totalVolume = workouts.reduce((sum, w) => {
        return sum + w.sets.reduce((setSum, set) => {
          const weightInKg = set.unit === 'lb' ? set.weight * 0.453592 : set.weight;
          return setSum + (set.reps * weightInKg);
        }, 0);
      }, 0);
      const avgRPE = workouts.length > 0 
        ? (workouts.reduce((sum, w) => sum + w.rpe, 0) / workouts.length).toFixed(1)
        : 0;
      
      // Muscle group distribution
      const muscleGroups = workouts.reduce((acc, w) => {
        acc[w.muscleGroup] = (acc[w.muscleGroup] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const muscleGroupStats = Object.entries(muscleGroups)
        .map(([group, count]) => `${group}: ${count} exercises`)
        .join(', ');

      const prompt = `You are a fitness expert AI. Analyze the last 7 days of training and provide insights.

User Profile:
- Weight: ${user.profile?.weight || 75}kg
- Body Type: ${user.profile?.bodyType || 'mesomorph'}
- Workout Split: ${user.profile?.workoutSplit || 'push-pull-legs'}

Weekly Training Stats (Last 7 Days):
- Total Workouts: ${workouts.length}
- Total Sets: ${totalSets}
- Total Volume: ${Math.round(totalVolume)}kg
- Average Duration: ${avgDuration} minutes
- Average RPE: ${avgRPE}/10
- Training Frequency: ${workouts.length} days/week
- Muscle Group Distribution: ${muscleGroupStats || 'No data'}

Analyze:
1. Training frequency and consistency
2. Muscle group balance (are any groups undertrained?)
3. Volume and intensity appropriateness
4. Recovery considerations based on frequency and RPE
5. Specific improvements for next week

Format:
SUMMARY: [3-4 sentences analyzing weekly patterns and overall training quality]
RECOMMENDATIONS:
- [specific improvement 1]
- [specific improvement 2]
- [specific improvement 3]
- [specific improvement 4]
STATS:
TOTAL_WORKOUTS: ${workouts.length}
AVG_DURATION: ${avgDuration}min
FREQUENCY: ${workouts.length}
CONSISTENCY: ${Math.round((workouts.length / 7) * 100)}`;

      const weeklyStats = {
        totalworkouts: workouts.length,
        avgduration: avgDuration,
        frequency: workouts.length,
        consistency: Math.round((workouts.length / 7) * 100)
      };

      if (mealAIService.isGeminiAvailable && mealAIService.model) {
        try {
          const aiResponse = await mealAIService.model.generateContent(prompt);
          suggestions = parseWorkoutSuggestions(aiResponse.response.text());
          // Ensure stats are always populated
          if (!suggestions.stats || Object.keys(suggestions.stats).length === 0) {
            suggestions.stats = weeklyStats;
          }
        } catch (geminiError) {
          console.error('Gemini error for weekly workout insights, using fallback:', geminiError);
          suggestions = {
            summary: `Over the last 7 days you logged ${workouts.length} workout(s) with an average RPE of ${avgRPE}/10. ${workouts.length < 3 ? 'Try to aim for at least 3-4 training sessions per week for consistent progress.' : 'Great training frequency! Focus on progressive overload next week.'}`,
            recommendations: [
              workouts.length < 3 ? 'Increase training frequency to at least 3 days per week.' : 'Maintain your consistent training frequency.',
              'Ensure each muscle group is trained at least once per week.',
              'Track total volume per session to ensure progressive overload.',
              'Include at least one dedicated recovery or mobility day.'
            ],
            workoutSuggestions: [],
            stats: weeklyStats
          };
        }
      } else {
        suggestions = {
          summary: `Over the last 7 days you logged ${workouts.length} workout(s). ${workouts.length < 3 ? 'Aim for 3-4 sessions per week to build momentum.' : 'Solid training week! Keep up the consistency.'}`,
          recommendations: [
            'Track every session to monitor volume over time.',
            'Balance pushing, pulling, and leg movements throughout the week.',
            'Progressive overload is key — add small weight increments each week.',
            'Prioritise sleep and nutrition to maximise recovery between sessions.'
          ],
          workoutSuggestions: [],
          stats: weeklyStats
        };
      }

    } else if (type === 'overall') {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);

      const workouts = await Workout.find({
        userId: req.user._id,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });

      const totalSets = workouts.reduce((sum, w) => sum + w.sets.length, 0);
      const avgDuration = workouts.length > 0 ? Math.round(workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / workouts.length) : 0;
      const daysWithWorkouts = new Set(workouts.map(w => w.date.toISOString().split('T')[0])).size;
      const totalVolume = workouts.reduce((sum, w) => {
        return sum + w.sets.reduce((setSum, set) => {
          const weightInKg = set.unit === 'lb' ? set.weight * 0.453592 : set.weight;
          return setSum + (set.reps * weightInKg);
        }, 0);
      }, 0);
      const avgRPE = workouts.length > 0 
        ? (workouts.reduce((sum, w) => sum + w.rpe, 0) / workouts.length).toFixed(1)
        : 0;
      
      // Muscle group distribution
      const muscleGroups = workouts.reduce((acc, w) => {
        acc[w.muscleGroup] = (acc[w.muscleGroup] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const muscleGroupStats = Object.entries(muscleGroups)
        .sort((a, b) => b[1] - a[1])
        .map(([group, count]) => `${group}: ${count}`)
        .join(', ');

      const prompt = `You are a fitness expert AI. Provide comprehensive analysis of the last 30 days of training.

User Profile:
- Weight: ${user.profile?.weight || 75}kg
- Body Type: ${user.profile?.bodyType || 'mesomorph'}
- Workout Split: ${user.profile?.workoutSplit || 'push-pull-legs'}

Monthly Training Stats (Last 30 Days):
- Total Workouts: ${workouts.length}
- Days with Training: ${daysWithWorkouts}/30
- Total Sets: ${totalSets}
- Total Volume: ${Math.round(totalVolume)}kg
- Average Duration: ${avgDuration} minutes
- Average RPE: ${avgRPE}/10
- Weekly Frequency: ${(workouts.length / 4).toFixed(1)} workouts/week
- Consistency: ${Math.round((daysWithWorkouts / 30) * 100)}%
- Muscle Group Distribution: ${muscleGroupStats || 'No data'}

Provide comprehensive analysis:
1. Overall training consistency and adherence
2. Volume progression and intensity management
3. Muscle group balance and potential imbalances
4. Recovery patterns based on frequency and RPE
5. Long-term recommendations for continued progress
6. Strengths to maintain and weaknesses to address

Format:
SUMMARY: [4-5 sentences providing comprehensive overview of training habits and progress]
RECOMMENDATIONS:
- [long-term recommendation 1]
- [long-term recommendation 2]
- [long-term recommendation 3]
- [long-term recommendation 4]
- [long-term recommendation 5]
STATS:
TOTAL_WORKOUTS: ${workouts.length}
AVG_DURATION: ${avgDuration}min
FREQUENCY: ${(workouts.length / 4).toFixed(1)}
CONSISTENCY: ${Math.round((daysWithWorkouts / 30) * 100)}`;

      const overallStats = {
        totalworkouts: workouts.length,
        avgduration: avgDuration,
        frequency: parseFloat((workouts.length / 4).toFixed(1)),
        consistency: Math.round((daysWithWorkouts / 30) * 100)
      };

      if (mealAIService.isGeminiAvailable && mealAIService.model) {
        try {
          const aiResponse = await mealAIService.model.generateContent(prompt);
          suggestions = parseWorkoutSuggestions(aiResponse.response.text());
          if (!suggestions.stats || Object.keys(suggestions.stats).length === 0) {
            suggestions.stats = overallStats;
          }
        } catch (geminiError) {
          console.error('Gemini error for overall workout insights, using fallback:', geminiError);
          suggestions = {
            summary: `Over the last 30 days you completed ${workouts.length} workout(s) across ${daysWithWorkouts} training days — a consistency rate of ${Math.round((daysWithWorkouts / 30) * 100)}%. ${workouts.length < 8 ? 'Building the training habit is the first step — aim for 3-4 sessions per week going forward.' : 'You are building a solid training base. Focus on progressive overload and recovery to keep improving.'}`,
            recommendations: [
              'Set a target of 3-5 training sessions per week for sustainable progress.',
              'Review your muscle group distribution and ensure no major groups are neglected.',
              'Add progressive overload by increasing weight or reps each week.',
              'Deload every 4-6 weeks to allow full recovery and avoid burnout.',
              'Combine strength training with adequate nutrition and sleep for best results.'
            ],
            workoutSuggestions: [],
            stats: overallStats
          };
        }
      } else {
        suggestions = {
          summary: `Over the last 30 days you completed ${workouts.length} workout(s) with a consistency of ${Math.round((daysWithWorkouts / 30) * 100)}%. ${workouts.length < 8 ? 'Focus on building the training habit first.' : 'Great long-term consistency! Keep progressive overload as your north star.'}`,
          recommendations: [
            'Aim for 3-5 sessions per week for continued progress.',
            'Log every session to track long-term volume trends.',
            'Deload every 4-6 weeks to prevent overtraining.',
            'Ensure balanced muscle group training across your split.',
            'Combine training with good nutrition and sleep for maximum gains.'
          ],
          workoutSuggestions: [],
          stats: overallStats
        };
      }
    } else {
      suggestions = {
        summary: 'Start logging your workouts to receive personalized training insights from The Oracle.',
        recommendations: [
          'Log your first workout to get started.',
          'Track exercises, sets, reps, and weight for accurate analysis.',
          'Consistency is the key to long-term progress.'
        ],
        workoutSuggestions: [],
        stats: {}
      };
    }

    res.json({
      status: 'success',
      suggestions
    });

  } catch (error: any) {
    console.error('Workout AI Suggestions Error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to generate AI suggestions',
      suggestions: { error: 'AI service is currently unavailable. Please try again later.' }
    });
  }
});

function parseWorkoutSuggestions(responseText: string): any {
  const result: any = {
    summary: '',
    recommendations: [],
    workoutSuggestions: [],
    stats: {}
  };

  const summaryMatch = responseText.match(/SUMMARY:\s*(.+?)(?=RECOMMENDATIONS:|WORKOUTS:|STATS:|$)/s);
  if (summaryMatch) result.summary = summaryMatch[1].trim();

  const recommendationsMatch = responseText.match(/RECOMMENDATIONS:\s*(.+?)(?=WORKOUTS:|STATS:|$)/s);
  if (recommendationsMatch) {
    result.recommendations = recommendationsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());
  }

  const workoutsMatch = responseText.match(/WORKOUTS:\s*(.+?)(?=STATS:|$)/s);
  if (workoutsMatch) {
    const workoutLines = workoutsMatch[1].split('\n').filter(line => line.includes('|'));
    result.workoutSuggestions = workoutLines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 4) {
        return {
          name: parts[0],
          description: parts[1],
          type: parts[2],
          exercises: parts[3].split(',').map(e => e.trim())
        };
      }
      return null;
    }).filter(Boolean);
  }

  const statsMatch = responseText.match(/STATS:\s*(.+?)$/s);
  if (statsMatch) {
    const statsLines = statsMatch[1].split('\n').filter(line => line.includes(':'));
    statsLines.forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) {
        const cleanKey = key.toLowerCase().replace(/_/g, '');
        result.stats[cleanKey] = value.replace(/[^\d.]/g, '');
      }
    });
  }

  return result;
}

// @route   GET /api/workouts/friend/:friendId/today
// @desc    Get a friend's today workouts (read-only, friendship required)
// @access  Private
router.get('/friend/:friendId/today', async (req: AuthRequest, res, next) => {
  try {
    const { friendId } = req.params;

    // Verify accepted friendship
    const friendship = await Friendship.findOne({
      $or: [
        { requester: req.user._id, recipient: friendId, status: 'accepted' },
        { requester: friendId, recipient: req.user._id, status: 'accepted' }
      ]
    });

    if (!friendship) {
      return res.status(403).json({ status: 'error', message: 'Not friends with this user' });
    }

    // Today's date range
    const today = new Date();
    const start = new Date(today); start.setHours(0, 0, 0, 0);
    const end   = new Date(today); end.setHours(23, 59, 59, 999);

    const workouts = await Workout.find({
      userId: friendId,
      date: { $gte: start, $lte: end }
    }).sort({ createdAt: 1 });

    // Compute summary stats
    const totalSets = workouts.reduce((s, w) => s + w.sets.length, 0);
    const totalVolume = workouts.reduce((s, w) =>
      s + w.sets.reduce((ss, set) => {
        const kg = set.unit === 'lb' ? set.weight * 0.453592 : set.weight;
        return ss + set.reps * kg;
      }, 0), 0);
    const avgRPE = workouts.length > 0
      ? workouts.reduce((s, w) => s + w.rpe, 0) / workouts.length
      : 0;
    const muscleGroups = [...new Set(workouts.map(w => w.muscleGroup))];

    res.json({
      status: 'success',
      workoutCount: workouts.length,
      workouts,
      stats: {
        totalSets,
        totalVolume: Math.round(totalVolume),
        avgRPE: Math.round(avgRPE * 10) / 10,
        muscleGroups
      }
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

