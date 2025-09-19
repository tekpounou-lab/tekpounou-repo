import React from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { AlertTriangle, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import { SystemHealthStatus } from '../../lib/monitoringService'

interface SystemHealthWidgetProps {
  health: {
    overall_status: string
    services: SystemHealthStatus[]
    real_time_checks: Record<string, boolean>
    last_updated: string
    alerts: SystemHealthStatus[]
  } | null
  loading: boolean
  error: string | null
  onRefresh: () => void
  onUpdateService?: (serviceName: string, status: SystemHealthStatus['status'], uptime: number, responseTime: number, errorRate: number) => void
  detailed?: boolean
  className?: string
}

export function SystemHealthWidget({
  health,
  loading,
  error,
  onRefresh,
  onUpdateService,
  detailed = false,
  className = ''
}: SystemHealthWidgetProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'maintenance':
        return <Clock className="w-5 h-5 text-blue-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50'
      case 'unhealthy':
        return 'text-red-600 bg-red-50'
      case 'maintenance':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
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
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load System Health</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onRefresh} size="sm">Try Again</Button>
        </div>
      </Card>
    )
  }

  if (!health) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          No health data available
        </div>
      </Card>
    )
  }

  return (
    <Card className={`${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            {getStatusIcon(health.overall_status)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Last updated: {new Date(health.last_updated).toLocaleTimeString()}
            </span>
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <div className={`p-4 rounded-lg mb-6 ${getStatusColor(health.overall_status)}`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(health.overall_status)}
            <div>
              <h4 className="font-medium">Overall Status: {health.overall_status.charAt(0).toUpperCase() + health.overall_status.slice(1)}</h4>
              <p className="text-sm opacity-80">
                {health.services.length} services monitored, {health.alerts.length} alerts
              </p>
            </div>
          </div>
        </div>

        {/* Service List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Services</h4>
          {health.services.map((service) => (
            <div key={service.service_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(service.status)}
                <div>
                  <h5 className="font-medium text-gray-900 capitalize">
                    {service.service_name.replace('_', ' ')}
                  </h5>
                  {detailed && (
                    <div className="text-sm text-gray-600">
                      Uptime: {service.uptime_percentage?.toFixed(1)}% |
                      Response: {service.response_time_avg?.toFixed(0)}ms |
                      Errors: {service.error_rate?.toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge
                  variant={service.status === 'healthy' ? 'success' : 
                          service.status === 'degraded' ? 'warning' : 'error'}
                >
                  {service.status}
                </Badge>
                
                {detailed && service.alert_threshold_exceeded && (
                  <Badge variant="error">
                    Alert
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Real-time Checks */}
        {detailed && Object.keys(health.real_time_checks).length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Real-time Checks</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(health.real_time_checks).map(([check, status]) => (
                <div key={check} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  {status ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm capitalize">
                    {check.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts */}
        {health.alerts.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Active Alerts</h4>
            <div className="space-y-2">
              {health.alerts.map((alert) => (
                <div key={alert.service_name} className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">
                    {alert.service_name}: {alert.status}
                    {alert.health_details?.message && ` - ${alert.health_details.message}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}