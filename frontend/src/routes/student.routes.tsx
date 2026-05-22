import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentLayout from '../layouts/StudentLayout';
import Dashboard from '../pages/student/Dashboard';
import Courses from '../pages/student/Courses';
import Assignments from '../pages/student/Assignments';
import Progress from '../pages/student/Progress';
import Resources from '../pages/student/Resources';
import Profile from '../pages/common/Profile';
import Exam from '../pages/student/Exam';
import WrongAnswers from '../pages/student/WrongAnswers';
import Messages from '../pages/common/Messages';
import MockExam from '../pages/student/MockExam';
import NotificationCenter from '../pages/common/NotificationCenter';
import Invite from '../pages/common/Invite';

const StudentRoutes: React.FC = () => {
  return (
    <StudentLayout>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="exam" element={<Exam />} />
        <Route path="mock-exam" element={<MockExam />} />
        <Route path="progress" element={<Progress />} />
        <Route path="wrong-answers" element={<WrongAnswers />} />
        <Route path="resources" element={<Resources />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications-center" element={<NotificationCenter />} />
        <Route path="invite" element={<Invite />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </StudentLayout>
  );
};

export default StudentRoutes;
