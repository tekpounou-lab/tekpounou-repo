import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Calendar, Eye, Heart, Tag, ArrowLeft, Share2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image?: string;
  author_id: string;
  tags: string[];
  published_at: string;
  views_count: number;
  likes_count: number;
  author: {
    full_name: string;
    avatar_url?: string;
    bio?: string;
  };
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  cover_image?: string;
  published_at: string;
}

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  useEffect(() => {
    if (post && user) {
      checkIfLiked();
    }
  }, [post, user]);

  const fetchPost = async () => {
    try {
      setLoading(true);

      // Fetch the blog post
      const { data: postData, error: postError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles!author_id(full_name, avatar_url, bio)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (postError) throw postError;

      setPost(postData);
      setLikesCount(postData.likes_count);

      // Increment view count
      await supabase.rpc('increment_view_count', {
        table_name: 'blog_posts',
        record_id: postData.id
      });

      // Fetch related posts (same tags)
      if (postData.tags && postData.tags.length > 0) {
        const { data: relatedData } = await supabase
          .from('blog_posts')
          .select('id, title, slug, cover_image, published_at')
          .eq('status', 'published')
          .neq('id', postData.id)
          .overlaps('tags', postData.tags)
          .order('published_at', { ascending: false })
          .limit(3);

        setRelatedPosts(relatedData || []);
      }

    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    if (!user || !post) return;

    try {
      const { data, error } = await supabase
        .from('blog_post_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .single();

      setIsLiked(!!data);
    } catch (error) {
      // User hasn't liked the post
      setIsLiked(false);
    }
  };

  const toggleLike = async () => {
    if (!user || !post) return;

    try {
      if (isLiked) {
        // Unlike the post
        await supabase
          .from('blog_post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);

        setIsLiked(false);
        setLikesCount(prev => prev - 1);

        // Update the blog post likes count
        await supabase
          .from('blog_posts')
          .update({ likes_count: likesCount - 1 })
          .eq('id', post.id);

      } else {
        // Like the post
        await supabase
          .from('blog_post_likes')
          .insert({ user_id: user.id, post_id: post.id });

        setIsLiked(true);
        setLikesCount(prev => prev + 1);

        // Update the blog post likes count
        await supabase
          .from('blog_posts')
          .update({ likes_count: likesCount + 1 })
          .eq('id', post.id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const sharePost = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Lyen an kopi nan clipboard la!');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ht-HT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Atik la pa jwenn</h1>
            <Link 
              to="/blog" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Retounen nan blog la
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link 
          to="/blog"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retounen nan blog la
        </Link>

        {/* Post Header */}
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {post.cover_image && (
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          )}

          <div className="p-8">
            {/* Post Meta */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(post.published_at)}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.views_count} wè
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {post.title}
            </h1>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map(tag => (
                  <Link
                    key={tag}
                    to={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Author Info */}
            <div className="flex items-center justify-between border-b pb-6 mb-8">
              <div className="flex items-center gap-4">
                {post.author.avatar_url ? (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.full_name}
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600">
                      {post.author.full_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{post.author.full_name}</h3>
                  {post.author.bio && (
                    <p className="text-sm text-gray-600">{post.author.bio}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={sharePost}
                  className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  Pataje
                </button>

                {user && (
                  <button
                    onClick={toggleLike}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                      isLiked
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                    {likesCount}
                  </button>
                )}
              </div>
            </div>

            {/* Post Content */}
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Atik ki gen rapò</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedPosts.map(relatedPost => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {relatedPost.cover_image && (
                    <img
                      src={relatedPost.cover_image}
                      alt={relatedPost.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(relatedPost.published_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPostPage;