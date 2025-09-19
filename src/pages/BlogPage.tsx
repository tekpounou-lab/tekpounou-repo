import React from 'react';
import { Calendar, User, Tag } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils';

const BlogPage: React.FC = () => {
  // Placeholder blog posts
  const posts = [
    {
      id: '1',
      title: 'Byenvini nan Tek Pou Nou',
      excerpt: 'Nou kontan anpil pou nou ka prezante nou nouvo platfòm edikasyon an ki rele Tek Pou Nou...',
      content: '',
      author: 'Super Administrator',
      published_at: '2025-01-15T10:00:00Z',
      featured_image_url: null,
      is_featured: true,
      tags: ['welcome', 'education', 'haiti', 'platform'],
      language: 'ht-HT',
    },
    {
      id: '2',
      title: 'The Importance of Education in Haiti',
      excerpt: 'Education plays a crucial role in Haiti\'s development and future prosperity...',
      content: '',
      author: 'Dr. Jean Baptiste',
      published_at: '2025-01-12T14:30:00Z',
      featured_image_url: null,
      is_featured: false,
      tags: ['education', 'development', 'haiti', 'future'],
      language: 'en-US',
    },
    {
      id: '3',
      title: 'Teknoloji ak Edikasyon nan Kominote a',
      excerpt: 'Kijan teknoloji ap chanje fason moun yo ap aprann nan kominote ayisyen an...',
      content: '',
      author: 'Prof. Marie Dubois',
      published_at: '2025-01-10T09:15:00Z',
      featured_image_url: null,
      is_featured: false,
      tags: ['technology', 'education', 'community', 'innovation'],
      language: 'ht-HT',
    },
  ];

  const featuredPost = posts.find(post => post.is_featured);
  const regularPosts = posts.filter(post => !post.is_featured);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Blog
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Li dènye nouvèl yo ak atik yo ki konsènen edikasyon ak devlopman.
          Read the latest news and articles about education and development.
        </p>
      </div>

      {/* Featured Post */}
      {featuredPost && (
        <div className="mb-12">
          <Card className="overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3">
                <div className="h-48 md:h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">Featured</span>
                </div>
              </div>
              <div className="md:w-2/3">
                <CardBody className="h-full flex flex-col justify-between">
                  <div>
                    <div className="mb-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200 rounded">
                        Featured
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      {featuredPost.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {featuredPost.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {featuredPost.author}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(featuredPost.published_at)}
                      </div>
                    </div>
                    <Button size="sm">
                      Li plis / Read More
                    </Button>
                  </div>
                </CardBody>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Regular Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regularPosts.map((post) => (
          <Card key={post.id} className="flex flex-col">
            <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                Blog Post
              </span>
            </div>
            <CardBody className="flex-1 flex flex-col">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
              </div>
              
              <div className="space-y-3">
                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* Meta */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {post.author}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(post.published_at)}
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="w-full">
                  Li atik la / Read Article
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center mt-12">
        <Button variant="outline">
          Chaje plis atik / Load More Articles
        </Button>
      </div>
    </div>
  );
};

export default BlogPage;