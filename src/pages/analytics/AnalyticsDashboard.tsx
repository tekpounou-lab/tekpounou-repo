import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { AnalyticsOverview } from '../../components/analytics/AnalyticsOverview';
import { AnalyticsCharts } from '../../components/analytics/AnalyticsCharts';
import { RecentActivity } from '../../components/analytics/RecentActivity';
import { AIInsights } from '../../components/analytics/AIInsights';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface DashboardData {
  overview: Record<string, any>;
  charts: Record<string, any>;
  recent_activity: any[];
}

export function AnalyticsDashboard() {
  const { user, profile } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'activity'>('overview');

  useEffect(() => {
    if (user && profile) {
      fetchDashboardData();
    }
  }, [user, profile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get current session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const response = await fetch(
        '/api/analytics-summary?scope=dashboard',
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const logAnalyticsEvent = async (eventType: string, metadata: any = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      await fetch('/api/analytics-events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: eventType,
          metadata
        })
      });
    } catch (error) {
      console.error('Failed to log analytics event:', error);
    }
  };

  useEffect(() => {
    // Log dashboard view
    if (user) {
      logAnalyticsEvent('analytics_dashboard_view', {
        tab: activeTab,
        role: profile?.role
      });
    }
  }, [activeTab, user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error Loading Dashboard</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getDashboardTitle = () => {
    switch (profile?.role) {
      case 'super_admin':
        return 'Platform Analytics';
      case 'admin':
        return 'Admin Analytics';
      case 'teacher':
        return 'Teaching Analytics';
      case 'sme_client':
        return 'Project Analytics';
      default:
        return 'Learning Analytics';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {getDashboardTitle()}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {profile?.role === 'super_admin' && 'Monitor platform performance and user engagement'}
            {profile?.role === 'admin' && 'Track content performance and manage platform activities'}
            {profile?.role === 'teacher' && 'Monitor your course performance and student engagement'}
            {profile?.role === 'sme_client' && 'Track your project progress and service utilization'}
            {(!profile?.role || profile?.role === 'student') && 'Track your learning progress and achievements'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {(['overview', 'insights', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              <AnalyticsOverview data={dashboardData?.overview} />
              <AnalyticsCharts data={dashboardData?.charts} userRole={profile?.role} />
            </>
          )}

          {activeTab === 'insights' && (
            <AIInsights userRole={profile?.role} />
          )}

          {activeTab === 'activity' && (
            <RecentActivity activities={dashboardData?.recent_activity} />
          )}
        </div>
      </div>
    </div>
  );
}