import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/admin/Dashboard';
import Users from '../pages/admin/Users';
import Classes from '../pages/admin/Classes';
import Courses from '../pages/admin/Courses';
import Notifications from '../pages/admin/Notifications';
import Feedbacks from '../pages/admin/Feedbacks';
import Analytics from '../pages/admin/Analytics';
import Settings from '../pages/admin/Settings';

const AdminRoutes: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="classes" element={<Classes />} />
        <Route path="courses" element={<Courses />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="feedbacks" element={<Feedbacks />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminRoutes;
