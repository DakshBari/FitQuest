import express from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import * as mealController from '../controllers/mealController';

const router = express.Router();

router.use(protect);

router.get('/summary', mealController.getDailySummary);
router.get('/weekly', mealController.getWeeklySummary);
router.get('/weekly-detailed', mealController.getWeeklyDetailed);
router.get('/favorites', mealController.getFavorites);
router.get('/history', mealController.getMealHistory);
router.get('/daily-entries', mealController.getDailyEntries);
router.post('/', mealController.addMeal);
router.post('/favorites/add-to-log', mealController.addFavoriteToLog);
router.put('/:id', mealController.updateMeal);
router.put('/:id/favorite', mealController.toggleFavorite);
router.delete('/:id', mealController.deleteMeal);

export { router as mealRoutes };