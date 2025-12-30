import { Response } from 'express';
import Meal from '../models/Meal';
import Hydration from '../models/Hydration';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

// Helper to get start and end of a specific day
const getDayRange = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Get daily summary
export const getDailySummary = async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const { start, end } = getDayRange(targetDate);

    const meals = await Meal.find({
      userId: req.user._id,
      date: { $gte: start, $lte: end }
    });

    const user = await User.findById(req.user._id);

    // Calculate Totals
    const summary = {
      date: start.toISOString().split('T')[0],
      totalCalories: meals.reduce((sum, m) => sum + m.calories, 0),
      totalProtein: meals.reduce((sum, m) => sum + m.protein, 0),
      totalCarbs: meals.reduce((sum, m) => sum + m.carbs, 0),
      totalFats: meals.reduce((sum, m) => sum + m.fats, 0),
      meals: meals
    };

    const goals = user?.goals || { calories: 2000, protein: 150, carbs: 200, fats: 65 };

    res.json({
      status: 'success',
      summary: {
        ...summary,
        goals,
        progress: {
          calories: (summary.totalCalories / goals.calories) * 100,
          protein: (summary.totalProtein / goals.protein) * 100,
          carbs: (summary.totalCarbs / goals.carbs) * 100,
          fats: (summary.totalFats / goals.fats) * 100
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// @desc    Get weekly summary
export const getWeeklySummary = async (req: AuthRequest, res: Response) => {
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

    const meals = await Meal.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const user = await User.findById(req.user._id);
    const goals = user?.goals || { calories: 2000 };

    // Group by Date using user's timezone
    const grouped = meals.reduce((acc: any, meal) => {
      // Convert meal date to user's timezone
      const mealUserDate = new Date(meal.date.getTime() - (timezoneOffset * 60000));
      const dateStr = mealUserDate.toISOString().split('T')[0];
      
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr, calories: 0, protein: 0, carbs: 0, fats: 0 };
      }
      acc[dateStr].calories += meal.calories;
      acc[dateStr].protein += meal.protein;
      acc[dateStr].carbs += meal.carbs;
      acc[dateStr].fats += meal.fats;
      return acc;
    }, {});

    // Fill in missing days using user's timezone
    const weeklyData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      
      // Convert to user's timezone for display
      const userDate = new Date(d.getTime() - (timezoneOffset * 60000));
      const dateStr = userDate.toISOString().split('T')[0];
      
      const dayData = grouped[dateStr] || { date: dateStr, calories: 0, protein: 0, carbs: 0, fats: 0 };
      
      weeklyData.push({
        date: dateStr,
        pct: Math.min((dayData.calories / goals.calories) * 100, 100),
        calories: dayData.calories,
        protein: dayData.protein,
        carbs: dayData.carbs,
        fats: dayData.fats
      });
    }

    res.json({ status: 'success', weeklyData });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// @desc    Get weekly detailed data
export const getWeeklyDetailed = async (req: AuthRequest, res: Response) => {
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

    const meals = await Meal.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const user = await User.findById(req.user._id);
    const goals = user?.goals || { calories: 2000, protein: 150, carbs: 200, fats: 65 };

    // Group meals by date
    const dailyMeals: any = {};
    const weeklyTotals = { calories: 0, protein: 0, carbs: 0, fats: 0 };

    // Initialize all days of the week using user's timezone
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      
      // Convert to user's timezone for display
      const userDate = new Date(d.getTime() - (timezoneOffset * 60000));
      const dateStr = userDate.toISOString().split('T')[0];
      const dayName = userDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Check if this is today in user's timezone
      const todayStr = userNow.toISOString().split('T')[0];
      
      dailyMeals[dateStr] = {
        date: dateStr,
        dayName,
        meals: [],
        totals: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        isToday: dateStr === todayStr
      };
    }

    // Populate with actual meals
    meals.forEach(meal => {
      // Convert meal date to user's timezone
      const mealUserDate = new Date(meal.date.getTime() - (timezoneOffset * 60000));
      const dateStr = mealUserDate.toISOString().split('T')[0];
      
      if (dailyMeals[dateStr]) {
        dailyMeals[dateStr].meals.push(meal);
        dailyMeals[dateStr].totals.calories += meal.calories;
        dailyMeals[dateStr].totals.protein += meal.protein;
        dailyMeals[dateStr].totals.carbs += meal.carbs;
        dailyMeals[dateStr].totals.fats += meal.fats;

        // Add to weekly totals
        weeklyTotals.calories += meal.calories;
        weeklyTotals.protein += meal.protein;
        weeklyTotals.carbs += meal.carbs;
        weeklyTotals.fats += meal.fats;
      }
    });

    // Convert to array and sort by date
    const weeklyMeals = Object.values(dailyMeals).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    res.json({ 
      status: 'success', 
      weeklyMeals,
      weeklyTotals,
      weeklyGoals: {
        calories: goals.calories * 7,
        protein: goals.protein * 7,
        carbs: goals.carbs * 7,
        fats: goals.fats * 7
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// @desc    Create Meal
export const addMeal = async (req: AuthRequest, res: Response) => {
  try {
    const mealData = {
      ...req.body,
      userId: req.user._id,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      time: req.body.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const meal = await Meal.create(mealData);
    res.status(201).json({ status: 'success', meal });
  } catch (error) {
    res.status(400).json({ status: 'error', message: 'Error creating meal' });
  }
};

// @desc    Update Meal
export const updateMeal = async (req: AuthRequest, res: Response) => {
  try {
    const meal = await Meal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!meal) {
      return res.status(404).json({ status: 'error', message: 'Meal not found' });
    }
    res.json({ status: 'success', meal });
  } catch (error) {
    res.status(400).json({ status: 'error', message: 'Error updating meal' });
  }
};

// @desc    Delete Meal
export const deleteMeal = async (req: AuthRequest, res: Response) => {
  try {
    const meal = await Meal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!meal) {
      return res.status(404).json({ status: 'error', message: 'Meal not found' });
    }
    res.json({ status: 'success', message: 'Meal deleted' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// @desc    Toggle Favorite Meal
export const toggleFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const meal = await Meal.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!meal) {
      return res.status(404).json({ status: 'error', message: 'Meal not found' });
    }

    meal.isFavorite = !meal.isFavorite;
    await meal.save();

    res.json({ 
      status: 'success', 
      message: meal.isFavorite ? 'Meal added to favorites' : 'Meal removed from favorites',
      meal 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// @desc    Get Favorite Meals
export const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const favorites = await Meal.find({
      userId: req.user._id,
      isFavorite: true
    }).sort({ updatedAt: -1 });

    res.json({ status: 'success', favorites });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// @desc    Add Favorite Meal to Log
export const addFavoriteToLog = async (req: AuthRequest, res: Response) => {
  try {
    const { favoriteId, date, time, quantity } = req.body;

    const favoriteMeal = await Meal.findOne({
      _id: favoriteId,
      userId: req.user._id,
      isFavorite: true
    });

    if (!favoriteMeal) {
      return res.status(404).json({ status: 'error', message: 'Favorite meal not found' });
    }

    // Calculate nutritional values based on quantity
    const quantityRatio = (quantity || favoriteMeal.quantity) / favoriteMeal.baseQuantity;
    
    const newMeal = new Meal({
      userId: req.user._id,
      name: favoriteMeal.name,
      date: date ? new Date(date) : new Date(),
      time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      calories: Math.round(favoriteMeal.calories * quantityRatio),
      protein: Math.round(favoriteMeal.protein * quantityRatio * 100) / 100,
      carbs: Math.round(favoriteMeal.carbs * quantityRatio * 100) / 100,
      fats: Math.round(favoriteMeal.fats * quantityRatio * 100) / 100,
      micros: {
        fiber: favoriteMeal.micros.fiber ? Math.round(favoriteMeal.micros.fiber * quantityRatio * 100) / 100 : 0,
        sugar: favoriteMeal.micros.sugar ? Math.round(favoriteMeal.micros.sugar * quantityRatio * 100) / 100 : 0,
        sodium: favoriteMeal.micros.sodium ? Math.round(favoriteMeal.micros.sodium * quantityRatio * 100) / 100 : 0,
        cholesterol: favoriteMeal.micros.cholesterol ? Math.round(favoriteMeal.micros.cholesterol * quantityRatio * 100) / 100 : 0,
        vitA: favoriteMeal.micros.vitA ? Math.round(favoriteMeal.micros.vitA * quantityRatio * 100) / 100 : 0,
        vitC: favoriteMeal.micros.vitC ? Math.round(favoriteMeal.micros.vitC * quantityRatio * 100) / 100 : 0,
        iron: favoriteMeal.micros.iron ? Math.round(favoriteMeal.micros.iron * quantityRatio * 100) / 100 : 0,
        calcium: favoriteMeal.micros.calcium ? Math.round(favoriteMeal.micros.calcium * quantityRatio * 100) / 100 : 0
      },
      baseQuantity: favoriteMeal.baseQuantity,
      quantity: quantity || favoriteMeal.quantity,
      isFavorite: false // New log entry is not a favorite by default
    });

    await newMeal.save();

    res.status(201).json({ 
      status: 'success', 
      message: 'Favorite meal added to log',
      meal: newMeal 
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: 'Error adding favorite to log' });
  }
};

// @desc    Get meal history with pagination
export const getMealHistory = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    const meals = await Meal.find({
      userId: req.user._id
    })
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalMeals = await Meal.countDocuments({ userId: req.user._id });

    res.json({
      status: 'success',
      meals,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMeals / limit),
        totalMeals,
        hasNext: skip + limit < totalMeals,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// @desc    Get daily entries (days with meals)
export const getDailyEntries = async (req: AuthRequest, res: Response) => {
  try {
    const meals = await Meal.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" }
          },
          date: { $first: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } },
          mealCount: { $sum: 1 },
          totalCalories: { $sum: "$calories" },
          totalProtein: { $sum: "$protein" },
          totalCarbs: { $sum: "$carbs" },
          totalFats: { $sum: "$fats" }
        }
      },
      { $sort: { date: -1 } },
      { $limit: 30 } // Last 30 days with meals
    ]);

    res.json({
      status: 'success',
      dailyEntries: meals
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};