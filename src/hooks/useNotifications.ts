import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { 
  Notification, 
  UserNotificationSettings, 
  NotificationType,
  NotificationPriority 
} from '@/types';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  metadata?: Record<string, any>;
  priority?: NotificationPriority;
  sendEmail?: boolean;
  emailData?: {
    subject?: string;
    html?: string;
    text?: string;
  };
}

interface UseNotificationsReturn {
  // State
  notifications: Notification[];
  unreadCount: number;
  settings: UserNotificationSettings | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: (limit?: number) => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  
  // Settings
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<UserNotificationSettings>) => Promise<void>;
  
  // Admin functions
  createNotification: (params: CreateNotificationParams) => Promise<void>;
  sendBulkAnnouncement: (params: {
    title: string;
    body: string;
    linkUrl?: string;
    userFilter?: { role?: string; subscription_status?: string };
    sendEmail?: boolean;
  }) => Promise<void>;
  
  // Real-time
  subscribeToNotifications: () => (() => void) | undefined;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<UserNotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (limit = 50) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setNotifications(data || []);
      
      // Get unread count
      const { data: countData, error: countError } = await supabase
        .rpc('get_unread_notification_count', { target_user_id: user.id });
      
      if (countError) throw countError;
      setUnreadCount(countData || 0);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (!user || notificationIds.length === 0) return;
    
    try {
      const { error } = await supabase
        .rpc('mark_notifications_as_read', { notification_ids: notificationIds });
      
      if (error) throw error;
      
      setNotifications(prev =>
        prev.map(n =>
          notificationIds.includes(n.id) ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notifications as read');
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    await markAsRead(unreadIds);
  }, [user, notifications, markAsRead]);

  // Archive notification
  const archiveNotification = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_archived: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive notification');
    }
  }, [user]);

  // Delete notification (admin only)
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  }, [user]);

  // Fetch user notification settings
  const fetchSettings = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error is OK
        throw error;
      }

      setSettings(data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notification settings');
    }
  }, [user]);

  // Update notification settings
  const updateSettings = useCallback(async (newSettings: Partial<UserNotificationSettings>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          ...newSettings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification settings');
    }
  }, [user]);

  // Create notification (admin function)
  const createNotification = useCallback(async (params: CreateNotificationParams) => {
    try {
      const { data, error } = await supabase.functions.invoke('notifications', {
        body: { action: 'send_notification', ...params }
      });

      if (error) throw error;
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create notification');
      throw err;
    }
  }, []);

  // Send bulk announcement (admin function)
  const sendBulkAnnouncement = useCallback(async (params: {
    title: string;
    body: string;
    linkUrl?: string;
    userFilter?: { role?: string; subscription_status?: string };
    sendEmail?: boolean;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('notifications', {
        body: { action: 'send_bulk_announcement', ...params }
      });

      if (error) throw error;
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send bulk announcement');
      throw err;
    }
  }, []);

  // Subscribe to real-time notifications
  const subscribeToNotifications = useCallback(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Auto-fetch data when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchSettings();
    }
  }, [user, fetchNotifications, fetchSettings]);

  return {
    // State
    notifications,
    unreadCount,
    settings,
    loading,
    error,
    
    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    
    // Settings
    fetchSettings,
    updateSettings,
    
    // Admin functions
    createNotification,
    sendBulkAnnouncement,
    
    // Real-time
    subscribeToNotifications
  };
};