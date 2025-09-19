import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
  BellIcon,
  XMarkIcon,
  CheckIcon,
  EnvelopeIcon,
  ChatBubbleLeftEllipsisIcon,
  TrophyIcon,
  AcademicCapIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content?: string;
  data: any;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

interface NotificationSystemProps {
  className?: string;
}

export function NotificationSystem({ className = '' }: NotificationSystemProps) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    subscribeToNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const { data: { user } } = supabase.auth.getUser();
    
    user.then((userData) => {
      if (!userData.user) return;

      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userData.user.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show toast notification
            showToastNotification(newNotification);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    });
  };

  const showToastNotification = (notification: Notification) => {
    const icon = getNotificationIcon(notification.type);
    
    toast((t) => (
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <div className="font-medium text-neutral-900">
            {notification.title}
          </div>
          {notification.content && (
            <div className="text-sm text-neutral-600 mt-1">
              {notification.content}
            </div>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 text-neutral-400 hover:text-neutral-600"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    ), {
      duration: 5000,
      style: {
        maxWidth: '400px',
      },
    });
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      setUnreadCount(0);
      toast.success(t('notifications.allMarkedRead'));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error(t('error.markNotificationsRead'));
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success(t('notifications.deleted'));
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error(t('error.deleteNotification'));
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    
    switch (type) {
      case 'message':
        return <EnvelopeIcon className={`${iconClass} text-blue-500`} />;
      case 'discussion_reply':
        return <ChatBubbleLeftEllipsisIcon className={`${iconClass} text-green-500`} />;
      case 'badge_earned':
        return <TrophyIcon className={`${iconClass} text-yellow-500`} />;
      case 'certificate_issued':
        return <AcademicCapIcon className={`${iconClass} text-purple-500`} />;
      case 'course_announcement':
        return <SpeakerWaveIcon className={`${iconClass} text-orange-500`} />;
      case 'quiz_graded':
        return <AcademicCapIcon className={`${iconClass} text-indigo-500`} />;
      default:
        return <BellIcon className={`${iconClass} text-neutral-500`} />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Handle navigation based on notification type
    switch (notification.type) {
      case 'message':
        // Navigate to messages
        if (notification.data?.sender_id) {
          // Could dispatch a navigation event or use router
          console.log('Navigate to messages with sender:', notification.data.sender_id);
        }
        break;
      case 'discussion_reply':
        // Navigate to course discussion
        if (notification.data?.course_id) {
          console.log('Navigate to course discussion:', notification.data.course_id);
        }
        break;
      case 'certificate_issued':
        // Navigate to certificates
        console.log('Navigate to certificates');
        break;
      case 'badge_earned':
        // Navigate to profile/badges
        console.log('Navigate to badges');
        break;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-neutral-600 hover:text-accent-600 transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {t('notifications.title')}
                  </h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-accent-600 hover:text-accent-700"
                    >
                      {t('notifications.markAllRead')}
                    </Button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-600"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <BellIcon className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-neutral-600 dark:text-neutral-300">
                      {t('notifications.noNotifications')}
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-4 border-b border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors ${
                          !notification.is_read ? 'bg-accent-50 dark:bg-accent-900/20' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className={`text-sm font-medium ${
                                !notification.is_read 
                                  ? 'text-neutral-900 dark:text-white' 
                                  : 'text-neutral-700 dark:text-neutral-300'
                              }`}>
                                {notification.title}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="flex-shrink-0 text-neutral-400 hover:text-red-500 ml-2"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                            
                            {notification.content && (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
                                {notification.content}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              
                              {!notification.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="text-xs text-accent-600 hover:text-accent-700 flex items-center gap-1"
                                >
                                  <CheckIcon className="h-3 w-3" />
                                  {t('notifications.markRead')}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-center text-accent-600 hover:text-accent-700"
                    onClick={() => {
                      setIsOpen(false);
                      // Navigate to full notifications page
                      console.log('Navigate to all notifications');
                    }}
                  >
                    {t('notifications.viewAll')}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook for easy notification creation
export function useNotifications() {
  const createNotification = async (
    userId: string,
    type: string,
    title: string,
    content?: string,
    data?: any
  ) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          content,
          data: data || {}
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  return { createNotification };
}