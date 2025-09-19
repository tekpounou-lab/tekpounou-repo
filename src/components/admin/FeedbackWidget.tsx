import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { MessageSquare, RefreshCw, Filter, Star, ChevronRight, Send } from 'lucide-react'
import { UserFeedback } from '../../lib/monitoringService'

interface FeedbackWidgetProps {
  feedback: UserFeedback[]
  loading: boolean
  onUpdateStatus: (feedbackId: string, status: UserFeedback['status'], resolutionNotes?: string) => Promise<void>
  onFetch?: (module?: string, status?: string, priority?: string, limit?: number) => Promise<void>
  compact?: boolean
  detailed?: boolean
  className?: string
}

export function FeedbackWidget({
  feedback,
  loading,
  onUpdateStatus,
  onFetch,
  compact = false,
  detailed = false,
  className = ''
}: FeedbackWidgetProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<UserFeedback | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    module: '',
    status: '',
    priority: ''
  })

  const handleUpdateStatus = async (feedbackId: string, status: UserFeedback['status']) => {
    setUpdating(feedbackId)
    try {
      const notes = (status === 'resolved' && resolutionNotes.trim()) ? resolutionNotes : undefined
      await onUpdateStatus(feedbackId, status, notes)
      setSelectedFeedback(null)
      setResolutionNotes('')
    } catch (err) {
      console.error('Failed to update feedback status:', err)
    } finally {
      setUpdating(null)
    }
  }

  const handleFilter = () => {
    if (onFetch) {
      onFetch(
        filters.module || undefined,
        filters.status || undefined,
        filters.priority || undefined,
        detailed ? 100 : 50
      )
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-600 bg-green-50'
      case 'in_progress':
        return 'text-blue-600 bg-blue-50'
      case 'acknowledged':
        return 'text-yellow-600 bg-yellow-50'
      case 'rejected':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug_report':
        return '🐛'
      case 'feature_request':
        return '💡'
      case 'improvement_suggestion':
        return '⚡'
      case 'usability_issue':
        return '🎯'
      case 'content_feedback':
        return '📝'
      default:
        return '💬'
    }
  }

  const pendingFeedback = feedback.filter(f => f.status === 'pending')
  const highPriorityFeedback = feedback.filter(f => f.priority === 'high' || f.priority === 'critical')
  const avgRating = feedback.length > 0 
    ? feedback.filter(f => f.rating).reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.filter(f => f.rating).length
    : 0

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
                User Feedback
              </h3>
              <MessageSquare className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500`} />
              {pendingFeedback.length > 0 && (
                <Badge variant="warning">
                  {pendingFeedback.length} pending
                </Badge>
              )}
            </div>
            
            {!compact && (
              <div className="flex items-center gap-2">
                {detailed && (
                  <>
                    <select
                      value={filters.module}
                      onChange={(e) => setFilters(prev => ({ ...prev, module: e.target.value }))}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">All Modules</option>
                      <option value="dashboard">Dashboard</option>
                      <option value="courses">Courses</option>
                      <option value="blog">Blog</option>
                      <option value="services">Services</option>
                      <option value="ai_assistant">AI Assistant</option>
                    </select>
                    
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFilter}
                      className="flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Filter
                    </Button>
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
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Total</div>
                <div className="text-xl font-bold text-blue-900">{feedback.length}</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-sm text-yellow-600 font-medium">Pending</div>
                <div className="text-xl font-bold text-yellow-900">{pendingFeedback.length}</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-sm text-red-600 font-medium">High Priority</div>
                <div className="text-xl font-bold text-red-900">{highPriorityFeedback.length}</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Avg Rating</div>
                <div className="text-xl font-bold text-green-900 flex items-center gap-1">
                  {avgRating.toFixed(1)}
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                </div>
              </div>
            </div>
          )}

          {/* Feedback List */}
          <div className="space-y-3">
            {feedback.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No feedback to display</p>
              </div>
            ) : (
              feedback.slice(0, compact ? 5 : undefined).map((item) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{getTypeIcon(item.feedback_type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getPriorityColor(item.priority)} size="sm">
                            {item.priority}
                          </Badge>
                          <Badge className={getStatusColor(item.status)} size="sm">
                            {item.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-600 capitalize">
                            {item.module.replace('_', ' ')}
                          </span>
                          {item.rating && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < item.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{item.comment}</p>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          {new Date(item.created_at || '').toLocaleString()}
                          {item.category && (
                            <span className="ml-2">• Category: {item.category}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFeedback(item)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      
                      {item.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(item.id!, 'acknowledged')}
                          disabled={updating === item.id}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {compact && feedback.length > 5 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm">
                View All {feedback.length} Feedback
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedFeedback(null)
            setResolutionNotes('')
          }}
          title="Feedback Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getTypeIcon(selectedFeedback.feedback_type)}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedFeedback.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getPriorityColor(selectedFeedback.priority)}>
                    {selectedFeedback.priority} priority
                  </Badge>
                  <Badge className={getStatusColor(selectedFeedback.status)}>
                    {selectedFeedback.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-gray-600 capitalize">
                    {selectedFeedback.module.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Feedback</h4>
              <div className="p-3 bg-gray-50 rounded border">
                {selectedFeedback.comment}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Type:</strong> {selectedFeedback.feedback_type.replace('_', ' ')}</div>
                  <div><strong>Module:</strong> {selectedFeedback.module.replace('_', ' ')}</div>
                  <div><strong>Created:</strong> {new Date(selectedFeedback.created_at || '').toLocaleString()}</div>
                  {selectedFeedback.rating && (
                    <div className="flex items-center gap-2">
                      <strong>Rating:</strong>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < selectedFeedback.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedFeedback.tags && selectedFeedback.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedFeedback.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedFeedback.status !== 'resolved' && selectedFeedback.status !== 'rejected' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
                <div className="space-y-3">
                  {selectedFeedback.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUpdateStatus(selectedFeedback.id!, 'acknowledged')}
                        disabled={updating === selectedFeedback.id}
                        size="sm"
                      >
                        Acknowledge
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus(selectedFeedback.id!, 'in_progress')}
                        disabled={updating === selectedFeedback.id}
                        size="sm"
                      >
                        Start Working
                      </Button>
                    </div>
                  )}
                  
                  <div>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Enter resolution notes (optional)..."
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdateStatus(selectedFeedback.id!, 'resolved')}
                      disabled={updating === selectedFeedback.id}
                      className="flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Mark as Resolved
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedFeedback.id!, 'rejected')}
                      disabled={updating === selectedFeedback.id}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedFeedback.resolution_notes && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Resolution Notes</h4>
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  {selectedFeedback.resolution_notes}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}