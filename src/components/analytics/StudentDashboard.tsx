import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import {
  AcademicCapIcon,
  ClockIcon,
  TrophyIcon,
  FireIcon,
  ChartBarIcon,
  BookOpenIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface StudentDashboardProps {
  studentId?: string;
}

interface DashboardStats {
  enrolledCourses: number;
  completedCourses: number;
  avgProgress: number;
  quizzesTaken: number;
  quizzesPassed: number;
  avgQuizScore: number;
  totalTimeSpentSeconds: number;
  certificatesEarned: number;
  badgesEarned: number;
  currentStreak: number;
  longestStreak: number;
}

interface Course {
  id: string;
  title: string;
  progress_percentage: number;
  last_accessed_at: string;
  thumbnail_url?: string;
  teacher: {
    full_name: string;
  };
}

interface RecentActivity {
  id: string;
  event_type: string;
  created_at: string;
  metadata: any;
}

export function StudentDashboard({ studentId }: StudentDashboardProps) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [studentId]);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = studentId || user?.id;
      if (!userId) return;

      // Fetch dashboard stats
      const { data: dashboardData, error: dashboardError } = await supabase
        .from('student_dashboard_analytics')
        .select('*')
        .eq('student_id', userId)
        .single();

      if (dashboardError && dashboardError.code !== 'PGRST116') {
        console.error('Dashboard error:', dashboardError);
      }

      // Fetch enrolled courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses:course_id (
            id,
            title,
            thumbnail_url,
            users:teacher_id (
              full_name
            )
          )
        `)
        .eq('student_id', userId)
        .order('last_accessed_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Fetch recent activity
      const { data: activityData, error: activityError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityError) throw activityError;

      // Fetch quiz results for charts
      const { data: quizData, error: quizError } = await supabase
        .from('quiz_results')
        .select(`
          *,
          quizzes:quiz_id (
            title,
            courses:course_id (title)
          )
        `)
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (quizError) throw quizError;

      // Fetch progress over time
      const { data: progressDataRaw, error: progressError } = await supabase
        .from('course_progress')
        .select('*')
        .eq('student_id', userId)
        .eq('progress_type', 'lesson_complete')
        .order('created_at', { ascending: true });

      if (progressError) throw progressError;

      // Fetch gamification data
      const { data: gamificationData, error: gamificationError } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (gamificationError && gamificationError.code !== 'PGRST116') {
        console.error('Gamification error:', gamificationError);
      }

      // Process data
      setStats({
        enrolledCourses: dashboardData?.enrolled_courses || coursesData?.length || 0,
        completedCourses: dashboardData?.completed_courses || 0,
        avgProgress: dashboardData?.avg_progress || 0,
        quizzesTaken: dashboardData?.quizzes_taken || 0,
        quizzesPassed: dashboardData?.quizzes_passed || 0,
        avgQuizScore: dashboardData?.avg_quiz_score || 0,
        totalTimeSpentSeconds: dashboardData?.total_time_spent_seconds || 0,
        certificatesEarned: dashboardData?.certificates_earned || 0,
        badgesEarned: dashboardData?.badges_earned || 0,
        currentStreak: gamificationData?.streak_days || 0,
        longestStreak: gamificationData?.longest_streak || 0
      });

      setCourses(coursesData?.map(enrollment => ({
        ...enrollment.courses,
        progress_percentage: enrollment.progress_percentage,
        last_accessed_at: enrollment.last_accessed_at,
        teacher: enrollment.courses.users
      })) || []);

      setRecentActivity(activityData || []);
      setQuizResults(quizData || []);

      // Process progress data for charts
      const progressByMonth = progressDataRaw?.reduce((acc, item) => {
        const month = new Date(item.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setProgressData(
        Object.entries(progressByMonth || {}).map(([month, count]) => ({
          month,
          lessons: count
        }))
      );

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getActivityIcon = (eventType: string) => {
    switch (eventType) {
      case 'lesson_complete':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'quiz_complete':
        return <AcademicCapIcon className="h-4 w-4 text-blue-500" />;
      case 'course_view':
        return <BookOpenIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <ChartBarIcon className="h-4 w-4 text-neutral-500" />;
    }
  };

  const getActivityMessage = (activity: RecentActivity) => {
    switch (activity.event_type) {
      case 'lesson_complete':
        return t('activity.completedLesson', { lesson: activity.metadata?.lesson_title || 'lesson' });
      case 'quiz_complete':
        return t('activity.completedQuiz', { quiz: activity.metadata?.quiz_title || 'quiz' });
      case 'course_view':
        return t('activity.viewedCourse', { course: activity.metadata?.course_title || 'course' });
      case 'enrollment':
        return t('activity.enrolledInCourse', { course: activity.metadata?.course_title || 'course' });
      default:
        return t('activity.generalActivity');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            {t('dashboard.student.title')}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300 mt-1">
            {t('dashboard.student.description')}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {t('dashboard.student.enrolledCourses')}
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats?.enrolledCourses || 0}
              </p>
            </div>
            <BookOpenIcon className="h-8 w-8 text-accent-500" />
          </div>
          <div className="mt-2">
            <div className="flex items-center text-sm text-green-600">
              <span>{stats?.completedCourses || 0} {t('dashboard.student.completed')}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {t('dashboard.student.avgProgress')}
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {Math.round(stats?.avgProgress || 0)}%
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <Progress value={stats?.avgProgress || 0} className="h-2" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {t('dashboard.student.timeSpent')}
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {formatTime(stats?.totalTimeSpentSeconds || 0)}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-orange-500" />
          </div>
          <div className="mt-2">
            <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
              <FireIcon className="h-4 w-4 mr-1" />
              <span>{stats?.currentStreak || 0} {t('dashboard.student.dayStreak')}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {t('dashboard.student.achievements')}
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {(stats?.certificatesEarned || 0) + (stats?.badgesEarned || 0)}
              </p>
            </div>
            <TrophyIcon className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
              <span>{stats?.certificatesEarned || 0} {t('dashboard.student.certificates')}</span>
              <span>{stats?.badgesEarned || 0} {t('dashboard.student.badges')}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            {t('dashboard.student.learningProgress')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="lessons" 
                stroke="#FF6B6B" 
                fill="#FF6B6B" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Quiz Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            {t('dashboard.student.quizPerformance')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={quizResults.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="quizzes.title" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Current Courses and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Courses */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            {t('dashboard.student.currentCourses')}
          </h3>
          <div className="space-y-4">
            {courses.slice(0, 5).map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                {course.thumbnail_url ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center">
                    <BookOpenIcon className="h-6 w-6 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-neutral-900 dark:text-white">
                    {course.title}
                  </h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {course.teacher?.full_name}
                  </p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {course.progress_percentage}% {t('common.complete')}
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-500">
                        {course.last_accessed_at && formatDistanceToNow(new Date(course.last_accessed_at), { addSuffix: true })}
                      </span>
                    </div>
                    <Progress value={course.progress_percentage} className="h-1 mt-1" />
                  </div>
                </div>
                {course.progress_percentage === 100 && (
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                )}
              </motion.div>
            ))}
            {courses.length === 0 && (
              <div className="text-center py-8">
                <BookOpenIcon className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-600 dark:text-neutral-300">
                  {t('dashboard.student.noCourses')}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            {t('dashboard.student.recentActivity')}
          </h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.event_type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-neutral-900 dark:text-white">
                    {getActivityMessage(activity)}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-center py-8">
                <ChartBarIcon className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-600 dark:text-neutral-300">
                  {t('dashboard.student.noActivity')}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}