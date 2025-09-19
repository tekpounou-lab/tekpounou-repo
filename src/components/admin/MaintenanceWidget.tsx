import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { Calendar, Clock, RefreshCw, Plus, Settings, AlertTriangle } from 'lucide-react'
import { MaintenanceNotification } from '../../lib/monitoringService'

interface MaintenanceWidgetProps {
  notifications: MaintenanceNotification[]
  loading: boolean
  onUpdateStatus: (notificationId: string, status: MaintenanceNotification['status'], actualStart?: string, actualEnd?: string) => Promise<void>
  onSchedule?: (notification: Omit<MaintenanceNotification, 'id'>) => Promise<string>
  onFetch?: (startDate?: string, endDate?: string, status?: string) => Promise<void>
  compact?: boolean
  detailed?: boolean
  className?: string
}

export function MaintenanceWidget({
  notifications,
  loading,
  onUpdateStatus,
  onSchedule,
  onFetch,
  compact = false,
  detailed = false,
  className = ''
}: MaintenanceWidgetProps) {
  const [selectedNotification, setSelectedNotification] = useState<MaintenanceNotification | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [newNotification, setNewNotification] = useState({
    title: '',
    description: '',
    maintenance_type: 'scheduled' as const,
    scheduled_start: '',
    scheduled_end: '',
    affected_services: [] as string[],
    severity: 'medium' as const,
    user_groups: ['all'] as string[]
  })

  const handleUpdateStatus = async (
    notificationId: string, 
    status: MaintenanceNotification['status'],
    actualStart?: string,
    actualEnd?: string
  ) => {
    setUpdating(notificationId)
    try {
      await onUpdateStatus(notificationId, status, actualStart, actualEnd)
      setSelectedNotification(null)
    } catch (err) {
      console.error('Failed to update maintenance status:', err)
    } finally {
      setUpdating(null)
    }
  }

  const handleSchedule = async () => {
    if (!onSchedule) return
    
    try {
      await onSchedule(newNotification)
      setShowScheduleModal(false)
      setNewNotification({
        title: '',
        description: '',
        maintenance_type: 'scheduled',
        scheduled_start: '',
        scheduled_end: '',
        affected_services: [],
        severity: 'medium',
        user_groups: ['all']
      })
      onFetch?.()
    } catch (err) {
      console.error('Failed to schedule maintenance:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'text-blue-600 bg-blue-50'
      case 'in_progress':
        return 'text-orange-600 bg-orange-50'
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'cancelled':
        return 'text-red-600 bg-red-50'
      case 'extended':
        return 'text-purple-600 bg-purple-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50'
      case 'high':
        return 'text-orange-600 bg-orange-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-blue-600 bg-blue-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return '⚠️'
      case 'security_update':
        return '🔒'
      case 'feature_update':
        return '✨'
      case 'infrastructure':
        return '🛠️'
      default:
        return '🔧'
    }
  }

  const upcomingMaintenance = notifications.filter(n => 
    n.status === 'scheduled' && new Date(n.scheduled_start) > new Date()
  )
  const activeMaintenance = notifications.filter(n => n.status === 'in_progress')
  const thisWeekMaintenance = notifications.filter(n => {
    const start = new Date(n.scheduled_start)
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    return start <= weekFromNow && start > new Date()
  })

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className={`${compact ? 'text-md' : 'text-lg'} font-semibold text-gray-900`}>
                Maintenance
              </h3>
              <Settings className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500`} />
              {activeMaintenance.length > 0 && (
                <Badge variant="warning">
                  {activeMaintenance.length} active
                </Badge>
              )}
            </div>
            
            {!compact && (
              <div className="flex items-center gap-2">
                {onSchedule && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowScheduleModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Schedule
                  </Button>
                )}
                
                <Button variant="ghost" size="sm" onClick={() => onFetch?.()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {!compact && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Upcoming</div>
                <div className="text-xl font-bold text-blue-900">{upcomingMaintenance.length}</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">Active</div>
                <div className="text-xl font-bold text-orange-900">{activeMaintenance.length}</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">This Week</div>
                <div className="text-xl font-bold text-purple-900">{thisWeekMaintenance.length}</div>
              </div>
            </div>
          )}

          {/* Active Maintenance Alert */}
          {activeMaintenance.length > 0 && (
            <div className="mb-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">
                  {activeMaintenance.length} maintenance window{activeMaintenance.length !== 1 ? 's' : ''} currently active
                </span>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No maintenance scheduled</p>
              </div>
            ) : (
              notifications.slice(0, compact ? 3 : undefined).map((notification) => (
                <div key={notification.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{getTypeIcon(notification.maintenance_type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(notification.status)} size="sm">
                            {notification.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getSeverityColor(notification.severity)} size="sm">
                            {notification.severity}
                          </Badge>
                          <span className="text-sm text-gray-600 capitalize">
                            {notification.maintenance_type.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <h4 className="font-medium text-gray-900 mb-1">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{notification.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(notification.scheduled_start).toLocaleDateString()} 
                              {new Date(notification.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {Math.round(
                                (new Date(notification.scheduled_end).getTime() - 
                                 new Date(notification.scheduled_start).getTime()) / (1000 * 60)
                              )} minutes
                            </span>
                          </div>
                        </div>
                        
                        {notification.affected_services.length > 0 && (
                          <div className="mt-2">
                            <span className="text-sm text-gray-600">Affected services: </span>
                            <span className="text-sm text-gray-900">
                              {notification.affected_services.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedNotification(notification)}
                      >
                        View
                      </Button>
                      
                      {notification.status === 'scheduled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(notification.id!, 'in_progress', new Date().toISOString())}
                          disabled={updating === notification.id}
                        >
                          Start
                        </Button>
                      )}
                      
                      {notification.status === 'in_progress' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(notification.id!, 'completed', undefined, new Date().toISOString())}
                          disabled={updating === notification.id}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {compact && notifications.length > 3 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm">
                View All {notifications.length} Notifications
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Schedule Maintenance Modal */}
      {showScheduleModal && onSchedule && (
        <Modal
          isOpen={true}
          onClose={() => setShowScheduleModal(false)}
          title="Schedule Maintenance"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={newNotification.title}
                onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter maintenance title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newNotification.description}
                onChange={(e) => setNewNotification(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Describe the maintenance work..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={newNotification.maintenance_type}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, maintenance_type: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="emergency">Emergency</option>
                  <option value="security_update">Security Update</option>
                  <option value="feature_update">Feature Update</option>
                  <option value="infrastructure">Infrastructure</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={newNotification.severity}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, severity: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={newNotification.scheduled_start}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, scheduled_start: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={newNotification.scheduled_end}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, scheduled_end: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Affected Services (comma-separated)
              </label>
              <input
                type="text"
                value={newNotification.affected_services.join(', ')}
                onChange={(e) => setNewNotification(prev => ({ 
                  ...prev, 
                  affected_services: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="web_app, api, database..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSchedule}
                disabled={!newNotification.title || !newNotification.scheduled_start || !newNotification.scheduled_end}
              >
                Schedule Maintenance
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedNotification(null)}
          title="Maintenance Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getTypeIcon(selectedNotification.maintenance_type)}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedNotification.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(selectedNotification.status)}>
                    {selectedNotification.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getSeverityColor(selectedNotification.severity)}>
                    {selectedNotification.severity} severity
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <div className="p-3 bg-gray-50 rounded border">
                {selectedNotification.description}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Schedule</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Start:</strong> {new Date(selectedNotification.scheduled_start).toLocaleString()}</div>
                  <div><strong>End:</strong> {new Date(selectedNotification.scheduled_end).toLocaleString()}</div>
                  <div><strong>Duration:</strong> {
                    Math.round(
                      (new Date(selectedNotification.scheduled_end).getTime() - 
                       new Date(selectedNotification.scheduled_start).getTime()) / (1000 * 60)
                    )
                  } minutes</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Affected Services</h4>
                <div className="space-y-1">
                  {selectedNotification.affected_services.length > 0 ? (
                    selectedNotification.affected_services.map((service, index) => (
                      <Badge key={index} variant="outline" size="sm" className="mr-1 mb-1">
                        {service}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No specific services affected</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Target Users</h4>
              <div className="flex flex-wrap gap-1">
                {selectedNotification.user_groups.map((group, index) => (
                  <Badge key={index} variant="outline" size="sm">
                    {group}
                  </Badge>
                ))}
              </div>
            </div>

            {(selectedNotification.status === 'scheduled' || selectedNotification.status === 'in_progress') && (
              <div className="flex justify-end gap-2 pt-4">
                {selectedNotification.status === 'scheduled' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedNotification.id!, 'cancelled')}
                      disabled={updating === selectedNotification.id}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus(selectedNotification.id!, 'in_progress', new Date().toISOString())}
                      disabled={updating === selectedNotification.id}
                    >
                      Start Maintenance
                    </Button>
                  </>
                )}
                
                {selectedNotification.status === 'in_progress' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedNotification.id!, 'extended')}
                      disabled={updating === selectedNotification.id}
                    >
                      Extend
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus(selectedNotification.id!, 'completed', undefined, new Date().toISOString())}
                      disabled={updating === selectedNotification.id}
                    >
                      Complete
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}