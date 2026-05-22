import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ParentLayout from '../layouts/ParentLayout';
import Dashboard from '../pages/parent/Dashboard';
import Assignments from '../pages/parent/Assignments';
import Progress from '../pages/parent/Progress';
import Feedback from '../pages/parent/Feedback';
import Profile from '../pages/common/Profile';
import Messages from '../pages/common/Messages';
import NotificationCenter from '../pages/common/NotificationCenter';
import Invite from '../pages/common/Invite';

const ParentRoutes: React.FC = () => {
  return (
    <ParentLayout>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="progress" element={<Progress />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications-center" element={<NotificationCenter />} />
        <Route path="invite" element={<Invite />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </ParentLayout>
  );
};

export default ParentRoutes;
