import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import {
  UsersIcon,
  BookOpenIcon,
  TrophyIcon,
  ChartBarIcon,
  ClockIcon,
  AcademicCapIcon,
  ChatBubbleLeftEllipsisIcon,
  ArrowTrendingUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface TeacherDashboardProps {
  teacherId?: string;
}

interface DashboardStats {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  studentsCompleted: number;
  avgStudentProgress: number;
  totalQuizAttempts: number;
  avgQuizScore: number;
  certificatesIssued: number;
  discussionPosts: number;
}

interface Course {
  id: string;
  title: string;
  status: string;
  thumbnail_url?: string;
  enrollments: number;
  completionRate: number;
  avgProgress: number;
  avgQuizScore: number;
  revenue?: number;
}

interface Student {
  id: string;
  full_name: string;
  avatar_url?: string;
  course: string;
  progress: number;
  lastActivity: string;
  totalTimeSpent: number;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

export function TeacherDashboard({ teacherId }: TeacherDashboardProps) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [topStudents, setTopStudents] = useState<Student[]>([]);
  const [engagementData, setEngagementData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [teacherId]);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = teacherId || user?.id;
      if (!userId) return;

      // Fetch dashboard stats
      const { data: dashboardData, error: dashboardError } = await supabase
        .from('teacher_dashboard_analytics')
        .select('*')
        .eq('teacher_id', userId)
        .single();

      if (dashboardError && dashboardError.code !== 'PGRST116') {
        console.error('Dashboard error:', dashboardError);
      }

      // Fetch courses with enrollment data
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          enrollments:enrollments(count),
          quiz_results:quizzes!inner(quiz_results(*))
        `)
        .eq('teacher_id', userId);

      if (coursesError) throw coursesError;

      // Process courses data
      const processedCourses = await Promise.all(
        (coursesData || []).map(async (course) => {
          // Get enrollment stats
          const { data: enrollmentStats, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('progress_percentage, completed_at')
            .eq('course_id', course.id);

          if (enrollmentError) throw enrollmentError;

          const totalEnrollments = enrollmentStats?.length || 0;
          const completedEnrollments = enrollmentStats?.filter(e => e.progress_percentage === 100).length || 0;
          const avgProgress = totalEnrollments > 0 
            ? enrollmentStats.reduce((sum, e) => sum + e.progress_percentage, 0) / totalEnrollments 
            : 0;

          // Get quiz stats
          const { data: quizStats, error: quizError } = await supabase
            .from('quiz_results')
            .select('score')
            .in('quiz_id', (course.quizzes || []).map((q: any) => q.id));

          if (quizError) console.error('Quiz error:', quizError);

          const avgQuizScore = quizStats?.length > 0
            ? quizStats.reduce((sum, q) => sum + q.score, 0) / quizStats.length
            : 0;

          return {
            id: course.id,
            title: course.title,
            status: course.status,
            thumbnail_url: course.thumbnail_url,
            enrollments: totalEnrollments,
            completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0,
            avgProgress,
            avgQuizScore
          };
        })
      );

      // Fetch top performing students
      const { data: studentsData, error: studentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          users:student_id (
            id,
            full_name,
            avatar_url
          ),
          courses:course_id (
            title
          )
        `)
        .in('course_id', (coursesData || []).map(c => c.id))
        .order('progress_percentage', { ascending: false })
        .limit(10);

      if (studentsError) throw studentsError;

      // Fetch engagement data over time
      const { data: engagementDataRaw, error: engagementError } = await supabase
        .from('analytics_events')
        .select('event_type, created_at, metadata')
        .in('metadata->>course_id', (coursesData || []).map(c => c.id))
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (engagementError) throw engagementError;

      // Process engagement data by day
      const engagementByDay = (engagementDataRaw || []).reduce((acc, event) => {
        const day = new Date(event.created_at).toLocaleDateString();
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const engagementChartData = Object.entries(engagementByDay).map(([day, count]) => ({
        day: new Date(day).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        engagement: count
      }));

      // Create performance data for courses
      const performanceChartData = processedCourses.slice(0, 5).map(course => ({
        name: course.title.length > 15 ? course.title.substring(0, 15) + '...' : course.title,
        enrollments: course.enrollments,
        completion: Math.round(course.completionRate),
        avgScore: Math.round(course.avgQuizScore)
      }));

      setStats({
        totalCourses: dashboardData?.total_courses || coursesData?.length || 0,
        publishedCourses: dashboardData?.published_courses || coursesData?.filter(c => c.status === 'published').length || 0,
        totalStudents: dashboardData?.total_students || 0,
        studentsCompleted: dashboardData?.students_completed || 0,
        avgStudentProgress: dashboardData?.avg_student_progress || 0,
        totalQuizAttempts: dashboardData?.total_quiz_attempts || 0,
        avgQuizScore: dashboardData?.avg_quiz_score || 0,
        certificatesIssued: dashboardData?.certificates_issued || 0,
        discussionPosts: dashboardData?.discussion_posts || 0
      });

      setCourses(processedCourses);
      setTopStudents(
        (studentsData || []).map(enrollment => ({
          id: enrollment.users.id,
          full_name: enrollment.users.full_name,
          avatar_url: enrollment.users.avatar_url,
          course: enrollment.courses.title,
          progress: enrollment.progress_percentage,
          lastActivity: enrollment.last_accessed_at,
          totalTimeSpent: enrollment.time_spent || 0
        }))
      );
      setEngagementData(engagementChartData);
      setPerformanceData(performanceChartData);

    } catch (error) {
      console.error('Error fetching teacher dashboard data:', error);
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
            {t('dashboard.teacher.title')}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300 mt-1">
            {t('dashboard.teacher.description')}
          </p>
        </div>
        <Button onClick={() => window.location.href = '/courses/create'}>
          {t('dashboard.teacher.createCourse')}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {t('dashboard.teacher.totalCourses')}
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats?.totalCourses || 0}
              </p>
            </div>
            <BookOpenIcon className="h-8 w-8 text-accent-500" />
          </div>
          <div className="mt-2">
            <div className="flex items-center text-sm text-green-600">
              <span>{stats?.publishedCourses || 0} {t('dashboard.teacher.published')}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {t('dashboard.teacher.totalStudents')}
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats?.totalStudents || 0}
              </p>
            </div>
            <UsersIcon className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="flex items-center text-sm text-green-600">
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              <span>{stats?.studentsCompleted || 0} {t('dashboard.teacher.completed')}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {t('dashboard.teacher.avgProgress')}
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {Math.round(stats?.avgStudentProgress || 0)}%
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-orange-500" />
          </div>
          <div className="mt-2">
            <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
              <span>{t('dashboard.teacher.avgQuizScore')}: {Math.round(stats?.avgQuizScore || 0)}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {t('dashboard.teacher.certificates')}
              </p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {stats?.certificatesIssued || 0}
              </p>
            </div>
            <TrophyIcon className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="mt-2">
            <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
              <ChatBubbleLeftEllipsisIcon className="h-4 w-4 mr-1" />
              <span>{stats?.discussionPosts || 0} {t('dashboard.teacher.discussions')}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            {t('dashboard.teacher.studentEngagement')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="engagement" 
                stroke="#4ECDC4" 
                fill="#4ECDC4" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Course Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            {t('dashboard.teacher.coursePerformance')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="enrollments" fill="#FF6B6B" name={t('dashboard.teacher.enrollments')} />
              <Bar dataKey="completion" fill="#4ECDC4" name={t('dashboard.teacher.completion')} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Courses and Students Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Overview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            {t('dashboard.teacher.myCourses')}
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
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-neutral-900 dark:text-white">
                      {course.title}
                    </h4>
                    <Badge 
                      variant={course.status === 'published' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {t(`status.${course.status}`)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-center gap-1">
                      <UsersIcon className="h-4 w-4" />
                      <span>{course.enrollments} {t('dashboard.teacher.students')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ChartBarIcon className="h-4 w-4" />
                      <span>{Math.round(course.completionRate)}% {t('dashboard.teacher.completion')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AcademicCapIcon className="h-4 w-4" />
                      <span>{Math.round(course.avgQuizScore)}% {t('dashboard.teacher.avgScore')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {courses.length === 0 && (
              <div className="text-center py-8">
                <BookOpenIcon className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-600 dark:text-neutral-300">
                  {t('dashboard.teacher.noCourses')}
                </p>
                <Button className="mt-2" onClick={() => window.location.href = '/courses/create'}>
                  {t('dashboard.teacher.createFirstCourse')}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Top Students */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            {t('dashboard.teacher.topStudents')}
          </h3>
          <div className="space-y-3">
            {topStudents.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-900 text-accent-800 dark:text-accent-200 text-sm font-medium">
                  {index + 1}
                </div>
                {student.avatar_url ? (
                  <img 
                    src={student.avatar_url} 
                    alt={student.full_name}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center">
                    <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                      {student.full_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-neutral-900 dark:text-white">
                    {student.full_name}
                  </h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {student.course}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <span>{student.progress}% {t('dashboard.teacher.progress')}</span>
                    <span>{formatTime(student.totalTimeSpent)} {t('dashboard.teacher.spent')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {student.progress}%
                  </div>
                </div>
              </motion.div>
            ))}
            {topStudents.length === 0 && (
              <div className="text-center py-8">
                <UsersIcon className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-600 dark:text-neutral-300">
                  {t('dashboard.teacher.noStudents')}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}