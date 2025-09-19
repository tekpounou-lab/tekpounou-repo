import { gtag } from 'gtag'

declare global {
  interface Window {
    gtag: typeof gtag
    dataLayer: any[]
  }
}

export interface AnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
  custom_parameters?: Record<string, any>
}

export interface PageViewData {
  page_title: string
  page_location: string
  page_path: string
  content_group1?: string // Course, Blog, Service, etc.
  content_group2?: string // Category
  content_group3?: string // Level/Type
}

export interface ConversionData {
  transaction_id?: string
  value?: number
  currency?: string
  items?: {
    item_id: string
    item_name: string
    item_category: string
    price: number
    quantity: number
  }[]
}

class AnalyticsService {
  private supabaseClient: any
  private isInitialized = false
  private sessionId: string
  private userId?: string

  constructor() {
    this.sessionId = this.getOrCreateSessionId()
  }

  init(supabaseClient: any, gaTrackingId?: string) {
    this.supabaseClient = supabaseClient
    
    if (gaTrackingId && typeof window !== 'undefined') {
      this.initGoogleAnalytics(gaTrackingId)
    }
    
    this.isInitialized = true
  }

  private initGoogleAnalytics(trackingId: string) {
    // Load gtag script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`
    document.head.appendChild(script)

    // Initialize dataLayer and gtag
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }

    window.gtag('js', new Date())
    window.gtag('config', trackingId, {
      send_page_view: false, // We'll handle page views manually
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    })
  }

  setUserId(userId: string) {
    this.userId = userId
    
    if (window.gtag) {
      window.gtag('config', 'GA_TRACKING_ID', {
        user_id: userId
      })
    }
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('tek_analytics_session')
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem('tek_analytics_session', sessionId)
    }
    return sessionId
  }

  private getUTMParameters(): Record<string, string | null> {
    const urlParams = new URLSearchParams(window.location.search)
    return {
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_term: urlParams.get('utm_term'),
      utm_content: urlParams.get('utm_content')
    }
  }

  // Track page views
  async trackPageView(data: Partial<PageViewData> = {}) {
    if (!this.isInitialized) return

    const pageData = {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname,
      ...data
    }

    // Track in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'page_view', pageData)
    }

    // Track in our database
    try {
      await this.supabaseClient.functions.invoke('analytics-tracker', {
        body: {
          action: 'track_page_view',
          page: pageData.page_path,
          title: pageData.page_title,
          userId: this.userId,
          sessionId: this.sessionId,
          utmParams: this.getUTMParameters(),
          metadata: pageData
        }
      })
    } catch (error) {
      console.error('Failed to track page view:', error)
    }
  }

  // Track custom events
  async trackEvent(event: AnalyticsEvent) {
    if (!this.isInitialized) return

    // Track in Google Analytics
    if (window.gtag) {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.custom_parameters
      })
    }

    // Track in our database
    try {
      await this.supabaseClient.functions.invoke('analytics-tracker', {
        body: {
          action: 'track_event',
          eventType: `${event.category}_${event.action}`,
          value: event.value || 1,
          userId: this.userId,
          sessionId: this.sessionId,
          utmParams: this.getUTMParameters(),
          metadata: {
            category: event.category,
            action: event.action,
            label: event.label,
            ...event.custom_parameters
          }
        }
      })
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  // Track conversions (purchases, enrollments, etc.)
  async trackConversion(type: string, data: ConversionData & { relatedId?: string; relatedType?: string }) {
    if (!this.isInitialized) return

    // Track in Google Analytics as purchase/conversion
    if (window.gtag && data.value) {
      if (type === 'purchase') {
        window.gtag('event', 'purchase', {
          transaction_id: data.transaction_id,
          value: data.value,
          currency: data.currency || 'USD',
          items: data.items
        })
      } else {
        window.gtag('event', 'conversion', {
          send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL', // Configure with actual values
          value: data.value,
          currency: data.currency || 'USD'
        })
      }
    }

    // Track in our database
    try {
      await this.supabaseClient.functions.invoke('analytics-tracker', {
        body: {
          action: 'track_conversion',
          conversionType: type,
          value: data.value,
          userId: this.userId,
          sessionId: this.sessionId,
          courseId: data.relatedType === 'course' ? data.relatedId : undefined,
          serviceId: data.relatedType === 'service' ? data.relatedId : undefined,
          referralCode: localStorage.getItem('referral_code'),
          metadata: data
        }
      })
    } catch (error) {
      console.error('Failed to track conversion:', error)
    }
  }

  // Track user engagement
  async trackEngagement(action: string, target: string, value?: number) {
    await this.trackEvent({
      action,
      category: 'engagement',
      label: target,
      value
    })
  }

  // Track course interactions
  async trackCourseEvent(action: string, courseId: string, lessonId?: string, progress?: number) {
    await this.trackEvent({
      action,
      category: 'course',
      label: courseId,
      value: progress,
      custom_parameters: {
        course_id: courseId,
        lesson_id: lessonId,
        progress
      }
    })
  }

  // Track blog interactions
  async trackBlogEvent(action: string, postId: string, category?: string) {
    await this.trackEvent({
      action,
      category: 'blog',
      label: postId,
      custom_parameters: {
        post_id: postId,
        post_category: category
      }
    })
  }

  // Track service interactions
  async trackServiceEvent(action: string, serviceId: string, serviceType?: string) {
    await this.trackEvent({
      action,
      category: 'service',
      label: serviceId,
      custom_parameters: {
        service_id: serviceId,
        service_type: serviceType
      }
    })
  }

  // Track search
  async trackSearch(query: string, category?: string, resultsCount?: number) {
    await this.trackEvent({
      action: 'search',
      category: 'site_search',
      label: query,
      value: resultsCount,
      custom_parameters: {
        search_term: query,
        search_category: category,
        results_count: resultsCount
      }
    })
  }

  // Track form submissions
  async trackFormSubmission(formName: string, success: boolean = true) {
    await this.trackEvent({
      action: success ? 'submit_success' : 'submit_error',
      category: 'form',
      label: formName
    })
  }

  // Track downloads
  async trackDownload(fileName: string, fileType: string, relatedId?: string) {
    await this.trackEvent({
      action: 'download',
      category: 'file',
      label: fileName,
      custom_parameters: {
        file_name: fileName,
        file_type: fileType,
        related_id: relatedId
      }
    })
  }

  // Track video interactions
  async trackVideo(action: string, videoId: string, progress?: number, duration?: number) {
    await this.trackEvent({
      action,
      category: 'video',
      label: videoId,
      value: progress,
      custom_parameters: {
        video_id: videoId,
        video_progress: progress,
        video_duration: duration
      }
    })
  }

  // Track newsletter signups
  async trackNewsletterSignup(source: string) {
    await this.trackEvent({
      action: 'signup',
      category: 'newsletter',
      label: source
    })

    // Also track as conversion
    await this.trackConversion('newsletter_signup', {
      value: 1
    })
  }

  // Get analytics data (for admin dashboard)
  async getAnalyticsData(startDate: string, endDate: string, metricTypes?: string[]) {
    try {
      const { data, error } = await this.supabaseClient.functions.invoke('analytics-tracker', {
        body: {
          action: 'get_analytics_data',
          startDate,
          endDate,
          metricTypes
        }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to get analytics data:', error)
      throw error
    }
  }

  // Get growth metrics (for admin dashboard)
  async getGrowthMetrics(startDate: string, endDate: string) {
    try {
      const { data, error } = await this.supabaseClient.functions.invoke('analytics-tracker', {
        body: {
          action: 'get_growth_metrics',
          startDate,
          endDate
        }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to get growth metrics:', error)
      throw error
    }
  }
}

// Create singleton instance
export const analytics = new AnalyticsService()

// React hook for analytics
export function useAnalytics() {
  const trackPageView = (data?: Partial<PageViewData>) => analytics.trackPageView(data)
  const trackEvent = (event: AnalyticsEvent) => analytics.trackEvent(event)
  const trackConversion = (type: string, data: ConversionData & { relatedId?: string; relatedType?: string }) => 
    analytics.trackConversion(type, data)
  const trackEngagement = (action: string, target: string, value?: number) => 
    analytics.trackEngagement(action, target, value)

  return {
    trackPageView,
    trackEvent,
    trackConversion,
    trackEngagement,
    trackCourse: analytics.trackCourseEvent.bind(analytics),
    trackBlog: analytics.trackBlogEvent.bind(analytics),
    trackService: analytics.trackServiceEvent.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackForm: analytics.trackFormSubmission.bind(analytics),
    trackDownload: analytics.trackDownload.bind(analytics),
    trackVideo: analytics.trackVideo.bind(analytics),
    trackNewsletter: analytics.trackNewsletterSignup.bind(analytics)
  }
}

// Higher-order component for automatic page view tracking
export function withPageTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  pageData?: Partial<PageViewData>
) {
  return function TrackedComponent(props: P) {
    React.useEffect(() => {
      analytics.trackPageView(pageData)
    }, [])

    return React.createElement(WrappedComponent, props)
  }
}

// Decorator for tracking method calls
export function trackMethod(eventData: Partial<AnalyticsEvent>) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = function (...args: any[]) {
      analytics.trackEvent({
        action: propertyName,
        category: eventData.category || 'method_call',
        label: eventData.label || target.constructor.name,
        ...eventData
      })

      return method.apply(this, args)
    }
  }
}

// Utility functions for common tracking scenarios
export const trackingUtils = {
  // Track when user starts course
  courseStart: (courseId: string, courseName: string) => {
    analytics.trackCourseEvent('start', courseId)
    analytics.trackEvent({
      action: 'course_start',
      category: 'education',
      label: courseName,
      custom_parameters: { course_id: courseId }
    })
  },

  // Track when user completes lesson
  lessonComplete: (courseId: string, lessonId: string, progress: number) => {
    analytics.trackCourseEvent('lesson_complete', courseId, lessonId, progress)
  },

  // Track when user completes course
  courseComplete: (courseId: string, courseName: string) => {
    analytics.trackCourseEvent('complete', courseId, undefined, 100)
    analytics.trackConversion('course_completion', {
      value: 1,
      relatedId: courseId,
      relatedType: 'course'
    })
  },

  // Track blog post read
  blogRead: (postId: string, timeSpent: number, scrollDepth: number) => {
    analytics.trackBlogEvent('read', postId)
    analytics.trackEvent({
      action: 'read_complete',
      category: 'content',
      label: postId,
      value: timeSpent,
      custom_parameters: {
        time_spent: timeSpent,
        scroll_depth: scrollDepth
      }
    })
  },

  // Track service inquiry
  serviceInquiry: (serviceId: string, serviceName: string) => {
    analytics.trackServiceEvent('inquiry', serviceId)
    analytics.trackConversion('service_inquiry', {
      value: 1,
      relatedId: serviceId,
      relatedType: 'service'
    })
  },

  // Track user registration
  userRegister: (method: string = 'email') => {
    analytics.trackEvent({
      action: 'sign_up',
      category: 'authentication',
      label: method
    })
    analytics.trackConversion('registration', { value: 1 })
  },

  // Track user login
  userLogin: (method: string = 'email') => {
    analytics.trackEvent({
      action: 'login',
      category: 'authentication',
      label: method
    })
  }
}

export default analytics
