import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AccessDenied from './AccessDenied';

interface DriverRouteProps {
  children: React.ReactNode;
  showAccessDenied?: boolean;
}

const DriverRoute: React.FC<DriverRouteProps> = ({ children, showAccessDenied = false }) => {
  const { user } = useAuth();

  // If user is a driver
  if (user?.staffInfo?.isDriver) {
    if (showAccessDenied) {
      return <AccessDenied />;
    }
    return <Navigate to="/mobile-sales" replace />;
  }

  // For non-drivers, show the intended component
  return <>{children}</>;
};

export default DriverRoute; 