import React, { useState } from 'react';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { useAI } from '../../hooks/useAI';
import { AIChatInterface } from './AIChatInterface';

interface AIAssistantButtonProps {
  className?: string;
}

export const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({ 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { user, profile } = useAuthStore();
  const userRole = profile?.roles?.[0] || 'guest';
  
  const { 
    messages, 
    isLoading, 
    isTyping, 
    error, 
    preferences,
    quickSuggestions,
    sendMessage, 
    clearMessages,
    startNewSession,
    isAIEnabled 
  } = useAI(userRole);

  // Don't show AI assistant if disabled
  if (!isAIEnabled) {
    return null;
  }

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsFullScreen(false);
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsFullScreen(false);
  };

  // Floating button
  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={toggleChat}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 
                     hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl 
                     transition-all duration-300 group"
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          
          {/* Notification dot if there are new features or updates */}
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full 
                          animate-pulse border-2 border-white" />
        </Button>
        
        {/* Tooltip */}
        <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-sm 
                        py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 
                        transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          {preferences?.preferred_language === 'en' ? 'AI Assistant' :
           preferences?.preferred_language === 'fr' ? 'Assistant IA' :
           'Asistan AI'}
        </div>
      </div>
    );
  }

  // Chat modal/fullscreen
  return (
    <>
      {/* Backdrop */}
      {isFullScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeChat} />
      )}
      
      {/* Chat Container */}
      <div className={`
        fixed z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
        shadow-2xl transition-all duration-300 ${
          isFullScreen 
            ? 'inset-4 rounded-lg'
            : 'bottom-6 right-6 w-96 h-[32rem] rounded-xl'
        }
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 
                            flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {preferences?.preferred_language === 'en' ? 'AI Assistant' :
                 preferences?.preferred_language === 'fr' ? 'Assistant IA' :
                 'Asistan AI'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isTyping 
                  ? (preferences?.preferred_language === 'en' ? 'Typing...' :
                     preferences?.preferred_language === 'fr' ? 'Tape...' :
                     'K ap tape...')
                  : (preferences?.preferred_language === 'en' ? 'Online' :
                     preferences?.preferred_language === 'fr' ? 'En ligne' :
                     'Sou entènèt')
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullScreen}
              className="h-8 w-8 p-0"
            >
              {isFullScreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={closeChat}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Interface */}
        <AIChatInterface
          messages={messages}
          isLoading={isLoading}
          isTyping={isTyping}
          error={error}
          quickSuggestions={quickSuggestions}
          onSendMessage={sendMessage}
          onClearMessages={clearMessages}
          onNewSession={startNewSession}
          userRole={userRole}
          language={preferences?.preferred_language || 'ht'}
          isFullScreen={isFullScreen}
        />
      </div>
    </>
  );
};