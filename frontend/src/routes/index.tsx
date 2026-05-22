import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getRoleHomePath } from '../utils/permission';
import TeacherRoutes from './teacher.routes';
import ParentRoutes from './parent.routes';
import StudentRoutes from './student.routes';
import AdminRoutes from './admin.routes';
import PublicRoutes from './public.routes';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

/**
 * 受保护路由 — 只检查是否登录，不检查角色
 * 角色路由由各自的子路由处理
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

/**
 * 根路由组件
 */
const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  const getHomeRoute = (): string => {
    if (!isAuthenticated || !user) return '/login';
    const role = (user.role || '').toUpperCase();
    if (!role) return '/admin/dashboard';
    return getRoleHomePath(role);
  };

  return (
    <Routes>
      {/* 认证页面 */}
      <Route
        path="/login"
        element={
          isAuthenticated && user
            ? <Navigate to={getHomeRoute()} replace />
            : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated && user
            ? <Navigate to={getHomeRoute()} replace />
            : <Register />
        }
      />

      {/* 管理员端 */}
      <Route path="/admin/*" element={<ProtectedRoute><AdminRoutes /></ProtectedRoute>} />

      {/* 教师端 */}
      <Route path="/teacher/*" element={<ProtectedRoute><TeacherRoutes /></ProtectedRoute>} />

      {/* 学生端 */}
      <Route path="/student/*" element={<ProtectedRoute><StudentRoutes /></ProtectedRoute>} />

      {/* 家长端 */}
      <Route path="/parent/*" element={<ProtectedRoute><ParentRoutes /></ProtectedRoute>} />

      {/* 根路径 */}
      <Route
        path="/"
        element={
          isAuthenticated && user
            ? <Navigate to={getHomeRoute()} replace />
            : <PublicRoutes />
        }
      />

      {/* 404 */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated && user ? getHomeRoute() : '/login'} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
