import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Award, CreditCard, TrendingUp, Clock, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { PaymentHistory } from '@/components/payments/PaymentHistory';
import { CertificateView } from '@/components/profile/CertificateView';
import { BadgeList } from '@/components/profile/BadgeList';
import { CourseProgressBar } from '@/components/ui/CourseProgressBar';
import CommunityDashboard from './CommunityDashboard';
import { useAuthStore } from '@/stores/authStore';
import { usePayments } from '@/hooks/usePayments';
import { supabase } from '@/lib/supabase';

interface CourseProgress {
  id: string;
  title: string;
  progress_percentage: number;
  last_viewed_lesson_id?: string;
  updated_at: string;
  total_lessons: number;
  completed_lessons: number;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { getUserSubscriptions, getUserTransactions } = usePayments();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'payments' | 'achievements' | 'community'>('overview');
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    certificatesEarned: 0,
    totalSpent: 0,
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
        loadCourseProgress(),
        loadSubscriptions(),
        loadTransactions(),
        loadStats(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('course_progress')
        .select(`
          *,
          course:courses(id, title, modules:course_modules(lessons:count))
        `)
        .eq('student_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const progressData = data?.map(progress => ({
        id: progress.course.id,
        title: progress.course.title,
        progress_percentage: progress.progress_percentage,
        last_viewed_lesson_id: progress.last_viewed_lesson_id,
        updated_at: progress.updated_at,
        total_lessons: progress.course.modules?.reduce((sum, module) => sum + (module.lessons || 0), 0) || 0,
        completed_lessons: Math.floor((progress.progress_percentage / 100) * (progress.course.modules?.reduce((sum, module) => sum + (module.lessons || 0), 0) || 0)),
      })) || [];

      setCourseProgress(progressData);
    } catch (error) {
      console.error('Error loading course progress:', error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const subs = await getUserSubscriptions();
      setSubscriptions(subs);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const transactions = await getUserTransactions();
      setRecentTransactions(transactions.slice(0, 5));
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      // Get enrollment stats
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*, course:courses(id)')
        .eq('student_id', user.id);

      // Get completed courses
      const { data: completedCourses } = await supabase
        .from('course_progress')
        .select('*')
        .eq('student_id', user.id)
        .eq('progress_percentage', 100);

      // Get certificates
      const { data: certificates } = await supabase
        .from('certificates')
        .select('*')
        .eq('student_id', user.id);

      // Get total spent
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      const totalSpent = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

      setStats({
        totalCourses: enrollments?.length || 0,
        completedCourses: completedCourses?.length || 0,
        certificatesEarned: certificates?.length || 0,
        totalSpent,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
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
            { id: 'community', name: 'Community', icon: Users },
            { id: 'payments', name: 'Payments', icon: CreditCard },
            { id: 'achievements', name: 'Achievements', icon: Award },
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
                      Enrolled Courses
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
                      Completed
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.completedCourses}
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Award className="w-6 h-6 text-green-600" />
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
                      Certificates
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.certificatesEarned}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Award className="w-6 h-6 text-purple-600" />
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
                      Total Spent
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${stats.totalSpent.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <CreditCard className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Active Subscriptions */}
          {subscriptions.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Active Subscriptions
              </h3>
              <div className="space-y-3">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {subscription.plan.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {subscription.plan.description}
                      </p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Course Progress */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Course Progress
            </h3>
            <div className="space-y-4">
              {courseProgress.slice(0, 3).map((course) => (
                <div key={course.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {course.title}
                    </h4>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.round(course.progress_percentage)}%
                    </span>
                  </div>
                  <Progress value={course.progress_percentage} className="w-full" />
                  <div className="text-xs text-gray-500">
                    {course.completed_lessons} of {course.total_lessons} lessons completed
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
            <Button onClick={() => window.location.href = '/courses'}>
              Browse More Courses
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseProgress.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {course.title}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="font-medium">{Math.round(course.progress_percentage)}%</span>
                    </div>
                    <Progress value={course.progress_percentage} className="w-full" />
                    <div className="text-xs text-gray-500">
                      {course.completed_lessons} of {course.total_lessons} lessons completed
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.location.href = `/courses/${course.id}`}
                    >
                      Continue Learning
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && <PaymentHistory />}

      {/* Community Tab */}
      {activeTab === 'community' && <CommunityDashboard />}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Certificates
              </h3>
              <CertificateView />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Badges
              </h3>
              <BadgeList />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
