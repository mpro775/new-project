import React from 'react';
import { Outlet } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

interface RouteWrapperProps {
  requiresAuth?: boolean;
  layout?: React.ComponentType<{ children: React.ReactNode }>;
}

export const RouteWrapper: React.FC<RouteWrapperProps> = ({
  requiresAuth = true,
  layout: Layout,
}) => {
  const content = <Outlet />;

  return (
    <ProtectedRoute requiresAuth={requiresAuth}>
      {Layout ? (
        <Layout>
          {content}
        </Layout>
      ) : (
        content
      )}
    </ProtectedRoute>
  );
};

export default RouteWrapper;
