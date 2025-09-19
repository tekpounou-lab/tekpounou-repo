import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  Users,
  MessageSquare,
  Settings,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Zap,
  BarChart3,
  Filter,
  Download,
  Calendar,
  Activity,
  Mic,
  FileText,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Sliders
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { aiPersonalizationService } from '../../lib/aiPersonalizationService';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AIAdminDashboardProps {
  language: 'ht' | 'en' | 'fr';
}

export const AIAdminDashboard: React.FC<AIAdminDashboardProps> = ({ language }) => {
  const [usageAnalytics, setUsageAnalytics] = useState<any>(null);
  const [feedbackSummary, setFeedbackSummary] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');
  const [selectedFeature, setSelectedFeature] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterByRating, setFilterByRating] = useState('all');

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange, selectedFeature]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const analytics = await aiPersonalizationService.getUsageAnalytics(
        selectedFeature === 'all' ? undefined : selectedFeature,
        parseInt(selectedTimeRange)
      );
      setUsageAnalytics(analytics);

      const feedback = await aiPersonalizationService.getFeedbackSummary();
      setFeedbackSummary(feedback);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTranslation = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      ai_admin_dashboard: {
        ht: 'Dashboard Admin AI',
        en: 'AI Admin Dashboard',
        fr: 'Tableau de bord Admin IA'
      },
      usage_analytics: {
        ht: 'Analitik Itilizasyon',
        en: 'Usage Analytics',
        fr: 'Analyses d\'utilisation'
      },
      feedback_management: {
        ht: 'Jesyon Feedback',
        en: 'Feedback Management',
        fr: 'Gestion des commentaires'
      },
      ai_configuration: {
        ht: 'Konfigirasyon AI',
        en: 'AI Configuration',
        fr: 'Configuration IA'
      },
      total_interactions: {
        ht: 'Total Entelaksyon',
        en: 'Total Interactions',
        fr: 'Interactions totales'
      },
      unique_users: {
        ht: 'Itilizatè Inik',
        en: 'Unique Users',
        fr: 'Utilisateurs uniques'
      },
      average_rating: {
        ht: 'Nòt Mwayèn',
        en: 'Average Rating',
        fr: 'Note moyenne'
      },
      export_data: {
        ht: 'Ekspòte Done',
        en: 'Export Data',
        fr: 'Exporter les données'
      },
      refresh: {
        ht: 'Rafrechi',
        en: 'Refresh',
        fr: 'Actualiser'
      },
      last_updated: {
        ht: 'Dènye Mizajou',
        en: 'Last Updated',
        fr: 'Dernière mise à jour'
      }
    };

    return translations[key]?.[language] || translations[key]?.['en'] || key;
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;

    const headers = Object.keys(data[0]).join(',');
    const csvContent = [
      headers,
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const getUsageChartData = () => {
    if (!usageAnalytics?.daily_usage) return null;

    const sortedDays = Object.entries(usageAnalytics.daily_usage)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());

    return {
      labels: sortedDays.map(([date]) => new Date(date).toLocaleDateString()),
      datasets: [
        {
          label: getTranslation('interactions'),
          data: sortedDays.map(([, count]) => count),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
        },
      ],
    };
  };

  const getFeatureBreakdownData = () => {
    if (!usageAnalytics?.feature_breakdown) return null;

    return {
      labels: Object.keys(usageAnalytics.feature_breakdown),
      datasets: [
        {
          data: Object.values(usageAnalytics.feature_breakdown),
          backgroundColor: [
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444',
            '#8B5CF6',
            '#06B6D4',
          ],
        },
      ],
    };
  };

  const getRatingDistributionData = () => {
    if (!feedbackSummary?.module_ratings) return null;

    const modules = Object.keys(feedbackSummary.module_ratings);
    const averages = modules.map(module => feedbackSummary.module_ratings[module].average);

    return {
      labels: modules,
      datasets: [
        {
          label: getTranslation('average_rating'),
          data: averages,
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
        },
      ],
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          {getTranslation('loading')}...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getTranslation('ai_admin_dashboard')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor AI usage, feedback, and system performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Select
            value={selectedTimeRange}
            onValueChange={setSelectedTimeRange}
            className="w-32"
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </Select>
          
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            {getTranslation('refresh')}
          </Button>
          
          <Button 
            onClick={() => exportToCSV([], 'ai-analytics')}
            variant="outline" 
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {getTranslation('export_data')}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {getTranslation('total_interactions')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {usageAnalytics?.total_interactions?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">
              +12% from last period
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {getTranslation('unique_users')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {usageAnalytics?.unique_users || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">
              +8% from last period
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {getTranslation('average_rating')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {feedbackSummary?.average_rating?.toFixed(1) || '0.0'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <ThumbsUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className={`w-3 h-3 rounded-full ${
                    star <= (feedbackSummary?.average_rating || 0)
                      ? 'bg-yellow-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Feedback Count
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {feedbackSummary?.total_feedback || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            {Object.entries(feedbackSummary?.feedback_types || {}).map(([type, count]) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {count} {type}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            {getTranslation('usage_analytics')}
          </TabsTrigger>
          <TabsTrigger value="feedback">
            <MessageSquare className="w-4 h-4 mr-2" />
            {getTranslation('feedback_management')}
          </TabsTrigger>
          <TabsTrigger value="features">
            <Zap className="w-4 h-4 mr-2" />
            AI Features
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="w-4 h-4 mr-2" />
            {getTranslation('ai_configuration')}
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage Trends */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Daily Usage Trends
              </h3>
              {getUsageChartData() && (
                <Line 
                  data={getUsageChartData()!} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: { beginAtZero: true },
                    },
                  }}
                />
              )}
            </Card>

            {/* Feature Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Feature Usage Distribution
              </h3>
              {getFeatureBreakdownData() && (
                <Doughnut 
                  data={getFeatureBreakdownData()!}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'bottom' },
                    },
                  }}
                />
              )}
            </Card>

            {/* Module Ratings */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Module Ratings
              </h3>
              {getRatingDistributionData() && (
                <Bar 
                  data={getRatingDistributionData()!}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        max: 5,
                      },
                    },
                  }}
                />
              )}
            </Card>

            {/* Interaction Types */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Interaction Types
              </h3>
              <div className="space-y-3">
                {Object.entries(usageAnalytics?.interaction_breakdown || {}).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {type}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ 
                            width: `${(count as number / usageAnalytics.total_interactions) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[3rem] text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Feedback Management Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterByRating} onValueChange={setFilterByRating}>
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <option value="date">Sort by Date</option>
              <option value="rating">Sort by Rating</option>
              <option value="module">Sort by Module</option>
            </Select>
          </div>

          {/* Recent Feedback */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Feedback
            </h3>
            <div className="space-y-4">
              {feedbackSummary?.recent_comments?.map((feedback: any, index: number) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {feedback.rating}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {feedback.module}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {feedback.user_role}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {feedback.comment}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {feedback.rating >= 4 ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : feedback.rating <= 2 ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* AI Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            {[
              { name: 'Chat Assistant', icon: MessageSquare, usage: 1250, status: 'active' },
              { name: 'Learning Paths', icon: Target, usage: 890, status: 'active' },
              { name: 'Content Recommendations', icon: FileText, usage: 2100, status: 'active' },
              { name: 'Voice Assistant', icon: Mic, usage: 340, status: 'beta' },
              { name: 'Predictive Analytics', icon: TrendingUp, usage: 680, status: 'active' },
              { name: 'Summary Generation', icon: FileText, usage: 920, status: 'active' },
            ].map((feature, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {feature.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {feature.usage} interactions
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={feature.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {feature.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Performance</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {85 + Math.floor(Math.random() * 15)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${85 + Math.floor(Math.random() * 15)}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {getTranslation('ai_configuration')}
            </h3>
            
            <div className="space-y-6">
              {/* Global AI Settings */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Global Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      AI Response Max Length
                    </label>
                    <Input type="number" defaultValue="500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Context Window Size
                    </label>
                    <Input type="number" defaultValue="10" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rate Limit (per hour)
                    </label>
                    <Input type="number" defaultValue="50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Language
                    </label>
                    <Select defaultValue="ht">
                      <option value="ht">Kreyòl (Haitian Creole)</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Feature Toggles */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Feature Controls
                </h4>
                <div className="space-y-3">
                  {[
                    'Personalization Enabled',
                    'Voice Assistant Enabled',
                    'Predictive Analytics Enabled',
                    'Content Recommendations Enabled',
                    'Learning Path Generation Enabled',
                    'Summary Generation Enabled',
                    'Teacher Insights Enabled',
                    'SME Guidance Enabled'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {feature}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Sliders className="w-3 h-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Configuration */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getTranslation('last_updated')}: {new Date().toLocaleString()}
                </p>
                <div className="space-x-3">
                  <Button variant="outline">
                    Reset to Defaults
                  </Button>
                  <Button>
                    Save Configuration
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAdminDashboard;