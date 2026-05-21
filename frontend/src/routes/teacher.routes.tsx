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

const TeacherRoutes: React.FC = () => {
  return (
    <TeacherLayout>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="courses" element={<Courses />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="resources" element={<Resources />} />
        <Route path="classes" element={<Classes />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </TeacherLayout>
  );
};

export default TeacherRoutes;
