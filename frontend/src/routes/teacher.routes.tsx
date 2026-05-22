import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TeacherLayout from '../layouts/TeacherLayout';
import Dashboard from '../pages/teacher/Dashboard';
import Assignments from '../pages/teacher/Assignments';
import Courses from '../pages/teacher/Courses';
import Schedule from '../pages/teacher/Schedule';
import Resources from '../pages/teacher/Resources';
import Classes from '../pages/teacher/Classes';
import Analytics from '../pages/teacher/Analytics';
import Profile from '../pages/common/Profile';
import CreateAssignment from '../pages/teacher/CreateAssignment';
import Grading from '../pages/teacher/Grading';
import AIModelSettings from '../pages/teacher/AIModelSettings';
import Attendance from '../pages/teacher/Attendance';
import Messages from '../pages/common/Messages';
import CourseVideos from '../pages/teacher/CourseVideos';
import NotificationCenter from '../pages/common/NotificationCenter';
import Invite from '../pages/common/Invite';

const TeacherRoutes: React.FC = () => {
  return (
    <TeacherLayout>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="create-assignment" element={<CreateAssignment />} />
        <Route path="grading" element={<Grading />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="course-videos" element={<CourseVideos />} />
        <Route path="ai-settings" element={<AIModelSettings />} />
        <Route path="courses" element={<Courses />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="resources" element={<Resources />} />
        <Route path="classes" element={<Classes />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications-center" element={<NotificationCenter />} />
        <Route path="invite" element={<Invite />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </TeacherLayout>
  );
};

export default TeacherRoutes;
