import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Providers
import { SupabaseProvider } from './components/providers/SupabaseProvider'
import { AuthProvider } from './components/providers/AuthProvider'

// Components
import { SEOHead, defaultSEOConfigs } from './components/common/SEOHead'
import { FloatingNewsletterPopup } from './components/marketing/NewsletterSignup'
import { useReferralTracking } from './components/marketing/ReferralSystem'

// Analytics
import { analytics, useAnalytics } from './lib/analytics'
import { useSupabaseClient } from './components/providers/SupabaseProvider'

// Pages
import HomePage from './pages/HomePage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import ServicesPage from './pages/ServicesPage'
import ServiceDetailPage from './pages/ServiceDetailPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import PricingPage from './pages/PricingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import NewsletterUnsubscribePage from './pages/NewsletterUnsubscribePage'
import NotFoundPage from './pages/NotFoundPage'

// Admin Components
import { AdminLayout } from './components/admin/AdminLayout'
import { MarketingDashboard } from './components/admin/MarketingDashboard'
import { LandingPageBuilder } from './components/admin/LandingPageBuilder'

// Styles
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

// Analytics initialization component
function AnalyticsInit() {
  const supabase = useSupabaseClient()
  const location = useLocation()
  const { trackPageView } = useAnalytics()

  useEffect(() => {
    // Initialize analytics with Supabase client
    const gaTrackingId = import.meta.env.VITE_GA_TRACKING_ID
    analytics.init(supabase, gaTrackingId)
  }, [supabase])

  useEffect(() => {
    // Track page views on route changes
    trackPageView({
      page_title: document.title,
      page_location: window.location.href,
      page_path: location.pathname
    })
  }, [location, trackPageView])

  return null
}

// SEO component that provides default SEO for each route
function SEOManager() {
  const location = useLocation()
  
  const getSEOForRoute = (pathname: string) => {
    if (pathname === '/') return defaultSEOConfigs.home
    if (pathname.startsWith('/courses')) return defaultSEOConfigs.courses
    if (pathname.startsWith('/blog')) return defaultSEOConfigs.blog
    if (pathname.startsWith('/services')) return defaultSEOConfigs.services
    if (pathname === '/about') return defaultSEOConfigs.about
    return null
  }

  const seoConfig = getSEOForRoute(location.pathname)

  if (!seoConfig) return null

  return <SEOHead {...seoConfig} />
}

function App() {
  // Initialize referral tracking
  useReferralTracking()

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                {/* Global SEO */}
                <SEOManager />
                
                {/* Analytics initialization */}
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
                  
                  {/* Auth Routes */}
                  <Route path="/auth/login" element={<AuthPage type="login" />} />
                  <Route path="/auth/register" element={<AuthPage type="register" />} />
                  <Route path="/auth/reset-password" element={<AuthPage type="reset" />} />
                  
                  {/* Landing Pages */}
                  <Route path="/landing/:slug" element={<LandingPage />} />
                  
                  {/* Newsletter */}
                  <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribePage />} />
                  
                  {/* User Dashboard */}
                  <Route path="/dashboard/*" element={<DashboardPage />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/*" element={
                    <AdminLayout>
                      <Routes>
                        <Route path="marketing" element={<MarketingDashboard />} />
                        <Route path="landing-pages" element={<LandingPageBuilder />} />
                        <Route path="landing-pages/new" element={<LandingPageBuilder />} />
                        <Route path="landing-pages/:id" element={<LandingPageBuilder />} />
                      </Routes>
                    </AdminLayout>
                  } />
                  
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
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      theme: {
                        primary: 'green',
                        secondary: 'black',
                      },
                    },
                  }}
                />
              </div>
            </Router>
            
            {/* Development Tools */}
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
          </AuthProvider>
        </SupabaseProvider>
      </QueryClientProvider>
    </HelmetProvider>
  )
}

export default App
