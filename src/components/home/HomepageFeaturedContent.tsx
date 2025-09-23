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

// ------------------ Types ------------------

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  cover_image?: string;
  published_at: string;
  views_count: number;
  author: { full_name: string };
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  published_at: string;
  views_count: number;
}

interface Resource {
  id: string;
  title: string;
  type: string;
  description?: string;
  downloads_count: number;
}

interface Partner {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
}

interface FeaturedContent {
  blog: BlogPost[];
  news: NewsItem[];
  resources: Resource[];
  partners: Partner[];
}

// ------------------ Component ------------------

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
      // Fetch blog posts
      const { data: blogData, error: blogError } = await supabase
        .from('blog_posts')
        .select(
          `id, title, slug, cover_image, published_at, views_count,
           profiles:author_id ( full_name )`
        )
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(3);

      if (blogError) throw blogError;

      const blogs: BlogPost[] = (blogData || []).map((post: any) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        cover_image: post.cover_image,
        published_at: post.published_at,
        views_count: post.views_count,
        author: { full_name: post.profiles?.full_name ?? 'Unknown' }
      }));

      // Fetch news
      const { data: newsData } = await supabase
        .from('news')
        .select('id, title, content, published_at, views_count')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(3);

      // Fetch resources
      const { data: resourcesData } = await supabase
        .from('resources')
        .select('id, title, type, description, downloads_count')
        .eq('is_featured', true)
        .order('added_at', { ascending: false })
        .limit(4);

      // Fetch partners
      const { data: partnersData } = await supabase
        .from('partners')
        .select('id, name, logo_url, description')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(6);

      setContent({
        blog: blogs,
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
        <div className="space-y-16">
          {/* Blog Section */}
          <section>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <NewspaperIcon className="h-6 w-6 text-blue-600 mr-2" />
                Dènye Atik yo
              </h2>
              <Link
                to="/blog"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                Tout Atik yo <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {content.blog.map(post => (
                <Link
                  to={`/blog/${post.slug}`}
                  key={post.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
                >
                  {post.cover_image && (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 line-clamp-2">
                      {post.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(post.published_at)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center">
                        <EyeIcon className="h-4 w-4 mr-1" /> {post.views_count}
                      </span>
                      <span className="text-sm text-gray-600">
                        {post.author.full_name}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* News Section */}
          <section>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <StarIcon className="h-6 w-6 text-yellow-500 mr-2" />
                Nouvèl enpòtan yo
              </h2>
              <Link
                to="/news"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                Tout Nouvèl yo <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {content.news.map(item => (
                <Link
                  to={`/news/${item.id}`}
                  key={item.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
                >
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {truncateText(item.content, 120)}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(item.published_at)}
                    </span>
                    <span className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" /> {item.views_count}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Resources Section */}
          <section>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <FolderOpenIcon className="h-6 w-6 text-green-600 mr-2" />
                Resous itil yo
              </h2>
              <Link
                to="/resources"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                Tout Resous yo <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {content.resources.map(resource => (
                <Link
                  to={`/resources/${resource.id}`}
                  key={resource.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
                >
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 line-clamp-2">
                    {resource.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {truncateText(resource.description || '', 80)}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="capitalize">{resource.type}</span>
                    <span className="flex items-center">
                      <ArrowRightIcon className="h-4 w-4 ml-1" /> {resource.downloads_count}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Partners Section */}
          <section>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <UserGroupIcon className="h-6 w-6 text-purple-600 mr-2" />
                Patnè nou yo
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              {content.partners.map(partner => (
                <div
                  key={partner.id}
                  className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center h-32 hover:shadow-lg transition"
                >
                  {partner.logo_url ? (
                    <img
                      src={partner.logo_url}
                      alt={partner.name}
                      className="max-h-16 object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-lg font-bold">
                      {getInitials(partner.name)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HomepageFeaturedContent;
