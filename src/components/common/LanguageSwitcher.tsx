import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { LanguageCode } from '@/types';
import { getLanguageDisplayName } from '@/utils';
import { useAuthStore } from '@/stores/authStore';

interface LanguageOption {
  code: LanguageCode;
  name: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: 'ht-HT', name: 'Kreyòl', flag: '🇭🇹' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
];

const LanguageSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile, updateProfile } = useAuthStore();
  
  const currentLanguage = profile?.preferred_language || 'ht-HT';
  const currentLangOption = languages.find(lang => lang.code === currentLanguage) || languages[0];

  const handleLanguageChange = async (languageCode: LanguageCode) => {
    await updateProfile({ preferred_language: languageCode });
    setIsOpen(false);
    
    // Update document language attribute
    document.documentElement.lang = languageCode.substring(0, 2);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Switch language"
      >
        <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentLangOption.flag} {currentLangOption.name}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                currentLanguage === language.code
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <span>{language.flag}</span>
              <span>{language.name}</span>
              {currentLanguage === language.code && (
                <span className="ml-auto text-primary-600 dark:text-primary-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;