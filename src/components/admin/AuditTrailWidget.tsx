import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { FileText, RefreshCw, Filter, Download, Eye, Search, Calendar } from 'lucide-react'
import { AuditTrailEntry } from '../../lib/monitoringService'

interface AuditTrailWidgetProps {
  auditTrail: AuditTrailEntry[]
  loading: boolean
  onFetch: (startDate?: string, endDate?: string, actionType?: string, userId?: string, resourceType?: string, limit?: number) => Promise<void>
  onExport: (dataType: 'audit_trail', startDate: string, endDate: string, format?: 'json' | 'csv') => Promise<void>
  className?: string
}

export function AuditTrailWidget({
  auditTrail,
  loading,
  onFetch,
  onExport,
  className = ''
}: AuditTrailWidgetProps) {
  const [selectedEntry, setSelectedEntry] = useState<AuditTrailEntry | null>(null)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    actionType: '',
    userId: '',
    resourceType: '',
    searchTerm: ''
  })
  const [exporting, setExporting] = useState(false)

  const handleFilter = () => {
    onFetch(
      filters.startDate || undefined,
      filters.endDate || undefined,
      filters.actionType || undefined,
      filters.userId || undefined,
      filters.resourceType || undefined,
      100
    )
  }

  const handleExport = async (format: 'json' | 'csv' = 'json') => {
    setExporting(true)
    try {
      const startDate = filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const endDate = filters.endDate || new Date().toISOString().split('T')[0]
      await onExport('audit_trail', startDate, endDate, format)
    } catch (err) {
      console.error('Failed to export audit trail:', err)
    } finally {
      setExporting(false)
    }
  }

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'user_management':
        return 'text-blue-600 bg-blue-50'
      case 'payment_processing':
        return 'text-green-600 bg-green-50'
      case 'security_event':
        return 'text-red-600 bg-red-50'
      case 'system_configuration':
        return 'text-purple-600 bg-purple-50'
      case 'content_moderation':
        return 'text-orange-600 bg-orange-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getActionIcon = (actionName: string) => {
    if (actionName === 'CREATE') return '➕'
    if (actionName === 'UPDATE') return '✏️'
    if (actionName === 'DELETE') return '🗑️'
    return '📝'
  }

  const filteredAuditTrail = auditTrail.filter(entry => {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      return (
        entry.action_name.toLowerCase().includes(searchLower) ||
        entry.action_type.toLowerCase().includes(searchLower) ||
        entry.resource_type?.toLowerCase().includes(searchLower) ||
        entry.user_id?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const todayEntries = auditTrail.filter(entry => 
    new Date(entry.created_at).toDateString() === new Date().toDateString()
  )
  const failedActions = auditTrail.filter(entry => !entry.success)
  const uniqueUsers = new Set(auditTrail.map(entry => entry.user_id).filter(Boolean)).size

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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Audit Trail</h3>
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </Button>
              
              <Button variant="ghost" size="sm" onClick={() => onFetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Total Entries</div>
              <div className="text-xl font-bold text-blue-900">{auditTrail.length}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Today</div>
              <div className="text-xl font-bold text-green-900">{todayEntries.length}</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-sm text-red-600 font-medium">Failed Actions</div>
              <div className="text-xl font-bold text-red-900">{failedActions.length}</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Unique Users</div>
              <div className="text-xl font-bold text-purple-900">{uniqueUsers}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Type
                </label>
                <select
                  value={filters.actionType}
                  onChange={(e) => setFilters(prev => ({ ...prev, actionType: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="">All Actions</option>
                  <option value="user_management">User Management</option>
                  <option value="payment_processing">Payment Processing</option>
                  <option value="course_management">Course Management</option>
                  <option value="content_moderation">Content Moderation</option>
                  <option value="system_configuration">System Configuration</option>
                  <option value="security_event">Security Event</option>
                  <option value="ai_configuration">AI Configuration</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource Type
                </label>
                <select
                  value={filters.resourceType}
                  onChange={(e) => setFilters(prev => ({ ...prev, resourceType: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="">All Resources</option>
                  <option value="user_profiles">User Profiles</option>
                  <option value="courses">Courses</option>
                  <option value="payments">Payments</option>
                  <option value="ai_personalizations">AI Personalizations</option>
                  <option value="blog_posts">Blog Posts</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  value={filters.userId}
                  onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  placeholder="Enter user ID..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="w-full text-sm border border-gray-300 rounded px-8 py-1"
                    placeholder="Search entries..."
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFilter}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Apply Filters
              </Button>
            </div>
          </div>

          {/* Audit Trail List */}
          <div className="space-y-3">
            {filteredAuditTrail.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No audit trail entries found</p>
              </div>
            ) : (
              filteredAuditTrail.map((entry) => (
                <div key={entry.id} className={`p-4 border rounded-lg hover:bg-gray-50 ${
                  !entry.success ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-lg">{getActionIcon(entry.action_name)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getActionTypeColor(entry.action_type)} size="sm">
                            {entry.action_type.replace('_', ' ')}
                          </Badge>
                          <Badge 
                            variant={entry.success ? 'success' : 'error'} 
                            size="sm"
                          >
                            {entry.action_name}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {new Date(entry.created_at).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-900 mb-1">
                          <strong>{entry.resource_type}</strong>
                          {entry.resource_id && (
                            <span className="text-gray-600 ml-2">ID: {entry.resource_id.substring(0, 8)}...</span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          User: {entry.user_id ? entry.user_id.substring(0, 8) + '...' : 'System'}
                          {entry.ip_address && (
                            <span className="ml-4">IP: {entry.ip_address}</span>
                          )}
                        </div>
                        
                        {!entry.success && entry.error_message && (
                          <div className="mt-2 text-sm text-red-600">
                            Error: {entry.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {filteredAuditTrail.length > 0 && filteredAuditTrail.length < auditTrail.length && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing {filteredAuditTrail.length} of {auditTrail.length} entries
            </div>
          )}
        </div>
      </Card>

      {/* Audit Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Audit Entry Details</h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Action:</strong> {selectedEntry.action_name}</div>
                      <div><strong>Type:</strong> {selectedEntry.action_type.replace('_', ' ')}</div>
                      <div><strong>Resource:</strong> {selectedEntry.resource_type}</div>
                      <div><strong>Resource ID:</strong> {selectedEntry.resource_id || 'N/A'}</div>
                      <div><strong>Success:</strong> 
                        <Badge variant={selectedEntry.success ? 'success' : 'error'} size="sm" className="ml-2">
                          {selectedEntry.success ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div><strong>Timestamp:</strong> {new Date(selectedEntry.created_at).toLocaleString()}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Context</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>User ID:</strong> {selectedEntry.user_id || 'System'}</div>
                      <div><strong>IP Address:</strong> {selectedEntry.ip_address || 'N/A'}</div>
                      <div><strong>User Agent:</strong> 
                        <div className="mt-1 text-xs text-gray-600 break-all">
                          {selectedEntry.user_agent || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedEntry.error_message && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Error Message</h4>
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {selectedEntry.error_message}
                    </div>
                  </div>
                )}

                {selectedEntry.old_values && Object.keys(selectedEntry.old_values).length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Previous Values</h4>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedEntry.old_values, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedEntry.new_values && Object.keys(selectedEntry.new_values).length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">New Values</h4>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedEntry.new_values, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}