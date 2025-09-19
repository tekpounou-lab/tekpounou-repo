import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/lib/notificationService';
import { aiService } from '@/lib/aiService';
import { Clock, Users, Star, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Course {
  id: string;
  title: string;
  description: string;
  short_description: string;
  teacher: {
    id: string;
    profiles: {
      display_name: string;
    };
  };
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  duration_hours: number;
  is_free: boolean;
  status: string;
  created_at: string;
  _count?: { count: number }[];
}

const CoursesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [enrolledCourses, setEnrolledCourses] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchEnrolledCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          teacher:users!courses_teacher_id_fkey(id, profiles(display_name)),
          _count:enrollments(count)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id);

      if (error) throw error;
      setEnrolledCourses(new Set(data?.map(e => e.course_id) || []));
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      // Redirect to login
      return;
    }

    try {
      const response = await fetch('/.netlify/functions/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ course_id: courseId })
      });

      if (response.ok) {
        setEnrolledCourses(prev => new Set([...prev, courseId]));
        
        // Find the course title for the notification
        const enrolledCourse = courses.find(course => course.id === courseId);
        if (enrolledCourse && user.id) {
          try {
            await notificationService.notifyCourseEnrollment(
              user.id,
              enrolledCourse.title,
              courseId
            );
          } catch (notificationError) {
            console.error('Failed to send enrollment notification:', notificationError);
            // Don't fail the enrollment if notification fails
          }
          
          // AI Assistant: Provide helpful next steps after enrollment
          try {
            const welcomeMessage = `Felisitasyon! Ou vin enskri nan "${enrolledCourse.title}". Mwen ka ede w kòmanse ak leson yo ak ba w konsèy pou reyisi. Ou vle konnen ki pwochèn etap yo?`;
            await aiService.sendMessage(welcomeMessage, 'ht');
          } catch (aiError) {
            console.error('Failed to send AI welcome message:', aiError);
            // Don't fail enrollment if AI message fails
          }
        }
      } else {
        const error = await response.json();
        console.error('Enrollment error:', error);
      }
    } catch (error) {
      console.error('Error enrolling:', error);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = !selectedDifficulty || course.difficulty_level === selectedDifficulty;
    const matchesLanguage = !selectedLanguage || course.language === selectedLanguage;
    
    return matchesSearch && matchesDifficulty && matchesLanguage;
  });

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'ht': return 'Kreyòl';
      case 'en': return 'English';
      case 'fr': return 'Français';
      default: return lang;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Kous yo / Courses</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Dekouvri kous yo ki disponib pou aprann bagay nouvo / Discover available courses to learn new skills
        </p>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Input
            type="text"
            placeholder="Chèche kous... / Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="">Tout nivo / All levels</option>
            <option value="beginner">Komèsman / Beginner</option>
            <option value="intermediate">Entèmedyè / Intermediate</option>
            <option value="advanced">Avanse / Advanced</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            <option value="">Tout lang / All languages</option>
            <option value="ht">Kreyòl</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
          <Button variant="outline" onClick={fetchCourses}>
            Aktyalize / Refresh
          </Button>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <Badge className={getDifficultyColor(course.difficulty_level)}>
                  {course.difficulty_level}
                </Badge>
                <Badge variant="outline">
                  {getLanguageLabel(course.language)}
                </Badge>
              </div>
              <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {course.short_description}
              </p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-2" />
                {course.teacher?.profiles?.display_name || 'Unknown Teacher'}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-2" />
                {course.duration_hours} hours
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <BookOpen className="w-4 h-4 mr-2" />
                {course._count?.[0]?.count || 0} students enrolled
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {course.is_free ? (
                  <Badge variant="success">FREE / GRATIS</Badge>
                ) : (
                  <Badge variant="warning">PAID / PEYE</Badge>
                )}
              </div>
              
              <div className="space-x-2">
                <Link to={`/courses/${course.id}`}>
                  <Button variant="outline" size="sm">
                    Gade / View
                  </Button>
                </Link>
                
                {user && !enrolledCourses.has(course.id) ? (
                  <Button 
                    size="sm"
                    onClick={() => handleEnroll(course.id)}
                  >
                    Enskri / Enroll
                  </Button>
                ) : enrolledCourses.has(course.id) ? (
                  <Button 
                    size="sm" 
                    variant="success" 
                    disabled
                  >
                    Enskri deja / Enrolled
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.location.href = '/login'}
                  >
                    Login pou enskri / Login to enroll
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Pa gen kous yo jwenn / No courses found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Eseye chanje filtè yo oswa retounen pi ta / Try adjusting your filters or check back later
          </p>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
