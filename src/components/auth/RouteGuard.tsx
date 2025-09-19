import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoadingPage } from '@/components/ui/Loading';
import { UserRole } from '@/types';
import { hasRole } from '@/utils';

export interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
  requireAuth?: boolean;
}

const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredRole,
  redirectTo = '/login',
  requireAuth = true,
}) => {
  const { user, isLoading, isAuthenticated } = useAuthStore();

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingPage message="Verifying authentication..." />;
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // If specific role is required
  if (requiredRole && user) {
    const userHasRole = Array.isArray(requiredRole)
      ? requiredRole.some(role => hasRole(user.role, role))
      : hasRole(user.role, requiredRole);

    if (!userHasRole) {
      // Redirect based on user role
      if (user.role === 'guest') {
        return <Navigate to="/login" replace />;
      } else if (user.role === 'student') {
        return <Navigate to="/dashboard" replace />;
      } else if (user.role === 'teacher') {
        return <Navigate to="/teacher" replace />;
      } else {
        return <Navigate to="/admin" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default RouteGuard;