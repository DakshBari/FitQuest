import { Response } from 'express';
import Hydration from '../models/Hydration';
import { AuthRequest } from '../middleware/auth';

const getDayRange = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Get today's hydration
export const getTodayHydration = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const { start } = getDayRange(today);

    let hydration = await Hydration.findOne({
      userId: req.user._id,
      date: { $gte: start, $lt: tomorrow }
    });

    res.json({
      status: 'success',
      hydration: {
        amount: hydration?.amount || 0,
        date: start.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// @desc    Add water
export const addWater = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    const { start, end } = getDayRange(targetDate);

    let hydration = await Hydration.findOne({
      userId: req.user._id,
      date: { $gte: start, $lte: end }
    });

    if (hydration) {
      hydration.amount += amount;
      await hydration.save();
    } else {
      hydration = await Hydration.create({
        userId: req.user._id,
        date: targetDate,
        amount
      });
    }

    res.status(201).json({ status: 'success', hydration });
  } catch (error) {
    res.status(400).json({ status: 'error', message: 'Error updating hydration' });
  }
};

// @desc    Get weekly hydration
export const getWeeklyHydration = async (req: AuthRequest, res: Response) => {
  try {
    // Get timezone offset from query parameter (in minutes) or default to 0 (UTC)
    const timezoneOffset = parseInt(req.query.timezoneOffset as string) || 0;
    
    // Create dates adjusted for user's timezone
    const now = new Date();
    const userNow = new Date(now.getTime() - (timezoneOffset * 60000));
    
    const endDate = new Date(userNow);
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date(userNow);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const hydrationRecords = await Hydration.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Group by date and calculate totals
    const dailyHydration: any = {};
    let weeklyTotal = 0;

    // Initialize all days using user's timezone
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      
      // Convert to user's timezone for display
      const userDate = new Date(d.getTime() - (timezoneOffset * 60000));
      const dateStr = userDate.toISOString().split('T')[0];
      
      dailyHydration[dateStr] = {
        date: dateStr,
        amount: 0,
        dayName: userDate.toLocaleDateString('en-US', { weekday: 'short' })
      };
    }

    // Populate with actual data
    hydrationRecords.forEach(record => {
      // Convert record date to user's timezone
      const recordUserDate = new Date(record.date.getTime() - (timezoneOffset * 60000));
      const dateStr = recordUserDate.toISOString().split('T')[0];
      
      if (dailyHydration[dateStr]) {
        dailyHydration[dateStr].amount = record.amount;
        weeklyTotal += record.amount;
      }
    });

    const weeklyHydration = Object.values(dailyHydration).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    res.json({ 
      status: 'success', 
      weeklyHydration,
      weeklyTotal
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};