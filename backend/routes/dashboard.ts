import express from 'express';
import Workout from '../models/Workout';
import Meal from '../models/Meal';
import Activity from '../models/Activity';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', async (req: AuthRequest, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get user
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Today's workouts
    const todayWorkouts = await Workout.find({
      userId: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    // Today's meals
    const todayMeals = await Meal.find({
      userId: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    // This week's activities
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekActivities = await Activity.find({
      userId: req.user._id,
      startTime: { $gte: weekStart, $lt: weekEnd }
    });

    // Calculate daily stats
    const totalCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);
    const moveMinutes = weekActivities.reduce((sum, a) => sum + Math.floor(a.duration / 60), 0);
    const standHours = 12; // This would typically come from activity tracking

    // Calculate streak
    const lastActivity = await Workout.findOne({ userId: req.user._id })
      .sort({ date: -1 })
      .select('date');

    const stats = {
      dailyActivity: {
        calories: {
          current: totalCalories,
          goal: user.goals.calories,
          percentage: (totalCalories / user.goals.calories) * 100
        },
        moveMinutes: {
          current: moveMinutes,
          goal: 60,
          percentage: (moveMinutes / 60) * 100
        },
        standHours: {
          current: standHours,
          goal: 12,
          percentage: (standHours / 12) * 100
        }
      },
      streak: {
        current: user.streak.current,
        longest: user.streak.longest
      },
      todayStats: {
        questsCompleted: todayWorkouts.length,
        perfectReps: todayWorkouts.reduce((sum, w) => {
          return sum + w.sets.reduce((setSum, set) => setSum + set.reps, 0);
        }, 0),
        formScore: 94 // This would come from motion detection AI
      },
      avatar: {
        strength: user.stats.strength,
        agility: user.stats.agility,
        endurance: user.stats.endurance
      },
      weeklySummary: {
        totalWorkouts: await Workout.countDocuments({
          userId: req.user._id,
          date: { $gte: weekStart, $lt: weekEnd }
        }),
        xpEarned: 3480, // This would be calculated from activities
        territoriesCaptured: await Activity.countDocuments({
          userId: req.user._id,
          startTime: { $gte: weekStart, $lt: weekEnd },
          capturedTerritories: { $exists: true, $ne: [] }
        })
      }
    };

    res.json({
      status: 'success',
      stats
    });
  } catch (error: any) {
    next(error);
  }
});

// @route   GET /api/dashboard/quests
// @desc    Get current quests
// @access  Private
router.get('/quests', async (req: AuthRequest, res, next) => {
  try {
    // This would typically come from a Quest model
    // For now, returning a mock quest structure
    const quest = {
      id: '1',
      name: 'Leg Day Destruction',
      description: 'Complete a legendary lower body workout to unlock the Titan\'s Greaves armor piece.',
      status: 'active',
      objectives: [
        { name: 'Squats', current: 30, target: 50, completed: false },
        { name: 'Lunges', current: 20, target: 40, completed: false },
        { name: 'Calf Raises', current: 0, target: 30, completed: false }
      ],
      reward: {
        name: 'Titan\'s Greaves',
        type: 'armor',
        stats: { endurance: 15, strength: 10 }
      }
    };

    res.json({
      status: 'success',
      quest
    });
  } catch (error: any) {
    next(error);
  }
});

export { router as dashboardRoutes };



