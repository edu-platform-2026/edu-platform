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
import Profile from '../pages/common/Profile';
import UserImport from '../pages/admin/UserImport';
import OperationLogs from '../pages/admin/OperationLogs';
import Messages from '../pages/common/Messages';
import NotificationCenter from '../pages/common/NotificationCenter';
import PaymentManagement from '../pages/admin/PaymentManagement';
import Invitations from '../pages/admin/Invitations';

const AdminRoutes: React.FC = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="user-import" element={<UserImport />} />
        <Route path="classes" element={<Classes />} />
        <Route path="courses" element={<Courses />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="payment" element={<PaymentManagement />} />
        <Route path="invitations" element={<Invitations />} />
        <Route path="feedbacks" element={<Feedbacks />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="logs" element={<OperationLogs />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications-center" element={<NotificationCenter />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminRoutes;
