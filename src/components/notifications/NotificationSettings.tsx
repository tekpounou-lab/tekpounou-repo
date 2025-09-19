import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Clock, 
  Globe, 
  Save,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/Button';
import { UserNotificationSettings } from '@/types';

interface NotificationSettingsProps {
  onSave?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onSave }) => {
  const { settings, loading, fetchSettings, updateSettings } = useNotifications();
  const [formData, setFormData] = useState<Partial<UserNotificationSettings>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await updateSettings(formData);
      setMessage({ type: 'success', text: 'Notification settings saved successfully!' });
      onSave?.();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save settings' 
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof UserNotificationSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const timezones = [
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'America/Port-au-Prince', // Haiti
    'Europe/London',
    'Europe/Paris',
    'UTC'
  ];

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading notification settings...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notification Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Customize how and when you receive notifications
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* General Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              General Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Language
                </label>
                <select
                  value={formData.language_pref || 'en'}
                  onChange={(e) => updateField('language_pref', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="en">English</option>
                  <option value="ht">Haitian Creole</option>
                  <option value="fr">French</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Timezone
                </label>
                <select
                  value={formData.timezone || 'UTC'}
                  onChange={(e) => updateField('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Digest Frequency
                </label>
                <select
                  value={formData.digest_frequency || 'daily'}
                  onChange={(e) => updateField('digest_frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="immediate">Immediate</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="never">Never</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quiet Hours
                </label>
                <div className="flex space-x-2">
                  <input
                    type="time"
                    value={formData.quiet_hours_start || ''}
                    onChange={(e) => updateField('quiet_hours_start', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Start"
                  />
                  <span className="text-gray-500 self-center">to</span>
                  <input
                    type="time"
                    value={formData.quiet_hours_end || ''}
                    onChange={(e) => updateField('quiet_hours_end', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="End"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  No notifications will be sent during these hours
                </p>
              </div>
            </div>
          </div>

          {/* Email Notifications */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Email Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <label className="font-medium text-gray-900 dark:text-white">
                    Enable Email Notifications
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive notifications via email
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.email_enabled || false}
                    onChange={(e) => updateField('email_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                </label>
              </div>

              {formData.email_enabled && (
                <div className="ml-4 space-y-3">
                  {[
                    { key: 'email_course_updates', label: 'Course Updates', desc: 'New lessons, quiz results, certificates' },
                    { key: 'email_community_updates', label: 'Community Updates', desc: 'Event reminders, group activities, connections' },
                    { key: 'email_payment_updates', label: 'Payment Updates', desc: 'Subscription renewals, payment failures' },
                    { key: 'email_system_updates', label: 'System Updates', desc: 'Platform updates, maintenance notices' },
                    { key: 'email_marketing', label: 'Marketing Communications', desc: 'Newsletters, promotional content' }
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                          {label}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData[key as keyof UserNotificationSettings] as boolean || false}
                        onChange={(e) => updateField(key as keyof UserNotificationSettings, e.target.checked)}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* In-App Notifications */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              In-App Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <label className="font-medium text-gray-900 dark:text-white">
                    Enable In-App Notifications
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Show notifications in the app
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.inapp_enabled || false}
                    onChange={(e) => updateField('inapp_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                </label>
              </div>

              {formData.inapp_enabled && (
                <div className="ml-4 space-y-3">
                  {[
                    { key: 'inapp_course_updates', label: 'Course Updates' },
                    { key: 'inapp_community_updates', label: 'Community Updates' },
                    { key: 'inapp_payment_updates', label: 'Payment Updates' },
                    { key: 'inapp_system_updates', label: 'System Updates' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-900 dark:text-white">
                        {label}
                      </label>
                      <input
                        type="checkbox"
                        checked={formData[key as keyof UserNotificationSettings] as boolean || false}
                        onChange={(e) => updateField(key as keyof UserNotificationSettings, e.target.checked)}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Push Notifications (Future) */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              Push Notifications
              <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded">
                Coming Soon
              </span>
            </h3>
            <div className="space-y-4 opacity-50">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <label className="font-medium text-gray-900 dark:text-white">
                    Enable Push Notifications
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive notifications on your mobile device
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-not-allowed">
                  <input
                    type="checkbox"
                    disabled
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg flex items-center space-x-2 ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{message.text}</span>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={fetchSettings}
              disabled={loading || saving}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-pulse' : ''}`} />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};