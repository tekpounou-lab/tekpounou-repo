import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, DollarSign, TrendingUp, Plus, Eye, Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TeacherEarnings } from '@/components/payments/TeacherEarnings';
import { AnalyticsChart } from '@/components/charts/AnalyticsChart';
import { useAuthStore } from '@/stores/authStore';
import { useTeacherEarnings } from '@/hooks/usePayments';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/stripe';

interface CourseStats {
  id: string;
  title: string;
  enrollments: number;
  completion_rate: number;
  revenue: number;
  is_free: boolean;
  price: number;
  currency: string;
}

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { getEarningsSummary } = useTeacherEarnings();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'earnings' | 'analytics'>('overview');
  const [courses, setCourses] = useState<CourseStats[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    averageRating: 0,
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCourseStats(),
        loadEarningsSummary(),
        loadOverallStats(),
      ]);
    } catch (error) {
      console.error('Error loading teacher dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          is_free,
          price,
          currency,
          enrollments:enrollments(count),
          completed_enrollments:enrollments!inner(
            id,
            course_progress!inner(progress_percentage)
          )
        `)
        .eq('teacher_id', user.id);

      if (error) throw error;

      // Calculate stats for each course
      const courseStats = await Promise.all(
        data?.map(async (course) => {
          // Get enrollment count
          const { count: enrollmentCount } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          // Get completion rate
          const { count: completedCount } = await supabase
            .from('course_progress')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)
            .eq('progress_percentage', 100);

          // Get revenue
          const { data: transactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('course_id', course.id)
            .eq('status', 'completed');

          const revenue = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

          return {
            id: course.id,
            title: course.title,
            enrollments: enrollmentCount || 0,
            completion_rate: enrollmentCount ? ((completedCount || 0) / enrollmentCount) * 100 : 0,
            revenue,
            is_free: course.is_free,
            price: course.price || 0,
            currency: course.currency || 'USD',
          };
        }) || []
      );

      setCourses(courseStats);
    } catch (error) {
      console.error('Error loading course stats:', error);
    }
  };

  const loadEarningsSummary = async () => {
    try {
      const summary = await getEarningsSummary();
      setEarningsSummary(summary);
    } catch (error) {
      console.error('Error loading earnings summary:', error);
    }
  };

  const loadOverallStats = async () => {
    if (!user) return;

    try {
      // Get total courses
      const { count: courseCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id);

      // Get total students (unique enrollments)
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id, course:courses!inner(teacher_id)')
        .eq('course.teacher_id', user.id);

      const uniqueStudents = new Set(enrollments?.map(e => e.student_id) || []).size;

      // Get total revenue
      const { data: earnings } = await supabase
        .from('teacher_earnings')
        .select('net_amount')
        .eq('teacher_id', user.id)
        .eq('status', 'available');

      const totalRevenue = earnings?.reduce((sum, e) => sum + e.net_amount, 0) || 0;

      setStats({
        totalCourses: courseCount || 0,
        totalStudents: uniqueStudents,
        totalRevenue,
        averageRating: 4.5, // TODO: Calculate from course ratings
      });
    } catch (error) {
      console.error('Error loading overall stats:', error);
    }
  };

  // Generate chart data for course performance
  const getCoursePerformanceData = () => {
    return courses.slice(0, 5).map(course => ({
      name: course.title.length > 20 ? course.title.slice(0, 17) + '...' : course.title,
      students: course.enrollments,
      completion: course.completion_rate,
      revenue: course.revenue,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: TrendingUp },
            { id: 'courses', name: 'My Courses', icon: BookOpen },
            { id: 'earnings', name: 'Earnings', icon: DollarSign },
            { id: 'analytics', name: 'Analytics', icon: AnalyticsChart },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Courses
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalCourses}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Students
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalStudents}
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Earnings
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(stats.totalRevenue)}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Avg. Rating
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.averageRating.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Course Performance Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Course Performance
            </h3>
            <AnalyticsChart
              data={getCoursePerformanceData()}
              type="bar"
              height={300}
            />
          </Card>

          {/* Recent Course Activity */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Course Activity
              </h3>
              <Button onClick={() => setActiveTab('courses')}>
                View All Courses
              </Button>
            </div>
            <div className="space-y-4">
              {courses.slice(0, 3).map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {course.title}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{course.enrollments} students</span>
                      <span>{Math.round(course.completion_rate)}% completion</span>
                      <span>{formatPrice(course.revenue)} revenue</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Courses
            </h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New Course
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {course.title}
                    </h3>
                    <Badge variant={course.is_free ? 'success' : 'warning'}>
                      {course.is_free ? 'Free' : formatPrice(course.price, course.currency)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {course.enrollments}
                      </div>
                      <div className="text-xs text-gray-500">Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(course.completion_rate)}%
                      </div>
                      <div className="text-xs text-gray-500">Completion</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatPrice(course.revenue)}
                      </div>
                      <div className="text-xs text-gray-500">Revenue</div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && <TeacherEarnings />}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Detailed Analytics
          </h2>
          
          {/* Course Performance Comparison */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Course Comparison
            </h3>
            <AnalyticsChart
              data={getCoursePerformanceData()}
              type="line"
              height={400}
            />
          </Card>

          {/* Revenue Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Revenue Trends
            </h3>
            <AnalyticsChart
              data={courses.map(course => ({
                name: course.title.slice(0, 10),
                value: course.revenue,
              }))}
              type="area"
              height={300}
            />
          </Card>
        </div>
      )}
    </div>
  );
};
