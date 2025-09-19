import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Eye, ExternalLink, Star, Search, Filter } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  link_url?: string;
  published_at: string;
  is_featured: boolean;
  views_count: number;
  created_at: string;
}

const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [featuredNews, setFeaturedNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  useEffect(() => {
    fetchNews();
    fetchFeaturedNews();
  }, []);

  const fetchNews = async () => {
    try {
      let query = supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      if (showFeaturedOnly) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setFeaturedNews(data || []);
    } catch (error) {
      console.error('Error fetching featured news:', error);
    }
  };

  const handleNewsClick = async (newsItem: NewsItem) => {
    // Increment view count
    await supabase.rpc('increment_view_count', {
      table_name: 'news',
      record_id: newsItem.id
    });

    // Open external link if available
    if (newsItem.link_url) {
      window.open(newsItem.link_url, '_blank');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ht-HT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ht-HT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-6">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-4">
                    <div className="h-5 bg-gray-200 rounded mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Nouvèl ak Enfòmasyon</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Rete nan kijan ak dènye nouvèl ak enfòmasyon yo sou platfòm nan
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Chache nouvèl..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(e) => {
                  setShowFeaturedOnly(e.target.checked);
                  fetchNews();
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Sèlman nouvèl yo ki enpòtan</span>
            </label>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main News Feed */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tout Nouvèl yo</h2>
            
            {news.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pa gen nouvèl yo jwenn</h3>
                <p className="text-gray-600">Eseye chanje rechèch ou a oswa filtre yo.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {news.map(newsItem => (
                  <article
                    key={newsItem.id}
                    onClick={() => handleNewsClick(newsItem)}
                    className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer group ${
                      newsItem.is_featured ? 'border-l-4 border-yellow-400' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {formatDate(newsItem.published_at)}
                          <span>•</span>
                          {formatTime(newsItem.published_at)}
                        </div>
                        {newsItem.is_featured && (
                          <div className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-medium">
                            <Star className="h-3 w-3" />
                            Enpòtan
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {newsItem.views_count}
                        </div>
                        {newsItem.link_url && (
                          <ExternalLink className="h-4 w-4 group-hover:text-blue-600 transition-colors" />
                        )}
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {newsItem.title}
                    </h3>

                    <p className="text-gray-600 leading-relaxed">
                      {truncateContent(newsItem.content)}
                    </p>

                    {newsItem.link_url && (
                      <div className="mt-4 pt-4 border-t">
                        <span className="text-sm text-blue-600 font-medium group-hover:text-blue-800 transition-colors">
                          Li plis detay yo →
                        </span>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Featured News */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Nouvèl yo ki Enpòtan
              </h3>
              
              {featuredNews.length === 0 ? (
                <p className="text-gray-500 text-sm">Pa gen nouvèl ki make kòm enpòtan.</p>
              ) : (
                <div className="space-y-4">
                  {featuredNews.map(newsItem => (
                    <div
                      key={newsItem.id}
                      onClick={() => handleNewsClick(newsItem)}
                      className="cursor-pointer group"
                    >
                      <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                        {newsItem.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(newsItem.published_at)}</span>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {newsItem.views_count}
                        </div>
                      </div>
                      {newsItem !== featuredNews[featuredNews.length - 1] && (
                        <hr className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatistik</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total nouvèl:</span>
                  <span className="font-medium">{news.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ki enpòtan:</span>
                  <span className="font-medium">{featuredNews.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dènye a:</span>
                  <span className="font-medium text-sm">
                    {news.length > 0 ? formatDate(news[0].published_at) : 'Okenn'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsPage;