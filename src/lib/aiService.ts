import { supabase } from './supabase';
import type { 
  AIConversation, 
  AIUserPreferences, 
  AIMessage, 
  AIResponse,
  AIQuickSuggestion,
  UserRole 
} from '../types';

class AIService {
  private currentSessionId: string = '';

  constructor() {
    this.currentSessionId = this.generateSessionId();
  }

  // Generate a new session ID
  generateSessionId(): string {
    return crypto.randomUUID();
  }

  // Start a new conversation session
  startNewSession(): string {
    this.currentSessionId = this.generateSessionId();
    return this.currentSessionId;
  }

  // Send message to AI assistant
  async sendMessage(
    message: string, 
    language: 'ht' | 'en' | 'fr' = 'ht'
  ): Promise<AIResponse> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await supabase.functions.invoke('ai-assistant', {
        body: {
          message,
          sessionId: this.currentSessionId,
          language
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get AI response');
      }

      return response.data;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  // Get conversation history for current user
  async getConversationHistory(limit: number = 50): Promise<AIConversation[]> {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  // Get conversations by session
  async getSessionConversations(sessionId: string): Promise<AIConversation[]> {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching session conversations:', error);
      return [];
    }
  }

  // Get user AI preferences
  async getUserPreferences(): Promise<AIUserPreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('ai_user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching AI preferences:', error);
      return null;
    }
  }

  // Update user AI preferences
  async updateUserPreferences(preferences: Partial<AIUserPreferences>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('ai_user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating AI preferences:', error);
      throw error;
    }
  }

  // Mark message as helpful/unhelpful
  async markMessageHelpful(conversationId: string, isHelpful: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ is_helpful: isHelpful })
        .eq('id', conversationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking message helpful:', error);
      throw error;
    }
  }

  // Get quick suggestions based on user role
  getQuickSuggestions(userRole: UserRole, language: 'ht' | 'en' | 'fr' = 'ht'): AIQuickSuggestion[] {
    const suggestions: Record<string, Record<string, AIQuickSuggestion[]>> = {
      student: {
        ht: [
          { id: '1', text: 'Gade pwogre m yo', action: 'view_progress', icon: '📊' },
          { id: '2', text: 'Jwenn nouvo kou', action: 'find_courses', icon: '📚' },
          { id: '3', text: 'Tcheke evenman yo', action: 'check_events', icon: '📅' },
          { id: '4', text: 'Konsèy aprann', action: 'learning_tips', icon: '💡' }
        ],
        en: [
          { id: '1', text: 'View my progress', action: 'view_progress', icon: '📊' },
          { id: '2', text: 'Find new courses', action: 'find_courses', icon: '📚' },
          { id: '3', text: 'Check events', action: 'check_events', icon: '📅' },
          { id: '4', text: 'Learning tips', action: 'learning_tips', icon: '💡' }
        ],
        fr: [
          { id: '1', text: 'Voir mes progrès', action: 'view_progress', icon: '📊' },
          { id: '2', text: 'Trouver de nouveaux cours', action: 'find_courses', icon: '📚' },
          { id: '3', text: 'Vérifier les événements', action: 'check_events', icon: '📅' },
          { id: '4', text: 'Conseils d\'apprentissage', action: 'learning_tips', icon: '💡' }
        ]
      },
      teacher: {
        ht: [
          { id: '1', text: 'Analitik elèv yo', action: 'student_analytics', icon: '📈' },
          { id: '2', text: 'Jesyon kou', action: 'course_management', icon: '🎓' },
          { id: '3', text: 'Estrateji angajman', action: 'engagement_tips', icon: '🎯' },
          { id: '4', text: 'Kreyè kontni', action: 'content_creation', icon: '✍️' }
        ],
        en: [
          { id: '1', text: 'Student analytics', action: 'student_analytics', icon: '📈' },
          { id: '2', text: 'Course management', action: 'course_management', icon: '🎓' },
          { id: '3', text: 'Engagement strategies', action: 'engagement_tips', icon: '🎯' },
          { id: '4', text: 'Content creation', action: 'content_creation', icon: '✍️' }
        ],
        fr: [
          { id: '1', text: 'Analyses d\'étudiants', action: 'student_analytics', icon: '📈' },
          { id: '2', text: 'Gestion de cours', action: 'course_management', icon: '🎓' },
          { id: '3', text: 'Stratégies d\'engagement', action: 'engagement_tips', icon: '🎯' },
          { id: '4', text: 'Création de contenu', action: 'content_creation', icon: '✍️' }
        ]
      },
      sme: {
        ht: [
          { id: '1', text: 'Dekouvri sèvis yo', action: 'discover_services', icon: '🔍' },
          { id: '2', text: 'Nouvo pwojè', action: 'new_project', icon: '🚀' },
          { id: '3', text: 'Konekte ak ekspè', action: 'connect_experts', icon: '🤝' },
          { id: '4', text: 'Resous biznis', action: 'business_resources', icon: '💼' }
        ],
        en: [
          { id: '1', text: 'Discover services', action: 'discover_services', icon: '🔍' },
          { id: '2', text: 'New project', action: 'new_project', icon: '🚀' },
          { id: '3', text: 'Connect with experts', action: 'connect_experts', icon: '🤝' },
          { id: '4', text: 'Business resources', action: 'business_resources', icon: '💼' }
        ],
        fr: [
          { id: '1', text: 'Découvrir les services', action: 'discover_services', icon: '🔍' },
          { id: '2', text: 'Nouveau projet', action: 'new_project', icon: '🚀' },
          { id: '3', text: 'Se connecter avec des experts', action: 'connect_experts', icon: '🤝' },
          { id: '4', text: 'Ressources d\'entreprise', action: 'business_resources', icon: '💼' }
        ]
      },
      admin: {
        ht: [
          { id: '1', text: 'Jesyon itilizatè', action: 'user_management', icon: '👥' },
          { id: '2', text: 'Rapò sistèm', action: 'system_reports', icon: '📋' },
          { id: '3', text: 'Konfigirasyon', action: 'configuration', icon: '⚙️' },
          { id: '4', text: 'Pòlitik AI', action: 'ai_policies', icon: '🤖' }
        ],
        en: [
          { id: '1', text: 'User management', action: 'user_management', icon: '👥' },
          { id: '2', text: 'System reports', action: 'system_reports', icon: '📋' },
          { id: '3', text: 'Configuration', action: 'configuration', icon: '⚙️' },
          { id: '4', text: 'AI policies', action: 'ai_policies', icon: '🤖' }
        ],
        fr: [
          { id: '1', text: 'Gestion des utilisateurs', action: 'user_management', icon: '👥' },
          { id: '2', text: 'Rapports système', action: 'system_reports', icon: '📋' },
          { id: '3', text: 'Configuration', action: 'configuration', icon: '⚙️' },
          { id: '4', text: 'Politiques IA', action: 'ai_policies', icon: '🤖' }
        ]
      },
      super_admin: {
        ht: [
          { id: '1', text: 'Jesyon itilizatè', action: 'user_management', icon: '👥' },
          { id: '2', text: 'Rapò sistèm', action: 'system_reports', icon: '📋' },
          { id: '3', text: 'Konfigirasyon', action: 'configuration', icon: '⚙️' },
          { id: '4', text: 'Pòlitik AI', action: 'ai_policies', icon: '🤖' }
        ],
        en: [
          { id: '1', text: 'User management', action: 'user_management', icon: '👥' },
          { id: '2', text: 'System reports', action: 'system_reports', icon: '📋' },
          { id: '3', text: 'Configuration', action: 'configuration', icon: '⚙️' },
          { id: '4', text: 'AI policies', action: 'ai_policies', icon: '🤖' }
        ],
        fr: [
          { id: '1', text: 'Gestion des utilisateurs', action: 'user_management', icon: '👥' },
          { id: '2', text: 'Rapports système', action: 'system_reports', icon: '📋' },
          { id: '3', text: 'Configuration', action: 'configuration', icon: '⚙️' },
          { id: '4', text: 'Politiques IA', action: 'ai_policies', icon: '🤖' }
        ]
      },
      guest: {
        ht: [
          { id: '1', text: 'Konnen plis sou nou', action: 'about_us', icon: 'ℹ️' },
          { id: '2', text: 'Enskri', action: 'register', icon: '✏️' },
          { id: '3', text: 'Konekte', action: 'login', icon: '🔐' },
          { id: '4', text: 'Eksplorè kou yo', action: 'explore_courses', icon: '🎓' }
        ],
        en: [
          { id: '1', text: 'About us', action: 'about_us', icon: 'ℹ️' },
          { id: '2', text: 'Register', action: 'register', icon: '✏️' },
          { id: '3', text: 'Login', action: 'login', icon: '🔐' },
          { id: '4', text: 'Explore courses', action: 'explore_courses', icon: '🎓' }
        ],
        fr: [
          { id: '1', text: 'À propos de nous', action: 'about_us', icon: 'ℹ️' },
          { id: '2', text: 'S\'inscrire', action: 'register', icon: '✏️' },
          { id: '3', text: 'Se connecter', action: 'login', icon: '🔐' },
          { id: '4', text: 'Explorer les cours', action: 'explore_courses', icon: '🎓' }
        ]
      }
    };

    return suggestions[userRole]?.[language] || suggestions.guest[language] || [];
  }

  // Execute quick suggestion action
  async executeQuickAction(action: string, userRole: UserRole): Promise<string> {
    // This would integrate with your existing routing and navigation
    // For now, return appropriate AI responses
    
    const responses: Record<string, Record<string, string>> = {
      view_progress: {
        ht: 'Mwen ap chèche pwogre w yo kounye a...',
        en: 'Let me check your progress...',
        fr: 'Je vérifie vos progrès...'
      },
      find_courses: {
        ht: 'Kite m ede w jwenn kou ki bon pou ou...',
        en: 'Let me help you find suitable courses...',
        fr: 'Laissez-moi vous aider à trouver des cours appropriés...'
      },
      check_events: {
        ht: 'Mwen ap gade evenman yo k ap vini yo...',
        en: 'Checking upcoming events...',
        fr: 'Vérification des événements à venir...'
      },
      // Add more action responses as needed
    };

    return responses[action]?.ht || 'Mwen ap travay sou demann ou an...';
  }

  // Clear conversation history
  async clearConversationHistory(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Start a new session
      this.startNewSession();
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      throw error;
    }
  }

  // Get AI settings (for admin use)
  async getAISettings(): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('ai_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      const settings: Record<string, any> = {};
      data?.forEach(setting => {
        settings[setting.setting_key] = setting.setting_value;
      });

      return settings;
    } catch (error) {
      console.error('Error fetching AI settings:', error);
      return {};
    }
  }
}

export const aiService = new AIService();