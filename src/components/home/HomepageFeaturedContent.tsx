import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ArrowRightIcon, 
  CalendarIcon, 
  EyeIcon, 
  StarIcon,
  NewspaperIcon,
  FolderOpenIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface FeaturedContent {
  blog: {
    id: string;
    title: string;
    slug: string;
    cover_image?: string;
    published_at: string;
    views_count: number;
    author: { full_name: string };
  }[];
  news: {
    id: string;
    title: string;
    content: string;
    published_at: string;
    views_count: number;
  }[];
  resources: {
    id: string;
    title: string;
    type: string;
    description?: string;
    downloads_count: number;
  }[];
  partners: {
    id: string;
    name: string;
    logo_url?: string;
    description?: string;
  }[];
}

const HomepageFeaturedContent: React.FC = () => {
  const [content, setContent] = useState<FeaturedContent>({
    blog: [],
    news: [],
    resources: [],
    partners: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedContent();
  }, []);

  const fetchFeaturedContent = async () => {
    try {
      // Fetch featured blog posts
      const { data: blogData } = await supabase
        .from('blog_posts')
        .select(`
          id, title, slug, cover_image, published_at, views_count,
          author:profiles!author_id(full_name)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(3);

      // Fetch featured news
      const { data: newsData } = await supabase
        .from('news')
        .select('id, title, content, published_at, views_count')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(3);

      // Fetch featured resources
      const { data: resourcesData } = await supabase
        .from('resources')
        .select('id, title, type, description, downloads_count')
        .eq('is_featured', true)
        .order('added_at', { ascending: false })
        .limit(4);

      // Fetch active partners
      const { data: partnersData } = await supabase
        .from('partners')
        .select('id, name, logo_url, description')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(6);

      setContent({
        blog: blogData || [],
        news: newsData || [],
        resources: resourcesData || [],
        partners: partnersData || []
      });
    } catch (error) {
      console.error('Error fetching featured content:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ht-HT', {
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    const plainText = text.replace(/<[^>]*>/g, '');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6">
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Dekouvri Kontni ak Resous yo
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Rete nan kijan ak dènye atik, nouvèl, resous ak patnè yo ki ap travay ansanm ak nou
          </p>
        </div>

        <div className="space-y-16">
          {/* Featured Blog Posts */}
          {content.blog.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <NewspaperIcon className="h-6 w-6 text-blue-600" />
                  Atik Resan yo
                </h3>
                <Link
                  to="/blog"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Wè tout yo
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {content.blog.map(post => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    {post.cover_image && (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {formatDate(post.published_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <EyeIcon className="h-4 w-4" />
                          {post.views_count}
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Pa {post.author.full_name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Featured News */}
          {content.news.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <StarIcon className="h-6 w-6 text-yellow-600" />
                  Nouvèl Enpòtan yo
                </h3>
                <Link
                  to="/news"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Wè tout yo
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {content.news.map(newsItem => (
                  <div
                    key={newsItem.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {formatDate(newsItem.published_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <EyeIcon className="h-4 w-4" />
                        {newsItem.views_count}
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-3 line-clamp-2">
                      {newsItem.title}
                    </h4>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {truncateText(newsItem.content)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featured Resources */}
          {content.resources.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <FolderOpenIcon className="h-6 w-6 text-purple-600" />
                  Resous ki Rekòmande
                </h3>
                <Link
                  to="/resources"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Wè tout yo
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {content.resources.map(resource => (
                  <div
                    key={resource.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center"
                  >
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                        {resource.type.toUpperCase()}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {resource.title}
                    </h4>
                    {resource.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                    <div className="text-sm text-gray-500">
                      {resource.downloads_count} telechaje
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Partners Showcase */}
          {content.partners.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <UserGroupIcon className="h-6 w-6 text-orange-600" />
                  Patnè yo
                </h3>
                <Link
                  to="/partners"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Wè tout yo
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
                {content.partners.map(partner => (
                  <div
                    key={partner.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center"
                  >
                    <div className="mb-4">
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt={`${partner.name} logo`}
                          className="h-12 w-12 mx-auto object-contain"
                        />
                      ) : (
                        <div className="h-12 w-12 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {getInitials(partner.name)}
                          </span>
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                      {partner.name}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Rete nan Kominikasyon</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Enskri ou nan newsletter nou an pou resevwa dènye nouvèl yo, atik ak resous yo dirèkteman nan boukèt imel ou a.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Email ou..."
                className="flex-1 px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                Enskri
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomepageFeaturedContent;