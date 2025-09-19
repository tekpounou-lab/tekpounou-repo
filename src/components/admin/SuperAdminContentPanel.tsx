import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  BarChart3, 
  FileText, 
  Newspaper, 
  FolderOpen, 
  Users, 
  Settings,
  TrendingUp,
  Eye,
  Download,
  Star,
  Calendar
} from 'lucide-react';

import SuperAdminBlog from './SuperAdminBlog';
import SuperAdminNews from './SuperAdminNews';
import SuperAdminResources from './SuperAdminResources';
import SuperAdminPartners from './SuperAdminPartners';
import SuperAdminSettings from './SuperAdminSettings';

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  totalNews: number;
  featuredNews: number;
  totalResources: number;
  totalDownloads: number;
  totalPartners: number;
  activePartners: number;
  totalViews: number;
}

interface RecentActivity {
  id: string;
  type: 'blog' | 'news' | 'resource' | 'partner';
  title: string;
  action: 'created' | 'updated' | 'published';
  date: string;
}

const SuperAdminContentPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    publishedPosts: 0,
    totalNews: 0,
    featuredNews: 0,
    totalResources: 0,
    totalDownloads: 0,
    totalPartners: 0,
    activePartners: 0,
    totalViews: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'blog', label: 'Blog', icon: FileText },
    { id: 'news', label: 'Nouvèl', icon: Newspaper },
    { id: 'resources', label: 'Resous', icon: FolderOpen },
    { id: 'partners', label: 'Patnè', icon: Users },
    { id: 'settings', label: 'Paramèt', icon: Settings }
  ];

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch blog stats
      const { data: blogStats } = await supabase
        .from('blog_posts')
        .select('status, views_count');

      // Fetch news stats
      const { data: newsStats } = await supabase
        .from('news')
        .select('is_featured, views_count');

      // Fetch resources stats
      const { data: resourcesStats } = await supabase
        .from('resources')
        .select('downloads_count');

      // Fetch partners stats
      const { data: partnersStats } = await supabase
        .from('partners')
        .select('is_active');

      // Calculate stats
      const totalPosts = blogStats?.length || 0;
      const publishedPosts = blogStats?.filter(p => p.status === 'published').length || 0;
      const totalNews = newsStats?.length || 0;
      const featuredNews = newsStats?.filter(n => n.is_featured).length || 0;
      const totalResources = resourcesStats?.length || 0;
      const totalDownloads = resourcesStats?.reduce((sum, r) => sum + (r.downloads_count || 0), 0) || 0;
      const totalPartners = partnersStats?.length || 0;
      const activePartners = partnersStats?.filter(p => p.is_active).length || 0;
      const totalViews = [
        ...(blogStats?.map(b => b.views_count || 0) || []),
        ...(newsStats?.map(n => n.views_count || 0) || [])
      ].reduce((sum, views) => sum + views, 0);

      setStats({
        totalPosts,
        publishedPosts,
        totalNews,
        featuredNews,
        totalResources,
        totalDownloads,
        totalPartners,
        activePartners,
        totalViews
      });

      // Fetch recent activity
      await fetchRecentActivity();

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Get recent blog posts
      const { data: recentPosts } = await supabase
        .from('blog_posts')
        .select('id, title, created_at, updated_at, status')
        .order('updated_at', { ascending: false })
        .limit(5);

      // Get recent news
      const { data: recentNews } = await supabase
        .from('news')
        .select('id, title, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);

      // Get recent resources
      const { data: recentResources } = await supabase
        .from('resources')
        .select('id, title, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);

      // Get recent partners
      const { data: recentPartners } = await supabase
        .from('partners')
        .select('id, name, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);

      // Combine and format activity
      const activity: RecentActivity[] = [
        ...(recentPosts?.map(post => ({
          id: post.id,
          type: 'blog' as const,
          title: post.title,
          action: (post.updated_at > post.created_at ? 'updated' : 'created') as const,
          date: post.updated_at
        })) || []),
        ...(recentNews?.map(news => ({
          id: news.id,
          type: 'news' as const,
          title: news.title,
          action: (news.updated_at > news.created_at ? 'updated' : 'created') as const,
          date: news.updated_at
        })) || []),
        ...(recentResources?.map(resource => ({
          id: resource.id,
          type: 'resource' as const,
          title: resource.title,
          action: (resource.updated_at > resource.created_at ? 'updated' : 'created') as const,
          date: resource.updated_at
        })) || []),
        ...(recentPartners?.map(partner => ({
          id: partner.id,
          type: 'partner' as const,
          title: partner.name,
          action: (partner.updated_at > partner.created_at ? 'updated' : 'created') as const,
          date: partner.updated_at
        })) || [])
      ];

      // Sort by date and take top 10
      activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activity.slice(0, 10));

    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ht-HT', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'blog': return <FileText className="h-4 w-4" />;
      case 'news': return <Newspaper className="h-4 w-4" />;
      case 'resource': return <FolderOpen className="h-4 w-4" />;
      case 'partner': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created': return 'kreye';
      case 'updated': return 'modifye';
      case 'published': return 'pibliye';
      default: return action;
    }
  };

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Atik</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
                <p className="text-sm text-green-600">{stats.publishedPosts} pibliye</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Nouvèl</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalNews}</p>
                <p className="text-sm text-yellow-600">{stats.featuredNews} enpòtan</p>
              </div>
              <Newspaper className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Resous</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalResources}</p>
                <p className="text-sm text-purple-600">{stats.totalDownloads} telechaje</p>
              </div>
              <FolderOpen className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patnè</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPartners}</p>
                <p className="text-sm text-orange-600">{stats.activePartners} aktif</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Wè</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
                <p className="text-sm text-blue-600">nan tout kontni an</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Telechajman</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDownloads.toLocaleString()}</p>
                <p className="text-sm text-green-600">total resous</p>
              </div>
              <Download className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Konvertisman</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalPosts > 0 ? Math.round((stats.publishedPosts / stats.totalPosts) * 100) : 0}%
                </p>
                <p className="text-sm text-purple-600">atik pibliye</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktivite</p>
                <p className="text-2xl font-bold text-gray-900">{recentActivity.length}</p>
                <p className="text-sm text-orange-600">aksyon resan</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Aktivite Resan</h3>
          </div>
          <div className="p-6">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Pa gen aktivite resan</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map(activity => (
                  <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 p-2 bg-white rounded-lg">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.type} {getActionLabel(activity.action)} • {formatDate(activity.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksyon Rapid</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setActiveTab('blog')}
              className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-6 w-6 text-blue-500" />
              <span className="text-sm font-medium">Nouvo Atik</span>
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Newspaper className="h-6 w-6 text-green-500" />
              <span className="text-sm font-medium">Nouvo Nouvèl</span>
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FolderOpen className="h-6 w-6 text-purple-500" />
              <span className="text-sm font-medium">Nouvo Resous</span>
            </button>
            <button
              onClick={() => setActiveTab('partners')}
              className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-6 w-6 text-orange-500" />
              <span className="text-sm font-medium">Nouvo Patnè</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'blog':
        return <SuperAdminBlog />;
      case 'news':
        return <SuperAdminNews />;
      case 'resources':
        return <SuperAdminResources />;
      case 'partners':
        return <SuperAdminPartners />;
      case 'settings':
        return <SuperAdminSettings />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panèl Jesyon Kontni</h1>
              <p className="text-gray-600">Jesyon blog, nouvèl, resous ak patnè yo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default SuperAdminContentPanel;