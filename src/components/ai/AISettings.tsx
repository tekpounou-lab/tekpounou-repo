import React, { useState, useEffect } from 'react';
import { Save, MessageCircle, Volume2, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { useAI } from '../../hooks/useAI';
import { useAuthStore } from '../../stores/authStore';
import { ToastProvider } from '../ui/ToastProvider';

interface AISettingsProps {
  className?: string;
}

export const AISettings: React.FC<AISettingsProps> = ({ className = '' }) => {
  const { profile } = useAuthStore();
  const userRole = profile?.roles?.[0] || 'guest';
  const { preferences, updatePreferences } = useAI(userRole);
  
  const [localPreferences, setLocalPreferences] = useState({
    ai_enabled: true,
    preferred_language: 'ht' as 'ht' | 'en' | 'fr',
    voice_enabled: false,
    quick_suggestions_enabled: true,
    conversation_history_enabled: true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Load preferences when component mounts
  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        ai_enabled: preferences.ai_enabled,
        preferred_language: preferences.preferred_language,
        voice_enabled: preferences.voice_enabled,
        quick_suggestions_enabled: preferences.quick_suggestions_enabled,
        conversation_history_enabled: preferences.conversation_history_enabled
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updatePreferences(localPreferences);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error saving AI preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'ht': return 'Kreyòl Ayisyen';
      case 'en': return 'English';
      case 'fr': return 'Français';
      default: return lang;
    }
  };

  const getText = (key: string) => {
    const texts = {
      title: {
        ht: 'Konfigirasyon Asistan AI',
        en: 'AI Assistant Settings',
        fr: 'Paramètres Assistant IA'
      },
      description: {
        ht: 'Personaliser ki jan asistan AI an ap travay pou ou.',
        en: 'Customize how the AI assistant works for you.',
        fr: 'Personnalisez le fonctionnement de l\'assistant IA pour vous.'
      },
      enable_ai: {
        ht: 'Aktive Asistan AI',
        en: 'Enable AI Assistant',
        fr: 'Activer l\'Assistant IA'
      },
      enable_ai_desc: {
        ht: 'Ouvri oswa fèmen asistan AI an.',
        en: 'Turn the AI assistant on or off.',
        fr: 'Activer ou désactiver l\'assistant IA.'
      },
      language: {
        ht: 'Lang Yo Prefere',
        en: 'Preferred Language',
        fr: 'Langue Préférée'
      },
      language_desc: {
        ht: 'Ki lang ou vle asistan AI an reponn nan.',
        en: 'Which language you want the AI assistant to respond in.',
        fr: 'Dans quelle langue vous voulez que l\'assistant IA réponde.'
      },
      voice: {
        ht: 'Komando Vwa (K ap vini)',
        en: 'Voice Commands (Coming Soon)',
        fr: 'Commandes Vocales (Bientôt)'
      },
      voice_desc: {
        ht: 'Aktive komando vwa pou kominike ak asistan AI an.',
        en: 'Enable voice commands to communicate with the AI assistant.',
        fr: 'Activez les commandes vocales pour communiquer avec l\'assistant IA.'
      },
      quick_suggestions: {
        ht: 'Sijesyon Rapid',
        en: 'Quick Suggestions',
        fr: 'Suggestions Rapides'
      },
      quick_suggestions_desc: {
        ht: 'Montre sijesyon rapid yo ki baze sou wòl ou an.',
        en: 'Show quick suggestions based on your role.',
        fr: 'Afficher des suggestions rapides basées sur votre rôle.'
      },
      conversation_history: {
        ht: 'Istorik Konvèsasyon',
        en: 'Conversation History',
        fr: 'Historique des Conversations'
      },
      conversation_history_desc: {
        ht: 'Kenbe yon dosye sou konvèsasyon yo ou te genyen ak asistan AI an.',
        en: 'Keep a record of your conversations with the AI assistant.',
        fr: 'Conserver un enregistrement de vos conversations avec l\'assistant IA.'
      },
      save: {
        ht: 'Konsève Chanjman Yo',
        en: 'Save Changes',
        fr: 'Enregistrer les Modifications'
      },
      saved: {
        ht: 'Konfigirasyon yo konsève!',
        en: 'Settings saved!',
        fr: 'Paramètres enregistrés!'
      }
    };

    return texts[key]?.[localPreferences.preferred_language] || texts[key]?.['ht'] || '';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toast Notification */}
      {showToast && (
        <ToastProvider>
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            {getText('saved')}
          </div>
        </ToastProvider>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <MessageCircle className="h-6 w-6 mr-2 text-blue-600" />
          {getText('title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {getText('description')}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Enable AI Assistant */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                {getText('enable_ai')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {getText('enable_ai_desc')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.ai_enabled}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  ai_enabled: e.target.checked
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                              peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full 
                              peer dark:bg-gray-700 peer-checked:after:translate-x-full 
                              peer-checked:after:border-white after:content-[''] after:absolute 
                              after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
                              after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                              dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </Card>

        {/* Language Preference */}
        <Card className="p-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {getText('language')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {getText('language_desc')}
            </p>
            <Select
              value={localPreferences.preferred_language}
              onValueChange={(value) => setLocalPreferences(prev => ({
                ...prev,
                preferred_language: value as 'ht' | 'en' | 'fr'
              }))}
              className="w-full"
            >
              <option value="ht">{getLanguageLabel('ht')}</option>
              <option value="en">{getLanguageLabel('en')}</option>
              <option value="fr">{getLanguageLabel('fr')}</option>
            </Select>
          </div>
        </Card>

        {/* Voice Commands */}
        <Card className="p-6 opacity-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Volume2 className="h-5 w-5 mr-2" />
                {getText('voice')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {getText('voice_desc')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-not-allowed">
              <input
                type="checkbox"
                checked={false}
                disabled
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 
                              after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                              after:bg-white after:border-gray-300 after:border after:rounded-full 
                              after:h-5 after:w-5 after:transition-all dark:border-gray-600"></div>
            </label>
          </div>
        </Card>

        {/* Quick Suggestions */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {getText('quick_suggestions')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {getText('quick_suggestions_desc')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.quick_suggestions_enabled}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  quick_suggestions_enabled: e.target.checked
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                              peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full 
                              peer dark:bg-gray-700 peer-checked:after:translate-x-full 
                              peer-checked:after:border-white after:content-[''] after:absolute 
                              after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
                              after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                              dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </Card>

        {/* Conversation History */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {getText('conversation_history')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {getText('conversation_history_desc')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.conversation_history_enabled}
                onChange={(e) => setLocalPreferences(prev => ({
                  ...prev,
                  conversation_history_enabled: e.target.checked
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                              peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full 
                              peer dark:bg-gray-700 peer-checked:after:translate-x-full 
                              peer-checked:after:border-white after:content-[''] after:absolute 
                              after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
                              after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                              dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{getText('save')}</span>
        </Button>
      </div>
    </div>
  );
};