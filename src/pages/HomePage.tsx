import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { BookOpen, FileText, Users, Award, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const HomePage: React.FC = () => {
  const { user } = useAuthStore();

  const features = [
    {
      icon: BookOpen,
      title: 'Kous yo / Courses',
      titleEn: 'Interactive Courses',
      description: 'Aprann ak kous entraktif yo nan Kreyòl ak lòt lang yo',
      descriptionEn: 'Learn with interactive courses in Creole and other languages',
      href: '/courses',
      color: 'text-blue-600'
    },
    {
      icon: FileText,
      title: 'Blog / Nouvèl',
      titleEn: 'Educational Blog',
      description: 'Li atik ak nouvèl yo sou edikasyon ak teknolòji',
      descriptionEn: 'Read articles and news about education and technology',
      href: '/blog',
      color: 'text-green-600'
    },
    {
      icon: Users,
      title: 'Kominote / Community',
      titleEn: 'Learning Community',
      description: 'Rankontre ak lòt etidyan ak pwofè yo nan kominote an',
      descriptionEn: 'Connect with other students and teachers in our community',
      href: '/community',
      color: 'text-purple-600'
    },
    {
      icon: Award,
      title: 'Sètifika / Certificates',
      titleEn: 'Earn Certificates',
      description: 'Resevwa sètifika lè ou fini kous yo ak siksè',
      descriptionEn: 'Receive certificates when you complete courses successfully',
      href: '/certificates',
      color: 'text-orange-600'
    }
  ];

  const stats = [
    { number: '500+', label: 'Etidyan / Students' },
    { number: '50+', label: 'Kous / Courses' },
    { number: '20+', label: 'Pwofè / Teachers' },
    { number: '100+', label: 'Sètifika / Certificates' }
  ];

  return (
    <div className="">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="block">Tek Pou Nou</span>
              <span className="block text-2xl lg:text-3xl font-normal mt-2 text-blue-200">
                Technology for Us / Teknolòji pou Nou
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl mb-8 text-blue-100">
              Aprann, devlope, ak grandi ak kominote edikasyon Ayisyen an
            </p>
            
            <p className="text-lg mb-10 text-blue-200">
              Learn, develop, and grow with the Haitian educational community
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link to="/courses">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                      Gade Kous yo / Browse Courses
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/profile">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                      Mon Pwofil / My Profile
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                      Kòmanse Jodia a / Get Started Today
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                      Konekte / Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Sa nou ofri / What We Offer
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Dekouvri opòtinite yo pou aprann ak grandi nan domèn teknolòji ak edikasyon an
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-500 max-w-3xl mx-auto mt-2">
              Discover opportunities to learn and grow in technology and education
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow text-center">
                  <div className={`w-12 h-12 ${feature.color} mx-auto mb-4`}>
                    <IconComponent className="w-full h-full" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {feature.description}
                  </p>
                  
                  <Link to={feature.href}>
                    <Button variant="outline" size="sm">
                      Aprann Plus / Learn More
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Content Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4">Popular / Popiyè</Badge>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Kous ak Kontni ki Pi Popiyè yo
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                Popular Courses and Content
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Dekouvri kous ak atik yo ki gen plis moun k ap gade yo. Aprann ak pwofesè yo ki gen ekspè ak etidyan ki motivé yo.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span>Kous yo ak evalyasyon segondè / High-rated courses</span>
                </div>
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <span>Materyèl edikasyon nan Kreyòl / Educational content in Creole</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-green-500" />
                  <span>Kominote etidyan ak pwofesè yo / Community of learners and teachers</span>
                </div>
              </div>
              
              <div className="mt-8">
                <Link to="/courses">
                  <Button size="lg">
                    Gade Tout Kous yo / View All Courses
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Sample Course Cards */}
              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Introduction to Web Development</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      Aprann kijan pou w devlope sit entènet yo ak HTML, CSS ak JavaScript
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>150 etidyan</span>
                      <span>20 hours</span>
                      <Badge variant="success">Free</Badge>
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Haitian Creole Digital Literacy</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      Konsèy ak estratéji pou òdinatè ak teknolòji nan Kreyòl
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>200 etidyan</span>
                      <span>15 hours</span>
                      <Badge variant="success">Free</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Pare pou Kòmanse? / Ready to Get Started?
          </h2>
          
          <p className="text-xl mb-8 text-purple-100">
            Antre nan kominote nou an ak kòmanse aprann jodi a
          </p>
          
          <p className="text-lg mb-10 text-purple-200">
            Join our community and start learning today
          </p>
          
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                  Kreye Kont Gratis / Create Free Account
                </Button>
              </Link>
              <Link to="/courses">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                  Gade Kous yo / Browse Courses
                </Button>
              </Link>
            </div>
          )}
          
          {user && (
            <Link to="/courses">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                Kontinye Aprann / Continue Learning
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;