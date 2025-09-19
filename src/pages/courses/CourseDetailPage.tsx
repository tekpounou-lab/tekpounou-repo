import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Clock, Users, Star, BookOpen, Play, CheckCircle, Circle, MessageSquare, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { DiscussionBoard } from '@/components/courses/DiscussionBoard';
import { PaymentModal } from '@/components/payments/PaymentModal';
import { usePayments } from '@/hooks/usePayments';
import { formatPrice } from '@/lib/stripe';

interface Course {
  id: string;
  title: string;
  description: string;
  teacher: {
    id: string;
    profiles: {
      display_name: string;
      avatar?: string;
      bio?: string;
    };
  };
  difficulty_level: string;
  language: string;
  duration_hours: number;
  is_free: boolean;
  is_premium?: boolean;
  price?: number;
  currency?: string;
  created_at: string;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  media_url?: string;
  duration_minutes: number;
  order_index: number;
  is_free: boolean;
}

interface Enrollment {
  id: string;
  progress_percentage: number;
  enrolled_at: string;
  completed_at?: string;
}

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { canAccessCourse } = usePayments();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'content' | 'discussion'>('content');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
    }
  }, [id, user]);

  const fetchCourseDetails = async () => {
    try {
      // Fetch course with modules and lessons
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          teacher:users!courses_teacher_id_fkey(id, profiles(display_name, avatar, bio)),
          modules:course_modules(
            *,
            lessons(*)
          )
        `)
        .eq('id', id)
        .order('order_index', { referencedTable: 'course_modules' })
        .order('order_index', { referencedTable: 'course_modules.lessons' })
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Check if user has access to the course
      if (user) {
        const access = await canAccessCourse(id!);
        setHasAccess(access);

        // Check if user is enrolled
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('*')
          .eq('student_id', user.id)
          .eq('course_id', id)
          .single();

        if (!enrollmentError && enrollmentData) {
          setEnrollment(enrollmentData);
          await fetchLessonProgress();
        }
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonProgress = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('student_id', user.id)
        .not('completed_at', 'is', null);

      if (error) throw error;
      setLessonProgress(new Set(data?.map(p => p.lesson_id) || []));
    } catch (error) {
      console.error('Error fetching lesson progress:', error);
    }
  };

  const handleEnroll = async () => {
    if (!user || !id || !course) return;

    // If course is not free and user doesn't have access, show payment modal
    if (!course.is_free && !hasAccess) {
      setShowPaymentModal(true);
      return;
    }

    // For free courses, enroll directly
    try {
      const response = await fetch('/.netlify/functions/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ course_id: id })
      });

      if (response.ok) {
        const enrollmentData = await response.json();
        setEnrollment(enrollmentData);
        setHasAccess(true);
        fetchLessonProgress();
      } else {
        const error = await response.json();
        console.error('Enrollment error:', error);
      }
    } catch (error) {
      console.error('Error enrolling:', error);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setHasAccess(true);
    fetchCourseDetails(); // Refresh course data
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          student_id: user.id,
          lesson_id: lessonId,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      setLessonProgress(prev => new Set([...prev, lessonId]));
      await fetchCourseDetails(); // Refresh to update progress
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading course details...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
        </div>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  const completedLessons = course.modules.reduce(
    (acc, module) => acc + module.lessons.filter(lesson => lessonProgress.has(lesson.id)).length,
    0
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Course Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={() => navigate('/courses')}>
            ← Back to Courses
          </Button>
          
          {enrollment && (
            <Badge variant="success">
              Enrolled / Enskri
            </Badge>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {course.description}
            </p>

            <div className="flex items-center space-x-6 mb-6">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-gray-500" />
                <span>{course.teacher?.profiles?.display_name}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-500" />
                <span>{course.duration_hours} hours</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-gray-500" />
                <span>{totalLessons} lessons</span>
              </div>
            </div>

            {enrollment && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Progress / Pwogrè</span>
                  <span className="text-sm text-gray-500">
                    {completedLessons} / {totalLessons} lessons
                  </span>
                </div>
                <Progress 
                  value={totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0}
                  className="w-full"
                />
              </div>
            )}

            {/* Tab Navigation - Only show if user is enrolled */}
            {enrollment && (
              <div className="mb-6">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('content')}
                      className={`
                        py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                        ${activeTab === 'content'
                          ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }
                      `}
                    >
                      <BookOpen className="w-4 h-4 inline mr-2" />
                      Course Content
                    </button>
                    <button
                      onClick={() => setActiveTab('discussion')}
                      className={`
                        py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                        ${activeTab === 'discussion'
                          ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }
                      `}
                    >
                      <MessageSquare className="w-4 h-4 inline mr-2" />
                      Discussion
                    </button>
                  </nav>
                </div>
              </div>
            )}

            {/* Course Modules - Show only when content tab is active */}
            {(!enrollment || activeTab === 'content') && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Course Content / Kontni Kous la</h2>
              
              {course.modules.map((module, moduleIndex) => (
                <Card key={module.id} className="p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    {moduleIndex + 1}. {module.title}
                  </h3>
                  
                  {module.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {module.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div 
                        key={lesson.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          selectedLesson?.id === lesson.id
                            ? 'bg-blue-50 border-blue-200'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {lessonProgress.has(lesson.id) ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                          
                          <div>
                            <div className="font-medium">
                              {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {lesson.duration_minutes} min
                              {!lesson.is_free && !enrollment && (
                                <Badge variant="warning" className="ml-2">Premium</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-x-2">
                          {(lesson.is_free || enrollment) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedLesson(lesson)}
                            >
                              {lesson.media_url ? (
                                <><Play className="w-4 h-4 mr-1" /> Play</>
                              ) : (
                                'Read'
                              )}
                            </Button>
                          )}
                          
                          {enrollment && !lessonProgress.has(lesson.id) && (
                            <Button
                              size="sm"
                              onClick={() => markLessonComplete(lesson.id)}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
            )}

            {/* Discussion Board - Show only when discussion tab is active and user is enrolled */}
            {enrollment && activeTab === 'discussion' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Course Discussion / Diskisyon Kous la</h2>
                <DiscussionBoard courseId={id!} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              {/* Teacher Info */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Pwofesè / Instructor</h3>
                <div className="flex items-center space-x-3">
                  {course.teacher?.profiles?.avatar && (
                    <img
                      src={course.teacher.profiles.avatar}
                      alt={course.teacher?.profiles?.display_name}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-medium">
                      {course.teacher?.profiles?.display_name}
                    </div>
                    {course.teacher?.profiles?.bio && (
                      <div className="text-sm text-gray-500">
                        {course.teacher.profiles.bio}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enrollment Action */}
              <div className="mb-6">
                {!user ? (
                  <Button 
                    className="w-full"
                    onClick={() => navigate('/login')}
                  >
                    Login to Enroll
                  </Button>
                ) : !enrollment && !hasAccess ? (
                  <div className="space-y-3">
                    {/* Show price if not free */}
                    {!course.is_free && course.price && (
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(course.price, course.currency)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          One-time payment
                        </div>
                      </div>
                    )}
                    <Button 
                      className="w-full"
                      onClick={handleEnroll}
                    >
                      {course.is_free ? (
                        'Enroll Free'
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Purchase Course
                        </>
                      )}
                    </Button>
                  </div>
                ) : hasAccess || enrollment ? (
                  <div className="text-center">
                    <Badge variant="success" className="mb-2">
                      {enrollment ? 'Enrolled' : 'Access Granted'}
                    </Badge>
                    {enrollment && (
                      <div className="text-sm text-gray-500">
                        Enrolled on {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Course Info */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Level:</span>
                  <Badge>{course.difficulty_level}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Language:</span>
                  <span>{course.language === 'ht' ? 'Kreyòl' : course.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration:</span>
                  <span>{course.duration_hours} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Price:</span>
                  {course.is_free ? (
                    <Badge variant="success">Free</Badge>
                  ) : (
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {course.price ? formatPrice(course.price, course.currency) : 'Premium'}
                      </div>
                      <div className="text-xs text-gray-500">One-time</div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Selected Lesson Modal/Content */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{selectedLesson.title}</h3>
                <Button variant="outline" onClick={() => setSelectedLesson(null)}>
                  Close
                </Button>
              </div>
              
              {selectedLesson.media_url && (
                <div className="mb-6">
                  <video 
                    src={selectedLesson.media_url}
                    controls
                    className="w-full rounded-lg"
                  />
                </div>
              )}
              
              <div className="prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedLesson.content || '' }} />
              </div>
              
              {enrollment && !lessonProgress.has(selectedLesson.id) && (
                <div className="mt-6 pt-6 border-t">
                  <Button
                    onClick={() => {
                      markLessonComplete(selectedLesson.id);
                      setSelectedLesson(null);
                    }}
                  >
                    Mark as Complete
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && course && !course.is_free && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          course={{
            id: course.id,
            title: course.title,
            price: course.price || 0,
            currency: course.currency || 'USD',
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default CourseDetailPage;
