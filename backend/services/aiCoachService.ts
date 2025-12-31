import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatSession, IChatSession, IMessage } from '../models/ChatSession';
import { User } from '../models/User';
import { Workout } from '../models/Workout';
import { Meal } from '../models/Meal';

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
  private genAI: GoogleGenerativeAI | null;
  private model: any;
  private isGeminiAvailable: boolean;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  GEMINI_API_KEY not found. AI Coach will use fallback responses.');
      this.genAI = null;
      this.model = null;
      this.isGeminiAvailable = false;
    } else {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        this.isGeminiAvailable = true;
        console.log('✅ Gemini AI initialized successfully');
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
    return `You are "The Oracle," an advanced AI fitness coach for the FitQuest app. You are knowledgeable, supportive, and motivational. Your role is to provide personalized fitness guidance, workout recommendations, nutrition advice, and form corrections.

Key characteristics:
- Speak like an experienced fitness coach who cares about the user's progress
- Be encouraging but realistic about goals and expectations
- Provide specific, actionable advice with detailed explanations
- Consider the user's fitness level and goals in every response
- Always prioritize safety and proper form
- Use fitness terminology appropriately but explain complex concepts
- Give comprehensive responses (3-5 paragraphs when appropriate)
- Include practical tips, step-by-step instructions, and reasoning behind recommendations
- Address both immediate concerns and long-term fitness goals

User Context:
${userContext}

Response Guidelines:
- Always consider the user's current fitness level and goals
- Provide specific recommendations based on their recent activity
- If asked about pain or injury, recommend consulting healthcare professionals
- Encourage progressive overload and consistency with detailed explanations
- Suggest modifications for exercises when appropriate with clear instructions
- Give thorough, informative responses that educate the user
- Include the "why" behind your recommendations, not just the "what"
- When discussing exercises, include proper form cues, common mistakes to avoid, and progression tips
- For nutrition advice, explain the science behind your recommendations
- Always end with encouragement and next steps

Remember: You are The Oracle, their trusted AI fitness coach in the FitQuest universe. Provide comprehensive, educational responses that help users understand not just what to do, but why they should do it.`;
  }

  /**
   * Get fallback AI response when Gemini is not available
   */
  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('squat') || lowerMessage.includes('form')) {
      return `I've analyzed your recent squat form data, and I want to help you perfect this fundamental movement. Based on your form analysis, I recommend focusing on maintaining a neutral spine throughout the entire movement - this means keeping your chest up and avoiding excessive forward lean.

Here are the key points to focus on: First, ensure your core is properly engaged before you even begin the descent. Think about bracing your abs as if someone were about to punch you in the stomach. Second, control the descent phase more deliberately - aim for a 2-3 second lowering phase rather than dropping quickly. This eccentric control builds strength and improves your movement pattern.

For your stance, keep your feet shoulder-width apart with toes slightly pointed out (about 15-30 degrees). As you descend, focus on pushing your knees out in line with your toes, and imagine sitting back into a chair rather than just bending your knees. Your hip crease should go just below your knee cap for a full squat.

Remember, quality over quantity always wins. I'd rather see you perform 8 perfect squats than 15 sloppy ones. Consider reducing the weight temporarily to master the movement pattern - your strength will return quickly once your form is dialed in, and you'll be much safer in the long run.`;
    }

    if (lowerMessage.includes('meal') || lowerMessage.includes('nutrition') || lowerMessage.includes('protein')) {
      return `Based on your current goals and activity level, I want to dive deep into optimizing your nutrition for better results. Your protein intake is crucial for muscle recovery and growth, and I recommend aiming for 1.6-2.2g per kg of body weight daily. This isn't just about hitting a number - protein timing and quality matter significantly.

Here's what I suggest: Include a high-quality protein source at every meal, focusing on complete proteins like chicken, fish, eggs, dairy, or combining plant proteins like rice and beans. Post-workout, aim to consume 20-40g of protein within 30-60 minutes of training. This is when your muscles are most receptive to protein synthesis.

Don't neglect your carbohydrates either - they're your body's preferred fuel source and crucial for recovery. Complex carbs like oats, sweet potatoes, and quinoa provide sustained energy and help replenish muscle glycogen. Healthy fats from sources like avocados, nuts, and olive oil support hormone production and nutrient absorption.

Hydration is equally important - aim for at least 35ml per kg of body weight daily, more on training days. Consider tracking your intake for a week to identify patterns and areas for improvement. Remember, consistency beats perfection - small, sustainable changes compound over time to create remarkable results.`;
    }

    if (lowerMessage.includes('hurt') || lowerMessage.includes('pain') || lowerMessage.includes('injury')) {
      return `I'm concerned about the discomfort you're experiencing, and I want to address this carefully. Pain is your body's way of communicating that something needs attention, and it's crucial we don't ignore these signals. Based on your activity patterns, I recommend immediate rest from any movements that aggravate the area.

Here's my immediate action plan for you: First, apply the RICE protocol - Rest, Ice (15-20 minutes every 2-3 hours), Compression (if appropriate), and Elevation (if applicable). Gentle stretching and mobility work can help, but avoid anything that increases pain. Focus on movements that feel good and promote blood flow without stress.

However, I must emphasize that if this pain persists for more than 2-3 days, worsens, or is accompanied by swelling, numbness, or significant limitation in movement, you should consult a healthcare professional immediately. A physical therapist or sports medicine doctor can provide proper assessment and treatment.

In the meantime, consider this an opportunity to focus on other aspects of your fitness - perhaps upper body work if it's a lower body issue, or vice versa. Remember, taking a few days off now is much better than pushing through and potentially causing weeks or months of problems. Your long-term health and fitness journey are more important than any single workout.`;
    }

    if (lowerMessage.includes('recovery') || lowerMessage.includes('rest')) {
      return `Recovery is absolutely crucial to your fitness success - in fact, it's during rest that your body actually adapts and grows stronger from your training. I'm glad you're asking about this because it shows you understand that fitness isn't just about the work you do in the gym.

Sleep is your most powerful recovery tool. Aim for 7-9 hours of quality sleep nightly, as this is when your body releases growth hormone, repairs muscle tissue, and consolidates the neural adaptations from your training. Create a consistent sleep schedule, keep your room cool and dark, and avoid screens for at least an hour before bed.

Active recovery is also incredibly valuable. On your rest days, consider light activities like walking, gentle yoga, or swimming at an easy pace. These activities promote blood flow, help clear metabolic waste products, and can actually speed up recovery. Stretching and foam rolling can also help maintain mobility and reduce muscle tension.

Nutrition plays a huge role in recovery too. Focus on anti-inflammatory foods like berries, leafy greens, and fatty fish. Stay well-hydrated, and don't forget about stress management - chronic stress elevates cortisol, which can impair recovery and adaptation. Consider meditation, deep breathing exercises, or other stress-reduction techniques as part of your recovery protocol.`;
    }

    if (lowerMessage.includes('workout') || lowerMessage.includes('exercise')) {
      return `Let's talk about creating an effective workout strategy that will help you reach your goals safely and efficiently. The foundation of any good program is progressive overload - the gradual increase in training stimulus over time. This doesn't always mean adding more weight; you can progress by increasing reps, sets, training frequency, or improving exercise technique.

Here's what I recommend for your training structure: Start each session with a proper warm-up - 5-10 minutes of light cardio followed by dynamic stretching and movement preparation specific to your workout. This prepares your nervous system, increases blood flow, and reduces injury risk significantly.

Focus on compound movements that work multiple muscle groups simultaneously - squats, deadlifts, push-ups, rows, and overhead presses should form the backbone of your routine. These exercises give you the most bang for your buck and translate better to real-world activities. Aim for 2-3 full-body sessions per week if you're a beginner, or 3-4 sessions with an upper/lower split if you're more advanced.

Don't forget about the cool-down - spend 5-10 minutes doing static stretching and light movement to help your body transition back to rest. Track your workouts to ensure you're progressing over time, and remember that consistency trumps intensity. It's better to do moderate workouts consistently than to go all-out sporadically and burn out.`;
    }

    // Default response
    return `I'm here to help you achieve your fitness goals, and I want to provide you with comprehensive guidance even though my advanced AI features are currently limited. The foundation of any successful fitness journey lies in three key pillars: consistent training, proper nutrition, and adequate recovery.

Let's start with consistency - this is arguably the most important factor in your success. It's better to do something small every day than to have perfect workouts sporadically. Whether it's a 10-minute walk, some bodyweight exercises, or a full gym session, showing up consistently builds the habit and momentum you need for long-term success.

Proper form should always be your priority over lifting heavier weights or doing more reps. Good form not only prevents injuries but also ensures you're targeting the right muscles effectively. If you're unsure about technique, consider working with a qualified trainer initially, or use mirrors and video to check your form.

Listen to your body - it's incredibly intelligent and will give you signals about when to push harder and when to back off. Soreness is normal, but sharp pain is not. Fatigue is expected, but chronic exhaustion suggests you need more recovery. What specific aspect of your fitness journey would you like to explore further? I'm here to provide detailed guidance on any topic you'd like to discuss.`;
  }

  /**
   * Chat with AI coach using Gemini or fallback
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Get or create chat session
      let session: IChatSession;
      
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
          console.error('Gemini API Error:', geminiError);
          aiResponse = this.getFallbackResponse(request.message);
        }
      } else {
        // Use fallback response when Gemini is not available
        aiResponse = this.getFallbackResponse(request.message);
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
      
      // Fallback response for any errors
      return {
        message: "I'm experiencing some technical difficulties right now. Please try again in a moment. In the meantime, remember to stay consistent with your workouts and listen to your body!",
        sessionId: request.sessionId || '',
        suggestions: ['Stay hydrated', 'Focus on proper form', 'Get adequate rest']
      };
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
   * Get personalized recommendations using Gemini or fallback
   */
  async getRecommendations(request: { userId: string }): Promise<Recommendation[]> {
    try {
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
        } catch (geminiError) {
          console.error('Gemini API Error for recommendations:', geminiError);
        }
      }
      
      // Fallback recommendations when Gemini is not available or fails
      return [
        {
          type: 'workout',
          title: 'Progressive Overload',
          description: 'Gradually increase weight, reps, or sets in your workouts to continue making progress.',
          priority: 'high'
        },
        {
          type: 'nutrition',
          title: 'Post-Workout Nutrition',
          description: 'Consume protein and carbs within 30 minutes after your workout for optimal recovery.',
          priority: 'medium'
        },
        {
          type: 'recovery',
          title: 'Sleep Quality',
          description: 'Aim for 7-9 hours of quality sleep to support muscle recovery and performance.',
          priority: 'high'
        }
      ];
    } catch (error) {
      console.error('Error getting recommendations:', error);
      
      // Fallback recommendations for any errors
      return [
        {
          type: 'workout',
          title: 'Stay Consistent',
          description: 'Consistency is key to achieving your fitness goals. Stick to your routine.',
          priority: 'high'
        },
        {
          type: 'nutrition',
          title: 'Balanced Diet',
          description: 'Focus on a balanced diet with adequate protein, carbs, and healthy fats.',
          priority: 'medium'
        },
        {
          type: 'recovery',
          title: 'Listen to Your Body',
          description: 'Pay attention to how your body feels and adjust your training accordingly.',
          priority: 'high'
        }
      ];
    }
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

