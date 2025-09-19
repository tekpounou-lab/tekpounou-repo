import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Settings, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface Setting {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  description?: string;
}

interface SettingGroup {
  category: string;
  settings: Setting[];
  label: string;
  description: string;
}

const SuperAdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });

      if (error) throw error;

      setSettings(data || []);
      
      // Initialize form data
      const initialFormData: Record<string, any> = {};
      data?.forEach(setting => {
        initialFormData[setting.key] = parseSettingValue(setting.value, setting.type);
      });
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Erè nan chaje paramèt yo' });
    } finally {
      setLoading(false);
    }
  };

  const parseSettingValue = (value: string, type: string) => {
    switch (type) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return parseInt(value) || 0;
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return {};
        }
      default:
        return value;
    }
  };

  const formatSettingValue = (value: any, type: string): string => {
    switch (type) {
      case 'boolean':
        return value ? 'true' : 'false';
      case 'json':
        return JSON.stringify(value);
      default:
        return String(value);
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const updates = settings.map(setting => ({
        id: setting.id,
        value: formatSettingValue(formData[setting.key], setting.type)
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('settings')
          .update({ value: update.value })
          .eq('id', update.id);

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Paramèt yo sove ak siksè!' });
      
      // Refresh settings
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Erè nan sove paramèt yo' });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('Ou kwè ou vle remèt tout paramèt yo nan valè yo pa defo a?')) return;

    try {
      // Reset to default values
      const defaultSettings = {
        platform_name: 'Tek Pou Nou',
        commission_rate: '30',
        default_language: 'ht',
        allow_registration: 'true',
        blog_enabled: 'true',
        resources_enabled: 'true',
        partners_enabled: 'true',
        homepage_featured_count: '6',
        max_file_size_mb: '50',
        contact_email: 'admin@tekpounou.com'
      };

      for (const [key, value] of Object.entries(defaultSettings)) {
        const { error } = await supabase
          .from('settings')
          .update({ value })
          .eq('key', key);

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Paramèt yo remèt nan valè yo pa defo a!' });
      fetchSettings();
    } catch (error) {
      console.error('Error resetting settings:', error);
      setMessage({ type: 'error', text: 'Erè nan remèt paramèt yo' });
    }
  };

  const settingGroups: SettingGroup[] = [
    {
      category: 'general',
      label: 'Paramèt Jeneral',
      description: 'Konfigirasyon jeneral platfòm nan',
      settings: settings.filter(s => s.category === 'general')
    },
    {
      category: 'features',
      label: 'Fonksyonalite',
      description: 'Aktive oswa dezaktive fonksyonalite yo',
      settings: settings.filter(s => s.category === 'features')
    },
    {
      category: 'payments',
      label: 'Peman',
      description: 'Konfigirasyon sistèm peman an',
      settings: settings.filter(s => s.category === 'payments')
    },
    {
      category: 'localization',
      label: 'Lokalizasyon',
      description: 'Lang ak rejyon',
      settings: settings.filter(s => s.category === 'localization')
    },
    {
      category: 'uploads',
      label: 'Telechajman',
      description: 'Paramèt telechajman fichye yo',
      settings: settings.filter(s => s.category === 'uploads')
    }
  ].filter(group => group.settings.length > 0);

  const renderSettingInput = (setting: Setting) => {
    const value = formData[setting.key];

    switch (setting.type) {
      case 'boolean':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => updateFormData(setting.key, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Aktive</span>
          </label>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => updateFormData(setting.key, parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
          />
        );

      case 'json':
        return (
          <textarea
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateFormData(setting.key, parsed);
              } catch {
                // Invalid JSON, keep the raw value for now
              }
            }}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        );

      default:
        return (
          <input
            type={setting.key.includes('email') ? 'email' : 'text'}
            value={value || ''}
            onChange={(e) => updateFormData(setting.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={setting.description}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Paramèt Platfòm
          </h2>
          <p className="text-gray-600 mt-1">Konfigire platfòm nan selon bezwen ou yo</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Remèt nan Defo
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Sov...' : 'Sove Chanjman'}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Settings Groups */}
      <div className="space-y-6">
        {settingGroups.map(group => (
          <div key={group.category} className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">{group.label}</h3>
              <p className="text-sm text-gray-600 mt-1">{group.description}</p>
            </div>
            
            <div className="p-6 space-y-6">
              {group.settings.map(setting => (
                <div key={setting.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    {setting.description && (
                      <p className="text-xs text-gray-500">{setting.description}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    {renderSettingInput(setting)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Help Text */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Konsèy ak Èd</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Commission Rate:</strong> Pousantaj platfòm nan ap pran sou vant yo (0-100)</p>
          <p><strong>Homepage Featured Count:</strong> Kantite eleman yo ki ap parèt nan paj prensipal la</p>
          <p><strong>Max File Size:</strong> Gwosè maksimòm fichye yo ka telechaje (nan MB)</p>
          <p><strong>Features:</strong> Ou ka aktive oswa dezaktive fonksyonalite yo selon bezwen ou</p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettings;