import express from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import * as mealController from '../controllers/mealController';
import Friendship from '../models/Friendship';
import Meal from '../models/Meal';

const router = express.Router();

router.use(protect);

router.get('/summary', mealController.getDailySummary);
router.get('/weekly', mealController.getWeeklySummary);
router.get('/weekly-detailed', mealController.getWeeklyDetailed);
router.get('/favorites', mealController.getFavorites);
router.get('/history', mealController.getMealHistory);
router.get('/daily-entries', mealController.getDailyEntries);
router.get('/ai-suggestions', mealController.getAISuggestions);

// @route   GET /api/meals/friend/:friendId/today
// @desc    Get a friend's today meals (read-only, friendship required)
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

    const meals = await Meal.find({
      userId: friendId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    const totals = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein:  acc.protein  + m.protein,
        carbs:    acc.carbs    + m.carbs,
        fats:     acc.fats     + m.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    res.json({
      status: 'success',
      mealCount: meals.length,
      meals,
      totals
    });
  } catch (error: any) {
    next(error);
  }
});

router.post('/', mealController.addMeal);
router.post('/favorites/add-to-log', mealController.addFavoriteToLog);
router.put('/:id', mealController.updateMeal);
router.put('/:id/favorite', mealController.toggleFavorite);
router.delete('/:id', mealController.deleteMeal);

export { router as mealRoutes };


