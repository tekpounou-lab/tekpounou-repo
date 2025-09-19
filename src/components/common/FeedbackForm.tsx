import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { MessageSquare, Send, Star, Bug, Lightbulb, Target, FileText, AlertTriangle } from 'lucide-react'
import { useFeedbackManagement } from '../../hooks/useMonitoring'
import { useAuth } from '../../hooks/useAuth'

interface FeedbackFormProps {
  module?: string
  isOpen?: boolean
  onClose?: () => void
  trigger?: 'button' | 'floating' | 'inline'
  className?: string
}

export function FeedbackForm({ 
  module,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  trigger = 'button',
  className = ''
}: FeedbackFormProps) {
  const { user } = useAuth()
  const { submitFeedback } = useFeedbackManagement()
  
  const [isOpen, setIsOpen] = useState(controlledIsOpen || false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    module: module || 'general',
    feedback_type: 'general_feedback' as const,
    rating: 0,
    title: '',
    comment: '',
    category: '',
    tags: [] as string[],
    priority: 'medium' as const
  })

  const handleOpen = () => {
    if (controlledIsOpen !== undefined) return
    setIsOpen(true)
    setSubmitted(false)
  }

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose()
    } else {
      setIsOpen(false)
    }
    
    // Reset form after a delay to allow modal to close
    setTimeout(() => {
      setFormData({
        module: module || 'general',
        feedback_type: 'general_feedback',
        rating: 0,
        title: '',
        comment: '',
        category: '',
        tags: [],
        priority: 'medium'
      })
      setSubmitted(false)
    }, 300)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !formData.title.trim() || !formData.comment.trim()) {
      return
    }

    setSubmitting(true)
    try {
      await submitFeedback({
        user_id: user.id,
        module: formData.module,
        feedback_type: formData.feedback_type,
        rating: formData.rating > 0 ? formData.rating : undefined,
        title: formData.title,
        comment: formData.comment,
        category: formData.category || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        priority: formData.priority,
        status: 'pending'
      })
      
      setSubmitted(true)
      
      // Auto-close after successful submission
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug_report':
        return <Bug className="w-5 h-5 text-red-500" />
      case 'feature_request':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />
      case 'improvement_suggestion':
        return <Target className="w-5 h-5 text-blue-500" />
      case 'usability_issue':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case 'content_feedback':
        return <FileText className="w-5 h-5 text-purple-500" />
      default:
        return <MessageSquare className="w-5 h-5 text-gray-500" />
    }
  }

  const currentIsOpen = controlledIsOpen !== undefined ? controlledIsOpen : isOpen

  // Floating Action Button
  if (trigger === 'floating') {
    return (
      <>
        <button
          onClick={handleOpen}
          className={`fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-40 ${className}`}
          title="Send Feedback"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
        
        {currentIsOpen && (
          <FeedbackModal
            isOpen={currentIsOpen}
            onClose={handleClose}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitted={submitted}
            addTag={addTag}
            removeTag={removeTag}
            getTypeIcon={getTypeIcon}
          />
        )}
      </>
    )
  }

  // Inline Form
  if (trigger === 'inline') {
    return (
      <Card className={className}>
        <FeedbackFormContent
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitted={submitted}
          addTag={addTag}
          removeTag={removeTag}
          getTypeIcon={getTypeIcon}
          inline
        />
      </Card>
    )
  }

  // Button Trigger
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className={`flex items-center gap-2 ${className}`}
      >
        <MessageSquare className="w-4 h-4" />
        Feedback
      </Button>
      
      {currentIsOpen && (
        <FeedbackModal
          isOpen={currentIsOpen}
          onClose={handleClose}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitted={submitted}
          addTag={addTag}
          removeTag={removeTag}
          getTypeIcon={getTypeIcon}
        />
      )}
    </>
  )
}

// Modal wrapper component
function FeedbackModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  submitting,
  submitted,
  addTag,
  removeTag,
  getTypeIcon
}: any) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Feedback"
      size="lg"
    >
      <FeedbackFormContent
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
        submitting={submitting}
        submitted={submitted}
        addTag={addTag}
        removeTag={removeTag}
        getTypeIcon={getTypeIcon}
        onClose={onClose}
      />
    </Modal>
  )
}

// Form content component
function FeedbackFormContent({
  formData,
  setFormData,
  onSubmit,
  submitting,
  submitted,
  addTag,
  removeTag,
  getTypeIcon,
  onClose,
  inline = false
}: any) {
  const [newTag, setNewTag] = useState('')

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault()
      addTag(newTag)
      setNewTag('')
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Feedback Submitted!
        </h3>
        <p className="text-gray-600">
          Thank you for your feedback. We'll review it and get back to you if needed.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className={inline ? 'p-6' : ''}>
      <div className="space-y-4">
        {/* Feedback Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedback Type
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              { value: 'bug_report', label: 'Bug Report' },
              { value: 'feature_request', label: 'Feature Request' },
              { value: 'improvement_suggestion', label: 'Improvement' },
              { value: 'usability_issue', label: 'Usability Issue' },
              { value: 'content_feedback', label: 'Content Feedback' },
              { value: 'general_feedback', label: 'General Feedback' }
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, feedback_type: type.value }))}
                className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                  formData.feedback_type === type.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {getTypeIcon(type.value)}
                  <span>{type.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Module */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Module/Section
          </label>
          <select
            value={formData.module}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, module: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="general">General</option>
            <option value="dashboard">Dashboard</option>
            <option value="courses">Courses</option>
            <option value="blog">Blog</option>
            <option value="services">Services</option>
            <option value="payments">Payments</option>
            <option value="ai_assistant">AI Assistant</option>
            <option value="mobile_app">Mobile App</option>
            <option value="search">Search</option>
            <option value="navigation">Navigation</option>
            <option value="user_experience">User Experience</option>
            <option value="performance">Performance</option>
            <option value="content_quality">Content Quality</option>
          </select>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating (optional)
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData((prev: any) => ({ 
                  ...prev, 
                  rating: prev.rating === star ? 0 : star 
                }))}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= formData.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300 hover:text-yellow-200'
                  }`}
                />
              </button>
            ))}
            {formData.rating > 0 && (
              <span className="ml-2 text-sm text-gray-600">
                {formData.rating} star{formData.rating !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, title: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Brief summary of your feedback..."
            required
          />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Details <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, comment: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Please provide detailed feedback. If reporting a bug, include steps to reproduce it..."
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category (optional)
          </label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, category: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., mobile, desktop, specific feature..."
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (optional)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleTagInput}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add tags (press Enter to add)..."
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, priority: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={submitting || !formData.title.trim() || !formData.comment.trim()}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </div>
    </form>
  )
}