import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { useCallback } from 'react';

export interface AnalyticsEvent {
  event_type: 'login' | 'logout' | 'course_view' | 'lesson_start' | 'lesson_complete' | 
             'quiz_attempt' | 'blog_view' | 'blog_like' | 'service_request' | 
             'project_view' | 'task_update' | 'enrollment' | 'search' | 'analytics_dashboard_view';
  metadata?: Record<string, any>;
  session_id?: string;
}

export function useAnalytics() {
  const { user } = useAuthStore();

  const logEvent = useCallback(async (event: AnalyticsEvent) => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      await fetch('/api/analytics-events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: event.event_type,
          metadata: event.metadata || {},
          session_id: event.session_id || generateSessionId()
        })
      });
    } catch (error) {
      console.error('Failed to log analytics event:', error);
    }
  }, [user]);

  // Convenience methods for common events
  const logPageView = useCallback((page: string, metadata?: Record<string, any>) => {
    logEvent({
      event_type: 'course_view', // Generic page view, can be extended
      metadata: { page, ...metadata }
    });
  }, [logEvent]);

  const logCourseView = useCallback((courseId: string, courseTitle: string) => {
    logEvent({
      event_type: 'course_view',
      metadata: { course_id: courseId, course_title: courseTitle }
    });
  }, [logEvent]);

  const logLessonStart = useCallback((lessonId: string, lessonTitle: string, courseId?: string) => {
    logEvent({
      event_type: 'lesson_start',
      metadata: { lesson_id: lessonId, lesson_title: lessonTitle, course_id: courseId }
    });
  }, [logEvent]);

  const logLessonComplete = useCallback((lessonId: string, lessonTitle: string, timeSpent: number, courseId?: string) => {
    logEvent({
      event_type: 'lesson_complete',
      metadata: { 
        lesson_id: lessonId, 
        lesson_title: lessonTitle, 
        time_spent: timeSpent,
        course_id: courseId 
      }
    });
  }, [logEvent]);

  const logEnrollment = useCallback((courseId: string, courseTitle: string) => {
    logEvent({
      event_type: 'enrollment',
      metadata: { course_id: courseId, course_title: courseTitle }
    });
  }, [logEvent]);

  const logBlogView = useCallback((postId: string, postTitle: string) => {
    logEvent({
      event_type: 'blog_view',
      metadata: { post_id: postId, post_title: postTitle }
    });
  }, [logEvent]);

  const logBlogLike = useCallback((postId: string, postTitle: string) => {
    logEvent({
      event_type: 'blog_like',
      metadata: { post_id: postId, post_title: postTitle }
    });
  }, [logEvent]);

  const logServiceRequest = useCallback((serviceId: string, serviceName: string, requestId?: string) => {
    logEvent({
      event_type: 'service_request',
      metadata: { service_id: serviceId, service_name: serviceName, request_id: requestId }
    });
  }, [logEvent]);

  const logProjectView = useCallback((projectId: string, projectName: string) => {
    logEvent({
      event_type: 'project_view',
      metadata: { project_id: projectId, project_name: projectName }
    });
  }, [logEvent]);

  const logTaskUpdate = useCallback((taskId: string, taskTitle: string, oldStatus: string, newStatus: string, projectId?: string) => {
    logEvent({
      event_type: 'task_update',
      metadata: { 
        task_id: taskId, 
        task_title: taskTitle, 
        old_status: oldStatus, 
        new_status: newStatus,
        project_id: projectId
      }
    });
  }, [logEvent]);

  const logQuizAttempt = useCallback((quizId: string, quizTitle: string, score: number, lessonId?: string) => {
    logEvent({
      event_type: 'quiz_attempt',
      metadata: { 
        quiz_id: quizId, 
        quiz_title: quizTitle, 
        score: score,
        lesson_id: lessonId
      }
    });
  }, [logEvent]);

  const logSearch = useCallback((query: string, resultsCount: number, searchType: string) => {
    logEvent({
      event_type: 'search',
      metadata: { query, results_count: resultsCount, search_type: searchType }
    });
  }, [logEvent]);

  const logLogin = useCallback(() => {
    logEvent({
      event_type: 'login',
      metadata: { login_time: new Date().toISOString() }
    });
  }, [logEvent]);

  const logLogout = useCallback(() => {
    logEvent({
      event_type: 'logout',
      metadata: { logout_time: new Date().toISOString() }
    });
  }, [logEvent]);

  return {
    logEvent,
    logPageView,
    logCourseView,
    logLessonStart,
    logLessonComplete,
    logEnrollment,
    logBlogView,
    logBlogLike,
    logServiceRequest,
    logProjectView,
    logTaskUpdate,
    logQuizAttempt,
    logSearch,
    logLogin,
    logLogout
  };
}

// Utility function to generate session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Higher-order component for automatic page view tracking
export function withAnalytics<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  pageName: string,
  additionalMetadata?: Record<string, any>
) {
  return function AnalyticsWrapper(props: P) {
    const { logPageView } = useAnalytics();
    
    React.useEffect(() => {
      logPageView(pageName, additionalMetadata);
    }, []);

    return <WrappedComponent {...props} />;
  };
}

// React hook for automatic page view tracking
export function usePageAnalytics(pageName: string, metadata?: Record<string, any>) {
  const { logPageView } = useAnalytics();
  
  React.useEffect(() => {
    logPageView(pageName, metadata);
  }, [pageName, metadata]);
}