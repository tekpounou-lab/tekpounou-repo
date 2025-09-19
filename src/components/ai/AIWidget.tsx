import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  BookOpen, 
  Calendar, 
  Users,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Target,
  BarChart3,
  RefreshCw,
  Settings,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Star
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { aiPersonalizationService } from '../../lib/aiPersonalizationService';
import { useAuthStore } from '../../stores/authStore';
import type { 
  AIPersonalization,
  AILearningPath,
  AIContentRecommendation,
  AITeacherInsights,
  AISMEGuidance,
  UserRole 
} from '../../types';

interface AIWidgetProps {
  userRole: UserRole;
  language: 'ht' | 'en' | 'fr';
  className?: string;
  isCompact?: boolean;
}

export const AIWidget: React.FC<AIWidgetProps> = ({
  userRole,
  language,
  className = '',
  isCompact = false
}) => {
  const [personalizations, setPersonalizations] = useState<AIPersonalization[]>([]);
  const [recommendations, setRecommendations] = useState<AIContentRecommendation[]>([]);
  const [learningPath, setLearningPath] = useState<AILearningPath | null>(null);
  const [teacherInsights, setTeacherInsights] = useState<AITeacherInsights | null>(null);
  const [smeGuidance, setSmeGuidance] = useState<AISMEGuidance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'recommendations' | 'insights' | 'analytics'>('recommendations');
  
  const { user } = useAuthStore();

  // Load AI data on component mount
  useEffect(() => {
    loadAIData();
  }, [userRole]);

  const loadAIData = async () => {
    setIsLoading(true);
    try {
      // Load personalizations
      const personalData = await aiPersonalizationService.getUserPersonalizations();
      setPersonalizations(personalData);

      // Load content recommendations
      const contentRecs = await aiPersonalizationService.getContentRecommendations('course', 5);
      setRecommendations(contentRecs);

      // Load role-specific data
      if (userRole === 'teacher') {
        const insights = await aiPersonalizationService.getTeacherInsights();
        setTeacherInsights(insights);
      } else if (userRole === 'sme') {
        const guidance = await aiPersonalizationService.getSMEGuidance();
        setSmeGuidance(guidance);
      } else if (userRole === 'student') {
        const path = await aiPersonalizationService.generateLearningPath();
        setLearningPath(path);
      }
    } catch (error) {
      console.error('Error loading AI data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = async () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      setIsListening(true);
      const transcript = await aiPersonalizationService.startVoiceSession(language);
      
      // Process voice command (simplified)
      if (transcript.toLowerCase().includes('recommendation') || 
          transcript.toLowerCase().includes('rekòmandasyon') ||
          transcript.toLowerCase().includes('recommandation')) {
        await loadAIData();
        await speakResponse(getTranslation('voice_recommendations_updated'));
      } else if (transcript.toLowerCase().includes('progress') ||
                 transcript.toLowerCase().includes('pwogre') ||
                 transcript.toLowerCase().includes('progrès')) {
        await speakResponse(getTranslation('voice_progress_info'));
      } else {
        await speakResponse(getTranslation('voice_not_understood'));
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
    } finally {
      setIsListening(false);
    }
  };

  const speakResponse = async (text: string) => {
    try {
      setIsSpeaking(true);
      await aiPersonalizationService.speakText(text, language);
    } catch (error) {
      console.error('Speech synthesis error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleFeedback = async (personalizationId: string, isHelpful: boolean) => {
    try {
      await aiPersonalizationService.submitFeedback(
        personalizationId,
        'content_recommendation',
        isHelpful ? 5 : 1,
        undefined,
        isHelpful ? 'helpful' : 'not_helpful'
      );
      
      // Refresh recommendations
      await loadAIData();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const getTranslation = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      ai_assistant: {
        ht: 'Asistan AI',
        en: 'AI Assistant',
        fr: 'Assistant IA'
      },
      recommendations: {
        ht: 'Rekòmandasyon yo',
        en: 'Recommendations',
        fr: 'Recommandations'
      },
      insights: {
        ht: 'Pwè ak konsèy',
        en: 'Insights',
        fr: 'Perspectives'
      },
      analytics: {
        ht: 'Analitik',
        en: 'Analytics',
        fr: 'Analytiques'
      },
      learning_path: {
        ht: 'Wout aprann',
        en: 'Learning Path',
        fr: 'Parcours d\'apprentissage'
      },
      voice_recommendations_updated: {
        ht: 'Rekòmandasyon yo mete ajou',
        en: 'Recommendations updated',
        fr: 'Recommandations mises à jour'
      },
      voice_progress_info: {
        ht: 'Gade pwogre w yo nan dashboard la',
        en: 'Check your progress in the dashboard',
        fr: 'Vérifiez vos progrès dans le tableau de bord'
      },
      voice_not_understood: {
        ht: 'Mwen pa konprann. Eseye ankò.',
        en: 'I didn\'t understand. Please try again.',
        fr: 'Je n\'ai pas compris. Veuillez réessayer.'
      },
      personalized_for_you: {
        ht: 'Pèsonalize pou ou',
        en: 'Personalized for you',
        fr: 'Personnalisé pour vous'
      },
      view_all: {
        ht: 'Gade tout',
        en: 'View All',
        fr: 'Voir tout'
      },
      no_recommendations: {
        ht: 'Pa gen rekòmandasyon yo kounye a',
        en: 'No recommendations available',
        fr: 'Aucune recommandation disponible'
      },
      loading: {
        ht: 'K ap chaje...',
        en: 'Loading...',
        fr: 'Chargement...'
      }
    };

    return translations[key]?.[language] || translations[key]?.['en'] || key;
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600 dark:text-gray-400">
            {getTranslation('loading')}
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${isCompact ? 'p-4' : 'p-6'} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {getTranslation('ai_assistant')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {getTranslation('personalized_for_you')}
            </p>
          </div>
        </div>
        
        {/* Voice Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVoiceToggle}
            className={`p-2 ${isListening ? 'bg-red-100 text-red-600' : ''}`}
            disabled={isSpeaking}
          >
            {isListening ? (
              <Mic className="w-4 h-4 animate-pulse" />
            ) : (
              <MicOff className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSpeaking(!isSpeaking)}
            className="p-2"
          >
            {isSpeaking ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={loadAIData}
            className="p-2"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      {!isCompact && (
        <div className="flex space-x-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {['recommendations', 'insights', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedTab === tab
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {getTranslation(tab)}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="space-y-4">
        {/* Recommendations Tab */}
        {(isCompact || selectedTab === 'recommendations') && (
          <div className="space-y-3">
            {/* Content Recommendations */}
            {recommendations.length > 0 ? (
              recommendations.slice(0, isCompact ? 3 : 5).map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {rec.content_title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {rec.recommendation_reason}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(rec.relevance_score * 100)}% {getTranslation('match')}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(rec.recommendation_id, true)}
                          className="h-6 w-6 p-0"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(rec.recommendation_id, false)}
                          className="h-6 w-6 p-0"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                {getTranslation('no_recommendations')}
              </div>
            )}

            {/* Learning Path for Students */}
            {userRole === 'student' && learningPath && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {getTranslation('learning_path')}
                  </h4>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {learningPath.name}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${learningPath.completion_percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {Math.round(learningPath.completion_percentage)}%
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {!isCompact && selectedTab === 'insights' && (
          <div className="space-y-3">
            {/* Teacher Insights */}
            {userRole === 'teacher' && teacherInsights && (
              <div className="space-y-3">
                {teacherInsights.student_performance?.map((course: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {course.course_title}
                      </h4>
                      <Badge variant="outline">
                        {course.total_students} {getTranslation('students')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Avg Progress:</span>
                        <span className="ml-1 font-medium">{Math.round(course.avg_progress)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Completion:</span>
                        <span className="ml-1 font-medium">{Math.round(course.completion_rate)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {teacherInsights.recommendations?.map((rec: any, index: number) => (
                  <div key={index} className="flex items-start space-x-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800">
                    <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white">{rec.title}</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rec.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SME Guidance */}
            {userRole === 'sme' && smeGuidance && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-800">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Business Opportunities
                  </h4>
                  {smeGuidance.business_opportunities?.slice(0, 3).map((opp: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{opp.service_category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {opp.demand_level} requests
                      </Badge>
                    </div>
                  ))}
                </div>
                
                {smeGuidance.recommendations?.map((rec: any, index: number) => (
                  <div key={index} className="flex items-start space-x-2 p-3 rounded-lg bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white">{rec.title}</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rec.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {!isCompact && selectedTab === 'analytics' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  AI Feature Usage
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Recommendations Used:</span>
                  <span className="ml-1 font-medium">24</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Voice Interactions:</span>
                  <span className="ml-1 font-medium">8</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-yellow-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              AI-powered
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {/* Navigate to full AI dashboard */}}
            className="text-xs"
          >
            {getTranslation('view_all')}
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AIWidget;