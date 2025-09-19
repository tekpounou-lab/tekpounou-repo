import { useState, useEffect, useCallback } from 'react'
import { 
  monitoringService, 
  SystemHealthStatus, 
  UserFeedback, 
  MaintenanceNotification,
  PerformanceDashboard,
  AuditTrailEntry
} from '../lib/monitoringService'

// Hook for system health monitoring
export function useSystemHealth(autoRefresh: boolean = true, refreshInterval: number = 30000) {
  const [health, setHealth] = useState<{
    overall_status: string
    services: SystemHealthStatus[]
    real_time_checks: Record<string, boolean>
    last_updated: string
    alerts: SystemHealthStatus[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const healthData = await monitoringService.getSystemHealth()
      setHealth(healthData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system health')
      console.error('System health fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateServiceHealth = useCallback(async (
    serviceName: string,
    status: SystemHealthStatus['status'],
    uptimePercentage: number,
    responseTimeAvg: number,
    errorRate: number,
    healthDetails?: Record<string, any>
  ) => {
    try {
      await monitoringService.updateServiceHealth(
        serviceName,
        status,
        uptimePercentage,
        responseTimeAvg,
        errorRate,
        healthDetails
      )
      await fetchHealth() // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service health')
      throw err
    }
  }, [fetchHealth])

  useEffect(() => {
    fetchHealth()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchHealth, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchHealth])

  useEffect(() => {
    const subscription = monitoringService.subscribeToSystemHealth((services) => {
      setHealth(prev => prev ? { ...prev, services } : null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    health,
    loading,
    error,
    refetch: fetchHealth,
    updateServiceHealth
  }
}

// Hook for performance monitoring
export function usePerformanceMonitoring(hoursBack: number = 24, autoRefresh: boolean = true) {
  const [dashboard, setDashboard] = useState<PerformanceDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const dashboardData = await monitoringService.getPerformanceDashboard(hoursBack)
      setDashboard(dashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance data')
      console.error('Performance dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [hoursBack])

  const generateReport = useCallback(async (hours: number = 24, includeMetrics: boolean = true) => {
    try {
      return await monitoringService.generateHealthReport(hours, includeMetrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
      throw err
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchDashboard, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [autoRefresh, fetchDashboard])

  return {
    dashboard,
    loading,
    error,
    refetch: fetchDashboard,
    generateReport
  }
}

// Hook for error tracking
export function useErrorTracking() {
  const [errors, setErrors] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchErrors = useCallback(async (
    startDate?: string,
    endDate?: string,
    isResolved?: boolean,
    limit: number = 50
  ) => {
    try {
      setLoading(true)
      setError(null)
      const errorData = await monitoringService.getErrorReports(startDate, endDate, isResolved, limit)
      setErrors(errorData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch errors')
      console.error('Error reports fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const trackError = useCallback(async (
    errorMessage: string,
    errorStack?: string,
    componentStack?: string,
    pageUrl?: string,
    userId?: string,
    deviceInfo?: Record<string, any>,
    errorBoundaryLevel?: string,
    additionalInfo?: Record<string, any>
  ) => {
    try {
      return await monitoringService.trackError(
        errorMessage,
        errorStack,
        componentStack,
        pageUrl,
        userId,
        deviceInfo,
        errorBoundaryLevel,
        additionalInfo
      )
    } catch (err) {
      console.error('Failed to track error:', err)
      throw err
    }
  }, [])

  const resolveError = useCallback(async (errorId: string, resolutionNotes: string) => {
    try {
      await monitoringService.resolveError(errorId, resolutionNotes)
      await fetchErrors() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve error')
      throw err
    }
  }, [fetchErrors])

  useEffect(() => {
    fetchErrors()
  }, [])

  useEffect(() => {
    const subscription = monitoringService.subscribeToErrorReports((errorReports) => {
      setErrors(errorReports)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    errors,
    loading,
    error,
    fetchErrors,
    trackError,
    resolveError
  }
}

// Hook for user feedback management
export function useFeedbackManagement() {
  const [feedback, setFeedback] = useState<UserFeedback[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFeedback = useCallback(async (
    module?: string,
    status?: string,
    priority?: string,
    limit: number = 50
  ) => {
    try {
      setLoading(true)
      setError(null)
      const feedbackData = await monitoringService.getFeedback(module, status, priority, limit)
      setFeedback(feedbackData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feedback')
      console.error('Feedback fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const submitFeedback = useCallback(async (feedbackData: Omit<UserFeedback, 'id' | 'created_at'>) => {
    try {
      const feedbackId = await monitoringService.submitFeedback(feedbackData)
      await fetchFeedback() // Refresh the list
      return feedbackId
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
      throw err
    }
  }, [fetchFeedback])

  const updateFeedbackStatus = useCallback(async (
    feedbackId: string,
    status: UserFeedback['status'],
    resolutionNotes?: string
  ) => {
    try {
      await monitoringService.updateFeedbackStatus(feedbackId, status, resolutionNotes)
      await fetchFeedback() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feedback status')
      throw err
    }
  }, [fetchFeedback])

  useEffect(() => {
    fetchFeedback()
  }, [])

  useEffect(() => {
    const subscription = monitoringService.subscribeToFeedback((feedbackData) => {
      setFeedback(feedbackData)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    feedback,
    loading,
    error,
    fetchFeedback,
    submitFeedback,
    updateFeedbackStatus
  }
}

// Hook for maintenance notifications
export function useMaintenanceNotifications() {
  const [notifications, setNotifications] = useState<MaintenanceNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async (
    startDate?: string,
    endDate?: string,
    status?: string
  ) => {
    try {
      setLoading(true)
      setError(null)
      const notificationData = await monitoringService.getMaintenanceNotifications(startDate, endDate, status)
      setNotifications(notificationData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch maintenance notifications')
      console.error('Maintenance notifications fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const scheduleNotification = useCallback(async (notification: Omit<MaintenanceNotification, 'id'>) => {
    try {
      const notificationId = await monitoringService.scheduleMaintenanceNotification(notification)
      await fetchNotifications() // Refresh the list
      return notificationId
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule maintenance notification')
      throw err
    }
  }, [fetchNotifications])

  const updateNotificationStatus = useCallback(async (
    notificationId: string,
    status: MaintenanceNotification['status'],
    actualStart?: string,
    actualEnd?: string
  ) => {
    try {
      await monitoringService.updateMaintenanceStatus(notificationId, status, actualStart, actualEnd)
      await fetchNotifications() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update maintenance status')
      throw err
    }
  }, [fetchNotifications])

  useEffect(() => {
    fetchNotifications()
  }, [])

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    scheduleNotification,
    updateNotificationStatus
  }
}

// Hook for audit trail
export function useAuditTrail() {
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAuditTrail = useCallback(async (
    startDate?: string,
    endDate?: string,
    actionType?: string,
    userId?: string,
    resourceType?: string,
    limit: number = 100
  ) => {
    try {
      setLoading(true)
      setError(null)
      const auditData = await monitoringService.getAuditTrail(
        startDate,
        endDate,
        actionType,
        userId,
        resourceType,
        limit
      )
      setAuditTrail(auditData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit trail')
      console.error('Audit trail fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAuditTrail()
  }, [])

  return {
    auditTrail,
    loading,
    error,
    fetchAuditTrail
  }
}

// Hook for data export
export function useDataExport() {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportData = useCallback(async (
    dataType: 'feedback' | 'errors' | 'audit_trail' | 'performance',
    startDate: string,
    endDate: string,
    format: 'json' | 'csv' = 'json'
  ) => {
    try {
      setExporting(true)
      setError(null)
      
      const blob = await monitoringService.exportData(dataType, startDate, endDate, format)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${dataType}_export_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data')
      throw err
    } finally {
      setExporting(false)
    }
  }, [])

  return {
    exporting,
    error,
    exportData
  }
}

// Hook for real-time monitoring dashboard
export function useMonitoringDashboard() {
  const systemHealth = useSystemHealth(true, 30000) // Auto-refresh every 30 seconds
  const performance = usePerformanceMonitoring(24, true)
  const errorTracking = useErrorTracking()
  const feedbackManagement = useFeedbackManagement()
  const maintenance = useMaintenanceNotifications()
  const auditTrail = useAuditTrail()
  const dataExport = useDataExport()

  const [alerts, setAlerts] = useState<Array<{
    id: string
    type: 'error' | 'health' | 'maintenance' | 'feedback'
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    timestamp: string
    resolved: boolean
  }>>([])

  // Aggregate alerts from different sources
  useEffect(() => {
    const newAlerts: typeof alerts = []

    // Health alerts
    if (systemHealth.health?.alerts) {
      systemHealth.health.alerts.forEach(service => {
        newAlerts.push({
          id: `health-${service.service_name}`,
          type: 'health',
          severity: service.status === 'unhealthy' ? 'critical' : 'high',
          message: `Service ${service.service_name} is ${service.status}`,
          timestamp: service.last_health_check,
          resolved: false
        })
      })
    }

    // Error alerts (unresolved errors from last 24 hours)
    const recentErrors = errorTracking.errors.filter(
      error => !error.is_resolved && 
      new Date(error.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    )
    recentErrors.forEach(error => {
      newAlerts.push({
        id: `error-${error.id}`,
        type: 'error',
        severity: error.error_boundary_level === 'application' ? 'critical' : 'high',
        message: `Unresolved error: ${error.error_message.substring(0, 100)}...`,
        timestamp: error.timestamp,
        resolved: false
      })
    })

    // High priority feedback
    const highPriorityFeedback = feedbackManagement.feedback.filter(
      f => f.priority === 'high' || f.priority === 'critical'
    ).filter(f => f.status === 'pending')
    highPriorityFeedback.forEach(feedback => {
      newAlerts.push({
        id: `feedback-${feedback.id}`,
        type: 'feedback',
        severity: feedback.priority as any,
        message: `${feedback.priority} priority feedback: ${feedback.title}`,
        timestamp: feedback.created_at || '',
        resolved: false
      })
    })

    // Upcoming maintenance
    const upcomingMaintenance = maintenance.notifications.filter(
      m => m.status === 'scheduled' && 
      new Date(m.scheduled_start) <= new Date(Date.now() + 24 * 60 * 60 * 1000)
    )
    upcomingMaintenance.forEach(maint => {
      newAlerts.push({
        id: `maintenance-${maint.id}`,
        type: 'maintenance',
        severity: maint.severity as any,
        message: `Scheduled maintenance: ${maint.title}`,
        timestamp: maint.scheduled_start,
        resolved: false
      })
    })

    setAlerts(newAlerts)
  }, [
    systemHealth.health,
    errorTracking.errors,
    feedbackManagement.feedback,
    maintenance.notifications
  ])

  const refreshAll = useCallback(async () => {
    await Promise.all([
      systemHealth.refetch(),
      performance.refetch(),
      errorTracking.fetchErrors(),
      feedbackManagement.fetchFeedback(),
      maintenance.fetchNotifications(),
      auditTrail.fetchAuditTrail()
    ])
  }, [
    systemHealth.refetch,
    performance.refetch,
    errorTracking.fetchErrors,
    feedbackManagement.fetchFeedback,
    maintenance.fetchNotifications,
    auditTrail.fetchAuditTrail
  ])

  return {
    systemHealth,
    performance,
    errorTracking,
    feedbackManagement,
    maintenance,
    auditTrail,
    dataExport,
    alerts,
    refreshAll
  }
}