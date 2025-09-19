import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardBody className="text-center py-12">
            {/* 404 Illustration */}
            <div className="mb-6">
              <div className="text-6xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                404
              </div>
              <div className="w-24 h-1 bg-primary-600 dark:bg-primary-400 mx-auto rounded"></div>
            </div>
            
            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Paj la pa jwenn
            </h1>
            <h2 className="text-lg text-gray-700 dark:text-gray-300 mb-2">
              Page Not Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Paj ou ap chèche a pa egziste oswa yo deplase li. / 
              The page you're looking for doesn't exist or has been moved.
            </p>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <Link to="/" className="block">
                <Button className="w-full flex items-center justify-center">
                  <Home className="h-4 w-4 mr-2" />
                  Retounen lakay / Go Home
                </Button>
              </Link>
              
              <Link to="/courses" className="block">
                <Button variant="outline" className="w-full flex items-center justify-center">
                  <Search className="h-4 w-4 mr-2" />
                  Eksplò kou yo / Browse Courses
                </Button>
              </Link>
            </div>
            
            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                <HelpCircle className="h-4 w-4 mr-2" />
                <span>
                  Bezwen ed? / Need help?{' '}
                  <a
                    href="mailto:support@tekpounou.com"
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Kontak nou / Contact us
                  </a>
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default NotFoundPage;