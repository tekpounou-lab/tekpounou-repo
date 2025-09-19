import { supabase } from './supabase'

interface PerformanceMetric {
  id?: string
  metric_name: string
  metric_value: number
  metric_type: 'timing' | 'navigation' | 'resource' | 'custom'
  page_url: string
  user_id?: string
  user_agent: string
  timestamp: string
  additional_data?: Record<string, any>
}

interface NavigationTiming {
  dns_lookup: number
  tcp_connection: number
  ssl_negotiation: number
  time_to_first_byte: number
  dom_interactive: number
  dom_complete: number
  load_complete: number
  first_contentful_paint?: number
  largest_contentful_paint?: number
}

interface ResourceTiming {
  name: string
  duration: number
  size: number
  type: string
}

interface WebVital {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
}

class PerformanceMonitoringService {
  private isInitialized = false
  private observer?: PerformanceObserver
  private metricsQueue: PerformanceMetric[] = []
  private batchSize = 10
  private flushInterval = 30000 // 30 seconds

  constructor() {
    this.init()
  }

  private async init() {
    if (this.isInitialized || typeof window === 'undefined') return

    this.isInitialized = true

    // Monitor Core Web Vitals
    this.initCoreWebVitals()

    // Monitor navigation timing
    this.collectNavigationTiming()

    // Monitor resource timing
    this.initResourceTiming()

    // Monitor custom metrics
    this.initCustomMetrics()

    // Start batch flushing
    this.startBatchFlushing()

    // Monitor page visibility changes
    this.initVisibilityChangeHandler()
  }

  private initCoreWebVitals() {
    // First Contentful Paint (FCP)
    this.observePerformanceEntry('paint', (entries) => {
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.addMetric({
            metric_name: 'FCP',
            metric_value: entry.startTime,
            metric_type: 'timing',
            page_url: window.location.href,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            additional_data: {
              rating: this.getWebVitalRating('FCP', entry.startTime)
            }
          })
        }
      })
    })

    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1]
      if (lastEntry) {
        this.addMetric({
          metric_name: 'LCP',
          metric_value: lastEntry.startTime,
          metric_type: 'timing',
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          additional_data: {
            rating: this.getWebVitalRating('LCP', lastEntry.startTime),
            element: lastEntry.element?.tagName
          }
        })
      }
    })

    // Cumulative Layout Shift (CLS)
    this.observePerformanceEntry('layout-shift', (entries) => {
      let clsValue = 0
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      })

      if (clsValue > 0) {
        this.addMetric({
          metric_name: 'CLS',
          metric_value: clsValue,
          metric_type: 'timing',
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          additional_data: {
            rating: this.getWebVitalRating('CLS', clsValue)
          }
        })
      }
    })

    // First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entries) => {
      entries.forEach((entry) => {
        const fid = (entry as any).processingStart - entry.startTime
        this.addMetric({
          metric_name: 'FID',
          metric_value: fid,
          metric_type: 'timing',
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          additional_data: {
            rating: this.getWebVitalRating('FID', fid),
            eventType: (entry as any).name
          }
        })
      })
    })
  }

  private collectNavigationTiming() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

        if (navigation) {
          const timing: NavigationTiming = {
            dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp_connection: navigation.connectEnd - navigation.connectStart,
            ssl_negotiation: navigation.secureConnectionStart > 0 
              ? navigation.connectEnd - navigation.secureConnectionStart 
              : 0,
            time_to_first_byte: navigation.responseStart - navigation.requestStart,
            dom_interactive: navigation.domInteractive - navigation.navigationStart,
            dom_complete: navigation.domComplete - navigation.navigationStart,
            load_complete: navigation.loadEventEnd - navigation.navigationStart
          }

          Object.entries(timing).forEach(([key, value]) => {
            this.addMetric({
              metric_name: key,
              metric_value: value,
              metric_type: 'navigation',
              page_url: window.location.href,
              user_agent: navigator.userAgent,
              timestamp: new Date().toISOString()
            })
          })
        }
      }, 1000)
    })
  }

  private initResourceTiming() {
    this.observePerformanceEntry('resource', (entries) => {
      entries.forEach((entry) => {
        const resource = entry as PerformanceResourceTiming
        
        // Only track significant resources
        if (resource.duration > 100 || resource.transferSize > 50000) {
          this.addMetric({
            metric_name: 'resource_timing',
            metric_value: resource.duration,
            metric_type: 'resource',
            page_url: window.location.href,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            additional_data: {
              resource_name: resource.name,
              resource_type: this.getResourceType(resource.name),
              transfer_size: resource.transferSize,
              encoded_size: resource.encodedBodySize,
              decoded_size: resource.decodedBodySize
            }
          })
        }
      })
    })
  }

  private initCustomMetrics() {
    // Track React component render times
    if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      // Custom implementation for tracking React renders
      this.trackReactPerformance()
    }

    // Track API response times
    this.interceptFetch()
  }

  private trackReactPerformance() {
    // Mark component render start/end
    const originalRender = React.createElement
    // This would need actual React integration
  }

  private interceptFetch() {
    const originalFetch = window.fetch
    
    window.fetch = async (...args) => {
      const startTime = performance.now()
      const url = typeof args[0] === 'string' ? args[0] : args[0].url
      
      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()
        const duration = endTime - startTime

        // Only track API calls (not assets)
        if (url.includes('/api/') || url.includes('supabase.co')) {
          this.addMetric({
            metric_name: 'api_response_time',
            metric_value: duration,
            metric_type: 'custom',
            page_url: window.location.href,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            additional_data: {
              api_url: url,
              status: response.status,
              method: args[1]?.method || 'GET'
            }
          })
        }

        return response
      } catch (error) {
        const endTime = performance.now()
        const duration = endTime - startTime

        this.addMetric({
          metric_name: 'api_error',
          metric_value: duration,
          metric_type: 'custom',
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          additional_data: {
            api_url: url,
            error: error instanceof Error ? error.message : 'Unknown error',
            method: args[1]?.method || 'GET'
          }
        })

        throw error
      }
    }
  }

  private observePerformanceEntry(
    entryType: string, 
    callback: (entries: PerformanceEntry[]) => void
  ) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries())
      })
      observer.observe({ entryTypes: [entryType] })
    } catch (error) {
      console.warn(`Failed to observe ${entryType}:`, error)
    }
  }

  private getWebVitalRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 }
    }

    const threshold = thresholds[metric as keyof typeof thresholds]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font'
    if (url.includes('/api/')) return 'api'
    return 'other'
  }

  private addMetric(metric: Omit<PerformanceMetric, 'user_id'>) {
    const user = supabase.auth.getUser()
    const fullMetric: PerformanceMetric = {
      ...metric,
      user_id: user ? (user as any).id : undefined
    }

    this.metricsQueue.push(fullMetric)

    if (this.metricsQueue.length >= this.batchSize) {
      this.flushMetrics()
    }
  }

  private async flushMetrics() {
    if (this.metricsQueue.length === 0) return

    const metrics = [...this.metricsQueue]
    this.metricsQueue = []

    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert(metrics)

      if (error) {
        console.error('Failed to save performance metrics:', error)
        // Re-queue metrics on failure
        this.metricsQueue.unshift(...metrics)
      }
    } catch (error) {
      console.error('Performance metrics flush error:', error)
      // Re-queue metrics on failure
      this.metricsQueue.unshift(...metrics)
    }
  }

  private startBatchFlushing() {
    setInterval(() => {
      this.flushMetrics()
    }, this.flushInterval)
  }

  private initVisibilityChangeHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Flush metrics before page is hidden
        this.flushMetrics()
      }
    })

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      // Use sendBeacon for reliable delivery
      if (this.metricsQueue.length > 0 && navigator.sendBeacon) {
        const data = JSON.stringify(this.metricsQueue)
        navigator.sendBeacon('/api/performance-metrics', data)
      }
    })
  }

  // Public methods for custom tracking
  public trackCustomMetric(name: string, value: number, additionalData?: Record<string, any>) {
    this.addMetric({
      metric_name: name,
      metric_value: value,
      metric_type: 'custom',
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      additional_data: additionalData
    })
  }

  public trackPageLoadTime(loadTime: number) {
    this.addMetric({
      metric_name: 'page_load_time',
      metric_value: loadTime,
      metric_type: 'timing',
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    })
  }

  public trackComponentRenderTime(componentName: string, renderTime: number) {
    this.addMetric({
      metric_name: 'component_render_time',
      metric_value: renderTime,
      metric_type: 'custom',
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      additional_data: {
        component_name: componentName
      }
    })
  }

  public async getPerformanceReport(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })

      if (error) throw error

      return this.analyzePerformanceData(data || [])
    } catch (error) {
      console.error('Failed to get performance report:', error)
      return null
    }
  }

  private analyzePerformanceData(data: PerformanceMetric[]) {
    const analysis = {
      totalMetrics: data.length,
      averageLoadTime: 0,
      webVitalsScore: { good: 0, needsImprovement: 0, poor: 0 },
      slowestPages: [] as string[],
      resourceBottlenecks: [] as any[],
      apiPerformance: { average: 0, slowest: [] as any[] }
    }

    // Analyze data and provide insights
    // Implementation details...

    return analysis
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitoringService()

// React hook for performance tracking
export function usePerformanceTracking() {
  return {
    trackCustomMetric: performanceMonitor.trackCustomMetric.bind(performanceMonitor),
    trackPageLoadTime: performanceMonitor.trackPageLoadTime.bind(performanceMonitor),
    trackComponentRenderTime: performanceMonitor.trackComponentRenderTime.bind(performanceMonitor),
    getPerformanceReport: performanceMonitor.getPerformanceReport.bind(performanceMonitor)
  }
}
