import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { RefreshCw, TrendingUp, TrendingDown, Activity, Users, Clock, AlertTriangle } from 'lucide-react'
import { PerformanceDashboard } from '../../lib/monitoringService'

interface PerformanceWidgetProps {
  dashboard: PerformanceDashboard | null
  loading: boolean
  error: string | null
  onRefresh: () => void
  onGenerateReport?: (hours: number, includeMetrics: boolean) => Promise<any>
  detailed?: boolean
  className?: string
}

export function PerformanceWidget({
  dashboard,
  loading,
  error,
  onRefresh,
  onGenerateReport,
  detailed = false,
  className = ''
}: PerformanceWidgetProps) {
  const [generatingReport, setGeneratingReport] = useState(false)

  const handleGenerateReport = async () => {
    if (!onGenerateReport) return
    
    setGeneratingReport(true)
    try {
      await onGenerateReport(24, true)
    } catch (err) {
      console.error('Failed to generate report:', err)
    } finally {
      setGeneratingReport(false)
    }
  }

  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'success'
    if (value <= thresholds.warning) return 'warning'
    return 'error'
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Performance Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onRefresh} size="sm">Try Again</Button>
        </div>
      </Card>
    )
  }

  if (!dashboard) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          No performance data available
        </div>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Performance Dashboard</h3>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Last {dashboard.period_hours}h
            </span>
            {onGenerateReport && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateReport}
                disabled={generatingReport}
              >
                Generate Report
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Avg Page Load</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {dashboard.page_performance.avg_page_load_time.toFixed(0)}ms
            </div>
            <Badge 
              variant={getPerformanceStatus(dashboard.page_performance.avg_page_load_time, { good: 1000, warning: 3000 })}
              className="mt-1"
            >
              {dashboard.page_performance.avg_page_load_time <= 1000 ? 'Excellent' : 
               dashboard.page_performance.avg_page_load_time <= 3000 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">API Response</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {dashboard.api_performance.avg_response_time.toFixed(0)}ms
            </div>
            <Badge 
              variant={getPerformanceStatus(dashboard.api_performance.avg_response_time, { good: 200, warning: 1000 })}
              className="mt-1"
            >
              {dashboard.api_performance.avg_response_time <= 200 ? 'Fast' : 
               dashboard.api_performance.avg_response_time <= 1000 ? 'Normal' : 'Slow'}
            </Badge>
          </div>

          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">Error Rate</span>
            </div>
            <div className="text-2xl font-bold text-red-900">
              {dashboard.api_performance.error_rate.toFixed(1)}%
            </div>
            <Badge 
              variant={getPerformanceStatus(dashboard.api_performance.error_rate, { good: 1, warning: 5 })}
              className="mt-1"
            >
              {dashboard.api_performance.error_rate <= 1 ? 'Low' : 
               dashboard.api_performance.error_rate <= 5 ? 'Medium' : 'High'}
            </Badge>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Active Users</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {dashboard.user_activity.active_users.toLocaleString()}
            </div>
            <div className="text-sm text-purple-600 mt-1">
              {dashboard.user_activity.total_sessions} sessions
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        {detailed && (
          <>
            {/* Page Performance */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Page Performance</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Page Views</span>
                    <div className="font-semibold">{dashboard.page_performance.total_page_views.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">95th Percentile</span>
                    <div className="font-semibold">{dashboard.page_performance.p95_page_load_time.toFixed(0)}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Average Load Time</span>
                    <div className="font-semibold">{dashboard.page_performance.avg_page_load_time.toFixed(0)}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Session Duration</span>
                    <div className="font-semibold">{dashboard.user_activity.avg_session_duration.toFixed(1)}min</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slowest Pages */}
            {dashboard.page_performance.slowest_pages && dashboard.page_performance.slowest_pages.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Slowest Pages</h4>
                <div className="space-y-2">
                  {dashboard.page_performance.slowest_pages.slice(0, 5).map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium truncate flex-1">{page.url}</span>
                      <span className="text-sm text-gray-600 ml-4">{page.avg_time.toFixed(0)}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API Performance */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">API Performance</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Requests</span>
                    <div className="font-semibold">{dashboard.api_performance.total_requests.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">95th Percentile</span>
                    <div className="font-semibold">{dashboard.api_performance.p95_response_time.toFixed(0)}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Error Rate</span>
                    <div className="font-semibold">{dashboard.api_performance.error_rate.toFixed(2)}%</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Response Time</span>
                    <div className="font-semibold">{dashboard.api_performance.avg_response_time.toFixed(0)}ms</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slowest Endpoints */}
            {dashboard.api_performance.slowest_endpoints && dashboard.api_performance.slowest_endpoints.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Slowest API Endpoints</h4>
                <div className="space-y-2">
                  {dashboard.api_performance.slowest_endpoints.slice(0, 5).map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium truncate flex-1">{endpoint.endpoint}</span>
                      <div className="flex items-center gap-4 ml-4">
                        <span className="text-sm text-gray-600">{endpoint.avg_time.toFixed(0)}ms</span>
                        <Badge variant={endpoint.error_rate > 5 ? 'error' : endpoint.error_rate > 1 ? 'warning' : 'success'}>
                          {endpoint.error_rate.toFixed(1)}% errors
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Pages */}
            {dashboard.user_activity.top_pages && dashboard.user_activity.top_pages.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Most Popular Pages</h4>
                <div className="space-y-2">
                  {dashboard.user_activity.top_pages.slice(0, 5).map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium truncate flex-1">{page.page}</span>
                      <span className="text-sm text-gray-600 ml-4">{page.views.toLocaleString()} views</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Summary Stats */}
        {!detailed && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600">Page Views</div>
                <div className="text-lg font-semibold">{dashboard.page_performance.total_page_views.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">API Requests</div>
                <div className="text-lg font-semibold">{dashboard.api_performance.total_requests.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Errors</div>
                <div className="text-lg font-semibold text-red-600">{dashboard.error_summary.total_errors}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}