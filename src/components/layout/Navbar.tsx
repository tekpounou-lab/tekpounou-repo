import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bars3Icon, 
  XMarkIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
  ChartBarIcon,
  UserIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  NewspaperIcon,
  FolderOpenIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  UsersIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { BrandLogo, BrandButton } from '../ui/BrandComponents';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';
import { AccessibleTooltip } from '../ui/AccessibilityComponents';
import { NotificationBell } from '../notifications/NotificationBell';
import { useAuthStore } from '../../stores/authStore';
import { BRAND_COLORS, BRAND_GRADIENT } from '../../styles/design-system';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Navigation items with i18n support
  const navigation = [
    { 
      name: t('nav.courses'), 
      href: '/courses', 
      icon: BookOpenIcon,
      current: location.pathname.startsWith('/courses')
    },
    { 
      name: t('nav.blog'), 
      href: '/blog', 
      icon: ChatBubbleLeftRightIcon,
      current: location.pathname.startsWith('/blog')
    },
    { 
      name: 'Resous', 
      href: '/resources', 
      icon: FolderOpenIcon,
      current: location.pathname.startsWith('/resources')
    },
    { 
      name: 'Nouvèl', 
      href: '/news', 
      icon: NewspaperIcon,
      current: location.pathname.startsWith('/news')
    },
    { 
      name: 'Patnè', 
      href: '/partners', 
      icon: UserGroupIcon,
      current: location.pathname.startsWith('/partners')
    },
    { 
      name: 'Aktivite', 
      href: '/events', 
      icon: CalendarDaysIcon,
      current: location.pathname.startsWith('/events')
    },
    { 
      name: 'Gwoup', 
      href: '/groups', 
      icon: UsersIcon,
      current: location.pathname.startsWith('/groups')
    },
    { 
      name: 'Rezo', 
      href: '/networking', 
      icon: UserPlusIcon,
      current: location.pathname.startsWith('/networking')
    },
    { 
      name: t('nav.services'), 
      href: '/services', 
      icon: BriefcaseIcon,
      current: location.pathname.startsWith('/services')
    },
    { 
      name: 'Pricing', 
      href: '/pricing', 
      icon: CogIcon,
      current: location.pathname.startsWith('/pricing')
    },
    { 
      name: t('nav.analytics'), 
      href: '/analytics', 
      icon: ChartBarIcon,
      current: location.pathname.startsWith('/analytics')
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsProfileMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user || !profile) return null;
    
    switch (profile.role) {
      case 'super_admin':
        return { href: '/admin/content', label: 'Jesyon Kontni', icon: CogIcon };
      case 'admin':
        return { href: '/admin-panel', label: 'Admin Panel', icon: CogIcon };
      case 'teacher':
        return { href: '/dashboard/teacher', label: t('nav.dashboard'), icon: CogIcon };
      case 'sme_client':
        return { href: '/client', label: t('nav.dashboard'), icon: CogIcon };
      default:
        return { href: '/dashboard/student', label: t('nav.dashboard'), icon: UserIcon };
    }
  };

  const dashboardLink = getDashboardLink();

  return (
    <nav 
      className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link 
            to="/" 
            className="flex items-center focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 rounded-lg"
            aria-label={t('brand.welcome')}
          >
            <BrandLogo size="md" className="transition-transform duration-200 hover:scale-105" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1" role="menubar">
            <Link 
              to="/"
              className={`
                flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2
                ${location.pathname === '/' 
                  ? `text-white shadow-md` 
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
              style={location.pathname === '/' ? { 
                background: BRAND_GRADIENT 
              } : {}}
              role="menuitem"
              aria-current={location.pathname === '/' ? 'page' : undefined}
            >
              <HomeIcon className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('common.home')}
            </Link>

            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2
                    ${item.current 
                      ? `text-white shadow-md` 
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                  style={item.current ? { 
                    background: BRAND_GRADIENT 
                  } : {}}
                  role="menuitem"
                  aria-current={item.current ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 mr-2" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Language Switcher */}
            <LanguageSwitcher variant="dropdown" showFlags />

            {/* Theme Switcher */}
            <ThemeSwitcher variant="toggle" />

            {/* Notifications (only for authenticated users) */}
            {user && <NotificationBell />}

            {/* User Authentication */}
            {user ? (
              <div className="relative">
                <AccessibleTooltip content={profile?.display_name || user.email || t('nav.profile')}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="
                      flex items-center space-x-2 px-3 py-2 text-sm font-medium
                      bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg
                      hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2
                      transition-all duration-200
                    "
                    aria-expanded={isProfileMenuOpen}
                    aria-haspopup="true"
                  >
                    <UserIcon className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden xl:block truncate max-w-24">
                      {profile?.display_name || user.email?.split('@')[0] || t('nav.profile')}
                    </span>
                  </motion.button>
                </AccessibleTooltip>
                
                {/* Profile Dropdown */}
                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="
                        absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 
                        border border-gray-200 dark:border-gray-700 
                        rounded-xl shadow-lg py-2 z-50
                      "
                      role="menu"
                      aria-orientation="vertical"
                    >
                      {dashboardLink && (
                        <Link
                          to={dashboardLink.href}
                          className="
                            flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 
                            hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white
                            transition-colors duration-150
                          "
                          onClick={() => setIsProfileMenuOpen(false)}
                          role="menuitem"
                        >
                          <dashboardLink.icon className="w-4 h-4 mr-3" aria-hidden="true" />
                          {dashboardLink.label}
                        </Link>
                      )}
                      
                      {/* Super Admin Links */}
                      {profile?.role === 'super_admin' && (
                        <Link
                          to="/admin/community"
                          className="
                            flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 
                            hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white
                            transition-colors duration-150
                          "
                          onClick={() => setIsProfileMenuOpen(false)}
                          role="menuitem"
                        >
                          <UsersIcon className="w-4 h-4 mr-3" aria-hidden="true" />
                          Jesyon Kominotè
                        </Link>
                      )}
                      
                      <Link
                        to="/profile"
                        className="
                          flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 
                          hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white
                          transition-colors duration-150
                        "
                        onClick={() => setIsProfileMenuOpen(false)}
                        role="menuitem"
                      >
                        <UserIcon className="w-4 h-4 mr-3" aria-hidden="true" />
                        {t('nav.profile')}
                      </Link>
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                      
                      <button
                        onClick={handleSignOut}
                        className="
                          flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 
                          hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300
                          transition-colors duration-150
                        "
                        role="menuitem"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" aria-hidden="true" />
                        {t('nav.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <BrandButton variant="ghost" size="sm">
                    {t('nav.login')}
                  </BrandButton>
                </Link>
                <Link to="/register">
                  <BrandButton variant="primary" size="sm">
                    {t('nav.signup')}
                  </BrandButton>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-3">
            {/* Mobile Theme & Language Switchers */}
            <LanguageSwitcher variant="buttons" showFlags={false} className="hidden sm:flex" />
            <ThemeSwitcher variant="toggle" className="hidden sm:block" />
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="
                p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white
                hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500
                transition-all duration-200
              "
              aria-expanded={isMenuOpen}
              aria-label="Toggle mobile menu"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isMenuOpen ? 'close' : 'open'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isMenuOpen ? (
                    <XMarkIcon className="w-6 h-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="w-6 h-6" aria-hidden="true" />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-4"
              role="menu"
            >
              <div className="space-y-2">
                <Link
                  to="/"
                  className={`
                    flex items-center px-4 py-3 text-base font-medium rounded-lg mx-2 transition-all duration-200
                    ${location.pathname === '/' 
                      ? 'text-white shadow-md' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                  style={location.pathname === '/' ? { 
                    background: BRAND_GRADIENT 
                  } : {}}
                  onClick={() => setIsMenuOpen(false)}
                  role="menuitem"
                >
                  <HomeIcon className="w-5 h-5 mr-3" aria-hidden="true" />
                  {t('common.home')}
                </Link>

                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`
                        flex items-center px-4 py-3 text-base font-medium rounded-lg mx-2 transition-all duration-200
                        ${item.current 
                          ? 'text-white shadow-md' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                      `}
                      style={item.current ? { 
                        background: BRAND_GRADIENT 
                      } : {}}
                      onClick={() => setIsMenuOpen(false)}
                      role="menuitem"
                    >
                      <Icon className="w-5 h-5 mr-3" aria-hidden="true" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Language & Theme Controls */}
              <div className="sm:hidden border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 px-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('profile.language')}
                  </span>
                  <LanguageSwitcher variant="buttons" showFlags className="scale-90" />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('profile.theme')}
                  </span>
                  <ThemeSwitcher variant="toggle" />
                </div>
              </div>

              {/* Mobile User Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                {user ? (
                  <div className="space-y-2 px-2">
                    {dashboardLink && (
                      <Link
                        to={dashboardLink.href}
                        className="
                          flex items-center px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 
                          hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg
                          transition-colors duration-200
                        "
                        onClick={() => setIsMenuOpen(false)}
                        role="menuitem"
                      >
                        <dashboardLink.icon className="w-5 h-5 mr-3" aria-hidden="true" />
                        {dashboardLink.label}
                      </Link>
                    )}
                    
                    <Link
                      to="/profile"
                      className="
                        flex items-center px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 
                        hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg
                        transition-colors duration-200
                      "
                      onClick={() => setIsMenuOpen(false)}
                      role="menuitem"
                    >
                      <UserIcon className="w-5 h-5 mr-3" aria-hidden="true" />
                      {t('nav.profile')}
                    </Link>
                    
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="
                        flex items-center w-full px-4 py-3 text-base font-medium 
                        text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg
                        transition-colors duration-200
                      "
                      role="menuitem"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" aria-hidden="true" />
                      {t('nav.logout')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 px-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full"
                    >
                      <BrandButton variant="ghost" className="w-full justify-center">
                        {t('nav.login')}
                      </BrandButton>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full"
                    >
                      <BrandButton variant="primary" className="w-full justify-center">
                        {t('nav.signup')}
                      </BrandButton>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
