import api from './api';
import { ApiResponse } from '../types/api';

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalClasses: number;
  activeCourses: number;
  pendingAssignments: number;
  todaySchedules: number;
  recentEnrollments: number;
}

export interface TrendData {
  date: string;
  count: number;
}

export interface PerformanceData {
  teacherId: string;
  teacherName: string;
  courseCount: number;
  studentCount: number;
  avgScore: number;
  assignmentCount: number;
}

export interface RevenueData {
  month: string;
  amount: number;
}

export const analyticsService = {
  getDashboardStats: () => {
    return api.get<any, ApiResponse<DashboardStats>>('/analytics/dashboard');
  },

  getStudentTrend: (params?: { startDate?: string; endDate?: string }) => {
    return api.get<any, ApiResponse<TrendData[]>>('/analytics/student-trend', { params });
  },

  getCourseDistribution: () => {
    return api.get<any, ApiResponse<{ name: string; value: number }[]>>('/analytics/course-distribution');
  },

  getTeacherPerformance: () => {
    return api.get<any, ApiResponse<PerformanceData[]>>('/analytics/teacher-performance');
  },

  getRevenueTrend: (params?: { year?: number }) => {
    return api.get<any, ApiResponse<RevenueData[]>>('/analytics/revenue-trend', { params });
  },

  getStudentProgress: (studentId: string) => {
    return api.get<any, ApiResponse<{
      courseName: string;
      progress: number;
      avgScore: number;
      assignmentCount: number;
    }[]>>(`/analytics/student-progress/${studentId}`);
  },

  getClassComparison: () => {
    return api.get<any, ApiResponse<{
      className: string;
      studentCount: number;
      avgScore: number;
      passRate: number;
    }[]>>(`/analytics/class-comparison`);
  },
};
