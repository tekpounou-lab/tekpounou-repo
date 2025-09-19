import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Send, 
  Users, 
  Mail, 
  Plus, 
  Filter,
  Search,
  Eye,
  Trash2,
  AlertCircle,
  Calendar,
  MessageSquare,
  Target,
  Globe
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/Button';
import { NotificationType, NotificationPriority } from '@/types';

export const SuperAdminNotifications: React.FC = () => {
  const { createNotification, sendBulkAnnouncement, loading } = useNotifications();
  
  // Announcement form state
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    body: '',
    linkUrl: '',
    priority: 'normal' as NotificationPriority,
    sendEmail: false,
    userFilter: {
      role: '',
      subscription_status: ''
    }
  });

  // Quick notification form state
  const [quickNotificationForm, setQuickNotificationForm] = useState({
    userId: '',
    type: 'system' as NotificationType,
    title: '',
    body: '',
    linkUrl: '',
    priority: 'normal' as NotificationPriority,
    sendEmail: false
  });

  const [activeTab, setActiveTab] = useState<'announcement' | 'quick' | 'templates'>('announcement');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage(null);

    try {
      await sendBulkAnnouncement({
        title: announcementForm.title,
        body: announcementForm.body,
        linkUrl: announcementForm.linkUrl || undefined,
        userFilter: {
          role: announcementForm.userFilter.role || undefined,
          subscription_status: announcementForm.userFilter.subscription_status || undefined
        },
        sendEmail: announcementForm.sendEmail
      });

      setMessage({ type: 'success', text: 'Announcement sent successfully!' });
      setAnnouncementForm({
        title: '',
        body: '',
        linkUrl: '',
        priority: 'normal',
        sendEmail: false,
        userFilter: { role: '', subscription_status: '' }
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to send announcement' 
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendQuickNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage(null);

    try {
      await createNotification({
        userId: quickNotificationForm.userId,
        type: quickNotificationForm.type,
        title: quickNotificationForm.title,
        body: quickNotificationForm.body,
        linkUrl: quickNotificationForm.linkUrl || undefined,
        priority: quickNotificationForm.priority,
        sendEmail: quickNotificationForm.sendEmail
      });

      setMessage({ type: 'success', text: 'Notification sent successfully!' });
      setQuickNotificationForm({
        userId: '',
        type: 'system',
        title: '',
        body: '',
        linkUrl: '',
        priority: 'normal',
        sendEmail: false
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to send notification' 
      });
    } finally {
      setSending(false);
    }
  };

  const predefinedTemplates = [
    {
      title: 'Welcome New Users',
      body: 'Welcome to Tech Pou Nou! Start your learning journey today.',
      type: 'system' as NotificationType,
      priority: 'normal' as NotificationPriority
    },
    {
      title: 'Maintenance Notice',
      body: 'Scheduled maintenance will begin at 2:00 AM EST. Expected downtime: 30 minutes.',
      type: 'system' as NotificationType,
      priority: 'high' as NotificationPriority
    },
    {
      title: 'New Feature Announcement',
      body: 'We\'ve added exciting new features to enhance your learning experience!',
      type: 'announcement' as NotificationType,
      priority: 'normal' as NotificationPriority
    },
    {
      title: 'Security Alert',
      body: 'Important security update: Please review your account settings.',
      type: 'system' as NotificationType,
      priority: 'urgent' as NotificationPriority
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Notification Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Send announcements and manage platform notifications
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'announcement', label: 'Global Announcement', icon: Globe },
              { id: 'quick', label: 'Quick Notification', icon: Send },
              { id: 'templates', label: 'Templates', icon: MessageSquare }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{message.text}</span>
        </motion.div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'announcement' && (
          <motion.div
            key="announcement"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Global Announcement
              </h2>
              
              <form onSubmit={handleSendAnnouncement} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter announcement title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={announcementForm.body}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, body: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter announcement message"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Link URL (optional)
                  </label>
                  <input
                    type="url"
                    value={announcementForm.linkUrl}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, linkUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Role
                    </label>
                    <select
                      value={announcementForm.userFilter.role}
                      onChange={(e) => setAnnouncementForm(prev => ({ 
                        ...prev, 
                        userFilter: { ...prev.userFilter, role: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">All Users</option>
                      <option value="student">Students</option>
                      <option value="teacher">Teachers</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subscription Status
                    </label>
                    <select
                      value={announcementForm.userFilter.subscription_status}
                      onChange={(e) => setAnnouncementForm(prev => ({ 
                        ...prev, 
                        userFilter: { ...prev.userFilter, subscription_status: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">All Users</option>
                      <option value="active">Active Subscribers</option>
                      <option value="inactive">Free Users</option>
                      <option value="trial">Trial Users</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={announcementForm.sendEmail}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, sendEmail: e.target.checked }))}
                      className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Also send via email
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAnnouncementForm({
                      title: '',
                      body: '',
                      linkUrl: '',
                      priority: 'normal',
                      sendEmail: false,
                      userFilter: { role: '', subscription_status: '' }
                    })}
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    disabled={sending || !announcementForm.title || !announcementForm.body}
                    className="flex items-center space-x-2"
                  >
                    <Send className={`w-4 h-4 ${sending ? 'animate-pulse' : ''}`} />
                    <span>{sending ? 'Sending...' : 'Send Announcement'}</span>
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === 'quick' && (
          <motion.div
            key="quick"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Send className="w-5 h-5 mr-2" />
                Quick Notification
              </h2>
              
              <form onSubmit={handleSendQuickNotification} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    User ID *
                  </label>
                  <input
                    type="text"
                    value={quickNotificationForm.userId}
                    onChange={(e) => setQuickNotificationForm(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter user UUID"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={quickNotificationForm.type}
                      onChange={(e) => setQuickNotificationForm(prev => ({ ...prev, type: e.target.value as NotificationType }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="system">System</option>
                      <option value="course">Course</option>
                      <option value="community">Community</option>
                      <option value="payment">Payment</option>
                      <option value="message">Message</option>
                      <option value="announcement">Announcement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={quickNotificationForm.priority}
                      onChange={(e) => setQuickNotificationForm(prev => ({ ...prev, priority: e.target.value as NotificationPriority }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={quickNotificationForm.title}
                    onChange={(e) => setQuickNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter notification title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={quickNotificationForm.body}
                    onChange={(e) => setQuickNotificationForm(prev => ({ ...prev, body: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter notification message"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Link URL (optional)
                  </label>
                  <input
                    type="url"
                    value={quickNotificationForm.linkUrl}
                    onChange={(e) => setQuickNotificationForm(prev => ({ ...prev, linkUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={quickNotificationForm.sendEmail}
                      onChange={(e) => setQuickNotificationForm(prev => ({ ...prev, sendEmail: e.target.checked }))}
                      className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Also send via email
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setQuickNotificationForm({
                      userId: '',
                      type: 'system',
                      title: '',
                      body: '',
                      linkUrl: '',
                      priority: 'normal',
                      sendEmail: false
                    })}
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    disabled={sending || !quickNotificationForm.userId || !quickNotificationForm.title || !quickNotificationForm.body}
                    className="flex items-center space-x-2"
                  >
                    <Send className={`w-4 h-4 ${sending ? 'animate-pulse' : ''}`} />
                    <span>{sending ? 'Sending...' : 'Send Notification'}</span>
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Quick Templates
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {predefinedTemplates.map((template, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-pink-300 dark:hover:border-pink-600 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {template.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded ${
                        template.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        template.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {template.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {template.body}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {template.type}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (activeTab === 'announcement') {
                            setAnnouncementForm(prev => ({
                              ...prev,
                              title: template.title,
                              body: template.body,
                              priority: template.priority
                            }));
                          } else {
                            setQuickNotificationForm(prev => ({
                              ...prev,
                              title: template.title,
                              body: template.body,
                              type: template.type,
                              priority: template.priority
                            }));
                          }
                          setActiveTab('announcement');
                        }}
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};