import React from 'react';
import { 
  UsersIcon, 
  BookOpenIcon, 
  BriefcaseIcon, 
  DocumentTextIcon,
  TrendingUpIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface OverviewData {
  total_users?: number;
  total_courses?: number;
  total_services?: number;
  total_blog_posts?: number;
  my_courses?: number;
  total_enrollments?: number;
  enrolled_courses?: number;
  completed_courses?: number;
  completion_rate?: string | number;
  service_requests?: number;
  active_projects?: number;
  total_service_requests?: number;
  total_projects?: number;
  active_users_30d?: number;
}

interface AnalyticsOverviewProps {
  data?: OverviewData;
}

export function AnalyticsOverview({ data }: AnalyticsOverviewProps) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  const getMetricCards = (): Array<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    change?: string;
    color: string;
  }> => {
    // Super Admin metrics
    if (data.total_users !== undefined) {
      return [
        {
          title: 'Total Users',
          value: data.total_users,
          icon: UsersIcon,
          color: 'blue'
        },
        {
          title: 'Courses',
          value: data.total_courses || 0,
          icon: BookOpenIcon,
          color: 'green'
        },
        {
          title: 'Services',
          value: data.total_services || 0,
          icon: BriefcaseIcon,
          color: 'purple'
        },
        {
          title: 'Blog Posts',
          value: data.total_blog_posts || 0,
          icon: DocumentTextIcon,
          color: 'yellow'
        }
      ];
    }

    // Teacher metrics
    if (data.my_courses !== undefined) {
      return [
        {
          title: 'My Courses',
          value: data.my_courses,
          icon: BookOpenIcon,
          color: 'blue'
        },
        {
          title: 'Total Enrollments',
          value: data.total_enrollments || 0,
          icon: UsersIcon,
          color: 'green'
        },
        {
          title: 'Active Students',
          value: data.total_enrollments || 0,
          icon: AcademicCapIcon,
          color: 'purple'
        },
        {
          title: 'Avg. Completion',
          value: '75%', // Placeholder - would calculate from real data
          icon: TrendingUpIcon,
          color: 'yellow'
        }
      ];
    }

    // Student metrics
    if (data.enrolled_courses !== undefined) {
      return [
        {
          title: 'Enrolled Courses',
          value: data.enrolled_courses,
          icon: BookOpenIcon,
          color: 'blue'
        },
        {
          title: 'Completed Courses',
          value: data.completed_courses || 0,
          icon: CheckCircleIcon,
          color: 'green'
        },
        {
          title: 'Completion Rate',
          value: `${data.completion_rate}%`,
          icon: TrendingUpIcon,
          color: 'purple'
        },
        {
          title: 'Study Time',
          value: '24h', // Placeholder - would calculate from real data
          icon: ClockIcon,
          color: 'yellow'
        }
      ];
    }

    // SME Client metrics
    if (data.service_requests !== undefined) {
      return [
        {
          title: 'Service Requests',
          value: data.service_requests,
          icon: BriefcaseIcon,
          color: 'blue'
        },
        {
          title: 'Active Projects',
          value: data.active_projects || 0,
          icon: DocumentTextIcon,
          color: 'green'
        },
        {
          title: 'Completed Projects',
          value: 2, // Placeholder
          icon: CheckCircleIcon,
          color: 'purple'
        },
        {
          title: 'Success Rate',
          value: '90%', // Placeholder
          icon: TrendingUpIcon,
          color: 'yellow'
        }
      ];
    }

    // Admin metrics
    return [
      {
        title: 'Service Requests',
        value: data.total_service_requests || 0,
        icon: BriefcaseIcon,
        color: 'blue'
      },
      {
        title: 'Total Projects',
        value: data.total_projects || 0,
        icon: DocumentTextIcon,
        color: 'green'
      },
      {
        title: 'Active Users (30d)',
        value: data.active_users_30d || 0,
        icon: UsersIcon,
        color: 'purple'
      },
      {
        title: 'Platform Health',
        value: '95%', // Placeholder
        icon: TrendingUpIcon,
        color: 'yellow'
      }
    ];
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'green':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'purple':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const metricCards = getMetricCards();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        const colorClasses = getColorClasses(metric.color);
        
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${colorClasses}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {metric.title}
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                </p>
                {metric.change && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {metric.change}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}