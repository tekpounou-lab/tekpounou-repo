import { useState, useEffect, useCallback } from 'react';
import { aiPersonalizationService } from '../lib/aiPersonalizationService';
import { useAuthStore } from '../stores/authStore';
import type { 
  AIPersonalization,
  AILearningPath,
  AIContentRecommendation,
  AITeacherInsights,
  AISMEGuidance,
  AIAnalyticsPrediction,
  UserRole 
} from '../types';

interface UseAIPersonalizationReturn {
  // Learning Paths
  learningPath: AILearningPath | null;
  generateLearningPath: () => Promise<void>;
  isGeneratingPath: boolean;

  // Content Recommendations
  recommendations: AIContentRecommendation[];
  getRecommendations: (type?: 'course' | 'blog_post' | 'event' | 'resource' | 'service') => Promise<void>;
  isLoadingRecommendations: boolean;

  // Role-specific Insights
  teacherInsights: AITeacherInsights | null;
  smeGuidance: AISMEGuidance | null;
  getInsights: () => Promise<void>;
  isLoadingInsights: boolean;

  // Voice Assistant
  isVoiceEnabled: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  startVoiceSession: () => Promise<string>;
  speakText: (text: string) => Promise<void>;
  toggleVoice: () => void;

  // Predictive Analytics
  predictions: AIAnalyticsPrediction[];
  generatePredictions: (type: string) => Promise<void>;
  isGeneratingPredictions: boolean;

  // AI Summaries
  generateSummary: (contentType: string, contentId: string, content: string, length?: 'short' | 'medium' | 'long') => Promise<string>;
  isGeneratingSummary: boolean;

  // Personalization Management
  personalizations: AIPersonalization[];
  getUserPersonalizations: () => Promise<void>;
  submitFeedback: (personalizationId: string, module: string, rating: number, comment?: string, type?: string) => Promise<void>;
  updateSettings: (settings: Record<string, any>) => Promise<void>;

  // Usage Analytics
  trackUsage: (feature: string, interaction: string, metadata?: Record<string, any>) => Promise<void>;

  // State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useAIPersonalization = (userRole: UserRole = 'student'): UseAIPersonalizationReturn => {
  // State management
  const [learningPath, setLearningPath] = useState<AILearningPath | null>(null);
  const [recommendations, setRecommendations] = useState<AIContentRecommendation[]>([]);
  const [teacherInsights, setTeacherInsights] = useState<AITeacherInsights | null>(null);
  const [smeGuidance, setSmeGuidance] = useState<AISMEGuidance | null>(null);
  const [predictions, setPredictions] = useState<AIAnalyticsPrediction[]>([]);
  const [personalizations, setPersonalizations] = useState<AIPersonalization[]>([]);
  
  // Loading states
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isGeneratingPredictions, setIsGeneratingPredictions] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Voice states
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // General states
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { user } = useAuthStore();

  // Initialize personalization features
  useEffect(() => {
    if (user) {
      initializePersonalization();
    }
  }, [user, userRole]);

  const initializePersonalization = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        getUserPersonalizations(),
        getRecommendations(),
        getInsights()
      ]);
      
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to initialize AI personalization');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate personalized learning path
  const generateLearningPath = useCallback(async () => {
    setIsGeneratingPath(true);
    setError(null);
    
    try {
      const path = await aiPersonalizationService.generateLearningPath();
      setLearningPath(path);
      
      // Track usage
      await trackUsage('learning_path', 'generate');
    } catch (err: any) {
      setError(err.message || 'Failed to generate learning path');
    } finally {
      setIsGeneratingPath(false);
    }
  }, []);

  // Get content recommendations
  const getRecommendations = useCallback(async (
    type: 'course' | 'blog_post' | 'event' | 'resource' | 'service' = 'course'
  ) => {
    setIsLoadingRecommendations(true);
    setError(null);
    
    try {
      const recs = await aiPersonalizationService.getContentRecommendations(type);
      setRecommendations(recs);
      
      // Track usage
      await trackUsage('content_recommendations', 'view', { content_type: type });
    } catch (err: any) {
      setError(err.message || 'Failed to get recommendations');
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, []);

  // Get role-specific insights
  const getInsights = useCallback(async () => {
    setIsLoadingInsights(true);
    setError(null);
    
    try {
      if (userRole === 'teacher') {
        const insights = await aiPersonalizationService.getTeacherInsights();
        setTeacherInsights(insights);
        await trackUsage('teacher_insights', 'view');
      } else if (userRole === 'sme') {
        const guidance = await aiPersonalizationService.getSMEGuidance();
        setSmeGuidance(guidance);
        await trackUsage('sme_guidance', 'view');
      } else if (userRole === 'student') {
        // Generate learning path for students
        await generateLearningPath();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get insights');
    } finally {
      setIsLoadingInsights(false);
    }
  }, [userRole, generateLearningPath]);

  // Voice assistant functionality
  const startVoiceSession = useCallback(async (): Promise<string> => {
    if (!isVoiceEnabled) {
      throw new Error('Voice assistant is not enabled');
    }

    setIsListening(true);
    setError(null);
    
    try {
      const transcript = await aiPersonalizationService.startVoiceSession();
      await trackUsage('voice_assistant', 'use', { transcript_length: transcript.length });
      return transcript;
    } catch (err: any) {
      setError(err.message || 'Voice recognition failed');
      throw err;
    } finally {
      setIsListening(false);
    }
  }, [isVoiceEnabled]);

  const speakText = useCallback(async (text: string) => {
    if (!isVoiceEnabled) {
      throw new Error('Voice assistant is not enabled');
    }

    setIsSpeaking(true);
    setError(null);
    
    try {
      await aiPersonalizationService.speakText(text);
      await trackUsage('voice_assistant', 'speak', { text_length: text.length });
    } catch (err: any) {
      setError(err.message || 'Speech synthesis failed');
      throw err;
    } finally {
      setIsSpeaking(false);
    }
  }, [isVoiceEnabled]);

  const toggleVoice = useCallback(() => {
    setIsVoiceEnabled(!isVoiceEnabled);
  }, [isVoiceEnabled]);

  // Predictive analytics
  const generatePredictions = useCallback(async (predictionType: string) => {
    setIsGeneratingPredictions(true);
    setError(null);
    
    try {
      const newPredictions = await aiPersonalizationService.generatePredictions(
        predictionType as any
      );
      setPredictions(newPredictions);
      
      await trackUsage('predictive_analytics', 'generate', { 
        prediction_type: predictionType,
        predictions_count: newPredictions.length 
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate predictions');
    } finally {
      setIsGeneratingPredictions(false);
    }
  }, []);

  // AI summary generation
  const generateSummary = useCallback(async (
    contentType: string,
    contentId: string,
    content: string,
    length: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<string> => {
    setIsGeneratingSummary(true);
    setError(null);
    
    try {
      const summary = await aiPersonalizationService.generateSummary(
        contentType as any,
        contentId,
        content,
        'ht', // Default language
        length
      );
      
      await trackUsage('summary_generation', 'generate', {
        content_type: contentType,
        content_length: content.length,
        summary_length: length
      });
      
      return summary;
    } catch (err: any) {
      setError(err.message || 'Failed to generate summary');
      throw err;
    } finally {
      setIsGeneratingSummary(false);
    }
  }, []);

  // Get user personalizations
  const getUserPersonalizations = useCallback(async () => {
    setError(null);
    
    try {
      const personalData = await aiPersonalizationService.getUserPersonalizations();
      setPersonalizations(personalData);
    } catch (err: any) {
      setError(err.message || 'Failed to get personalizations');
    }
  }, []);

  // Submit feedback
  const submitFeedback = useCallback(async (
    personalizationId: string,
    module: string,
    rating: number,
    comment?: string,
    type?: string
  ) => {
    setError(null);
    
    try {
      await aiPersonalizationService.submitFeedback(
        personalizationId,
        module as any,
        rating,
        comment,
        type as any
      );
      
      // Refresh personalizations after feedback
      await getUserPersonalizations();
      
      await trackUsage('ai_feedback', 'submit', {
        module,
        rating,
        feedback_type: type
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
    }
  }, [getUserPersonalizations]);

  // Update personalization settings
  const updateSettings = useCallback(async (settings: Record<string, any>) => {
    setError(null);
    
    try {
      await aiPersonalizationService.updatePersonalizationSettings(settings);
      
      // Update voice enabled state if changed
      if ('voice_enabled' in settings) {
        setIsVoiceEnabled(settings.voice_enabled);
      }
      
      await trackUsage('personalization_settings', 'update', settings);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    }
  }, []);

  // Track usage
  const trackUsage = useCallback(async (
    feature: string,
    interaction: string,
    metadata: Record<string, any> = {}
  ) => {
    try {
      await aiPersonalizationService.trackUsage(feature, interaction as any, metadata);
    } catch (err) {
      console.error('Error tracking usage:', err);
      // Don't throw error for tracking failures
    }
  }, []);

  // Auto-refresh recommendations periodically
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        await getRecommendations();
      } catch (err) {
        console.error('Auto-refresh failed:', err);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    return () => clearInterval(interval);
  }, [user, getRecommendations]);

  return {
    // Learning Paths
    learningPath,
    generateLearningPath,
    isGeneratingPath,

    // Content Recommendations
    recommendations,
    getRecommendations,
    isLoadingRecommendations,

    // Role-specific Insights
    teacherInsights,
    smeGuidance,
    getInsights,
    isLoadingInsights,

    // Voice Assistant
    isVoiceEnabled,
    isListening,
    isSpeaking,
    startVoiceSession,
    speakText,
    toggleVoice,

    // Predictive Analytics
    predictions,
    generatePredictions,
    isGeneratingPredictions,

    // AI Summaries
    generateSummary,
    isGeneratingSummary,

    // Personalization Management
    personalizations,
    getUserPersonalizations,
    submitFeedback,
    updateSettings,

    // Usage Analytics
    trackUsage,

    // State
    isLoading,
    error,
    lastUpdated
  };
};