import React from 'react';
import { BookOpen, Clock, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

const CoursesPage: React.FC = () => {
  // Placeholder course data
  const courses = [
    {
      id: '1',
      title: 'Kreyòl Ayisyen: Komisman',
      description: 'Aprann pale ak ekri nan lang kreyòl ayisyen yo nan yon fason ki bon.',
      instructor: 'Prof. Marie Dubois',
      duration: '10 hours',
      students: 245,
      rating: 4.8,
      price: 'Free',
      thumbnail: '/api/placeholder/300/200',
      level: 'Beginner',
    },
    {
      id: '2',
      title: 'Introduction to Haitian History',
      description: 'Learn about the rich history of Haiti from pre-Columbian times to modern day.',
      instructor: 'Dr. Jean Baptiste',
      duration: '15 hours',
      students: 189,
      rating: 4.7,
      price: '$29.99',
      thumbnail: '/api/placeholder/300/200',
      level: 'Intermediate',
    },
    {
      id: '3',
      title: 'Ti Biznis yo / Small Business Basics',
      description: 'Aprann kijan pou w kòmanse ak jere yon ti biznis nan Ayiti.',
      instructor: 'Entrepreneur James Louis',
      duration: '12 hours',
      students: 156,
      rating: 4.9,
      price: '$19.99',
      thumbnail: '/api/placeholder/300/200',
      level: 'Beginner',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Kou yo / Courses
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Dekouvri kou yo ki ka ede ou aprann ak devlope nan domèn diferan yo.
          Discover courses that help you learn and grow in various fields.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4 justify-center">
          <Button variant="outline" size="sm">
            Tout bagay / All
          </Button>
          <Button variant="outline" size="sm">
            Lang / Language
          </Button>
          <Button variant="outline" size="sm">
            Biznis / Business
          </Button>
          <Button variant="outline" size="sm">
            Teknoloji / Technology
          </Button>
          <Button variant="outline" size="sm">
            Kilti / Culture
          </Button>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
            <CardBody>
              <div className="mb-2">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded">
                  {course.level}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {course.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                {course.description}
              </p>
              
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                <p>Pwofesè / Instructor: {course.instructor}</p>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {course.duration}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {course.students}
                  </div>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 text-yellow-400" />
                  {course.rating}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  {course.price}
                </span>
                <Button size="sm">
                  Enskri / Enroll
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Pa jwenn kou ou vle a? / Don't see the course you want?
        </p>
        <Button variant="outline">
          Mande yon kou / Request a Course
        </Button>
      </div>
    </div>
  );
};

export default CoursesPage;