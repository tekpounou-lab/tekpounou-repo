import { useState, useEffect, useCallback } from 'react';
import { aiService } from '../lib/aiService';
import type { 
  AIMessage, 
  AIUserPreferences, 
  AIConversation,
  AIQuickSuggestion,
  UserRole 
} from '../types';

interface UseAIReturn {
  // State
  messages: AIMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  preferences: AIUserPreferences | null;
  quickSuggestions: AIQuickSuggestion[];
  
  // Actions
  sendMessage: (message: string, language?: 'ht' | 'en' | 'fr') => Promise<void>;
  clearMessages: () => void;
  startNewSession: () => void;
  updatePreferences: (prefs: Partial<AIUserPreferences>) => Promise<void>;
  markMessageHelpful: (messageId: string, isHelpful: boolean) => Promise<void>;
  executeQuickAction: (action: string) => Promise<void>;
  
  // Utilities
  isAIEnabled: boolean;
  sessionId: string;
}

export const useAI = (userRole: UserRole = 'guest'): UseAIReturn => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<AIUserPreferences | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize session and load preferences
  useEffect(() => {
    const initializeAI = async () => {
      try {
        // Start new session
        const newSessionId = aiService.startNewSession();
        setSessionId(newSessionId);

        // Load user preferences
        const userPrefs = await aiService.getUserPreferences();
        setPreferences(userPrefs);

        // If preferences don't exist, create default ones
        if (!userPrefs) {
          const defaultPrefs: Partial<AIUserPreferences> = {
            ai_enabled: true,
            preferred_language: 'ht',
            voice_enabled: false,
            quick_suggestions_enabled: true,
            conversation_history_enabled: true
          };
          await aiService.updateUserPreferences(defaultPrefs);
          setPreferences(defaultPrefs as AIUserPreferences);
        }
      } catch (err) {
        console.error('Error initializing AI:', err);
        setError('Failed to initialize AI assistant');
      }
    };

    initializeAI();
  }, []);

  // Send message to AI
  const sendMessage = useCallback(async (
    message: string, 
    language: 'ht' | 'en' | 'fr' = preferences?.preferred_language || 'ht'
  ) => {
    if (!message.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    // Add user message immediately
    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Show typing indicator
      setIsTyping(true);
      
      // Send to AI service
      const response = await aiService.sendMessage(message.trim(), language);
      
      // Add AI response
      const aiMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      
      // Add error message
      const errorMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: language === 'en' ? 'Sorry, I encountered an error. Please try again.' :
                language === 'fr' ? 'Désolé, j\'ai rencontré une erreur. Veuillez réessayer.' :
                'Padon, mwen gen yon pwoblèm. Tanpri eseye ankò.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [preferences, isLoading]);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    aiService.startNewSession();
    setSessionId(aiService.generateSessionId());
  }, []);

  // Start new session
  const startNewSession = useCallback(() => {
    const newSessionId = aiService.startNewSession();
    setSessionId(newSessionId);
    setMessages([]);
    setError(null);
  }, []);

  // Update user preferences
  const updatePreferences = useCallback(async (prefs: Partial<AIUserPreferences>) => {
    try {
      await aiService.updateUserPreferences(prefs);
      setPreferences(prev => prev ? { ...prev, ...prefs } : prefs as AIUserPreferences);
    } catch (err: any) {
      console.error('Error updating preferences:', err);
      setError(err.message || 'Failed to update preferences');
    }
  }, []);

  // Mark message as helpful/unhelpful
  const markMessageHelpful = useCallback(async (messageId: string, isHelpful: boolean) => {
    try {
      // Find the conversation ID from our messages
      // In a real implementation, you'd store conversation IDs with messages
      await aiService.markMessageHelpful(messageId, isHelpful);
    } catch (err: any) {
      console.error('Error marking message helpful:', err);
    }
  }, []);

  // Execute quick action
  const executeQuickAction = useCallback(async (action: string) => {
    try {
      const response = await aiService.executeQuickAction(action, userRole);
      await sendMessage(response);
    } catch (err: any) {
      console.error('Error executing quick action:', err);
      setError(err.message || 'Failed to execute action');
    }
  }, [userRole, sendMessage]);

  // Get quick suggestions based on user role and language
  const quickSuggestions = aiService.getQuickSuggestions(
    userRole, 
    preferences?.preferred_language || 'ht'
  );

  // Check if AI is enabled
  const isAIEnabled = preferences?.ai_enabled ?? true;

  return {
    // State
    messages,
    isLoading,
    isTyping,
    error,
    preferences,
    quickSuggestions,
    
    // Actions
    sendMessage,
    clearMessages,
    startNewSession,
    updatePreferences,
    markMessageHelpful,
    executeQuickAction,
    
    // Utilities
    isAIEnabled,
    sessionId
  };
};