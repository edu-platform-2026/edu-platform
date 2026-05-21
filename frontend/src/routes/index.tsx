import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { UserRole } from '../types/user';
import TeacherRoutes from './teacher.routes';
import ParentRoutes from './parent.routes';
import AdminRoutes from './admin.routes';
import PublicRoutes from './public.routes';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  const getHomeRoute = () => {
    if (!isAuthenticated || !user) return '/login';
    switch (user.role) {
      case UserRole.ADMIN:
        return '/admin/dashboard';
      case UserRole.TEACHER:
        return '/teacher/dashboard';
      case UserRole.PARENT:
      case UserRole.STUDENT:
        return '/parent/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<PublicRoutes />} />

      {isAuthenticated && user?.role === UserRole.ADMIN && (
        <Route path="/admin/*" element={<AdminRoutes />} />
      )}

      {isAuthenticated && user?.role === UserRole.TEACHER && (
        <Route path="/teacher/*" element={<TeacherRoutes />} />
      )}

      {isAuthenticated &&
        (user?.role === UserRole.PARENT || user?.role === UserRole.STUDENT) && (
          <Route path="/parent/*" element={<ParentRoutes />} />
        )}

      <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
      <Route path="*" element={<Navigate to={getHomeRoute()} replace />} />
    </Routes>
  );
};

export default AppRoutes;
