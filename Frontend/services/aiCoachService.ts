const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  _id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  suggestions?: string[];
}

export interface Recommendation {
  type: 'workout' | 'nutrition' | 'recovery' | 'form';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

class AICoachService {
  private getAuthHeaders() {
    // Get token from localStorage using the correct key
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async sendMessage(message: string, sessionId?: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-coach/chat`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ message, sessionId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to use the AI coach.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getChatSessions(): Promise<ChatSession[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-coach/sessions`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to view chat history.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error getting chat sessions:', error);
      throw error;
    }
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-coach/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to delete chat sessions.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }
  }

  async getRecommendations(): Promise<Recommendation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-coach/recommendations`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to get recommendations.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  async analyzeForm(exerciseType: string, videoData?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-coach/analyze-form`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ exerciseType, videoData }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to analyze form.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Error analyzing form:', error);
      throw error;
    }
  }
}

export const aiCoachService = new AICoachService();