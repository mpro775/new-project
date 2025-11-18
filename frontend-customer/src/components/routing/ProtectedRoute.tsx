import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { Loading } from '@/components/ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresAuth = true,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <Loading type="backdrop" message="جارٍ التحقق من المصادقة..." />;
  }

  // Redirect to login if authentication is required but user is not authenticated
  if (requiresAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect authenticated users away from auth pages (login, register, etc.)
  if (!requiresAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
