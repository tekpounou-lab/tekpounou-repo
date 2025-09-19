import React from 'react';
import { motion } from 'framer-motion';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { useAuthStore } from '@/stores/authStore';

const StudentDashboardPage: React.FC = () => {
  const { user, profile } = useAuthStore();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>Please log in to access your dashboard.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Student Dashboard / Tablo Etidyan
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {profile?.display_name || user.email}! / Byenveni tounen, {profile?.display_name || user.email}!
        </p>
      </div>

      <StudentDashboard />
    </motion.div>
  );
};

export default StudentDashboardPage;
