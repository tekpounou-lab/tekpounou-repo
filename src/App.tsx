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

// Navigation config
import { mainNavigation } from "@/config/navigation";

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

// Auth
import AuthPage from "./pages/AuthPage";

// Admin
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

// ---------------------- Analytics Init ----------------------
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

// ---------------------- SEO Manager ----------------------
function SEOManager() {
  const location = useLocation();

  const getSEOForRoute = (pathname: string) => {
    if (pathname === "/") return defaultSEOConfigs.home;

    // Dynamic course detail
    if (pathname.startsWith("/courses/") && pathname.split("/").length === 3) {
      return {
        ...defaultSEOConfigs.courses,
        title: "Course Detail | Tek Pou Nou",
        description:
          "Aprann plis sou kou sa a sou teknoloji, antreprenarya ak plis ankò.",
      };
    }
    if (pathname.startsWith("/courses")) return defaultSEOConfigs.courses;

    // Dynamic blog post
    if (pathname.startsWith("/blog/") && pathname.split("/").length === 3) {
      return {
        ...defaultSEOConfigs.blog,
        title: "Blog Post | Tek Pou Nou",
        description:
          "Li atik sa a sou teknoloji, inovasyon ak antreprenarya ann Ayiti.",
      };
    }
    if (pathname.startsWith("/blog")) return defaultSEOConfigs.blog;

    // Dynamic service detail
    if (pathname.startsWith("/services/") && pathname.split("/").length === 3) {
      return {
        ...defaultSEOConfigs.services,
        title: "Service Detail | Tek Pou Nou",
        description: "Aprann plis sou sèvis sa a pou devlopman biznis ou.",
      };
    }
    if (pathname.startsWith("/services")) return defaultSEOConfigs.services;

    if (pathname === "/pricing") return defaultSEOConfigs.pricing;
    if (pathname === "/about") return defaultSEOConfigs.about;
    if (pathname === "/contact") return defaultSEOConfigs.contact;
    if (pathname.startsWith("/events")) return defaultSEOConfigs.events;
    if (pathname.startsWith("/news")) return defaultSEOConfigs.news;

    // fallback: match a nav item
    const navMatch = mainNavigation.find((item) =>
      pathname.startsWith(item.href)
    );
    if (navMatch) {
      return {
        title: `${navMatch.name} | Tek Pou Nou`,
        description: `Discover more about ${navMatch.name} on Tek Pou Nou.`,
      };
    }

    return null;
  };

  const seoConfig = getSEOForRoute(location.pathname);
  if (!seoConfig) return null;

  return (
    <SEOHead
      {...seoConfig}
      locale="ht"
      image="https://tekpounou.com/og-image.png"
    />
  );
}

// ---------------------- App ----------------------
function App() {
  useReferralTracking();

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <SEOManager />
              <AnalyticsInit />

              <Routes>
                {/* Public Home */}
                <Route path="/" element={<HomePage />} />

                {/* Public Routes */}
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<BlogPostPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/:id" element={<ServiceDetailPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/pricing" element={<PricingPage />} />

                {/* Auth */}
                <Route
                  path="/auth/login"
                  element={<AuthPage defaultTab="login" />}
                />
                <Route
                  path="/auth/register"
                  element={<AuthPage defaultTab="register" />}
                />

                {/* Marketing Landing Pages */}
                <Route path="/landing/:slug" element={<LandingPage />} />

                {/* Newsletter */}
                <Route
                  path="/newsletter/unsubscribe"
                  element={<NewsletterUnsubscribePage />}
                />

                {/* Dashboard (protected) */}
                <Route
                  path="/dashboard/*"
                  element={
                    <RouteGuard>
                      <DashboardPage />
                    </RouteGuard>
                  }
                />

                {/* Admin (protected) */}
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
                  <Route path="landing-pages/new" element={<LandingPageBuilder />} />
                  <Route path="landing-pages/:id" element={<LandingPageBuilder />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>

              <FloatingNewsletterPopup />

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

          {(import.meta as any).env.DEV && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
