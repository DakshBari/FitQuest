import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatSession, IChatSession, IMessage } from '../models/ChatSession';
import User from '../models/User';
import Workout from '../models/Workout';
import Meal from '../models/Meal';

/**
 * AI Coach Service with Gemini Integration
 * 
 * This service integrates with Google's Gemini AI for intelligent fitness coaching
 */

interface ChatRequest {
  userId: string;
  message: string;
  sessionId?: string;
}

interface ChatResponse {
  message: string;
  sessionId: string;
  suggestions?: string[];
}

interface Recommendation {
  type: 'workout' | 'nutrition' | 'recovery' | 'form';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

class AICoachService {
  public genAI: GoogleGenerativeAI | null;
  public model: any;
  public isGeminiAvailable: boolean;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    console.log('Initializing AI Coach Service...');
    console.log('GEMINI_API_KEY exists:', !!apiKey);
    console.log('GEMINI_API_KEY length:', apiKey?.length || 0);
    console.log('GEMINI_API_KEY starts with:', apiKey?.substring(0, 4));
    
    if (!apiKey) {
      console.warn('⚠️  GEMINI_API_KEY not found. AI Coach will not be available.');
      this.genAI = null;
      this.model = null;
      this.isGeminiAvailable = false;
    } else {
      try {
        const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: modelName });
        this.isGeminiAvailable = true;
        console.log(`✅ Gemini AI initialized successfully with ${modelName}`);
      } catch (error) {
        console.error('❌ Failed to initialize Gemini AI:', error);
        this.genAI = null;
        this.model = null;
        this.isGeminiAvailable = false;
      }
    }
  }

  /**
   * Get user context for AI coaching
   */
  private async getUserContext(userId: string): Promise<string> {
    try {
      const user = await User.findById(userId).select('profile stats preferences');
      const recentWorkouts = await Workout.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('type exercises duration createdAt');
      const recentMeals = await Meal.find({ userId })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('name calories protein carbs fat createdAt');

      let context = `User Profile:
- Fitness Level: ${user?.profile?.fitnessLevel || 'Beginner'}
- Goals: ${user?.profile?.goals?.join(', ') || 'General fitness'}
- Age: ${user?.profile?.age || 'Not specified'}
- Weight: ${user?.profile?.weight || 'Not specified'}kg
- Height: ${user?.profile?.height || 'Not specified'}cm

Recent Activity:`;

      if (recentWorkouts.length > 0) {
        context += '\nRecent Workouts:\n';
        recentWorkouts.forEach((workout, index) => {
          context += `${index + 1}. ${workout.type} - ${workout.duration}min (${new Date(workout.createdAt).toLocaleDateString()})\n`;
        });
      }

      if (recentMeals.length > 0) {
        context += '\nRecent Meals:\n';
        recentMeals.forEach((meal, index) => {
          context += `${index + 1}. ${meal.name} - ${meal.calories}cal (${new Date(meal.createdAt).toLocaleDateString()})\n`;
        });
      }

      return context;
    } catch (error) {
      console.error('Error getting user context:', error);
      return 'User context unavailable';
    }
  }

  /**
   * Generate AI coach system prompt
   */
  private getSystemPrompt(userContext: string): string {
    return `You are "The Oracle," an AI fitness coach for FitQuest. You are knowledgeable, supportive, and motivational.

Key characteristics:
- Speak like an experienced fitness coach
- Be encouraging but realistic
- Provide specific, actionable advice
- Consider the user's fitness level and goals
- Prioritize safety and proper form
- Keep responses concise (2-3 paragraphs maximum)
- Include practical tips and reasoning

User Context:
${userContext}

Response Guidelines:
- Format your response point-wise, where each key point begins with a bullet point (*).
- Keep responses brief, clear, and focused.
- Provide specific recommendations based on recent activity.
- If asked about pain/injury, recommend consulting healthcare professionals.
- Include the "why" behind recommendations.
- End with one clear next step or question.

Remember: You are The Oracle. Provide concise, actionable guidance that helps users understand what to do and why.`;
  }

  /**
   * Get fallback AI response when Gemini is not available
   */
  private getFallbackResponse(message: string, session?: IChatSession): string {
    let lowerMessage = message.toLowerCase();

    const hasDietKeywords = (str: string) => 
      str.includes('meal') || str.includes('nutrition') || str.includes('protein') || 
      str.includes('diet') || str.includes('deit') || str.includes('calorie') || 
      str.includes('carb') || str.includes('fat') || str.includes('food') || 
      str.includes('eat') || str.includes('weight') || str.includes('gain') || 
      str.includes('lose');

    const hasSquatKeywords = (str: string) => 
      str.includes('squat') || str.includes('form') || str.includes('technique') || 
      str.includes('posture');

    const hasInjuryKeywords = (str: string) => 
      str.includes('hurt') || str.includes('pain') || str.includes('injury') || 
      str.includes('knee') || str.includes('shoulder') || str.includes('back') || 
      str.includes('ankle') || str.includes('elbow') || str.includes('wrist');

    const hasRecoveryKeywords = (str: string) => 
      str.includes('recovery') || str.includes('rest') || str.includes('sleep') || 
      str.includes('tired') || str.includes('fatigue') || str.includes('sore') || 
      str.includes('stretch');

    const hasWorkoutKeywords = (str: string) => 
      str.includes('workout') || str.includes('exercise') || str.includes('train') || 
      str.includes('routine') || str.includes('program') || str.includes('lift') || 
      str.includes('gym') || str.includes('muscle') || str.includes('build');

    const hasAnyKeywords = (str: string) => 
      hasDietKeywords(str) || hasSquatKeywords(str) || hasInjuryKeywords(str) || 
      hasRecoveryKeywords(str) || hasWorkoutKeywords(str);

    const isShortFollowUp = lowerMessage.length < 10 || 
                            lowerMessage === 'more' || 
                            lowerMessage.includes('explain') || 
                            lowerMessage.includes('continue') || 
                            lowerMessage.includes('elaborate');

    // Context check: If message has no keywords or is a short follow up, look back at session history
    if (session && session.messages && (isShortFollowUp || !hasAnyKeywords(lowerMessage))) {
      for (let i = session.messages.length - 2; i >= 0; i--) {
        const msg = session.messages[i];
        if (msg.role === 'user' && hasAnyKeywords(msg.content.toLowerCase())) {
          lowerMessage = msg.content.toLowerCase();
          break;
        }
      }
    }

    if (hasSquatKeywords(lowerMessage)) {
      return `I want to help you perfect your movement technique and form. Focus on the following key guidelines:

* **Maintain a Neutral Spine**: Keep your chest upright and avoid excessive forward lean throughout the entire movement.
* **Engage Your Core**: Brace your abs before beginning the movement as if preparing for an impact, which stabilizes your lower back.
* **Control the Tempo**: Aim for a deliberate 2-3 second lowering phase rather than dropping quickly to build eccentric control and stability.
* **Optimize Your Stance**: Ensure proper foot placement (shoulder-width for squats) and align your knees with your toes to protect your joints.
* **Prioritize Form Over Load**: Reduce the weight temporarily to master the movement pattern safely before progressing.`;
    }

    if (hasDietKeywords(lowerMessage)) {
      return `Here are key nutrition principles to optimize your diet, weight management, and recovery:

* **Prioritize Protein**: Aim for 1.6-2.2g of protein per kg of body weight daily. Include high-quality sources (chicken, fish, eggs, dairy, or combined plant proteins) in every meal.
* **Manage Caloric Balance**: To gain weight/muscle (like adding muscle mass over the next 3-4 months), consume a surplus of 300-500 calories above maintenance. To lose fat, aim for a deficit of 300-500 calories.
* **Fuel with Complex Carbs**: Eat oats, sweet potatoes, brown rice, and quinoa to replenish muscle glycogen and sustain your training energy.
* **Incorporate Healthy Fats**: Add avocado, nuts, seeds, and olive oil to your meals to support hormone production and nutrient absorption.
* **Stay Well-Hydrated**: Drink at least 35ml of water per kg of body weight daily (more on intense training days).`;
    }

    if (hasInjuryKeywords(lowerMessage)) {
      return `I want to address your discomfort and prioritize your safety. Please follow these guidelines:

* **Rest Immediately**: Stop any movements that aggravate the area. Pain is a signal that something needs immediate attention.
* **R.I.C.E. Protocol**: Apply Rest, Ice (15-20 minutes every 2-3 hours), Compression, and Elevation where applicable.
* **Avoid Painful Stretches**: Only perform gentle mobility work if it is completely pain-free; do not push through discomfort.
* **Seek Professional Advice**: If pain persists beyond 2-3 days, worsens, or is accompanied by swelling/numbness, consult a doctor or physical therapist.
* **Adjust Your Routine**: Use this time to focus on unaffected areas (e.g., upper body exercises if you have a lower body injury).`;
    }

    if (hasRecoveryKeywords(lowerMessage)) {
      return `To support optimal muscle repair and performance, focus on these recovery pillars:

* **Optimize Sleep**: Aim for 7-9 hours of quality sleep nightly to trigger growth hormone release and tissue repair. Avoid screens 1 hour before bed.
* **Incorporate Active Recovery**: Perform light activities (walking, easy yoga, swimming) on rest days to promote blood flow and speed up healing.
* **Stretch and Roll**: Spend time stretching and foam rolling to reduce muscle tension and maintain flexibility.
* **Eat Anti-Inflammatory Foods**: Include berries, leafy greens, and fatty fish in your diet to reduce systemic inflammation.
* **Manage Stress**: Practice deep breathing or meditation to lower cortisol levels, as high stress impairs physical recovery.`;
    }

    if (hasWorkoutKeywords(lowerMessage)) {
      return `Here is a structured strategy to make your workouts safe and highly effective:

* **Apply Progressive Overload**: Gradually increase your training stimulus over time by adding reps, sets, frequency, or improving technique.
* **Warm Up Properly**: Dedicate 5-10 minutes to light cardio and dynamic stretches before starting to prime your nervous system.
* **Prioritize Compound Movements**: Focus on exercises that target multiple muscle groups, such as squats, deadlifts, push-ups, and rows.
* **Structure Your Routine**: Aim for 2-3 full-body sessions per week as a beginner, or 3-4 sessions with an upper/lower split if advanced.
* **Cool Down Post-Workout**: Spend 5-10 minutes doing static stretching to help your body transition smoothly back to rest.`;
    }

    // Default response
    return `To build a strong foundation for your fitness journey, focus on these three primary pillars:

* **Maintain Consistency**: Focus on showing up every day, even for a 10-minute walk. Regular habits compound to build long-term success.
* **Focus on Proper Form**: Prioritize correct technique over lifting heavier weights to prevent injury and target the right muscles.
* **Listen to Your Body**: Pay attention to signals of fatigue and sharp pain. Adjust your training intensity or rest as needed.
* **Track Your Progress**: Keep a log of your workouts and nutrition to help you stay motivated and measure your improvements.`;
  }

  /**
   * Chat with AI coach using Gemini
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    let session: IChatSession | undefined;
    try {
      // Get or create chat session
      
      if (request.sessionId) {
        session = await ChatSession.findById(request.sessionId);
        if (!session || session.userId.toString() !== request.userId) {
          throw new Error('Invalid session');
        }
      } else {
        // Create new session
        const sessionCount = await ChatSession.countDocuments({ userId: request.userId, isActive: true });
        
        // FIFO: Keep only 5 sessions, deactivate oldest if needed
        if (sessionCount >= 5) {
          const oldestSession = await ChatSession.findOne({ 
            userId: request.userId, 
            isActive: true 
          }).sort({ lastActivity: 1 });
          
          if (oldestSession) {
            oldestSession.isActive = false;
            await oldestSession.save();
          }
        }

        session = new ChatSession({
          userId: request.userId,
          title: `Chat ${sessionCount + 1}`,
          messages: []
        });
      }

      // Add user message
      const userMessage: IMessage = {
        role: 'user',
        content: request.message,
        timestamp: new Date()
      };
      session.messages.push(userMessage);

      // Check message limit (10 user messages = 20 total messages including AI responses)
      if (session.messages.length > 20) {
        throw new Error('Message limit reached. Please start a new chat to continue.');
      }

      let aiResponse: string;

      if (this.isGeminiAvailable && this.model) {
        try {
          // Get user context for AI
          const userContext = await this.getUserContext(request.userId);
          const systemPrompt = this.getSystemPrompt(userContext);

          // Prepare conversation history for Gemini
          const conversationHistory = session.messages.slice(-10).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          }));

          // Start chat with Gemini
          const chat = this.model.startChat({
            history: [
              {
                role: 'user',
                parts: [{ text: systemPrompt }]
              },
              {
                role: 'model',
                parts: [{ text: 'I understand. I am The Oracle, your AI fitness coach in FitQuest. I\'m here to help you achieve your fitness goals with personalized guidance. How can I assist you today?' }]
              },
              ...conversationHistory.slice(0, -1) // Exclude the current message
            ]
          });

          // Get AI response
          const result = await chat.sendMessage(request.message);
          aiResponse = result.response.text();
        } catch (geminiError) {
          console.error('Gemini API call failed, falling back to local responses:', geminiError);
          aiResponse = this.getFallbackResponse(request.message, session);
        }
      } else {
        console.warn('Gemini API is not configured or disabled, using local responses.');
        aiResponse = this.getFallbackResponse(request.message, session);
      }

      // Add AI message to session
      const aiMessage: IMessage = {
        role: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      session.messages.push(aiMessage);

      // Update session title based on first user message
      if (session.messages.length === 2) {
        const title = request.message.length > 50 
          ? request.message.substring(0, 47) + '...'
          : request.message;
        session.title = title;
      }

      await session.save();

      return {
        message: aiResponse,
        sessionId: session._id.toString(),
        suggestions: this.extractSuggestions(aiResponse)
      };

    } catch (error: any) {
      console.error('AI Coach Service Error:', error);
      
      // If it's our custom error or message limit error, rethrow it
      if (error.message.includes('Message limit') || error.message.includes('Invalid session')) {
        throw error;
      }
      
      // For any other unexpected errors, try to return a fallback response if session exists
      try {
        const aiResponse = this.getFallbackResponse(request.message, session);
        return {
          message: aiResponse,
          sessionId: request.sessionId || '',
          suggestions: this.extractSuggestions(aiResponse)
        };
      } catch (e) {
        throw new Error('AI service encountered an error. Please try again later.');
      }
    }
  }

  /**
   * Extract actionable suggestions from AI response
   */
  private extractSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    
    // Look for bullet points or numbered lists
    const bulletRegex = /[•\-\*]\s*(.+)/g;
    const numberedRegex = /\d+\.\s*(.+)/g;
    
    let match;
    while ((match = bulletRegex.exec(response)) !== null) {
      suggestions.push(match[1].trim());
    }
    
    while ((match = numberedRegex.exec(response)) !== null) {
      suggestions.push(match[1].trim());
    }
    
    // If no structured suggestions found, extract key phrases
    if (suggestions.length === 0) {
      const sentences = response.split(/[.!?]+/);
      sentences.forEach(sentence => {
        if (sentence.toLowerCase().includes('recommend') || 
            sentence.toLowerCase().includes('suggest') ||
            sentence.toLowerCase().includes('try')) {
          const cleaned = sentence.trim();
          if (cleaned.length > 10 && cleaned.length < 100) {
            suggestions.push(cleaned);
          }
        }
      });
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Get chat sessions for a user
   */
  async getChatSessions(userId: string): Promise<IChatSession[]> {
    try {
      return await ChatSession.find({ 
        userId, 
        isActive: true 
      })
      .sort({ lastActivity: -1 })
      .limit(5)
      .select('title messages createdAt lastActivity');
    } catch (error) {
      console.error('Error getting chat sessions:', error);
      return [];
    }
  }

  /**
   * Delete a chat session
   */
  async deleteChatSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      const result = await ChatSession.findOneAndUpdate(
        { _id: sessionId, userId },
        { isActive: false },
        { new: true }
      );
      return !!result;
    } catch (error) {
      console.error('Error deleting chat session:', error);
      return false;
    }
  }

  /**
   * Get personalized recommendations using Gemini
   */
  async getRecommendations(request: { userId: string }): Promise<Recommendation[]> {
    const fallbackRecs = [
      {
        type: 'workout' as const,
        title: 'Master the Squat Form',
        description: 'Focus on maintaining a neutral spine and proper knee alignment. Keep your chest up and control the descent phase.',
        priority: 'high' as const
      },
      {
        type: 'nutrition' as const,
        title: 'Optimize Protein Timing',
        description: 'Aim for 1.6-2.2g of protein per kg of body weight, distributing it evenly across meals and post-workout.',
        priority: 'medium' as const
      },
      {
        type: 'recovery' as const,
        title: 'Prioritize Quality Sleep',
        description: 'Ensure 7-9 hours of restful sleep tonight to support muscle repair, hormone regulation, and nervous system recovery.',
        priority: 'high' as const
      }
    ];

    if (this.isGeminiAvailable && this.model) {
      try {
        const userContext = await this.getUserContext(request.userId);
        
        const prompt = `Based on the following user data, provide 3 specific fitness recommendations. Format each as: TYPE|TITLE|DESCRIPTION|PRIORITY

${userContext}

Provide recommendations for:
1. A workout-related suggestion
2. A nutrition-related suggestion  
3. A recovery or lifestyle suggestion

Each recommendation should be specific and actionable. Use these types: workout, nutrition, recovery, form
Use these priorities: high, medium, low`;

        const result = await this.model.generateContent(prompt);
        const response = result.response.text();
        
        const recommendations = this.parseRecommendations(response);
        if (recommendations.length > 0) {
          return recommendations;
        }
      } catch (error) {
        console.error('Error getting recommendations from Gemini, using fallback:', error);
      }
    }

    return fallbackRecs;
  }

  /**
   * Parse recommendations from AI response
   */
  private parseRecommendations(response: string): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const lines = response.split('\n');
    
    lines.forEach(line => {
      const parts = line.split('|');
      if (parts.length === 4) {
        const [type, title, description, priority] = parts.map(p => p.trim());
        
        if (['workout', 'nutrition', 'recovery', 'form'].includes(type) &&
            ['high', 'medium', 'low'].includes(priority)) {
          recommendations.push({
            type: type as any,
            title,
            description,
            priority: priority as any
          });
        }
      }
    });
    
    return recommendations.slice(0, 3);
  }
}

export const aiCoachService = new AICoachService();



