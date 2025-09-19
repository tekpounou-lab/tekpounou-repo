import { supabase } from './supabase';
import type { 
  AIPersonalization,
  AILearningPath,
  AIContentRecommendation,
  AIAnalyticsPrediction,
  AIVoiceInteraction,
  AISummary,
  AITeacherInsights,
  AISMEGuidance,
  UserRole
} from '../types';

class AIPersonalizationService {
  private currentSessionId: string = '';
  private voiceRecognition: SpeechRecognition | null = null;
  private speechSynthesis: SpeechSynthesis | null = null;

  constructor() {
    this.currentSessionId = crypto.randomUUID();
    this.initializeVoiceFeatures();
  }

  // Initialize voice recognition and synthesis
  private initializeVoiceFeatures() {
    if (typeof window !== 'undefined') {
      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.voiceRecognition = new SpeechRecognition();
        this.voiceRecognition.continuous = false;
        this.voiceRecognition.interimResults = false;
        this.voiceRecognition.lang = 'ht-HT'; // Default to Haitian Creole
      }

      // Initialize Speech Synthesis
      if (window.speechSynthesis) {
        this.speechSynthesis = window.speechSynthesis;
      }
    }
  }

  // Generate personalized learning path
  async generateLearningPath(userId?: string): Promise<AILearningPath | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('generate_personalized_learning_path', {
        user_uuid: targetUserId
      });

      if (error) throw error;

      // Get the generated learning path
      const { data: learningPath, error: pathError } = await supabase
        .from('ai_learning_paths')
        .select('*')
        .eq('id', data)
        .single();

      if (pathError) throw pathError;

      // Track usage
      await this.trackUsage('learning_path_generation', 'use');

      return learningPath;
    } catch (error) {
      console.error('Error generating learning path:', error);
      return null;
    }
  }

  // Get content recommendations
  async getContentRecommendations(
    contentType: 'course' | 'blog_post' | 'event' | 'resource' | 'service' = 'course',
    limit: number = 5
  ): Promise<AIContentRecommendation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('generate_content_recommendations', {
        user_uuid: user.id,
        content_type: contentType
      });

      if (error) throw error;

      // Track usage
      await this.trackUsage('content_recommendations', 'view', {
        content_type: contentType,
        recommendations_count: data?.length || 0
      });

      return data || [];
    } catch (error) {
      console.error('Error getting content recommendations:', error);
      return [];
    }
  }

  // Get personalized insights for teachers
  async getTeacherInsights(teacherId?: string): Promise<AITeacherInsights | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = teacherId || user?.id;
      
      if (!targetUserId) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('get_teacher_ai_insights', {
        teacher_uuid: targetUserId
      });

      if (error) throw error;

      // Track usage
      await this.trackUsage('teacher_insights', 'view');

      return data;
    } catch (error) {
      console.error('Error getting teacher insights:', error);
      return null;
    }
  }

  // Get SME guidance
  async getSMEGuidance(smeId?: string): Promise<AISMEGuidance | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = smeId || user?.id;
      
      if (!targetUserId) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('get_sme_ai_guidance', {
        sme_uuid: targetUserId
      });

      if (error) throw error;

      // Track usage
      await this.trackUsage('sme_guidance', 'view');

      return data;
    } catch (error) {
      console.error('Error getting SME guidance:', error);
      return null;
    }
  }

  // Voice assistant functionality
  async startVoiceSession(language: 'ht' | 'en' | 'fr' = 'ht'): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.voiceRecognition) {
        reject(new Error('Voice recognition not supported'));
        return;
      }

      // Set language
      const langMap = { ht: 'ht-HT', en: 'en-US', fr: 'fr-FR' };
      this.voiceRecognition.lang = langMap[language];

      this.voiceRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      this.voiceRecognition.onerror = (event) => {
        reject(new Error(`Voice recognition error: ${event.error}`));
      };

      this.voiceRecognition.start();

      // Track usage
      this.trackUsage('voice_assistant', 'start', { language });
    });
  }

  // Text-to-speech for AI responses
  async speakText(text: string, language: 'ht' | 'en' | 'fr' = 'ht'): Promise<void> {
    if (!this.speechSynthesis) {
      throw new Error('Speech synthesis not supported');
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice based on language
    const voices = this.speechSynthesis.getVoices();
    const languageMap = { ht: 'fr', en: 'en', fr: 'fr' }; // Fallback to French for Creole
    
    const voice = voices.find(v => v.lang.startsWith(languageMap[language]));
    if (voice) utterance.voice = voice;

    utterance.rate = 0.9;
    utterance.pitch = 1;

    return new Promise((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));
      
      this.speechSynthesis!.speak(utterance);
    });

    // Track usage
    await this.trackUsage('voice_assistant', 'speak', { 
      language, 
      text_length: text.length 
    });
  }

  // Generate AI summaries for content
  async generateSummary(
    contentType: 'course_lesson' | 'blog_post' | 'event' | 'project' | 'service_description',
    contentId: string,
    content: string,
    language: 'ht' | 'en' | 'fr' = 'ht',
    summaryLength: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<string> {
    try {
      // Check if summary already exists
      const { data: existingSummary } = await supabase
        .from('ai_summaries')
        .select('summary_text')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('summary_language', language)
        .eq('summary_length', summaryLength)
        .single();

      if (existingSummary) {
        return existingSummary.summary_text;
      }

      // Generate new summary (simplified AI logic)
      const summary = this.generateSimpleSummary(content, language, summaryLength);

      // Save summary to database
      const { error } = await supabase
        .from('ai_summaries')
        .insert({
          content_type: contentType,
          content_id: contentId,
          original_content_hash: this.hashContent(content),
          summary_text: summary,
          summary_language: language,
          summary_length: summaryLength
        });

      if (error) console.error('Error saving summary:', error);

      // Track usage
      await this.trackUsage('summary_generation', 'generate', {
        content_type: contentType,
        language,
        summary_length: summaryLength
      });

      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  // Simplified summary generation (replace with actual AI service in production)
  private generateSimpleSummary(content: string, language: 'ht' | 'en' | 'fr', length: 'short' | 'medium' | 'long'): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let targetSentences: number;

    switch (length) {
      case 'short':
        targetSentences = Math.min(2, sentences.length);
        break;
      case 'medium':
        targetSentences = Math.min(4, sentences.length);
        break;
      case 'long':
        targetSentences = Math.min(6, sentences.length);
        break;
    }

    const selectedSentences = sentences.slice(0, targetSentences);
    let summary = selectedSentences.join('. ').trim();
    
    if (summary && !summary.endsWith('.')) {
      summary += '.';
    }

    // Add language-specific prefix
    const prefixes = {
      ht: 'Rezime: ',
      en: 'Summary: ',
      fr: 'Résumé: '
    };

    return prefixes[language] + summary;
  }

  // Generate content hash for change detection
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Predictive analytics
  async generatePredictions(
    predictionType: 'course_demand' | 'user_engagement' | 'completion_rate' | 'sme_project_trends' | 'event_attendance',
    targetEntityType?: 'course' | 'user' | 'event' | 'service' | 'platform',
    targetEntityId?: string
  ): Promise<AIAnalyticsPrediction[]> {
    try {
      // This would integrate with actual ML models in production
      const mockPredictions = await this.generateMockPredictions(predictionType, targetEntityType, targetEntityId);

      // Save predictions to database
      for (const prediction of mockPredictions) {
        await supabase
          .from('ai_analytics_predictions')
          .insert(prediction);
      }

      // Track usage
      await this.trackUsage('predictive_analytics', 'generate', {
        prediction_type: predictionType,
        predictions_count: mockPredictions.length
      });

      return mockPredictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      return [];
    }
  }

  // Mock prediction generation (replace with actual ML in production)
  private async generateMockPredictions(
    predictionType: string,
    targetEntityType?: string,
    targetEntityId?: string
  ): Promise<any[]> {
    const predictions = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const predictionDate = new Date(currentDate);
      predictionDate.setDate(currentDate.getDate() + i);
      
      predictions.push({
        prediction_type: predictionType,
        target_entity_type: targetEntityType,
        target_entity_id: targetEntityId,
        prediction_data: {
          predicted_value: Math.random() * 100,
          trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
          factors: ['historical_data', 'seasonal_patterns', 'user_behavior']
        },
        confidence_level: 0.7 + Math.random() * 0.2,
        prediction_date: predictionDate.toISOString()
      });
    }
    
    return predictions;
  }

  // Get user's AI personalizations
  async getUserPersonalizations(
    type?: 'learning_path' | 'content_recommendation' | 'teacher_insight' | 'sme_guidance',
    limit: number = 10
  ): Promise<AIPersonalization[]> {
    try {
      let query = supabase
        .from('ai_personalizations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting personalizations:', error);
      return [];
    }
  }

  // Submit feedback on AI suggestions
  async submitFeedback(
    personalizationId: string,
    module: 'chat_assistant' | 'learning_path' | 'content_recommendation' | 'voice_assistant' | 'predictive_analytics' | 'summary_generation',
    rating: number,
    comment?: string,
    feedbackType?: 'helpful' | 'not_helpful' | 'inappropriate' | 'incorrect' | 'excellent'
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('ai_feedback')
        .insert({
          user_id: user.id,
          personalization_id: personalizationId,
          module,
          rating,
          comment,
          feedback_type: feedbackType
        });

      if (error) throw error;

      // Track usage
      await this.trackUsage('ai_feedback', 'submit', {
        module,
        rating,
        feedback_type: feedbackType
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  // Track AI feature usage
  async trackUsage(
    featureName: string,
    interactionType: 'view' | 'click' | 'use' | 'complete' | 'dismiss' | 'rate',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc('track_ai_usage', {
        user_uuid: user.id,
        feature_name: featureName,
        interaction_type: interactionType,
        session_uuid: this.currentSessionId,
        metadata: metadata
      });
    } catch (error) {
      console.error('Error tracking AI usage:', error);
    }
  }

  // Get AI usage analytics for admin
  async getUsageAnalytics(
    featureName?: string,
    days: number = 30
  ): Promise<any> {
    try {
      let query = supabase
        .from('ai_usage_analytics')
        .select(`
          feature_name,
          interaction_type,
          metadata,
          created_at,
          user_profiles!inner(role, full_name)
        `)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (featureName) {
        query = query.eq('feature_name', featureName);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process analytics data
      const analytics = {
        total_interactions: data?.length || 0,
        unique_users: new Set(data?.map(d => d.user_profiles?.full_name)).size,
        feature_breakdown: {},
        interaction_breakdown: {},
        daily_usage: {}
      };

      data?.forEach(item => {
        // Feature breakdown
        if (!analytics.feature_breakdown[item.feature_name]) {
          analytics.feature_breakdown[item.feature_name] = 0;
        }
        analytics.feature_breakdown[item.feature_name]++;

        // Interaction breakdown
        if (!analytics.interaction_breakdown[item.interaction_type]) {
          analytics.interaction_breakdown[item.interaction_type] = 0;
        }
        analytics.interaction_breakdown[item.interaction_type]++;

        // Daily usage
        const date = new Date(item.created_at).toDateString();
        if (!analytics.daily_usage[date]) {
          analytics.daily_usage[date] = 0;
        }
        analytics.daily_usage[date]++;
      });

      return analytics;
    } catch (error) {
      console.error('Error getting usage analytics:', error);
      return null;
    }
  }

  // Get AI feedback summary for admin
  async getFeedbackSummary(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('ai_feedback')
        .select(`
          module,
          rating,
          feedback_type,
          comment,
          created_at,
          user_profiles!inner(role, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const summary = {
        total_feedback: data?.length || 0,
        average_rating: 0,
        module_ratings: {},
        feedback_types: {},
        recent_comments: []
      };

      if (data && data.length > 0) {
        const validRatings = data.filter(item => item.rating).map(item => item.rating);
        summary.average_rating = validRatings.length > 0 
          ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
          : 0;

        data.forEach(item => {
          // Module ratings
          if (!summary.module_ratings[item.module]) {
            summary.module_ratings[item.module] = { total: 0, count: 0, average: 0 };
          }
          if (item.rating) {
            summary.module_ratings[item.module].total += item.rating;
            summary.module_ratings[item.module].count++;
            summary.module_ratings[item.module].average = 
              summary.module_ratings[item.module].total / summary.module_ratings[item.module].count;
          }

          // Feedback types
          if (item.feedback_type) {
            if (!summary.feedback_types[item.feedback_type]) {
              summary.feedback_types[item.feedback_type] = 0;
            }
            summary.feedback_types[item.feedback_type]++;
          }

          // Recent comments
          if (item.comment && summary.recent_comments.length < 10) {
            summary.recent_comments.push({
              comment: item.comment,
              module: item.module,
              rating: item.rating,
              user_role: item.user_profiles?.role,
              created_at: item.created_at
            });
          }
        });
      }

      return summary;
    } catch (error) {
      console.error('Error getting feedback summary:', error);
      return null;
    }
  }

  // Update AI personalization settings
  async updatePersonalizationSettings(settings: Record<string, any>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update user AI preferences
      const { error } = await supabase
        .from('ai_user_preferences')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Track usage
      await this.trackUsage('personalization_settings', 'update', settings);
    } catch (error) {
      console.error('Error updating personalization settings:', error);
      throw error;
    }
  }
}

export const aiPersonalizationService = new AIPersonalizationService();
export default AIPersonalizationService;