import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Settings, 
  Users, 
  MessageCircle, 
  TrendingUp, 
  Eye, 
  Edit, 
  Plus,
  Trash2,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { supabase } from '../../lib/supabase';
import type { AIConversation, AIBehaviorTemplate, AISettings as AISettingsType } from '../../types';

interface SuperAdminAIProps {
  className?: string;
}

export const SuperAdminAI: React.FC<SuperAdminAIProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'conversations' | 'templates' | 'settings'>('overview');
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [templates, setTemplates] = useState<AIBehaviorTemplate[]>([]);
  const [aiSettings, setAISettings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AIBehaviorTemplate | null>(null);

  // Statistics
  const [stats, setStats] = useState({
    totalConversations: 0,
    activeUsers: 0,
    averageRating: 0,
    responseTime: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadConversations(),
        loadTemplates(),
        loadAISettings(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error('Error loading AI admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select(`
          *,
          user_profiles!inner(full_name, role)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_behavior_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadAISettings = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      const settingsObj: Record<string, any> = {};
      data?.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });
      
      setAISettings(settingsObj);
    } catch (error) {
      console.error('Error loading AI settings:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      // Calculate basic statistics
      const { data: conversationData } = await supabase
        .from('ai_conversations')
        .select('user_id, is_helpful, created_at');

      if (conversationData) {
        const uniqueUsers = new Set(conversationData.map(c => c.user_id)).size;
        const helpfulRatings = conversationData.filter(c => c.is_helpful !== null);
        const positiveRatings = helpfulRatings.filter(c => c.is_helpful === true).length;
        const averageRating = helpfulRatings.length > 0 ? (positiveRatings / helpfulRatings.length) * 100 : 0;

        setStats({
          totalConversations: conversationData.length,
          activeUsers: uniqueUsers,
          averageRating: Math.round(averageRating),
          responseTime: 1.2 // Mock response time in seconds
        });
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleSaveTemplate = async (template: Partial<AIBehaviorTemplate>) => {
    try {
      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('ai_behavior_templates')
          .update(template)
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from('ai_behavior_templates')
          .insert(template);

        if (error) throw error;
      }

      await loadTemplates();
      setShowTemplateModal(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('ai_behavior_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleUpdateSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('ai_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      await loadAISettings();
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const exportConversations = () => {
    const csvContent = [
      ['Date', 'User', 'Role', 'Message', 'Response', 'Helpful'],
      ...conversations.map(conv => [
        new Date(conv.created_at).toLocaleDateString(),
        conv.user_profiles?.full_name || 'Unknown',
        conv.user_profiles?.role || 'Unknown',
        conv.message.replace(/,/g, ';'),
        (conv.response || '').replace(/,/g, ';'),
        conv.is_helpful?.toString() || 'Not rated'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_conversations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchTerm || 
      conv.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.response || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || conv.user_profiles?.role === selectedRole;
    const matchesLanguage = selectedLanguage === 'all' || conv.language === selectedLanguage;
    
    return matchesSearch && matchesRole && matchesLanguage;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Bot className="h-8 w-8 mr-3 text-blue-600" />
            AI Assistant Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage the AI assistant system
          </p>
        </div>
        
        <Button onClick={() => loadData()} disabled={isLoading}>
          Refresh Data
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: TrendingUp },
            { key: 'conversations', label: 'Conversations', icon: MessageCircle },
            { key: 'templates', label: 'Templates', icon: Edit },
            { key: 'settings', label: 'Settings', icon: Settings }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Conversations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalConversations}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeUsers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Satisfaction Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageRating}%</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <Bot className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.responseTime}s</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Conversations Tab */}
      {activeTab === 'conversations' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Select
                value={selectedRole}
                onValueChange={setSelectedRole}
                className="w-40"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="sme">SMEs</option>
                <option value="admin">Admins</option>
              </Select>
              
              <Select
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                className="w-40"
              >
                <option value="all">All Languages</option>
                <option value="ht">Kreyòl</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </Select>
              
              <Button onClick={exportConversations} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </Card>

          {/* Conversations List */}
          <div className="space-y-4">
            {filteredConversations.map((conversation) => (
              <Card key={conversation.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {conversation.user_profiles?.full_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {conversation.user_profiles?.full_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {conversation.user_profiles?.role} • {conversation.language} • {new Date(conversation.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {conversation.is_helpful !== null && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        conversation.is_helpful 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {conversation.is_helpful ? 'Helpful' : 'Not Helpful'}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User:</p>
                      <p className="text-sm text-gray-900 dark:text-white">{conversation.message}</p>
                    </div>
                    
                    {conversation.response && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">AI:</p>
                        <p className="text-sm text-gray-900 dark:text-white">{conversation.response}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              AI Behavior Templates
            </h2>
            <Button onClick={() => setShowTemplateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>

          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Role: <span className="font-medium">{template.user_role}</span> • 
                      Language: <span className="font-medium">{template.language}</span>
                    </p>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Keywords: {template.trigger_keywords.join(', ')}
                    </p>
                    
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {template.template_response}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(template);
                        setShowTemplateModal(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            AI System Settings
          </h2>

          <div className="grid gap-6">
            {Object.entries(aiSettings).map(([key, value]) => (
              <Card key={key} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{key.replace(/_/g, ' ').toUpperCase()}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current value: {String(value)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newValue = prompt(`Enter new value for ${key}:`, String(value));
                      if (newValue !== null) {
                        handleUpdateSetting(key, newValue);
                      }
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Template Modal */}
      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSave={handleSaveTemplate}
      />
    </div>
  );
};

// Template Modal Component
interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: AIBehaviorTemplate | null;
  onSave: (template: Partial<AIBehaviorTemplate>) => Promise<void>;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, template, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    user_role: 'student' as any,
    trigger_keywords: [] as string[],
    template_response: '',
    is_active: true,
    language: 'ht' as 'ht' | 'en' | 'fr'
  });
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        user_role: template.user_role,
        trigger_keywords: template.trigger_keywords,
        template_response: template.template_response,
        is_active: template.is_active,
        language: template.language
      });
    } else {
      setFormData({
        name: '',
        user_role: 'student',
        trigger_keywords: [],
        template_response: '',
        is_active: true,
        language: 'ht'
      });
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.trigger_keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        trigger_keywords: [...prev.trigger_keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      trigger_keywords: prev.trigger_keywords.filter(k => k !== keyword)
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={template ? 'Edit Template' : 'Add Template'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Template Name
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            User Role
          </label>
          <Select
            value={formData.user_role}
            onValueChange={(value) => setFormData(prev => ({ ...prev, user_role: value as any }))}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="sme">SME</option>
            <option value="admin">Admin</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <Select
            value={formData.language}
            onValueChange={(value) => setFormData(prev => ({ ...prev, language: value as any }))}
          >
            <option value="ht">Kreyòl Ayisyen</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Trigger Keywords
          </label>
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Add keyword..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              />
              <Button type="button" onClick={addKeyword}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.trigger_keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                           bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Template Response
          </label>
          <textarea
            value={formData.template_response}
            onChange={(e) => setFormData(prev => ({ ...prev, template_response: e.target.value }))}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 
                     dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 dark:text-white">
            Active
          </label>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {template ? 'Update' : 'Create'} Template
          </Button>
        </div>
      </form>
    </Modal>
  );
};