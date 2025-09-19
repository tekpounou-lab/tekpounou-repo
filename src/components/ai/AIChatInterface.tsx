import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, RotateCcw, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { AIMessage, AIQuickSuggestion, UserRole } from '../../types';

interface AIChatInterfaceProps {
  messages: AIMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  quickSuggestions: AIQuickSuggestion[];
  onSendMessage: (message: string, language?: 'ht' | 'en' | 'fr') => Promise<void>;
  onClearMessages: () => void;
  onNewSession: () => void;
  userRole: UserRole;
  language: 'ht' | 'en' | 'fr';
  isFullScreen: boolean;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  messages,
  isLoading,
  isTyping,
  error,
  quickSuggestions,
  onSendMessage,
  onClearMessages,
  onNewSession,
  userRole,
  language,
  isFullScreen
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setShowQuickSuggestions(false);
    
    await onSendMessage(message, language);
  };

  const handleQuickSuggestion = async (suggestion: AIQuickSuggestion) => {
    setShowQuickSuggestions(false);
    await onSendMessage(suggestion.text, language);
  };

  const handleClearMessages = () => {
    onClearMessages();
    setShowQuickSuggestions(true);
  };

  const handleNewSession = () => {
    onNewSession();
    setShowQuickSuggestions(true);
  };

  const getWelcomeMessage = () => {
    const roleMessages = {
      student: {
        ht: 'Bonjou! Mwen se asistan AI ou an pou Tek Pou Nou. Mwen ka ede w ak kou yo, pwogre w yo, ak rekòmandasyon yo. Ki sa ou vle konnen?',
        en: 'Hello! I\'m your AI assistant for Tek Pou Nou. I can help you with courses, progress tracking, and recommendations. What would you like to know?',
        fr: 'Bonjour! Je suis votre assistant IA pour Tek Pou Nou. Je peux vous aider avec les cours, le suivi des progrès et les recommandations. Que voulez-vous savoir?'
      },
      teacher: {
        ht: 'Bonjou Pwofesè! Mwen ka ede w ak analitik yo, estrateji angajman ak jesyon kou yo. Ki sa ou bezwen konnen?',
        en: 'Hello Teacher! I can help you with analytics, engagement strategies, and course management. What do you need to know?',
        fr: 'Bonjour Professeur! Je peux vous aider avec les analyses, les stratégies d\'engagement et la gestion des cours. De quoi avez-vous besoin?'
      },
      sme: {
        ht: 'Bonjou! Mwen ka ede w ak sèvis yo, nouvo pwojè yo ak resous yo. Ki jan mwen ka asiste w jodi a?',
        en: 'Hello! I can help you with services, new projects, and resources. How can I assist you today?',
        fr: 'Bonjour! Je peux vous aider avec les services, nouveaux projets et ressources. Comment puis-je vous assister aujourd\'hui?'
      },
      admin: {
        ht: 'Bonjou Admin! Mwen ka ede w ak jesyon sistèm, rapò ak konfigirasyon yo. Ki sa ou bezwen?',
        en: 'Hello Admin! I can help you with system management, reports, and configurations. What do you need?',
        fr: 'Bonjour Admin! Je peux vous aider avec la gestion système, les rapports et les configurations. De quoi avez-vous besoin?'
      },
      super_admin: {
        ht: 'Bonjou Super Admin! Mwen ka ede w ak jesyon sistèm, rapò ak konfigirasyon yo. Ki sa ou bezwen?',
        en: 'Hello Super Admin! I can help you with system management, reports, and configurations. What do you need?',
        fr: 'Bonjour Super Admin! Je peux vous aider avec la gestion système, les rapports et les configurations. De quoi avez-vous besoin?'
      },
      guest: {
        ht: 'Bonjou! Byenvini nan Tek Pou Nou. Mwen ka ede w aprann plis sou platfòm nou an ak sèvis yo. Ki sa ou vle konnen?',
        en: 'Hello! Welcome to Tek Pou Nou. I can help you learn more about our platform and services. What would you like to know?',
        fr: 'Bonjour! Bienvenue à Tek Pou Nou. Je peux vous aider à en savoir plus sur notre plateforme et nos services. Que voulez-vous savoir?'
      }
    };

    return roleMessages[userRole]?.[language] || roleMessages.guest[language];
  };

  return (
    <div className={`flex flex-col ${isFullScreen ? 'h-full' : 'h-96'}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome message for empty state */}
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full 
                            bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 mb-4">
              <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              {getWelcomeMessage()}
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
              
              {/* Feedback buttons for AI messages */}
              {message.role === 'assistant' && (
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                    onClick={() => {/* Handle helpful feedback */}}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                    onClick={() => {/* Handle unhelpful feedback */}}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                          rounded-lg p-3 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Quick suggestions */}
        {showQuickSuggestions && messages.length === 0 && quickSuggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {language === 'en' ? 'Quick suggestions:' :
               language === 'fr' ? 'Suggestions rapides:' :
               'Sijesyon rapid yo:'}
            </p>
            <div className="grid grid-cols-1 gap-2">
              {quickSuggestions.slice(0, 4).map((suggestion) => (
                <Button
                  key={suggestion.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSuggestion(suggestion)}
                  className="justify-start text-left h-auto py-2 px-3"
                >
                  <span className="mr-2">{suggestion.icon}</span>
                  <span className="text-sm">{suggestion.text}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Controls */}
      {messages.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewSession}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {language === 'en' ? 'New' :
                 language === 'fr' ? 'Nouveau' :
                 'Nouvo'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearMessages}
                className="text-xs text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {language === 'en' ? 'Clear' :
                 language === 'fr' ? 'Effacer' :
                 'Efase'}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {messages.length} {language === 'en' ? 'messages' :
                                language === 'fr' ? 'messages' :
                                'mesaj'}
            </p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              language === 'en' ? 'Type your message...' :
              language === 'fr' ? 'Tapez votre message...' :
              'Tape mesaj ou a...'
            }
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};