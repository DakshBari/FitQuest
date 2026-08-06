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
      totalCalories: summary.totalCalories,
      targetCalories: goals.calories,
      protein: summary.totalProtein,
      carbs: summary.totalCarbs,
      fats: summary.totalFats, // Changed from 'fat' to 'fats'
      targetProtein: goals.protein,
      targetCarbs: goals.carbs,
      targetFats: goals.fats, // Changed from 'targetFat' to 'targetFats'
      meals: summary.meals,
      goals,
      progress: {
        calories: (summary.totalCalories / goals.calories) * 100,
        protein: (summary.totalProtein / goals.protein) * 100,
        carbs: (summary.totalCarbs / goals.carbs) * 100,
        fats: (summary.totalFats / goals.fats) * 100
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
      quantityType: favoriteMeal.quantityType || 'weight',
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

// @desc    Get AI-powered nutrition suggestions
export const getAISuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.query; // 'today', 'weekly', or 'overall'
    const { mealAIService } = await import('../services/mealAIService');
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    let suggestions: any = {};

    if (type === 'today') {
      // Get today's meals and stats
      const today = new Date();
      const { start, end } = getDayRange(today);
      
      const meals = await Meal.find({
        userId: req.user._id,
        date: { $gte: start, $lte: end }
      });

      const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
      const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
      const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
      const totalFats = meals.reduce((sum, m) => sum + m.fats, 0);

      const goals = user.goals || { calories: 2000, protein: 150, carbs: 200, fats: 65 };
      
      const remainingCalories = goals.calories - totalCalories;
      const remainingProtein = goals.protein - totalProtein;
      const remainingCarbs = goals.carbs - totalCarbs;
      const remainingFats = goals.fats - totalFats;

      // Generate AI suggestions for today
      const foodPref = user.profile?.foodPreference || 'non-veg';
      const foodPrefText = foodPref === 'non-veg' ? 'Non-Vegetarian (can include meat, fish, eggs, dairy)' :
                           foodPref === 'veg' ? 'Vegetarian (no meat/fish, but includes eggs and dairy)' :
                           foodPref === 'vegan' ? 'Vegan (no animal products at all)' :
                           'Jain (no root vegetables, onion, garlic, or animal products)';
      
      const prompt = `You are a nutrition expert AI. Analyze today's nutrition intake and provide guidance.

User Profile:
- Weight: ${user.profile?.weight || 'Not specified'}kg
- Height: ${user.profile?.height || 'Not specified'}cm
- Goal: ${user.profile?.goal || 'general fitness'}
- Food Preference: ${foodPrefText}

Today's Intake:
- Calories: ${totalCalories}/${goals.calories} (${remainingCalories} remaining)
- Protein: ${totalProtein}g/${goals.protein}g (${remainingProtein}g remaining)
- Carbs: ${totalCarbs}g/${goals.carbs}g (${remainingCarbs}g remaining)
- Fats: ${totalFats}g/${goals.fats}g (${remainingFats}g remaining)

Meals logged today: ${meals.length}

IMPORTANT: All meal suggestions MUST strictly follow the ${foodPref} diet. Do not suggest any foods that violate this preference.

Provide:
1. A brief summary (2-3 sentences) of today's nutrition status
2. 3-4 specific recommendations for what to eat for the rest of the day (following ${foodPref} diet)
3. 2-3 meal suggestions with approximate macros (strictly ${foodPref} options only)

Format your response as:
SUMMARY: [your summary]
RECOMMENDATIONS:
- [recommendation 1]
- [recommendation 2]
- [recommendation 3]
MEALS:
[Meal Name]|[Description]|[Calories]|[Protein]|[Carbs]|[Fats]
[Meal Name]|[Description]|[Calories]|[Protein]|[Carbs]|[Fats]`;

      const aiResponse = await mealAIService.model.generateContent(prompt);
      const responseText = aiResponse.response.text();
      suggestions = parseAISuggestions(responseText);

    } else if (type === 'weekly') {
      // Get last 7 days of meals
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      const meals = await Meal.find({
        userId: req.user._id,
        date: { $gte: startDate, $lte: endDate }
      });

      const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
      const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
      const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
      const totalFats = meals.reduce((sum, m) => sum + m.fats, 0);
      const avgCalories = Math.round(totalCalories / 7);
      const avgProtein = Math.round(totalProtein / 7);
      const avgCarbs = Math.round(totalCarbs / 7);
      const avgFats = Math.round(totalFats / 7);

      const goals = user.goals || { calories: 2000, protein: 150, carbs: 200, fats: 65 };

      const prompt = `You are a nutrition expert AI. Analyze the last 7 days of eating patterns and provide insights.

User Profile:
- Weight: ${user.profile?.weight || 'Not specified'}kg
- Height: ${user.profile?.height || 'Not specified'}cm
- Goal: ${user.profile?.goal || 'general fitness'}

Weekly Averages (Last 7 Days):
- Daily Calories: ${avgCalories} (Target: ${goals.calories})
- Daily Protein: ${avgProtein}g (Target: ${goals.protein}g)
- Daily Carbs: ${avgCarbs}g (Target: ${goals.carbs}g)
- Daily Fats: ${avgFats}g (Target: ${goals.fats}g)

Total meals logged: ${meals.length}

Provide:
1. A summary (3-4 sentences) of the weekly eating patterns
2. 4-5 specific improvement suggestions for next week
3. Identify any concerning patterns or deficiencies

Format your response as:
SUMMARY: [your summary]
RECOMMENDATIONS:
- [recommendation 1]
- [recommendation 2]
- [recommendation 3]
- [recommendation 4]`;

      const aiResponse = await mealAIService.model.generateContent(prompt);
      const responseText = aiResponse.response.text();
      suggestions = parseAISuggestions(responseText);

    } else if (type === 'overall') {
      // Get last 30 days of meals
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);

      const meals = await Meal.find({
        userId: req.user._id,
        date: { $gte: startDate, $lte: endDate }
      });

      const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
      const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
      const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
      const totalFats = meals.reduce((sum, m) => sum + m.fats, 0);
      const avgCalories = Math.round(totalCalories / 30);
      const avgProtein = Math.round(totalProtein / 30);
      const avgCarbs = Math.round(totalCarbs / 30);
      const avgFats = Math.round(totalFats / 30);

      const goals = user.goals || { calories: 2000, protein: 150, carbs: 200, fats: 65 };

      const prompt = `You are a nutrition expert AI. Analyze the overall eating habits over the last 30 days and provide comprehensive insights.

User Profile:
- Weight: ${user.profile?.weight || 'Not specified'}kg
- Height: ${user.profile?.height || 'Not specified'}cm
- Goal: ${user.profile?.goal || 'general fitness'}

Monthly Averages (Last 30 Days):
- Daily Calories: ${avgCalories} (Target: ${goals.calories})
- Daily Protein: ${avgProtein}g (Target: ${goals.protein}g)
- Daily Carbs: ${avgCarbs}g (Target: ${goals.carbs}g)
- Daily Fats: ${avgFats}g (Target: ${goals.fats}g)

Total meals logged: ${meals.length}
Days with meals: ${new Set(meals.map(m => m.date.toISOString().split('T')[0])).size}

Provide:
1. A comprehensive summary (4-5 sentences) of overall eating habits
2. 5-6 actionable recommendations for long-term improvement
3. Highlight strengths and areas needing attention

Format your response as:
SUMMARY: [your summary]
RECOMMENDATIONS:
- [recommendation 1]
- [recommendation 2]
- [recommendation 3]
- [recommendation 4]
- [recommendation 5]`;

      const aiResponse = await mealAIService.model.generateContent(prompt);
      const responseText = aiResponse.response.text();
      suggestions = parseAISuggestions(responseText);
    }

    res.json({
      status: 'success',
      suggestions
    });

  } catch (error: any) {
    console.error('AI Suggestions Error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to generate AI suggestions',
      suggestions: {
        error: 'AI service is currently unavailable. Please try again later.'
      }
    });
  }
};

// Helper function to parse AI response
function parseAISuggestions(responseText: string): any {
  const result: any = {
    summary: '',
    recommendations: [],
    mealSuggestions: []
  };

  // Extract summary
  const summaryMatch = responseText.match(/SUMMARY:\s*(.+?)(?=RECOMMENDATIONS:|MEALS:|$)/s);
  if (summaryMatch) {
    result.summary = summaryMatch[1].trim();
  }

  // Extract recommendations
  const recommendationsMatch = responseText.match(/RECOMMENDATIONS:\s*(.+?)(?=MEALS:|$)/s);
  if (recommendationsMatch) {
    const recommendations = recommendationsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());
    result.recommendations = recommendations;
  }

  // Extract meal suggestions
  const mealsMatch = responseText.match(/MEALS:\s*(.+?)$/s);
  if (mealsMatch) {
    const mealLines = mealsMatch[1].split('\n').filter(line => line.includes('|'));
    result.mealSuggestions = mealLines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 6) {
        return {
          name: parts[0],
          description: parts[1],
          calories: parseInt(parts[2]) || 0,
          protein: parseInt(parts[3]) || 0,
          carbs: parseInt(parts[4]) || 0,
          fats: parseInt(parts[5]) || 0
        };
      }
      return null;
    }).filter(Boolean);
  }

  return result;
}
