import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

import { performanceMonitor } from '@/lib/performanceService'
import { supabase } from '@/lib/supabase'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showErrorDetails?: boolean
  level?: 'page' | 'component' | 'global'
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
  isRetrying: boolean
}

interface ErrorReport {
  id: string
  error_message: string
  error_stack: string
  component_stack: string
  user_id?: string
  page_url: string
  user_agent: string
  timestamp: string
  error_boundary_level: string
  additional_info: Record<string, any>
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isRetrying: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.generateErrorId()
    
    this.setState({
      errorInfo,
      errorId,
    })

    // Log error to performance monitoring
    performanceMonitor.trackCustomMetric('error_boundary_triggered', 1, {
      error_message: error.message,
      error_stack: error.stack,
      component_stack: errorInfo.componentStack,
      level: this.props.level || 'component',
    })

    // Report error to backend
    this.reportError(error, errorInfo, errorId)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🔥 Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.groupEnd()
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async reportError(error: Error, errorInfo: ErrorInfo, errorId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const errorReport: Omit<ErrorReport, 'id'> = {
        error_message: error.message,
        error_stack: error.stack || '',
        component_stack: errorInfo.componentStack,
        user_id: user?.id,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        error_boundary_level: this.props.level || 'component',
        additional_info: {
          error_id: errorId,
          react_version: React.version,
          props_keys: Object.keys(this.props),
          window_dimensions: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          memory_info: (performance as any).memory ? {
            used: (performance as any).memory.usedJSHeapSize,
            total: (performance as any).memory.totalJSHeapSize,
            limit: (performance as any).memory.jsHeapSizeLimit,
          } : null,
        },
      }

      const { error: insertError } = await supabase
        .from('error_reports')
        .insert([errorReport])

      if (insertError) {
        console.error('Failed to report error to backend:', insertError)
      }
    } catch (reportingError) {
      console.error('Error reporting failed:', reportingError)
    }
  }

  private handleRetry = () => {
    this.setState({ isRetrying: true })
    
    // Clear error state after a brief delay to show loading state
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        isRetrying: false,
      })
    }, 1000)
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private handleReportBug = () => {
    const { error, errorId } = this.state
    const mailtoLink = `mailto:support@tekpounou.com?subject=Bug Report - ${errorId}&body=Error ID: ${errorId}%0D%0AError: ${encodeURIComponent(error?.message || 'Unknown error')}%0D%0APage: ${encodeURIComponent(window.location.href)}`
    window.open(mailtoLink)
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-red-200">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Quelque chose s'est mal passé
                </h3>
                <p className="text-gray-600 mb-6">
                  Une erreur inattendue s'est produite. Nous avons été notifiés du problème.
                </p>

                {this.props.showErrorDetails && this.state.error && (
                  <div className="mb-6 p-3 bg-gray-50 rounded border text-left">
                    <p className="text-xs font-mono text-gray-700 break-all">
                      {this.state.error.message}
                    </p>
                    {this.state.errorId && (
                      <p className="text-xs text-gray-500 mt-2">
                        ID d'erreur: {this.state.errorId}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleRetry}
                    disabled={this.state.isRetrying}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {this.state.isRetrying ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Rechargement...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Réessayer
                      </>
                    )}
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Accueil
                  </button>
                </div>

                <button
                  onClick={this.handleReportBug}
                  className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Signaler le problème
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional component wrapper for easier usage
interface ErrorBoundaryWrapperProps extends Omit<Props, 'children'> {
  children: ReactNode
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Specialized error boundaries for different use cases
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="page"
      showErrorDetails={process.env.NODE_ENV === 'development'}
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-lg w-full mx-auto text-center p-6">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Page non disponible
              </h1>
              <p className="text-gray-600 mb-6">
                Cette page a rencontré une erreur. Nous travaillons à résoudre le problème.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Recharger la page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ 
  children, 
  name 
}: { 
  children: ReactNode
  name?: string 
}) {
  return (
    <ErrorBoundary
      level="component"
      fallback={
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">
              {name ? `Le composant "${name}" a rencontré une erreur.` : 'Ce composant a rencontré une erreur.'}
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// Hook for error reporting from components
export function useErrorReporting() {
  const reportError = async (error: Error, context?: Record<string, any>) => {
    try {
      performanceMonitor.trackCustomMetric('manual_error_report', 1, {
        error_message: error.message,
        error_stack: error.stack,
        context,
      })

      const { data: { user } } = await supabase.auth.getUser()
      
      const errorReport = {
        error_message: error.message,
        error_stack: error.stack || '',
        component_stack: '',
        user_id: user?.id,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        error_boundary_level: 'manual',
        additional_info: {
          context,
          react_version: React.version,
        },
      }

      await supabase.from('error_reports').insert([errorReport])
    } catch (reportingError) {
      console.error('Manual error reporting failed:', reportingError)
    }
  }

  return { reportError }
}

// Global error handler setup
export function setupGlobalErrorHandling() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    performanceMonitor.trackCustomMetric('unhandled_promise_rejection', 1, {
      reason: event.reason?.toString(),
      stack: event.reason?.stack,
    })
  })

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    
    performanceMonitor.trackCustomMetric('global_javascript_error', 1, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    })
  })
}
