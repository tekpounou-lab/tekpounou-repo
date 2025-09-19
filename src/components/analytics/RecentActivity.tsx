import React from 'react';
import { 
  UserIcon,
  BookOpenIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ClockIcon,
  EyeIcon,
  CheckCircleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  user_id?: string;
  event_type: string;
  metadata: any;
  created_at: string;
  user_agent?: string;
}

interface RecentActivityProps {
  activities?: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (eventType: string) => {
    switch (eventType) {
      case 'login':
        return UserIcon;
      case 'course_view':
        return EyeIcon;
      case 'lesson_start':
        return PlayIcon;
      case 'lesson_complete':
        return CheckCircleIcon;
      case 'quiz_attempt':
        return AcademicCapIcon;
      case 'blog_view':
        return DocumentTextIcon;
      case 'service_request':
        return BriefcaseIcon;
      case 'enrollment':
        return BookOpenIcon;
      default:
        return ClockIcon;
    }
  };

  const getActivityColor = (eventType: string) => {
    switch (eventType) {
      case 'login':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'course_view':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'lesson_complete':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'quiz_attempt':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'service_request':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'enrollment':
        return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getActivityMessage = (activity: Activity) => {
    const { event_type, metadata } = activity;
    
    switch (event_type) {
      case 'login':
        return 'Signed in to the platform';
      case 'course_view':
        return `Viewed course: ${metadata?.course_title || 'Unknown Course'}`;
      case 'lesson_start':
        return `Started lesson: ${metadata?.lesson_title || 'Unknown Lesson'}`;
      case 'lesson_complete':
        return `Completed lesson: ${metadata?.lesson_title || 'Unknown Lesson'}`;
      case 'quiz_attempt':
        return `Attempted quiz: ${metadata?.quiz_title || 'Quiz'} (Score: ${metadata?.score || 'N/A'})`;
      case 'blog_view':
        return `Read blog post: ${metadata?.post_title || 'Unknown Post'}`;
      case 'service_request':
        return `Requested service: ${metadata?.service_name || 'Unknown Service'}`;
      case 'enrollment':
        return `Enrolled in course: ${metadata?.course_title || 'Unknown Course'}`;
      case 'project_view':
        return `Viewed project: ${metadata?.project_name || 'Unknown Project'}`;
      case 'analytics_dashboard_view':
        return `Viewed analytics dashboard (${metadata?.tab || 'overview'})`;
      default:
        return `${event_type.replace('_', ' ')} activity`;
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No recent activity
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Activity will appear here as you use the platform.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {activities.slice(0, 10).map((activity, index) => {
          const Icon = getActivityIcon(activity.event_type);
          const colorClasses = getActivityColor(activity.event_type);
          
          return (
            <div key={activity.id || index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex items-start space-x-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colorClasses}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {getActivityMessage(activity)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  
                  {/* Additional metadata */}
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {activity.metadata.progress_percentage && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          {activity.metadata.progress_percentage}% complete
                        </span>
                      )}
                      {activity.metadata.role && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {activity.metadata.role}
                        </span>
                      )}
                      {activity.metadata.time_spent && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          {Math.round(activity.metadata.time_spent / 60)}min
                        </span>
                      )}
                    </div>
                  )}

                  {/* Browser/Device info for login events */}
                  {activity.event_type === 'login' && activity.user_agent && (
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 truncate">
                      {activity.user_agent.split('/')[0]} • {activity.metadata?.ip_address || 'Unknown location'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {activities.length > 10 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <button className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            View all activity ({activities.length} total)
          </button>
        </div>
      )}
    </div>
  );
}