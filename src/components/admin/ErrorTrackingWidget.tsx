import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { AlertTriangle, RefreshCw, CheckCircle, Eye, Filter, Calendar } from 'lucide-react'

interface ErrorTrackingWidgetProps {
  errors: any[]
  loading: boolean
  onResolve: (errorId: string, resolutionNotes: string) => Promise<void>
  onFetch?: (startDate?: string, endDate?: string, isResolved?: boolean, limit?: number) => Promise<void>
  compact?: boolean
  detailed?: boolean
  className?: string
}

export function ErrorTrackingWidget({
  errors,
  loading,
  onResolve,
  onFetch,
  compact = false,
  detailed = false,
  className = ''
}: ErrorTrackingWidgetProps) {
  const [selectedError, setSelectedError] = useState<any>(null)
  const [resolving, setResolving] = useState<string | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  })

  const handleResolve = async (errorId: string) => {
    if (!resolutionNotes.trim()) {
      alert('Please provide resolution notes')
      return
    }

    setResolving(errorId)
    try {
      await onResolve(errorId, resolutionNotes)
      setSelectedError(null)
      setResolutionNotes('')
    } catch (err) {
      console.error('Failed to resolve error:', err)
    } finally {
      setResolving(null)
    }
  }

  const handleFilter = () => {
    if (onFetch) {
      onFetch(
        dateFilter.startDate || undefined,
        dateFilter.endDate || undefined,
        showResolved ? undefined : false,
        detailed ? 100 : 50
      )
    }
  }

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'application':
        return 'text-red-600 bg-red-50'
      case 'page':
        return 'text-orange-600 bg-orange-50'
      case 'component':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const unresolvedErrors = errors.filter(error => !error.is_resolved)
  const recentErrors = errors.filter(error => 
    new Date(error.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  )

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
                Error Tracking
              </h3>
              <AlertTriangle className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-red-500`} />
              {unresolvedErrors.length > 0 && (
                <Badge variant="error">
                  {unresolvedErrors.length} unresolved
                </Badge>
              )}
            </div>
            
            {!compact && (
              <div className="flex items-center gap-2">
                {detailed && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowResolved(!showResolved)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      {showResolved ? 'Hide Resolved' : 'Show Resolved'}
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dateFilter.startDate}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      />
                      <span className="text-sm text-gray-500">to</span>
                      <input
                        type="date"
                        value={dateFilter.endDate}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFilter}
                      >
                        Apply
                      </Button>
                    </div>
                  </>
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
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-sm text-red-600 font-medium">Total Errors</div>
                <div className="text-xl font-bold text-red-900">{errors.length}</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">Unresolved</div>
                <div className="text-xl font-bold text-orange-900">{unresolvedErrors.length}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Last 24h</div>
                <div className="text-xl font-bold text-blue-900">{recentErrors.length}</div>
              </div>
            </div>
          )}

          {/* Error List */}
          <div className="space-y-3">
            {errors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>No errors to display</p>
              </div>
            ) : (
              errors.slice(0, compact ? 5 : undefined).map((error) => (
                <div key={error.id} className={`p-4 border rounded-lg ${
                  error.is_resolved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(error.error_boundary_level)}>
                          {error.error_boundary_level}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {new Date(error.timestamp).toLocaleString()}
                        </span>
                        {error.user && (
                          <span className="text-sm text-blue-600">
                            User: {error.user.email}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-1">
                        {error.error_message.length > 100 
                          ? `${error.error_message.substring(0, 100)}...`
                          : error.error_message
                        }
                      </h4>
                      
                      <p className="text-sm text-gray-600">
                        Page: {error.page_url}
                      </p>
                      
                      {error.is_resolved && error.resolved_by && (
                        <div className="mt-2 text-sm text-green-600">
                          ✓ Resolved by {error.resolved_by.email} on {new Date(error.resolved_at).toLocaleString()}
                          {error.resolution_notes && (
                            <div className="mt-1 text-gray-600">
                              Notes: {error.resolution_notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedError(error)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {!error.is_resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedError(error)
                            setResolutionNotes('')
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {compact && errors.length > 5 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm">
                View All {errors.length} Errors
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Error Detail Modal */}
      {selectedError && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedError(null)
            setResolutionNotes('')
          }}
          title="Error Details"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Error Message</h4>
              <div className="p-3 bg-gray-50 rounded border">
                <code className="text-sm">{selectedError.error_message}</code>
              </div>
            </div>

            {selectedError.error_stack && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Stack Trace</h4>
                <div className="p-3 bg-gray-50 rounded border max-h-40 overflow-y-auto">
                  <pre className="text-xs">{selectedError.error_stack}</pre>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Page:</strong> {selectedError.page_url}</div>
                  <div><strong>Level:</strong> {selectedError.error_boundary_level}</div>
                  <div><strong>Time:</strong> {new Date(selectedError.timestamp).toLocaleString()}</div>
                  {selectedError.user && (
                    <div><strong>User:</strong> {selectedError.user.email}</div>
                  )}
                </div>
              </div>

              {selectedError.device_info && Object.keys(selectedError.device_info).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Device Info</h4>
                  <div className="text-sm space-y-1">
                    {Object.entries(selectedError.device_info).map(([key, value]) => (
                      <div key={key}>
                        <strong className="capitalize">{key.replace('_', ' ')}:</strong> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!selectedError.is_resolved && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Resolve Error</h4>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter resolution notes..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedError(null)
                      setResolutionNotes('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleResolve(selectedError.id)}
                    disabled={resolving === selectedError.id || !resolutionNotes.trim()}
                  >
                    {resolving === selectedError.id ? 'Resolving...' : 'Mark as Resolved'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}