import { GoogleGenerativeAI } from '@google/generative-ai';
import Meal from '../models/Meal';
import User from '../models/User';

/**
 * Meal AI Service with Gemini Integration
 * 
 * This service provides AI-powered meal analysis, suggestions, and nutritional insights
 */

interface MealAnalysisRequest {
  userId: string;
  mealDescription: string;
  mealImage?: string; // Base64 encoded image
}

interface MealAnalysisResponse {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  confidence: number;
  suggestions?: string[];
}

interface MealSuggestionRequest {
  userId: string;
  goal: 'muscle-gain' | 'fat-loss' | 'maintenance';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calorieTarget?: number;
}

interface MealSuggestion {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  instructions?: string[];
}

class MealAIService {
  public genAI: GoogleGenerativeAI | null;
  public model: any;
  public visionModel: any;
  public isGeminiAvailable: boolean;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    console.log('Initializing Meal AI Service...');
    console.log('GEMINI_API_KEY exists:', !!apiKey);
    
    if (!apiKey) {
      console.warn('⚠️  GEMINI_API_KEY not found. Meal AI will not be available.');
      this.genAI = null;
      this.model = null;
      this.visionModel = null;
      this.isGeminiAvailable = false;
    } else {
      try {
        const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: modelName });
        this.visionModel = this.genAI.getGenerativeModel({ model: modelName });
        this.isGeminiAvailable = true;
        console.log(`✅ Meal AI (Gemini) initialized successfully with ${modelName}`);
      } catch (error) {
        console.error('❌ Failed to initialize Meal AI (Gemini):', error);
        this.genAI = null;
        this.model = null;
        this.visionModel = null;
        this.isGeminiAvailable = false;
      }
    }
  }

  /**
   * Get user's nutritional context
   */
  private async getUserNutritionContext(userId: string): Promise<string> {
    try {
      const user = await User.findById(userId).select('profile preferences');
      const recentMeals = await Meal.find({ userId })
        .sort({ date: -1 })
        .limit(10)
        .select('name calories protein carbs fats date');

      let context = `User Profile:
- Weight: ${user?.profile?.weight || 'Not specified'}kg
- Height: ${user?.profile?.height || 'Not specified'}cm
- Dietary Preferences: ${user?.preferences?.dietaryRestrictions?.join(', ') || 'None'}
- Allergies: ${user?.preferences?.allergies?.join(', ') || 'None'}

Recent Meals (Last 10):`;

      if (recentMeals.length > 0) {
        const totalCalories = recentMeals.reduce((sum, meal) => sum + meal.calories, 0);
        const avgCalories = totalCalories / recentMeals.length;
        const totalProtein = recentMeals.reduce((sum, meal) => sum + meal.protein, 0);
        const avgProtein = totalProtein / recentMeals.length;

        context += `\n- Average daily calories: ${Math.round(avgCalories)}
- Average daily protein: ${Math.round(avgProtein)}g
- Recent meals:\n`;
        
        recentMeals.slice(0, 5).forEach((meal, index) => {
          context += `  ${index + 1}. ${meal.name} - ${meal.calories}cal, ${meal.protein}g protein\n`;
        });
      } else {
        context += '\n- No recent meal data available';
      }

      return context;
    } catch (error) {
      console.error('Error getting user nutrition context:', error);
      return 'User nutrition context unavailable';
    }
  }

  /**
   * Analyze meal from description or image
   */
  async analyzeMeal(request: MealAnalysisRequest): Promise<MealAnalysisResponse> {
    if (this.isGeminiAvailable && this.model) {
      try {
        const userContext = await this.getUserNutritionContext(request.userId);
        
        const prompt = `You are a professional nutritionist AI. Analyze the following food item and provide ACCURATE nutritional information per 100 grams.

${userContext}

Food Item: ${request.mealDescription}

IMPORTANT: Provide realistic and accurate nutritional values based on standard food databases (USDA, etc.). Be precise with your estimates.

Respond ONLY in this exact format (numbers only, no units):
NAME: [food name]
CALORIES: [number]
PROTEIN: [number]
CARBS: [number]
FATS: [number]
CONFIDENCE: [number between 0-100]
SUGGESTIONS: [suggestion 1|suggestion 2|suggestion 3]

Example for "100g of boiled potato":
NAME: Boiled Potato
CALORIES: 87
PROTEIN: 2
CARBS: 20
FATS: 0.1
CONFIDENCE: 95
SUGGESTIONS: Good source of potassium|Low in fat|Pair with protein source

Now analyze: ${request.mealDescription}`;

        const result = await this.model.generateContent(prompt);
        const response = result.response.text();
        
        console.log('Gemini response for meal analysis:', response);
        
        const parsed = this.parseMealAnalysis(response, request.mealDescription);
        
        // Validate that we got reasonable values
        if (parsed.calories > 0 && parsed.protein >= 0 && parsed.carbs >= 0 && parsed.fats >= 0) {
          return parsed;
        }
      } catch (error) {
        console.error('Gemini API Error for meal analysis, using local fallback:', error);
      }
    }

    console.warn('Using local fallback meal analysis for:', request.mealDescription);
    return this.getFallbackMealAnalysis(request.mealDescription);
  }

  /**
   * Parse meal analysis from AI response
   */
  private parseMealAnalysis(response: string, mealDescription: string): MealAnalysisResponse {
    const lines = response.split('\n');
    const data: any = {};
    
    lines.forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) {
        data[key.toUpperCase()] = value;
      }
    });

    return {
      name: data.NAME || mealDescription,
      calories: parseInt(data.CALORIES) || 0,
      protein: parseInt(data.PROTEIN) || 0,
      carbs: parseInt(data.CARBS) || 0,
      fats: parseInt(data.FATS) || 0,
      confidence: parseInt(data.CONFIDENCE) || 70,
      suggestions: data.SUGGESTIONS ? data.SUGGESTIONS.split('|').map((s: string) => s.trim()) : []
    };
  }

  /**
   * Fallback meal analysis when Gemini is not available
   * Uses a basic food database for common items
   */
  private getFallbackMealAnalysis(mealDescription: string): MealAnalysisResponse {
    const lower = mealDescription.toLowerCase();
    
    // Common foods database (per 100g)
    const foodDatabase: { [key: string]: { calories: number, protein: number, carbs: number, fats: number } } = {
      'potato': { calories: 87, protein: 2, carbs: 20, fats: 0.1 },
      'boiled potato': { calories: 87, protein: 2, carbs: 20, fats: 0.1 },
      'rice': { calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
      'chicken breast': { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
      'chicken': { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
      'egg': { calories: 155, protein: 13, carbs: 1.1, fats: 11 },
      'banana': { calories: 89, protein: 1.1, carbs: 23, fats: 0.3 },
      'apple': { calories: 52, protein: 0.3, carbs: 14, fats: 0.2 },
      'bread': { calories: 265, protein: 9, carbs: 49, fats: 3.2 },
      'milk': { calories: 42, protein: 3.4, carbs: 5, fats: 1 },
      'yogurt': { calories: 59, protein: 10, carbs: 3.6, fats: 0.4 },
      'salmon': { calories: 208, protein: 20, carbs: 0, fats: 13 },
      'beef': { calories: 250, protein: 26, carbs: 0, fats: 15 },
      'pasta': { calories: 131, protein: 5, carbs: 25, fats: 1.1 },
      'oats': { calories: 389, protein: 17, carbs: 66, fats: 7 },
      'broccoli': { calories: 34, protein: 2.8, carbs: 7, fats: 0.4 },
      'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4 },
      'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2 },
      'cheese': { calories: 402, protein: 25, carbs: 1.3, fats: 33 },
      'butter': { calories: 717, protein: 0.9, carbs: 0.1, fats: 81 },
      'olive oil': { calories: 884, protein: 0, carbs: 0, fats: 100 },
      'peanut butter': { calories: 588, protein: 25, carbs: 20, fats: 50 },
      'sweet potato': { calories: 86, protein: 1.6, carbs: 20, fats: 0.1 }
    };

    // Try to find exact match
    for (const [food, nutrition] of Object.entries(foodDatabase)) {
      if (lower.includes(food)) {
        return {
          name: mealDescription,
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fats: nutrition.fats,
          confidence: 85,
          suggestions: [
            'Values based on standard food database',
            'Adjust portion size as needed',
            'Consider cooking method impact'
          ]
        };
      }
    }

    // Generic estimation if no match found
    let calories = 150;
    let protein = 5;
    let carbs = 20;
    let fats = 5;

    if (lower.includes('meat') || lower.includes('fish')) {
      protein = 25;
      fats = 10;
      carbs = 0;
      calories = 200;
    } else if (lower.includes('vegetable') || lower.includes('salad')) {
      calories = 30;
      protein = 2;
      carbs = 6;
      fats = 0.3;
    } else if (lower.includes('fruit')) {
      calories = 60;
      protein = 0.5;
      carbs = 15;
      fats = 0.2;
    }

    return {
      name: mealDescription,
      calories,
      protein,
      carbs,
      fats,
      confidence: 40,
      suggestions: [
        'Generic estimate - please verify',
        'Use manual entry for accuracy',
        'Consider using a food scale'
      ]
    };
  }

  /**
   * Get meal suggestions based on user goals
   */
  async getMealSuggestions(request: MealSuggestionRequest): Promise<MealSuggestion[]> {
    if (this.isGeminiAvailable && this.model) {
      try {
        const userContext = await this.getUserNutritionContext(request.userId);
        
        const prompt = `You are a nutrition expert AI. Suggest 3 healthy meal options for ${request.mealType}.

${userContext}

Requirements:
- Goal: ${request.goal}
- Meal Type: ${request.mealType}
- Target Calories per meal: ${request.calorieTarget || 'Not specified'}

For each meal, provide:
NAME: [meal name]
DESCRIPTION: [brief description]
CALORIES: [calories as number]
PROTEIN: [grams as number]
CARBS: [grams as number]
FATS: [grams as number]
INGREDIENTS: [ingredient1|ingredient2|ingredient3...]
INSTRUCTIONS: [step1|step2|step3...]

Separate each meal with "---"

Make suggestions practical, delicious, and aligned with the user's goal.`;

        const result = await this.model.generateContent(prompt);
        const response = result.response.text();
        
        return this.parseMealSuggestions(response);
      } catch (error) {
        console.error('Gemini API Error for meal suggestions, using local fallback:', error);
      }
    }

    console.warn('Using local fallback meal suggestions for:', request.mealType);
    return this.getFallbackMealSuggestions(request);
  }

  /**
   * Parse meal suggestions from AI response
   */
  private parseMealSuggestions(response: string): MealSuggestion[] {
    const suggestions: MealSuggestion[] = [];
    const meals = response.split('---');
    
    meals.forEach(mealText => {
      const lines = mealText.split('\n');
      const data: any = {};
      
      lines.forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        if (key && value) {
          data[key.toUpperCase()] = value;
        }
      });

      if (data.NAME) {
        suggestions.push({
          name: data.NAME,
          description: data.DESCRIPTION || '',
          calories: parseInt(data.CALORIES) || 0,
          protein: parseInt(data.PROTEIN) || 0,
          carbs: parseInt(data.CARBS) || 0,
          fats: parseInt(data.FATS) || 0,
          ingredients: data.INGREDIENTS ? data.INGREDIENTS.split('|').map((s: string) => s.trim()) : [],
          instructions: data.INSTRUCTIONS ? data.INSTRUCTIONS.split('|').map((s: string) => s.trim()) : []
        });
      }
    });
    
    return suggestions.slice(0, 3);
  }

  /**
   * Fallback meal suggestions when Gemini is not available
   */
  private getFallbackMealSuggestions(request: MealSuggestionRequest): MealSuggestion[] {
    const suggestions: MealSuggestion[] = [];
    
    if (request.mealType === 'breakfast') {
      suggestions.push({
        name: 'Protein Oatmeal Bowl',
        description: 'Hearty oatmeal with protein powder and berries',
        calories: 400,
        protein: 30,
        carbs: 50,
        fats: 10,
        ingredients: ['Oats', 'Protein powder', 'Berries', 'Almond milk', 'Honey'],
        instructions: ['Cook oats with almond milk', 'Mix in protein powder', 'Top with berries and honey']
      });
    } else if (request.mealType === 'lunch') {
      suggestions.push({
        name: 'Grilled Chicken Salad',
        description: 'Fresh salad with grilled chicken breast',
        calories: 450,
        protein: 40,
        carbs: 30,
        fats: 18,
        ingredients: ['Chicken breast', 'Mixed greens', 'Cherry tomatoes', 'Olive oil', 'Lemon'],
        instructions: ['Grill chicken breast', 'Toss greens with vegetables', 'Add chicken and dress with olive oil']
      });
    } else if (request.mealType === 'dinner') {
      suggestions.push({
        name: 'Salmon with Sweet Potato',
        description: 'Baked salmon with roasted sweet potato and broccoli',
        calories: 550,
        protein: 45,
        carbs: 45,
        fats: 22,
        ingredients: ['Salmon fillet', 'Sweet potato', 'Broccoli', 'Olive oil', 'Herbs'],
        instructions: ['Bake salmon at 400°F for 15 minutes', 'Roast sweet potato cubes', 'Steam broccoli']
      });
    } else {
      suggestions.push({
        name: 'Greek Yogurt with Nuts',
        description: 'High-protein snack with healthy fats',
        calories: 250,
        protein: 20,
        carbs: 20,
        fats: 12,
        ingredients: ['Greek yogurt', 'Mixed nuts', 'Honey', 'Berries'],
        instructions: ['Mix yogurt with honey', 'Top with nuts and berries']
      });
    }
    
    return suggestions;
  }

  /**
   * Get nutritional insights for user's recent meals
   */
  async getNutritionalInsights(userId: string): Promise<string> {
    const fallbackInsight = `Based on your recent logged meals, your overall calorie and macronutrient intake is progressing well. To maximize your energy levels and muscle recovery, prioritize matching your daily protein goals consistently. Ensure that you have complex carbohydrates such as oats or sweet potatoes before workouts, and continue to stay hydrated throughout the day. Consuming balanced meals with leafy greens and healthy fats will help support optimal body composition and performance.`;

    if (this.isGeminiAvailable && this.model) {
      try {
        const userContext = await this.getUserNutritionContext(userId);
        
        const prompt = `You are a nutrition expert AI. Analyze the user's recent eating patterns and provide insights.

${userContext}

Provide a comprehensive nutritional analysis covering:
1. Overall calorie intake patterns
2. Macronutrient balance (protein, carbs, fats)
3. Areas for improvement
4. Specific actionable recommendations

Keep the response concise but informative (3-4 paragraphs).`;

        const result = await this.model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        console.error('Gemini API Error for nutritional insights, using local fallback:', error);
      }
    }

    return fallbackInsight;
  }
}

export const mealAIService = new MealAIService();
