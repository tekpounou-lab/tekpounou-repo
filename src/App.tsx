// src/App.tsx
import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Providers
import AuthProvider from "@/components/providers/AuthProvider";

// Components
import { SEOHead, defaultSEOConfigs } from "./components/common/SEOHead";
import { FloatingNewsletterPopup } from "./components/marketing/NewsletterSignup";
import { useReferralTracking } from "./components/marketing/ReferralSystem";

// Analytics
import { analytics, useAnalytics } from "./lib/analytics";
import { supabase } from "./lib/supabase";

// Pages
import HomePage from "./pages/HomePage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/courses/CourseDetailPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/blog/BlogPostPage";
import ServicesPage from "./pages/ServicesPage";
import ServiceDetailPage from "./pages/services/ServiceDetailPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PricingPage from "./pages/pricing/PricingPage";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import NewsletterUnsubscribePage from "./pages/NewsletterUnsubscribePage";
import NotFoundPage from "./pages/NotFoundPage";

// Auth Pages (separated instead of passing type props)
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";

// Admin Components
import AdminLayout from "./components/admin/AdminLayout";
import { MarketingDashboard } from "./components/admin/MarketingDashboard";
import { LandingPageBuilder } from "./components/admin/LandingPageBuilder";

// Auth Guard
import RouteGuard from "./components/auth/RouteGuard";

// Styles
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Analytics initialization component
function AnalyticsInit() {
  const location = useLocation();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    const gaTrackingId = (import.meta as any).env.VITE_GA_TRACKING_ID;
    analytics.init(supabase, gaTrackingId);
  }, []);

  useEffect(() => {
    trackPageView({
      page_title: document.title,
      page_location: window.location.href,
      page_path: location.pathname,
    });
  }, [location, trackPageView]);

  return null;
}

// SEO manager
function SEOManager() {
  const location = useLocation();

  const getSEOForRoute = (pathname: string) => {
    if (pathname === "/") return defaultSEOConfigs.home;
    if (pathname.startsWith("/courses")) return defaultSEOConfigs.courses;
    if (pathname.startsWith("/blog")) return defaultSEOConfigs.blog;
    if (pathname.startsWith("/services")) return defaultSEOConfigs.services;
    if (pathname === "/about") return defaultSEOConfigs.about;
    return null;
  };

  const seoConfig = getSEOForRoute(location.pathname);
  if (!seoConfig) return null;

  return <SEOHead {...seoConfig} />;
}

function App() {
  // Initialize referral tracking
  useReferralTracking();

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              {/* Global SEO */}
              <SEOManager />

              {/* Analytics */}
              <AnalyticsInit />

              {/* Routes */}
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<BlogPostPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/:id" element={<ServiceDetailPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/pricing" element={<PricingPage />} />

                {/* Auth Routes (separate pages) */}
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />
                {/* Add ResetPasswordPage later if needed */}

                {/* Landing Pages */}
                <Route path="/landing/:slug" element={<LandingPage />} />

                {/* Newsletter */}
                <Route
                  path="/newsletter/unsubscribe"
                  element={<NewsletterUnsubscribePage />}
                />

                {/* User Dashboard (protected) */}
                <Route
                  path="/dashboard/*"
                  element={
                    <RouteGuard>
                      <DashboardPage />
                    </RouteGuard>
                  }
                />

                {/* Admin Routes (protected) */}
                <Route
                  path="/admin/*"
                  element={
                    <RouteGuard>
                      <AdminLayout />
                    </RouteGuard>
                  }
                >
                  <Route path="marketing" element={<MarketingDashboard />} />
                  <Route path="landing-pages" element={<LandingPageBuilder />} />
                  <Route
                    path="landing-pages/new"
                    element={<LandingPageBuilder />}
                  />
                  <Route
                    path="landing-pages/:id"
                    element={<LandingPageBuilder />}
                  />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>

              {/* Global Components */}
              <FloatingNewsletterPopup />

              {/* Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#363636",
                    color: "#fff",
                  },
                  success: {
                    duration: 3000,
                  },
                }}
              />
            </div>
          </Router>

          {/* Dev Tools */}
          {(import.meta as any).env.DEV && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
