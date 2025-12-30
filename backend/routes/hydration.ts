import express from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import * as hydrationController from '../controllers/hydrationController';

const router = express.Router();

router.use(protect);

router.get('/today', hydrationController.getTodayHydration);
router.get('/weekly', hydrationController.getWeeklyHydration);
router.post('/', hydrationController.addWater);

export { router as hydrationRoutes };