import React, { useState, useEffect } from 'react'
import { useMonitoringDashboard } from '../../hooks/useMonitoring'
import { SystemHealthWidget } from './SystemHealthWidget'
import { PerformanceWidget } from './PerformanceWidget'
import { ErrorTrackingWidget } from './ErrorTrackingWidget'
import { FeedbackWidget } from './FeedbackWidget'
import { MaintenanceWidget } from './MaintenanceWidget'
import { AlertsWidget } from './AlertsWidget'
import { AuditTrailWidget } from './AuditTrailWidget'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { RefreshCw, Download, Settings, AlertTriangle } from 'lucide-react'

interface MonitoringDashboardProps {
  className?: string
}

export function MonitoringDashboard({ className = '' }: MonitoringDashboardProps) {
  const {
    systemHealth,
    performance,
    errorTracking,
    feedbackManagement,
    maintenance,
    auditTrail,
    dataExport,
    alerts,
    refreshAll
  } = useMonitoringDashboard()

  const [refreshing, setRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'health' | 'performance' | 'errors' | 'feedback' | 'maintenance' | 'audit'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshAll()
    } catch (error) {
      console.error('Failed to refresh dashboard:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleExportReport = async () => {
    try {
      const report = await performance.generateReport(24, true)
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `monitoring_report_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export report:', error)
    }
  }

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && !alert.resolved)
  const overallStatus = systemHealth.health?.overall_status || 'unknown'

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            overallStatus === 'healthy' ? 'bg-green-100 text-green-800' :
            overallStatus === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
            overallStatus === 'unhealthy' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
          </div>
          {criticalAlerts.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">{criticalAlerts.length} Critical Alerts</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            Auto-refresh
          </label>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportReport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'health', label: 'System Health' },
            { id: 'performance', label: 'Performance' },
            { id: 'errors', label: 'Error Tracking' },
            { id: 'feedback', label: 'User Feedback' },
            { id: 'maintenance', label: 'Maintenance' },
            { id: 'audit', label: 'Audit Trail' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.id === 'errors' && errorTracking.errors.filter(e => !e.is_resolved).length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                  {errorTracking.errors.filter(e => !e.is_resolved).length}
                </span>
              )}
              {tab.id === 'feedback' && feedbackManagement.feedback.filter(f => f.status === 'pending').length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                  {feedbackManagement.feedback.filter(f => f.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Content */}
      <div className="space-y-6">
        {selectedTab === 'overview' && (
          <>
            {/* Critical Alerts */}
            {alerts.length > 0 && (
              <AlertsWidget alerts={alerts} className="mb-6" />
            )}
            
            {/* Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SystemHealthWidget 
                health={systemHealth.health}
                loading={systemHealth.loading}
                error={systemHealth.error}
                onRefresh={systemHealth.refetch}
              />
              
              <PerformanceWidget 
                dashboard={performance.dashboard}
                loading={performance.loading}
                error={performance.error}
                onRefresh={performance.refetch}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ErrorTrackingWidget 
                errors={errorTracking.errors.slice(0, 5)}
                loading={errorTracking.loading}
                onResolve={errorTracking.resolveError}
                compact
              />
              
              <FeedbackWidget 
                feedback={feedbackManagement.feedback.slice(0, 5)}
                loading={feedbackManagement.loading}
                onUpdateStatus={feedbackManagement.updateFeedbackStatus}
                compact
              />
              
              <MaintenanceWidget 
                notifications={maintenance.notifications.slice(0, 3)}
                loading={maintenance.loading}
                onUpdateStatus={maintenance.updateNotificationStatus}
                compact
              />
            </div>
          </>
        )}
        
        {selectedTab === 'health' && (
          <SystemHealthWidget 
            health={systemHealth.health}
            loading={systemHealth.loading}
            error={systemHealth.error}
            onRefresh={systemHealth.refetch}
            onUpdateService={systemHealth.updateServiceHealth}
            detailed
          />
        )}
        
        {selectedTab === 'performance' && (
          <PerformanceWidget 
            dashboard={performance.dashboard}
            loading={performance.loading}
            error={performance.error}
            onRefresh={performance.refetch}
            onGenerateReport={performance.generateReport}
            detailed
          />
        )}
        
        {selectedTab === 'errors' && (
          <ErrorTrackingWidget 
            errors={errorTracking.errors}
            loading={errorTracking.loading}
            onResolve={errorTracking.resolveError}
            onFetch={errorTracking.fetchErrors}
            detailed
          />
        )}
        
        {selectedTab === 'feedback' && (
          <FeedbackWidget 
            feedback={feedbackManagement.feedback}
            loading={feedbackManagement.loading}
            onUpdateStatus={feedbackManagement.updateFeedbackStatus}
            onFetch={feedbackManagement.fetchFeedback}
            detailed
          />
        )}
        
        {selectedTab === 'maintenance' && (
          <MaintenanceWidget 
            notifications={maintenance.notifications}
            loading={maintenance.loading}
            onUpdateStatus={maintenance.updateNotificationStatus}
            onSchedule={maintenance.scheduleNotification}
            onFetch={maintenance.fetchNotifications}
            detailed
          />
        )}
        
        {selectedTab === 'audit' && (
          <AuditTrailWidget 
            auditTrail={auditTrail.auditTrail}
            loading={auditTrail.loading}
            onFetch={auditTrail.fetchAuditTrail}
            onExport={dataExport.exportData}
          />
        )}
      </div>
    </div>
  )
}