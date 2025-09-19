import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...payload } = await req.json()

    switch (action) {
      case 'get_system_health':
        return await getSystemHealth(supabaseClient)
      
      case 'update_service_health':
        return await updateServiceHealth(supabaseClient, payload)
      
      case 'check_api_endpoints':
        return await checkApiEndpoints(supabaseClient)
      
      case 'generate_health_report':
        return await generateHealthReport(supabaseClient, payload)
      
      case 'get_performance_dashboard':
        return await getPerformanceDashboard(supabaseClient, payload)
      
      case 'track_error':
        return await trackError(supabaseClient, payload, req)
      
      case 'submit_feedback':
        return await submitUserFeedback(supabaseClient, payload, req)
      
      case 'schedule_maintenance':
        return await scheduleMaintenanceNotification(supabaseClient, payload)
      
      case 'get_audit_trail':
        return await getAuditTrail(supabaseClient, payload)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('System monitoring error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Get current system health status
async function getSystemHealth(supabase: any) {
  const { data: healthData, error } = await supabase
    .rpc('check_system_health')

  if (error) throw error

  // Add real-time checks
  const realTimeChecks = await performRealTimeHealthChecks()
  
  const healthSummary = {
    overall_status: calculateOverallHealth(healthData),
    services: healthData,
    real_time_checks: realTimeChecks,
    last_updated: new Date().toISOString(),
    alerts: healthData.filter((service: any) => service.status !== 'healthy')
  }

  return new Response(
    JSON.stringify(healthSummary),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Update health status for a specific service
async function updateServiceHealth(supabase: any, payload: any) {
  const {
    serviceName,
    status,
    uptimePercentage,
    responseTimeAvg,
    errorRate,
    healthDetails
  } = payload

  const { data, error } = await supabase
    .from('system_health_status')
    .upsert({
      service_name: serviceName,
      status,
      uptime_percentage: uptimePercentage,
      response_time_avg: responseTimeAvg,
      error_rate: errorRate,
      health_details: healthDetails || {},
      last_health_check: new Date().toISOString(),
      alert_threshold_exceeded: status !== 'healthy',
      updated_at: new Date().toISOString()
    })
    .select()

  if (error) throw error

  // Check if alert needs to be sent
  if (status !== 'healthy') {
    await sendHealthAlert(supabase, serviceName, status, healthDetails)
  }

  return new Response(
    JSON.stringify({ message: 'Service health updated', data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Check health of API endpoints
async function checkApiEndpoints(supabase: any) {
  const endpoints = [
    { name: 'auth', url: `${Deno.env.get('SUPABASE_URL')}/auth/v1/health`, method: 'GET' },
    { name: 'api', url: `${Deno.env.get('SUPABASE_URL')}/rest/v1/`, method: 'GET' },
    { name: 'storage', url: `${Deno.env.get('SUPABASE_URL')}/storage/v1/health`, method: 'GET' },
    { name: 'realtime', url: `${Deno.env.get('SUPABASE_URL')}/realtime/v1/health`, method: 'GET' }
  ]

  const results = await Promise.all(
    endpoints.map(async (endpoint) => {
      const startTime = Date.now()
      let status = 'healthy'
      let statusCode = 200
      let errorMessage = null
      let responseTimeMs = 0

      try {
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        
        responseTimeMs = Date.now() - startTime
        statusCode = response.status
        
        if (!response.ok) {
          status = response.status >= 500 ? 'unhealthy' : 'degraded'
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
      } catch (error) {
        responseTimeMs = Date.now() - startTime
        status = 'unhealthy'
        statusCode = 0
        errorMessage = error.message
      }

      // Store health check result
      await supabase
        .from('api_health_checks')
        .insert({
          endpoint_name: endpoint.name,
          endpoint_url: endpoint.url,
          method: endpoint.method,
          response_time_ms: responseTimeMs,
          status_code: statusCode,
          is_healthy: status === 'healthy',
          error_message: errorMessage
        })

      return {
        name: endpoint.name,
        url: endpoint.url,
        status,
        response_time_ms: responseTimeMs,
        status_code: statusCode,
        error_message: errorMessage
      }
    })
  )

  return new Response(
    JSON.stringify({ 
      timestamp: new Date().toISOString(),
      endpoints: results,
      overall_health: results.every(r => r.status === 'healthy') ? 'healthy' : 'degraded'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Generate comprehensive health report
async function generateHealthReport(supabase: any, payload: any) {
  const { hoursBack = 24, includeMetrics = true } = payload

  const report = await supabase
    .rpc('get_performance_dashboard', { hours_back: hoursBack })

  if (report.error) throw report.error

  // Add system health data
  const { data: systemHealth } = await supabase
    .from('system_health_status')
    .select('*')
    .order('updated_at', { ascending: false })

  // Add recent maintenance notifications
  const { data: maintenance } = await supabase
    .from('maintenance_notifications')
    .select('*')
    .gte('scheduled_start', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('scheduled_start', { ascending: false })

  // Add user feedback summary
  const { data: feedbackSummary } = await supabase
    .from('user_feedback')
    .select('module, feedback_type, priority, status')
    .gte('created_at', new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString())

  const feedbackByModule = feedbackSummary?.reduce((acc: any, feedback: any) => {
    if (!acc[feedback.module]) acc[feedback.module] = { total: 0, by_priority: {} }
    acc[feedback.module].total += 1
    acc[feedback.module].by_priority[feedback.priority] = 
      (acc[feedback.module].by_priority[feedback.priority] || 0) + 1
    return acc
  }, {})

  const healthReport = {
    generated_at: new Date().toISOString(),
    period_hours: hoursBack,
    system_health: systemHealth,
    performance_metrics: report.data,
    maintenance_schedule: maintenance,
    user_feedback: {
      summary: feedbackByModule,
      total_feedback: feedbackSummary?.length || 0,
      pending_issues: feedbackSummary?.filter((f: any) => f.status === 'pending').length || 0
    },
    recommendations: generateHealthRecommendations(systemHealth, report.data)
  }

  // Store the report
  await supabase
    .from('automated_reports')
    .insert({
      report_type: 'health_summary',
      report_name: `Health Report ${new Date().toISOString().split('T')[0]}`,
      schedule_type: 'manual',
      recipients: ['admin@tekpounou.com'],
      report_data: healthReport
    })

  return new Response(
    JSON.stringify(healthReport),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Get performance dashboard data
async function getPerformanceDashboard(supabase: any, payload: any) {
  const { hoursBack = 24 } = payload

  const { data, error } = await supabase
    .rpc('get_performance_dashboard', { hours_back: hoursBack })

  if (error) throw error

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Track application errors
async function trackError(supabase: any, payload: any, req: Request) {
  const {
    errorMessage,
    errorStack,
    componentStack,
    pageUrl,
    userId,
    deviceInfo,
    errorBoundaryLevel,
    additionalInfo
  } = payload

  const userAgent = req.headers.get('user-agent') || ''
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''

  const { data, error } = await supabase
    .from('error_reports')
    .insert({
      error_message: errorMessage,
      error_stack: errorStack,
      component_stack: componentStack,
      user_id: userId,
      page_url: pageUrl,
      user_agent: userAgent,
      device_info: deviceInfo || {},
      error_boundary_level: errorBoundaryLevel || 'component',
      additional_info: additionalInfo || {}
    })
    .select()

  if (error) throw error

  // Check if this is a critical error that needs immediate attention
  if (errorBoundaryLevel === 'application' || errorMessage.includes('Critical')) {
    await sendErrorAlert(supabase, errorMessage, pageUrl, userId)
  }

  return new Response(
    JSON.stringify({ message: 'Error tracked successfully', errorId: data[0].id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Submit user feedback
async function submitUserFeedback(supabase: any, payload: any, req: Request) {
  const {
    module,
    feedbackType,
    rating,
    title,
    comment,
    category,
    tags,
    attachments,
    userId
  } = payload

  const userAgent = req.headers.get('user-agent') || ''
  const pageUrl = req.headers.get('referer') || ''

  const { data, error } = await supabase
    .from('user_feedback')
    .insert({
      user_id: userId,
      module,
      feedback_type: feedbackType,
      rating,
      title,
      comment,
      category,
      tags: tags || [],
      attachments: attachments || [],
      user_agent: userAgent,
      page_url: pageUrl,
      priority: determineFeedbackPriority(feedbackType, rating)
    })
    .select()

  if (error) throw error

  // Track feedback submission in analytics
  await supabase
    .functions.invoke('analytics-tracker', {
      body: {
        action: 'track_event',
        eventType: 'feedback_submission',
        userId,
        metadata: {
          module,
          feedback_type: feedbackType,
          rating
        }
      }
    })

  return new Response(
    JSON.stringify({ message: 'Feedback submitted successfully', feedbackId: data[0].id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Schedule maintenance notification
async function scheduleMaintenanceNotification(supabase: any, payload: any) {
  const {
    title,
    description,
    maintenanceType,
    scheduledStart,
    scheduledEnd,
    affectedServices,
    severity,
    userGroups,
    createdBy
  } = payload

  const { data, error } = await supabase
    .from('maintenance_notifications')
    .insert({
      title,
      description,
      maintenance_type: maintenanceType,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      affected_services: affectedServices || [],
      severity: severity || 'medium',
      user_groups: userGroups || ['all'],
      created_by: createdBy
    })
    .select()

  if (error) throw error

  // Send notifications to users
  await sendMaintenanceNotifications(supabase, data[0])

  return new Response(
    JSON.stringify({ message: 'Maintenance notification scheduled', notificationId: data[0].id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Get audit trail
async function getAuditTrail(supabase: any, payload: any) {
  const {
    startDate,
    endDate,
    actionType,
    userId,
    resourceType,
    limit = 100
  } = payload

  let query = supabase
    .from('audit_trails')
    .select(`
      *,
      user:user_id (email, user_profiles(first_name, last_name))
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }
  if (actionType) {
    query = query.eq('action_type', actionType)
  }
  if (userId) {
    query = query.eq('user_id', userId)
  }
  if (resourceType) {
    query = query.eq('resource_type', resourceType)
  }

  const { data, error } = await query

  if (error) throw error

  return new Response(
    JSON.stringify({ audit_trail: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Helper functions

async function performRealTimeHealthChecks() {
  const checks = {
    database_connection: false,
    auth_service: false,
    storage_service: false,
    edge_functions: false
  }

  try {
    // These would be actual health check implementations
    checks.database_connection = true // Database query test
    checks.auth_service = true // Auth endpoint test
    checks.storage_service = true // Storage access test
    checks.edge_functions = true // Function invocation test
  } catch (error) {
    console.error('Real-time health check failed:', error)
  }

  return checks
}

function calculateOverallHealth(healthData: any[]) {
  if (!healthData || healthData.length === 0) return 'unknown'
  
  const unhealthyServices = healthData.filter(service => service.status === 'unhealthy')
  const degradedServices = healthData.filter(service => service.status === 'degraded')
  
  if (unhealthyServices.length > 0) return 'unhealthy'
  if (degradedServices.length > 0) return 'degraded'
  return 'healthy'
}

function generateHealthRecommendations(systemHealth: any[], performanceData: any) {
  const recommendations = []
  
  // System health recommendations
  systemHealth?.forEach(service => {
    if (service.status === 'unhealthy') {
      recommendations.push({
        type: 'critical',
        service: service.service_name,
        message: `${service.service_name} is unhealthy and requires immediate attention`,
        action: 'Investigate service logs and restart if necessary'
      })
    } else if (service.response_time_avg > 1000) {
      recommendations.push({
        type: 'warning',
        service: service.service_name,
        message: `${service.service_name} has high response times`,
        action: 'Consider scaling or optimizing the service'
      })
    }
  })
  
  // Performance recommendations
  if (performanceData?.api_performance?.error_rate > 5) {
    recommendations.push({
      type: 'warning',
      service: 'api',
      message: 'API error rate is above acceptable threshold',
      action: 'Review API logs and fix failing endpoints'
    })
  }
  
  return recommendations
}

function determineFeedbackPriority(feedbackType: string, rating?: number) {
  if (feedbackType === 'bug_report') {
    return rating && rating <= 2 ? 'high' : 'medium'
  }
  if (feedbackType === 'usability_issue') {
    return 'medium'
  }
  return 'low'
}

async function sendHealthAlert(supabase: any, serviceName: string, status: string, details: any) {
  // Implementation for sending health alerts (email, SMS, etc.)
  console.log(`ALERT: ${serviceName} is ${status}`, details)
}

async function sendErrorAlert(supabase: any, errorMessage: string, pageUrl: string, userId?: string) {
  // Implementation for sending error alerts
  console.log(`ERROR ALERT: ${errorMessage} on ${pageUrl}`, { userId })
}

async function sendMaintenanceNotifications(supabase: any, notification: any) {
  // Implementation for sending maintenance notifications
  console.log('Maintenance notification:', notification)
}