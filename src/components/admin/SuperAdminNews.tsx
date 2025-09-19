import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Newspaper, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Calendar,
  Star,
  ExternalLink,
  Eye
} from 'lucide-react';

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

const SuperAdminNews: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    link_url: '',
    is_featured: false,
    published_at: ''
  });

  useEffect(() => {
    fetchNews();
  }, [searchTerm, featuredFilter]);

  const fetchNews = async () => {
    try {
      let query = supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      if (featuredFilter === 'featured') {
        query = query.eq('is_featured', true);
      } else if (featuredFilter === 'normal') {
        query = query.eq('is_featured', false);
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

  const startCreating = () => {
    setIsCreating(true);
    setEditingNews(null);
    setFormData({
      title: '',
      content: '',
      link_url: '',
      is_featured: false,
      published_at: new Date().toISOString().split('T')[0]
    });
  };

  const startEditing = (newsItem: NewsItem) => {
    setEditingNews(newsItem);
    setIsCreating(false);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      link_url: newsItem.link_url || '',
      is_featured: newsItem.is_featured,
      published_at: newsItem.published_at.split('T')[0]
    });
  };

  const cancelEditing = () => {
    setEditingNews(null);
    setIsCreating(false);
    setFormData({
      title: '',
      content: '',
      link_url: '',
      is_featured: false,
      published_at: ''
    });
  };

  const saveNews = async () => {
    try {
      const newsData = {
        ...formData,
        published_at: formData.published_at ? new Date(formData.published_at).toISOString() : new Date().toISOString()
      };

      if (editingNews) {
        const { error } = await supabase
          .from('news')
          .update(newsData)
          .eq('id', editingNews.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('news')
          .insert([newsData]);
        
        if (error) throw error;
      }

      fetchNews();
      cancelEditing();
    } catch (error) {
      console.error('Error saving news:', error);
      alert('Yon erè rive pandan nou tap sove nouvèl la');
    }
  };

  const deleteNews = async (id: string) => {
    if (!confirm('Ou kwè ou vle efase nouvèl sa a?')) return;

    try {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchNews();
    } catch (error) {
      console.error('Error deleting news:', error);
      alert('Yon erè rive pandan nou tap efase nouvèl la');
    }
  };

  const toggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('news')
        .update({ is_featured: !currentFeatured })
        .eq('id', id);

      if (error) throw error;
      fetchNews();
    } catch (error) {
      console.error('Error updating featured status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ht-HT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Jesyon Nouvèl</h2>
        <button
          onClick={startCreating}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nouvo Nouvèl
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Chache nouvèl..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tout Nouvèl</option>
            <option value="featured">Ki Enpòtan</option>
            <option value="normal">Nòmal</option>
          </select>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingNews) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {isCreating ? 'Kreye Nouvo Nouvèl' : 'Modifye Nouvèl'}
            </h3>
            <button
              onClick={cancelEditing}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tit
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Antre tit nouvèl la..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kontni
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Antre kontni nouvèl la..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lyen Ekstèn (opsyonèl)
              </label>
              <input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/article"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dat Piblikasyon
                </label>
                <input
                  type="date"
                  value={formData.published_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, published_at: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Make kòm enpòtan</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveNews}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                Sove
              </button>
              <button
                onClick={cancelEditing}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="h-4 w-4" />
                Anile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* News List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nouvèl
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estati
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wè
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksyon
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {news.map(newsItem => (
                <tr key={newsItem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">
                        {newsItem.title}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {truncateContent(newsItem.content)}
                      </div>
                      {newsItem.link_url && (
                        <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Gen lyen ekstèn
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(newsItem.published_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleFeatured(newsItem.id, newsItem.is_featured)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        newsItem.is_featured
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      <Star className={`h-3 w-3 ${newsItem.is_featured ? 'fill-current' : ''}`} />
                      {newsItem.is_featured ? 'Enpòtan' : 'Nòmal'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {newsItem.views_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {newsItem.link_url && (
                        <a
                          href={newsItem.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => startEditing(newsItem)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteNews(newsItem.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {news.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Pa gen nouvèl yo jwenn</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminNews;