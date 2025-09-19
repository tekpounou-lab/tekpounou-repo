import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
  ChatBubbleLeftEllipsisIcon, 
  PlusIcon, 
  PinIcon,
  CheckCircleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';

interface Discussion {
  id: string;
  course_id: string;
  user_id: string;
  title: string;
  content: string;
  parent_id?: string;
  is_pinned: boolean;
  is_answered: boolean;
  created_at: string;
  updated_at: string;
  users: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
  replies?: Discussion[];
}

interface CourseDiscussionBoardProps {
  courseId: string;
  isTeacher?: boolean;
}

export function CourseDiscussionBoard({ courseId, isTeacher = false }: CourseDiscussionBoardProps) {
  const { t } = useTranslation();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '' });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'unanswered'>('all');

  useEffect(() => {
    fetchDiscussions();
    subscribeToDiscussions();
  }, [courseId]);

  const fetchDiscussions = async () => {
    try {
      const { data, error } = await supabase
        .from('course_discussions')
        .select(`
          *,
          users:user_id (
            id,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('course_id', courseId)
        .is('parent_id', null) // Only get top-level discussions
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch replies for each discussion
      const discussionsWithReplies = await Promise.all(
        data.map(async (discussion) => {
          const { data: replies, error: repliesError } = await supabase
            .from('course_discussions')
            .select(`
              *,
              users:user_id (
                id,
                full_name,
                avatar_url,
                role
              )
            `)
            .eq('parent_id', discussion.id)
            .order('created_at', { ascending: true });

          if (repliesError) throw repliesError;

          return {
            ...discussion,
            replies: replies || []
          };
        })
      );

      setDiscussions(discussionsWithReplies);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      toast.error(t('error.fetchDiscussions'));
    } finally {
      setLoading(false);
    }
  };

  const subscribeToDiscussions = () => {
    const subscription = supabase
      .channel('course_discussions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_discussions',
          filter: `course_id=eq.${courseId}`
        },
        () => {
          fetchDiscussions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const createDiscussion = async () => {
    if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) {
      toast.error(t('error.fillRequiredFields'));
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('course_discussions')
        .insert({
          course_id: courseId,
          user_id: user.id,
          title: newDiscussion.title.trim(),
          content: newDiscussion.content.trim()
        });

      if (error) throw error;

      setNewDiscussion({ title: '', content: '' });
      setShowNewDiscussion(false);
      toast.success(t('discussion.created'));
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast.error(t('error.createDiscussion'));
    }
  };

  const createReply = async (parentId: string) => {
    if (!replyContent.trim()) {
      toast.error(t('error.fillRequiredFields'));
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('course_discussions')
        .insert({
          course_id: courseId,
          user_id: user.id,
          title: 'Reply',
          content: replyContent.trim(),
          parent_id: parentId
        });

      if (error) throw error;

      setReplyContent('');
      setReplyingTo(null);
      toast.success(t('discussion.replyCreated'));
    } catch (error) {
      console.error('Error creating reply:', error);
      toast.error(t('error.createReply'));
    }
  };

  const togglePin = async (discussionId: string, isPinned: boolean) => {
    if (!isTeacher) return;

    try {
      const { error } = await supabase
        .from('course_discussions')
        .update({ is_pinned: !isPinned })
        .eq('id', discussionId);

      if (error) throw error;

      toast.success(isPinned ? t('discussion.unpinned') : t('discussion.pinned'));
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error(t('error.updateDiscussion'));
    }
  };

  const markAsAnswered = async (discussionId: string, isAnswered: boolean) => {
    if (!isTeacher) return;

    try {
      const { error } = await supabase
        .from('course_discussions')
        .update({ is_answered: !isAnswered })
        .eq('id', discussionId);

      if (error) throw error;

      toast.success(isAnswered ? t('discussion.unmarkedAnswered') : t('discussion.markedAnswered'));
    } catch (error) {
      console.error('Error marking as answered:', error);
      toast.error(t('error.updateDiscussion'));
    }
  };

  const filteredDiscussions = discussions.filter(discussion => {
    const matchesSearch = discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         discussion.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (filter) {
      case 'pinned':
        return matchesSearch && discussion.is_pinned;
      case 'unanswered':
        return matchesSearch && !discussion.is_answered;
      default:
        return matchesSearch;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {t('discussion.courseDiscussions')}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 mt-1">
            {t('discussion.shareIdeasAndQuestions')}
          </p>
        </div>
        <Button onClick={() => setShowNewDiscussion(true)} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          {t('discussion.newDiscussion')}
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder={t('discussion.searchDiscussions')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pinned', 'unanswered'] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterType)}
            >
              {t(`discussion.filter.${filterType}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Discussions List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredDiscussions.map((discussion) => (
            <motion.div
              key={discussion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-neutral-800 rounded-lg shadow border border-neutral-200 dark:border-neutral-700"
            >
              <Card className="p-0">
                <div className="p-6">
                  {/* Discussion Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {discussion.users.avatar_url ? (
                        <img 
                          src={discussion.users.avatar_url} 
                          alt={discussion.users.full_name}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <UserCircleIcon className="h-10 w-10 text-neutral-400" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-neutral-900 dark:text-white">
                            {discussion.title}
                          </h3>
                          {discussion.is_pinned && (
                            <PinIcon className="h-4 w-4 text-accent-500" />
                          )}
                          {discussion.is_answered && (
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-300">
                          <span>{discussion.users.full_name}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}</span>
                          {discussion.users.role === 'teacher' && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-accent-600 font-medium">{t('role.teacher')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {isTeacher && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePin(discussion.id, discussion.is_pinned)}
                          className="text-neutral-600 hover:text-accent-600"
                        >
                          <PinIcon className={`h-4 w-4 ${discussion.is_pinned ? 'text-accent-600' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsAnswered(discussion.id, discussion.is_answered)}
                          className="text-neutral-600 hover:text-green-600"
                        >
                          <CheckCircleIcon className={`h-4 w-4 ${discussion.is_answered ? 'text-green-600' : ''}`} />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Discussion Content */}
                  <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
                    <ReactMarkdown>{discussion.content}</ReactMarkdown>
                  </div>

                  {/* Replies */}
                  {discussion.replies && discussion.replies.length > 0 && (
                    <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-4">
                      <div className="space-y-4">
                        {discussion.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4">
                            {reply.users.avatar_url ? (
                              <img 
                                src={reply.users.avatar_url} 
                                alt={reply.users.full_name}
                                className="h-8 w-8 rounded-full"
                              />
                            ) : (
                              <UserCircleIcon className="h-8 w-8 text-neutral-400" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-neutral-900 dark:text-white">
                                  {reply.users.full_name}
                                </span>
                                <span className="text-sm text-neutral-600 dark:text-neutral-300">
                                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                </span>
                                {reply.users.role === 'teacher' && (
                                  <span className="text-xs bg-accent-100 text-accent-800 px-2 py-1 rounded-full">
                                    {t('role.teacher')}
                                  </span>
                                )}
                              </div>
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown>{reply.content}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reply Form */}
                  {replyingTo === discussion.id ? (
                    <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-4">
                      <div className="space-y-3">
                        <TextareaAutosize
                          placeholder={t('discussion.writeReply')}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg resize-none dark:bg-neutral-800 dark:text-white"
                          minRows={3}
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => createReply(discussion.id)} size="sm">
                            {t('discussion.postReply')}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setReplyingTo(null)}
                          >
                            {t('common.cancel')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(discussion.id)}
                        className="flex items-center gap-2 text-neutral-600 hover:text-accent-600"
                      >
                        <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                        {t('discussion.reply')} ({discussion.replies?.length || 0})
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredDiscussions.length === 0 && (
          <div className="text-center py-12">
            <ChatBubbleLeftEllipsisIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
              {searchTerm ? t('discussion.noSearchResults') : t('discussion.noDiscussions')}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-300">
              {searchTerm ? t('discussion.tryDifferentSearch') : t('discussion.startFirstDiscussion')}
            </p>
          </div>
        )}
      </div>

      {/* New Discussion Modal */}
      <Modal
        isOpen={showNewDiscussion}
        onClose={() => setShowNewDiscussion(false)}
        title={t('discussion.newDiscussion')}
      >
        <div className="space-y-4">
          <Input
            label={t('discussion.title')}
            placeholder={t('discussion.titlePlaceholder')}
            value={newDiscussion.title}
            onChange={(e) => setNewDiscussion(prev => ({ ...prev, title: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('discussion.content')}
            </label>
            <TextareaAutosize
              placeholder={t('discussion.contentPlaceholder')}
              value={newDiscussion.content}
              onChange={(e) => setNewDiscussion(prev => ({ ...prev, content: e.target.value }))}
              className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg resize-none dark:bg-neutral-800 dark:text-white"
              minRows={5}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowNewDiscussion(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={createDiscussion}>
              {t('discussion.create')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}