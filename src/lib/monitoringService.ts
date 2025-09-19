import { supabase } from './supabase'

export interface SystemHealthStatus {
  service_name: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'maintenance'
  uptime_percentage: number
  response_time_avg: number
  error_rate: number
  health_details: Record<string, any>
  last_health_check: string
  alert_threshold_exceeded: boolean
}

export interface UserFeedback {
  id?: string
  user_id: string
  module: string
  feedback_type: 'bug_report' | 'feature_request' | 'improvement_suggestion' | 'usability_issue' | 'content_feedback' | 'general_feedback'
  rating?: number
  title: string
  comment: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected' | 'duplicate'
  category?: string
  tags?: string[]
  attachments?: any[]
  created_at?: string
}

export interface MaintenanceNotification {
  id?: string
  title: string
  description: string
  maintenance_type: 'scheduled' | 'emergency' | 'security_update' | 'feature_update' | 'infrastructure'
  scheduled_start: string
  scheduled_end: string
  affected_services: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'extended'
  user_groups: string[]
}

export interface PerformanceDashboard {
  timestamp: string
  period_hours: number
  page_performance: {
    avg_page_load_time: number
    p95_page_load_time: number
    total_page_views: number
    slowest_pages: Array<{ url: string; avg_time: number }>
  }
  api_performance: {
    avg_response_time: number
    p95_response_time: number
    total_requests: number
    error_rate: number
    slowest_endpoints: Array<{ endpoint: string; avg_time: number; error_rate: number }>
  }
  error_summary: {
    total_errors: number
    unresolved_errors: number
    error_rate_trend: Array<{ hour: string; count: number }>
    top_error_types: Array<{ message: string; count: number }>
  }
  user_activity: {
    active_users: number
    total_sessions: number
    avg_session_duration: number
    top_pages: Array<{ page: string; views: number }>
  }
}

export interface AuditTrailEntry {
  id: string
  user_id: string
  action_type: string
  action_name: string
  resource_type: string
  resource_id?: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  ip_address?: string
  user_agent?: string
  success: boolean
  error_message?: string
  created_at: string
}

class MonitoringService {
  // System Health Methods
  async getSystemHealth(): Promise<{
    overall_status: string
    services: SystemHealthStatus[]
    real_time_checks: Record<string, boolean>
    last_updated: string
    alerts: SystemHealthStatus[]
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('system-monitoring', {
        body: { action: 'get_system_health' }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to get system health:', error)
      throw error
    }
  }

  async updateServiceHealth(
    serviceName: string,
    status: SystemHealthStatus['status'],
    uptimePercentage: number,
    responseTimeAvg: number,
    errorRate: number,
    healthDetails?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('system-monitoring', {
        body: {
          action: 'update_service_health',
          serviceName,
          status,
          uptimePercentage,
          responseTimeAvg,
          errorRate,
          healthDetails
        }
      })

      if (error) throw error
    } catch (error) {
      console.error('Failed to update service health:', error)
      throw error
    }
  }

  async checkApiEndpoints(): Promise<{
    timestamp: string
    endpoints: Array<{
      name: string
      url: string
      status: string
      response_time_ms: number
      status_code: number
      error_message?: string
    }>
    overall_health: string
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('system-monitoring', {
        body: { action: 'check_api_endpoints' }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to check API endpoints:', error)
      throw error
    }
  }

  // Performance Monitoring Methods
  async getPerformanceDashboard(hoursBack: number = 24): Promise<PerformanceDashboard> {
    try {
      const { data, error } = await supabase.functions.invoke('system-monitoring', {
        body: {
          action: 'get_performance_dashboard',
          hoursBack
        }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to get performance dashboard:', error)
      throw error
    }
  }

  async generateHealthReport(hoursBack: number = 24, includeMetrics: boolean = true): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('system-monitoring', {
        body: {
          action: 'generate_health_report',
          hoursBack,
          includeMetrics
        }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to generate health report:', error)
      throw error
    }
  }

  // Error Tracking Methods
  async trackError(
    errorMessage: string,
    errorStack?: string,
    componentStack?: string,
    pageUrl?: string,
    userId?: string,
    deviceInfo?: Record<string, any>,
    errorBoundaryLevel?: string,
    additionalInfo?: Record<string, any>
  ): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('system-monitoring', {
        body: {
          action: 'track_error',
          errorMessage,
          errorStack,
          componentStack,
          pageUrl: pageUrl || window.location.href,
          userId,
          deviceInfo,
          errorBoundaryLevel,
          additionalInfo
        }
      })

      if (error) throw error
      return data.errorId
    } catch (error) {
      console.error('Failed to track error:', error)
      throw error
    }
  }

  async getErrorReports(
    startDate?: string,
    endDate?: string,
    isResolved?: boolean,
    limit: number = 50
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('error_reports')
        .select(`
          *,
          user:user_id(email),
          resolved_by:resolved_by(email)
        `)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (startDate) {
        query = query.gte('timestamp', startDate)
      }
      if (endDate) {
        query = query.lte('timestamp', endDate)
      }
      if (isResolved !== undefined) {
        query = query.eq('is_resolved', isResolved)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get error reports:', error)
      throw error
    }
  }

  async resolveError(errorId: string, resolutionNotes: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('error_reports')
        .update({
          is_resolved: true,
          resolved_by: (await supabase.auth.getUser()).data.user?.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes
        })
        .eq('id', errorId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to resolve error:', error)
      throw error
    }
  }

  // User Feedback Methods
  async submitFeedback(feedback: Omit<UserFeedback, 'id' | 'created_at'>): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('system-monitoring', {
        body: {
          action: 'submit_feedback',
          ...feedback
        }
      })

      if (error) throw error
      return data.feedbackId
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      throw error
    }
  }

  async getFeedback(
    module?: string,
    status?: string,
    priority?: string,
    limit: number = 50
  ): Promise<UserFeedback[]> {
    try {
      let query = supabase
        .from('user_feedback')
        .select(`
          *,
          user:user_id(email),
          resolved_by:resolved_by(email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (module) {
        query = query.eq('module', module)
      }
      if (status) {
        query = query.eq('status', status)
      }
      if (priority) {
        query = query.eq('priority', priority)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get feedback:', error)
      throw error
    }
  }

  async updateFeedbackStatus(
    feedbackId: string,
    status: UserFeedback['status'],
    resolutionNotes?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'resolved' && resolutionNotes) {
        updateData.resolution_notes = resolutionNotes
        updateData.resolved_by = (await supabase.auth.getUser()).data.user?.id
        updateData.resolved_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_feedback')
        .update(updateData)
        .eq('id', feedbackId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to update feedback status:', error)
      throw error
    }
  }

  // Maintenance Notification Methods
  async scheduleMaintenanceNotification(
    notification: Omit<MaintenanceNotification, 'id'>
  ): Promise<string> {
    try {
      const currentUser = await supabase.auth.getUser()
      
      const { data, error } = await supabase.functions.invoke('system-monitoring', {
        body: {
          action: 'schedule_maintenance',
          ...notification,
          createdBy: currentUser.data.user?.id
        }
      })

      if (error) throw error
      return data.notificationId
    } catch (error) {
      console.error('Failed to schedule maintenance notification:', error)
      throw error
    }
  }

  async getMaintenanceNotifications(
    startDate?: string,
    endDate?: string,
    status?: string
  ): Promise<MaintenanceNotification[]> {
    try {
      let query = supabase
        .from('maintenance_notifications')
        .select('*')
        .order('scheduled_start', { ascending: false })

      if (startDate) {
        query = query.gte('scheduled_start', startDate)
      }
      if (endDate) {
        query = query.lte('scheduled_end', endDate)
      }
      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get maintenance notifications:', error)
      throw error
    }
  }

  async updateMaintenanceStatus(
    notificationId: string,
    status: MaintenanceNotification['status'],
    actualStart?: string,
    actualEnd?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (actualStart) updateData.actual_start = actualStart
      if (actualEnd) updateData.actual_end = actualEnd

      const { error } = await supabase
        .from('maintenance_notifications')
        .update(updateData)
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to update maintenance status:', error)
      throw error
    }
  }

  // Audit Trail Methods
  async getAuditTrail(
    startDate?: string,
    endDate?: string,
    actionType?: string,
    userId?: string,
    resourceType?: string,
    limit: number = 100
  ): Promise<AuditTrailEntry[]> {
    try {
      const { data, error } = await supabase.functions.invoke('system-monitoring', {
        body: {
          action: 'get_audit_trail',
          startDate,
          endDate,
          actionType,
          userId,
          resourceType,
          limit
        }
      })

      if (error) throw error
      return data.audit_trail || []
    } catch (error) {
      console.error('Failed to get audit trail:', error)
      throw error
    }
  }

  // Utility Methods
  async exportData(
    dataType: 'feedback' | 'errors' | 'audit_trail' | 'performance',
    startDate: string,
    endDate: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<Blob> {
    try {
      let data: any[]

      switch (dataType) {
        case 'feedback':
          data = await this.getFeedback()
          break
        case 'errors':
          data = await this.getErrorReports(startDate, endDate)
          break
        case 'audit_trail':
          data = await this.getAuditTrail(startDate, endDate)
          break
        case 'performance':
          data = [await this.getPerformanceDashboard()]
          break
        default:
          throw new Error('Invalid data type')
      }

      if (format === 'csv') {
        const csv = this.convertToCSV(data)
        return new Blob([csv], { type: 'text/csv' })
      } else {
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      }
    } catch (error) {
      console.error('Failed to export data:', error)
      throw error
    }
  }

  private convertToCSV(data: any[]): string {
    if (!data.length) return ''

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          if (typeof value === 'object') {
            return JSON.stringify(value).replace(/"/g, '""')
          }
          return String(value).replace(/"/g, '""')
        }).join(',')
      )
    ].join('\n')

    return csvContent
  }

  // Real-time subscriptions for live monitoring
  subscribeToSystemHealth(callback: (health: SystemHealthStatus[]) => void) {
    return supabase
      .channel('system_health')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_health_status'
        },
        () => {
          this.getSystemHealth().then(data => {
            callback(data.services)
          })
        }
      )
      .subscribe()
  }

  subscribeToErrorReports(callback: (errors: any[]) => void) {
    return supabase
      .channel('error_reports')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'error_reports'
        },
        () => {
          this.getErrorReports().then(callback)
        }
      )
      .subscribe()
  }

  subscribeToFeedback(callback: (feedback: UserFeedback[]) => void) {
    return supabase
      .channel('user_feedback')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_feedback'
        },
        () => {
          this.getFeedback().then(callback)
        }
      )
      .subscribe()
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService()

// Export individual methods for convenience
export const {
  getSystemHealth,
  updateServiceHealth,
  checkApiEndpoints,
  getPerformanceDashboard,
  generateHealthReport,
  trackError,
  getErrorReports,
  resolveError,
  submitFeedback,
  getFeedback,
  updateFeedbackStatus,
  scheduleMaintenanceNotification,
  getMaintenanceNotifications,
  updateMaintenanceStatus,
  getAuditTrail,
  exportData,
  subscribeToSystemHealth,
  subscribeToErrorReports,
  subscribeToFeedback
} = monitoringService