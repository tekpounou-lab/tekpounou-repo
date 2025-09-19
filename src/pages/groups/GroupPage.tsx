import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  MessageSquare, 
  Heart, 
  Share2, 
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  ArrowLeft,
  Send,
  Image as ImageIcon,
  User,
  Crown,
  Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Group {
  id: string;
  name: string;
  description: string;
  cover_image: string;
  tags: string[];
  is_private: boolean;
  member_count: number;
  created_by: string;
  creator: {
    full_name: string;
    avatar_url: string;
  };
}

interface Member {
  user_id: string;
  full_name: string;
  avatar_url: string;
  role: string;
  joined_at: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  attachments: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  author: {
    full_name: string;
    avatar_url: string;
  };
  is_liked: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author: {
    full_name: string;
    avatar_url: string;
  };
}

const GroupPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [userMembership, setUserMembership] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'members'>('posts');
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [postingComment, setPostingComment] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) {
      fetchGroup();
      fetchMembers();
      fetchPosts();
      checkMembership();
    }
  }, [id, user]);

  const fetchGroup = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          creator:profiles!groups_created_by_fkey(full_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setGroup(data);
    } catch (error) {
      console.error('Error fetching group:', error);
      toast.error('Erreur lors du chargement du groupe');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members_view')
        .select('*')
        .eq('group_id', id)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('group_posts')
        .select(`
          *,
          author:profiles!group_posts_user_id_fkey(full_name, avatar_url)
        `)
        .eq('group_id', id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Check if user has liked each post
      if (user && data) {
        const postsWithLikes = await Promise.all(
          data.map(async (post) => {
            const { data: likeData } = await supabase
              .from('group_post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single();
            
            return {
              ...post,
              is_liked: !!likeData
            };
          })
        );
        setPosts(postsWithLikes);
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_post_comments')
        .select(`
          *,
          author:profiles!group_post_comments_user_id_fkey(full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(prev => ({ ...prev, [postId]: data || [] }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const checkMembership = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', id)
        .eq('user_id', user.id)
        .single();

      setUserMembership(data);
    } catch (error) {
      // User not a member
      setUserMembership(null);
    }
  };

  const joinGroup = async () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour rejoindre le groupe');
      return;
    }

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: id,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      toast.success('Vous avez rejoint le groupe !');
      setUserMembership({ role: 'member' });
      fetchMembers();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Vous êtes déjà membre de ce groupe');
      } else {
        toast.error('Erreur lors de l\'adhésion au groupe');
      }
    }
  };

  const createPost = async () => {
    if (!user || !userMembership || !newPost.content.trim()) return;

    try {
      const { error } = await supabase
        .from('group_posts')
        .insert({
          group_id: id,
          user_id: user.id,
          title: newPost.title || null,
          content: newPost.content
        });

      if (error) throw error;

      setNewPost({ title: '', content: '' });
      toast.success('Publication créée !');
      fetchPosts();
    } catch (error) {
      toast.error('Erreur lors de la création de la publication');
    }
  };

  const addComment = async (postId: string) => {
    if (!user || !userMembership || !newComment[postId]?.trim()) return;

    setPostingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const { error } = await supabase
        .from('group_post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment[postId]
        });

      if (error) throw error;

      setNewComment(prev => ({ ...prev, [postId]: '' }));
      fetchComments(postId);
      // Update post comments count
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, comments_count: post.comments_count + 1 }
          : post
      ));
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    } finally {
      setPostingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({ 
      ...prev, 
      [postId]: !prev[postId] 
    }));
    
    if (!showComments[postId] && !comments[postId]) {
      fetchComments(postId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMemberDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
            <Crown className="h-3 w-3" />
            Admin
          </span>
        );
      case 'moderator':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            <Star className="h-3 w-3" />
            Modérateur
          </span>
        );
      default:
        return (
          <span className="text-xs text-gray-500">Membre</span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Groupe non trouvé
            </h2>
            <Link 
              to="/groups"
              className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux groupes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied for private groups if user is not a member
  if (group.is_private && !userMembership) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            to="/groups"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux groupes
          </Link>

          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Groupe Privé
            </h2>
            <p className="text-gray-600 mb-6">
              Ce groupe est privé. Vous devez être invité pour y accéder.
            </p>
            {user && (
              <button
                onClick={joinGroup}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Demander à rejoindre
              </button>
            )}
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
          to="/groups"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux groupes
        </Link>

        {/* Group Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          {group.cover_image ? (
            <img
              src={group.cover_image}
              alt={group.name}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Users className="h-16 w-16 text-white" />
            </div>
          )}

          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {group.name}
                </h1>

                <p className="text-gray-600 mb-4">
                  {group.description}
                </p>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-5 w-5" />
                    {group.member_count} membre{group.member_count !== 1 ? 's' : ''}
                  </div>
                  {group.creator && (
                    <div className="flex items-center gap-2 text-gray-600">
                      {group.creator.avatar_url && (
                        <img
                          src={group.creator.avatar_url}
                          alt={group.creator.full_name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      )}
                      <span>Par {group.creator.full_name}</span>
                    </div>
                  )}
                </div>

                {group.tags && group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 lg:ml-6 mt-4 lg:mt-0">
                {!userMembership && user && (
                  <button
                    onClick={joinGroup}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Rejoindre le groupe
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Publications
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'members'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Membres ({group.member_count})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'posts' && (
              <div className="space-y-6">
                {/* Create Post Form */}
                {userMembership && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Titre de votre publication (optionnel)"
                        value={newPost.title}
                        onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <textarea
                        placeholder="Partagez vos idées avec le groupe..."
                        value={newPost.content}
                        onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <div className="flex justify-between items-center">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                          <ImageIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={createPost}
                          disabled={!newPost.content.trim()}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Send className="h-4 w-4" />
                          Publier
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Posts List */}
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {post.author.avatar_url ? (
                            <img
                              src={post.author.avatar_url}
                              alt={post.author.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">
                              {post.author.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(post.created_at)}
                            </div>
                          </div>
                        </div>
                        
                        {user && post.user_id === user.id && (
                          <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                        )}
                      </div>

                      {/* Post Content */}
                      {post.title && (
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {post.title}
                        </h3>
                      )}
                      <div className="text-gray-700 mb-4 whitespace-pre-wrap">
                        {post.content}
                      </div>

                      {/* Post Actions */}
                      <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                        <button 
                          className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <Heart className={`h-5 w-5 ${post.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
                          {post.likes_count}
                        </button>
                        
                        <button 
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors"
                        >
                          <MessageSquare className="h-5 w-5" />
                          {post.comments_count}
                        </button>

                        <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors">
                          <Share2 className="h-5 w-5" />
                          Partager
                        </button>
                      </div>

                      {/* Comments Section */}
                      {showComments[post.id] && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          {/* Add Comment */}
                          {userMembership && (
                            <div className="flex gap-3 mb-4">
                              {user?.user_metadata?.avatar_url ? (
                                <img
                                  src={user.user_metadata.avatar_url}
                                  alt="Your avatar"
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Ajouter un commentaire..."
                                  value={newComment[post.id] || ''}
                                  onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      addComment(post.id);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => addComment(post.id)}
                                  disabled={!newComment[post.id]?.trim() || postingComment[post.id]}
                                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                                >
                                  {postingComment[post.id] ? '...' : 'Poster'}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Comments List */}
                          <div className="space-y-3">
                            {comments[post.id]?.map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                {comment.author.avatar_url ? (
                                  <img
                                    src={comment.author.avatar_url}
                                    alt={comment.author.full_name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                                    <div className="font-medium text-sm text-gray-900">
                                      {comment.author.full_name}
                                    </div>
                                    <div className="text-gray-700 text-sm">
                                      {comment.content}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {formatDate(comment.created_at)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {posts.length === 0 && (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucune publication
                      </h3>
                      <p className="text-gray-600">
                        Soyez le premier à partager quelque chose dans ce groupe !
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <div key={member.user_id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {member.full_name}
                        </div>
                        {getRoleDisplay(member.role)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Membre depuis {formatMemberDate(member.joined_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupPage;