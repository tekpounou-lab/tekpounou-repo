import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartData {
  user_trends?: any[];
  enrollment_trends?: any[];
  project_progress?: any[];
  progress_overview?: any[];
  completion_rates?: any[];
  service_request_trends?: any[];
  project_status_distribution?: any[];
}

interface AnalyticsChartsProps {
  data?: ChartData;
  userRole?: string;
}

export function AnalyticsCharts({ data, userRole }: AnalyticsChartsProps) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Sample data generators for demonstration
  const generateSampleUserTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      users: Math.floor(Math.random() * 100) + 20,
      active: Math.floor(Math.random() * 80) + 15
    }));
  };

  const generateSampleEnrollmentTrends = () => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return weeks.map(week => ({
      week,
      enrollments: Math.floor(Math.random() * 50) + 10,
      completions: Math.floor(Math.random() * 20) + 5
    }));
  };

  const generateProjectStatusData = () => [
    { name: 'Planning', value: 15, color: '#f59e0b' },
    { name: 'Active', value: 45, color: '#3b82f6' },
    { name: 'On Hold', value: 10, color: '#ef4444' },
    { name: 'Completed', value: 30, color: '#10b981' }
  ];

  const generateCompletionRates = () => {
    const courses = ['Web Development', 'Data Science', 'AI Basics', 'Mobile Apps'];
    return courses.map(course => ({
      course,
      completion_rate: Math.floor(Math.random() * 40) + 60,
      enrolled: Math.floor(Math.random() * 100) + 20
    }));
  };

  const generateStudentProgress = () => {
    const courses = ['React Fundamentals', 'JavaScript ES6', 'CSS Grid & Flexbox'];
    return courses.map(course => ({
      course,
      progress: Math.floor(Math.random() * 60) + 40,
      time_spent: Math.floor(Math.random() * 20) + 5
    }));
  };

  const renderSuperAdminCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Growth Trends */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          User Growth Trends
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.user_trends || generateSampleUserTrends()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="users" 
              stackId="1"
              stroke="#3b82f6" 
              fill="#3b82f6" 
              fillOpacity={0.6}
              name="Total Users"
            />
            <Area 
              type="monotone" 
              dataKey="active" 
              stackId="1"
              stroke="#10b981" 
              fill="#10b981" 
              fillOpacity={0.6}
              name="Active Users"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Enrollment Trends */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Course Enrollments
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.enrollment_trends || generateSampleEnrollmentTrends()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="enrollments" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="Enrollments"
            />
            <Line 
              type="monotone" 
              dataKey="completions" 
              stroke="#10b981" 
              strokeWidth={3}
              name="Completions"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Project Status Distribution */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Project Status Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={generateProjectStatusData()}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {generateProjectStatusData().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Platform Activity Heatmap Placeholder */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Platform Activity
        </h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="mb-2">Activity heatmap coming soon</p>
            <p className="text-sm">Real-time platform usage patterns</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeacherCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Course Completion Rates */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Course Completion Rates
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.completion_rates || generateCompletionRates()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="course" />
            <YAxis />
            <Tooltip />
            <Bar 
              dataKey="completion_rate" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              name="Completion Rate (%)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Enrollment vs Completion */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Enrollment vs Completion
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.completion_rates || generateCompletionRates()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="course" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="enrolled" fill="#93c5fd" name="Enrolled Students" />
            <Bar dataKey="completion_rate" fill="#3b82f6" name="Completion Rate %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderStudentCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Learning Progress */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          My Learning Progress
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.progress_overview || generateStudentProgress()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="course" />
            <YAxis />
            <Tooltip />
            <Bar 
              dataKey="progress" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]}
              name="Progress (%)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Study Time Distribution */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Study Time per Course
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={generateStudentProgress()}
              cx="50%"
              cy="50%"
              outerRadius={120}
              dataKey="time_spent"
              nameKey="course"
            >
              {generateStudentProgress().map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} 
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderSMECharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Project Progress */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Project Progress
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.project_progress || [
            { project_name: 'Website Redesign', completion_percentage: 75 },
            { project_name: 'Mobile App', completion_percentage: 40 },
            { project_name: 'Data Migration', completion_percentage: 90 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="project_name" />
            <YAxis />
            <Tooltip />
            <Bar 
              dataKey="completion_percentage" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              name="Completion %"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Service Utilization */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Service Utilization
        </h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="mb-2">Service analytics coming soon</p>
            <p className="text-sm">Track your service usage and ROI</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Service Request Trends */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Service Request Trends
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.service_request_trends || generateSampleEnrollmentTrends()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="enrollments" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="New Requests"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Project Status Distribution */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Project Management Overview
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={generateProjectStatusData()}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {generateProjectStatusData().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Render charts based on user role
  switch (userRole) {
    case 'super_admin':
      return renderSuperAdminCharts();
    case 'admin':
      return renderAdminCharts();
    case 'teacher':
      return renderTeacherCharts();
    case 'sme_client':
      return renderSMECharts();
    default:
      return renderStudentCharts();
  }
}