import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import htTranslations from './locales/ht.json';  // Haitian Creole
import enTranslations from './locales/en.json';  // English  
import frTranslations from './locales/fr.json';  // French

const resources = {
  ht: { translation: htTranslations }, // Default: Haitian Creole
  en: { translation: enTranslations },
  fr: { translation: frTranslations }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ht', // Default to Haitian Creole
    lng: 'ht', // Start with Haitian Creole
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'tek-pou-nou-language',
    },
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    debug: import.meta.env.DEV
  });

export default i18n;

// Language options for the UI
export const LANGUAGE_OPTIONS = [
  { code: 'ht', name: 'Kreyòl', nativeName: 'Kreyòl Ayisyen', flag: '🇭🇹' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' }
] as const;

export type LanguageCode = typeof LANGUAGE_OPTIONS[number]['code'];
