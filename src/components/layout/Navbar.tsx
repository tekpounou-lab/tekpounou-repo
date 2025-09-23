// src/components/layout/Navbar.tsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserIcon, UsersIcon, CogIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useAuthStore } from "@/stores/authStore";
import { BRAND_GRADIENT } from "@/styles/design-system";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/user_input_files/TekPouNouLogo.png";
import { mainNavigation } from "@/config/navigation";

type NavItem = {
  name: string;
  href: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  role?: string | "any"; // restrict to role if needed
};

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, profile, signOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const roles = Array.isArray(profile?.roles) ? profile.roles : [];

  const getDashboardLink = (): NavItem | null => {
    if (!user || !profile) return null;

    if (roles.includes("super_admin")) {
      return { href: "/admin/content", name: "Jesyon Kontni", icon: CogIcon };
    }
    if (roles.includes("admin")) {
      return { href: "/admin-panel", name: "Admin Panel", icon: CogIcon };
    }
    if (roles.includes("teacher")) {
      return { href: "/dashboard/teacher", name: "Tablo Kontwòl", icon: CogIcon };
    }
    if (roles.includes("sme_client")) {
      return { href: "/client", name: "Tablo Kontwòl", icon: CogIcon };
    }
    return { href: "/dashboard/student", name: "Tablo Kontwòl", icon: UserIcon };
  };

  const dashboardLink = getDashboardLink();

  // Profile dropdown config
  const profileNavigation: NavItem[] = [
    ...(dashboardLink ? [dashboardLink] : []),
    ...(roles.includes("super_admin")
      ? [{ href: "/admin/community", name: "Jesyon Kominotè", icon: UsersIcon }]
      : []),
    {
      href: "#",
      name: "Dekonekte",
      icon: ArrowRightOnRectangleIcon,
    },
  ];

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  return (
    <nav className="bg-white dark:bg-gray-900 shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left Section - Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src={Logo}
              alt="Tek Pou Nou Logo"
              className="h-8 w-8 object-contain"
            />
            <span
              className="text-xl sm:text-2xl font-bold tracking-tight"
              style={{
                background: BRAND_GRADIENT,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Tek Pou Nou
            </span>
          </Link>

          {/* Middle Section - Navigation (desktop only) */}
          <div className="hidden sm:flex sm:space-x-8">
            {mainNavigation.map((item) => {
              const Icon = item.icon || null;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition
                    ${
                      isActive(item.href)
                        ? "border-indigo-500 text-gray-900 dark:text-white"
                        : "border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-white"
                    }`}
                >
                  {Icon && <Icon className="w-4 h-4 mr-1" aria-hidden="true" />}
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right Section - Auth / Profile */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  className="bg-white dark:bg-gray-900 flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                >
                  <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </button>

                {/* Dropdown menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      {profileNavigation.map((item) => {
                        const Icon = item.icon || null;
                        if (item.name === "Dekonekte") {
                          return (
                            <button
                              key={item.name}
                              onClick={() => {
                                signOut();
                                setIsProfileMenuOpen(false);
                              }}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              {Icon && <Icon className="w-4 h-4 mr-2" />}
                              {item.name}
                            </button>
                          );
                        }
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            {Icon && <Icon className="w-4 h-4 mr-2" />}
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex space-x-4">
                <Link
                  to="/auth/login"
                  className={`text-sm font-medium px-3 py-1 rounded transition
                    ${
                      location.pathname.startsWith("/auth/login")
                        ? "text-indigo-600 dark:text-indigo-400 underline"
                        : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                    }`}
                >
                  Konekte
                </Link>
                <Link
                  to="/auth/register"
                  className={`text-sm font-medium px-3 py-1 rounded transition
                    ${
                      location.pathname.startsWith("/auth/register")
                        ? "text-indigo-600 dark:text-indigo-400 underline"
                        : "text-indigo-600 hover:text-indigo-800"
                    }`}
                >
                  Enskri
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
              >
                ☰
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu with Animation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden px-2 pb-3 space-y-1"
          >
            {mainNavigation.map((item) => {
              const Icon = item.icon || null;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition
                    ${
                      isActive(item.href)
                        ? "bg-indigo-50 text-indigo-700 dark:text-indigo-300"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                >
                  {Icon && <Icon className="w-5 h-5 mr-2" aria-hidden="true" />}
                  {item.name}
                </Link>
              );
            })}

            {!user && (
              <>
                <Link
                  to="/auth/login"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <UserIcon className="w-5 h-5 mr-2" />
                  Konekte
                </Link>
                <Link
                  to="/auth/register"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <UserIcon className="w-5 h-5 mr-2" />
                  Enskri
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
