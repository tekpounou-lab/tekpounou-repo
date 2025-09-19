import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { LANGUAGE_OPTIONS, type LanguageCode } from '../../i18n';
import { motion } from 'framer-motion';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons';
  className?: string;
  showFlags?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  className = '',
  showFlags = true
}) => {
  const { i18n, t } = useTranslation();
  
  const currentLanguage = LANGUAGE_OPTIONS.find(lang => lang.code === i18n.language) || LANGUAGE_OPTIONS[0];
  
  const changeLanguage = (langCode: LanguageCode) => {
    i18n.changeLanguage(langCode);
  };

  if (variant === 'buttons') {
    return (
      <div className={`flex space-x-1 ${className}`} role="group" aria-label={t('profile.language')}>
        {LANGUAGE_OPTIONS.map((lang) => (
          <motion.button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500
              ${i18n.language === lang.code 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
            aria-current={i18n.language === lang.code ? 'true' : 'false'}
            title={`Switch to ${lang.nativeName}`}
          >
            {showFlags && <span className="mr-1">{lang.flag}</span>}
            <span className="hidden sm:inline">{lang.name}</span>
            <span className="sm:hidden">{lang.code.toUpperCase()}</span>
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <Menu as="div" className={`relative inline-block text-left ${className}`}>
      <div>
        <Menu.Button 
          className="
            inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-gray-700 
            bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500
            transition-colors duration-200
          "
          aria-label={`Current language: ${currentLanguage.nativeName}. Click to change language`}
        >
          <GlobeAltIcon className="w-4 h-4 mr-2 text-gray-500" aria-hidden="true" />
          {showFlags && <span className="mr-2">{currentLanguage.flag}</span>}
          <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
          <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
          <ChevronDownIcon className="w-4 h-4 ml-2 text-gray-500" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items 
          className="
            absolute right-0 z-10 w-40 mt-2 origin-top-right bg-white border border-gray-200 
            divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 
            focus:outline-none
          "
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1" role="none">
            {LANGUAGE_OPTIONS.map((lang) => (
              <Menu.Item key={lang.code}>
                {({ active }) => (
                  <button
                    onClick={() => changeLanguage(lang.code)}
                    className={`
                      ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
                      ${i18n.language === lang.code ? 'font-semibold bg-pink-50' : ''}
                      flex items-center w-full px-4 py-2 text-sm transition-colors duration-150
                      hover:bg-gray-100 focus:bg-gray-100 focus:outline-none
                    `}
                    role="menuitem"
                    aria-current={i18n.language === lang.code ? 'true' : 'false'}
                  >
                    {showFlags && <span className="mr-3">{lang.flag}</span>}
                    <span>{lang.nativeName}</span>
                    {i18n.language === lang.code && (
                      <span className="ml-auto text-pink-600">✓</span>
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default LanguageSwitcher;
