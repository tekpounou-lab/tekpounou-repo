import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import {
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  SparklesIcon,
  ArrowPathIcon,
  TrendingUpIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface Insight {
  type: 'metric' | 'recommendation' | 'alert' | 'task' | 'success' | 'achievement' | 'ai_placeholder' | 'error';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  action?: string;
  context?: any;
}

interface AIInsightsData {
  type: string;
  generated_at: string;
  user_role: string;
  insights: Insight[];
}

interface AIInsightsProps {
  userRole?: string;
}

export function AIInsights({ userRole }: AIInsightsProps) {
  const { user, profile } = useAuthStore();
  const [insights, setInsights] = useState<AIInsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && userRole) {
      fetchInsights();
    }
  }, [user, userRole]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const response = await fetch('/api/ai-insights', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation':
        return LightBulbIcon;
      case 'alert':
        return ExclamationTriangleIcon;
      case 'success':
      case 'achievement':
        return CheckCircleIcon;
      case 'metric':
        return ChartBarIcon;
      case 'task':
        return InformationCircleIcon;
      case 'ai_placeholder':
        return SparklesIcon;
      default:
        return TrendingUpIcon;
    }
  };

  const getInsightColor = (type: string, priority: string) => {
    if (type === 'ai_placeholder') {
      return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
    }
    
    switch (priority) {
      case 'high':
        return type === 'alert' 
          ? 'text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'medium':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority as keyof typeof colors]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Insights & Recommendations
          </h3>
          <ArrowPathIcon className="w-5 h-5 animate-spin text-gray-400" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Insights & Recommendations
          </h3>
          <button
            onClick={fetchInsights}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Unable to load insights
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchInsights}
            className="mt-4 btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!insights || insights.insights.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Insights & Recommendations
          </h3>
          <button
            onClick={fetchInsights}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center py-12">
          <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No insights available
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Keep using the platform to generate personalized insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Insights & Recommendations
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generated {new Date(insights.generated_at).toLocaleDateString()} for {insights.user_role}
            </p>
          </div>
          <button
            onClick={fetchInsights}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
            title="Refresh insights"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {insights.insights.map((insight, index) => {
            const Icon = getInsightIcon(insight.type);
            const colorClasses = getInsightColor(insight.type, insight.priority);
            
            return (
              <div
                key={index}
                className={`border rounded-lg p-4 ${colorClasses}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">
                        {insight.title}
                      </h4>
                      {getPriorityBadge(insight.priority)}
                    </div>
                    
                    <p className="text-sm mb-3">
                      {insight.message}
                    </p>
                    
                    {insight.action && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          💡 {insight.action}
                        </p>
                        {insight.type !== 'ai_placeholder' && (
                          <button className="text-sm underline hover:no-underline">
                            Take action
                          </button>
                        )}
                      </div>
                    )}

                    {/* Special styling for AI placeholder insights */}
                    {insight.type === 'ai_placeholder' && (
                      <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center text-sm text-purple-700 dark:text-purple-300">
                          <SparklesIcon className="w-4 h-4 mr-2" />
                          <span className="font-medium">AI-Powered Feature Preview</span>
                        </div>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          This feature will use advanced AI to provide personalized insights, recommendations, and predictive analytics based on your platform usage patterns.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Feature Preview Section */}
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-start space-x-3">
            <SparklesIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                🚀 Coming Soon: Advanced AI Features
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>• <strong>Personalized Learning Paths:</strong> AI-recommended courses based on your progress and goals</p>
                <p>• <strong>Predictive Analytics:</strong> Forecast completion rates and identify at-risk students</p>
                <p>• <strong>Smart Content Recommendations:</strong> Discover relevant blog posts and services</p>
                <p>• <strong>Performance Optimization:</strong> AI insights to improve teaching and project outcomes</p>
                <p>• <strong>Automated Reports:</strong> Generate intelligent summaries and actionable insights</p>
              </div>
              <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Get notified when available
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}