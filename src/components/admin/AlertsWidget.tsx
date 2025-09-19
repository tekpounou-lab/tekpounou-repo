import React from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { AlertTriangle, XCircle, Clock, Info } from 'lucide-react'

interface Alert {
  id: string
  type: 'error' | 'health' | 'maintenance' | 'feedback'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: string
  resolved: boolean
}

interface AlertsWidgetProps {
  alerts: Alert[]
  onResolve?: (alertId: string) => Promise<void>
  className?: string
}

export function AlertsWidget({ alerts, onResolve, className = '' }: AlertsWidgetProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case 'medium':
        return <Info className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50'
      case 'high':
        return 'border-orange-500 bg-orange-50'
      case 'medium':
        return 'border-yellow-500 bg-yellow-50'
      default:
        return 'border-blue-500 bg-blue-50'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-600 bg-red-100'
      case 'health':
        return 'text-orange-600 bg-orange-100'
      case 'maintenance':
        return 'text-blue-600 bg-blue-100'
      case 'feedback':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const activeAlerts = alerts.filter(alert => !alert.resolved)
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical')
  const highAlerts = activeAlerts.filter(alert => alert.severity === 'high')

  if (activeAlerts.length === 0) {
    return null
  }

  return (
    <Card className={`border-l-4 border-l-red-500 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
            <Badge variant="error">
              {activeAlerts.length} active
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            {criticalAlerts.length > 0 && (
              <span className="text-red-600 font-medium">
                {criticalAlerts.length} critical
              </span>
            )}
            {highAlerts.length > 0 && (
              <span className="text-orange-600 font-medium">
                {highAlerts.length} high priority
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {activeAlerts.slice(0, 10).map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border-l-4 rounded-r-lg ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getTypeColor(alert.type)} size="sm">
                        {alert.type}
                      </Badge>
                      <Badge 
                        variant={
                          alert.severity === 'critical' ? 'error' :
                          alert.severity === 'high' ? 'warning' : 'default'
                        }
                        size="sm"
                      >
                        {alert.severity}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium">{alert.message}</p>
                  </div>
                </div>
                
                {onResolve && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onResolve(alert.id)}
                    className="ml-4"
                  >
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {activeAlerts.length > 10 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All {activeAlerts.length} Alerts
            </Button>
          </div>
        )}

        {criticalAlerts.length > 0 && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">
                Immediate attention required for {criticalAlerts.length} critical alert{criticalAlerts.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}