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
  totalAssignments?: number;
  totalSubmissions?: number;
  publishedAssignments?: number;
  pendingSubmissions?: number;
  recentActivity?: {
    newStudents?: number;
    newAssignments?: number;
    newSubmissions?: number;
  };
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
  // 管理员总览 - 后端实际端点: GET /analytics/overview
  getDashboardStats: () => {
    return api.get<any, ApiResponse<DashboardStats>>('/analytics/overview');
  },

  // 教师教学数据 - 后端实际端点: GET /analytics/teaching
  getTeachingStats: () => {
    return api.get<any, ApiResponse<any>>('/analytics/teaching');
  },

  // 作业统计 - 后端实际端点: GET /analytics/assignments
  getAssignmentStats: () => {
    return api.get<any, ApiResponse<any>>('/analytics/assignments');
  },

  // 学生个人数据 - 后端实际端点: GET /analytics/student/:id
  getStudentProgress: (studentId: string) => {
    return api.get<any, ApiResponse<{
      courseName: string;
      progress: number;
      avgScore: number;
      assignmentCount: number;
    }[]>>(`/analytics/student/${studentId}`);
  },

  // 学生趋势 - 后端实际端点: GET /analytics/student-trend
  getStudentTrend: (params?: { startDate?: string; endDate?: string }) => {
    return api.get<any, ApiResponse<TrendData[]>>('/analytics/student-trend', { params }).catch(() => ({ data: [] as TrendData[] }));
  },

  // 课程分布 - 后端实际端点: GET /analytics/course-distribution
  getCourseDistribution: () => {
    return api.get<any, ApiResponse<{ name: string; value: number }[]>>('/analytics/course-distribution').catch(() => ({ data: [] as { name: string; value: number }[] }));
  },

  // 教师绩效 - 后端实际端点: GET /analytics/teacher-performance
  getTeacherPerformance: () => {
    return api.get<any, ApiResponse<PerformanceData[]>>('/analytics/teacher-performance').catch(() => ({ data: [] as PerformanceData[] }));
  },

  // 收入趋势 - 后端实际端点: GET /analytics/revenue-trend
  getRevenueTrend: (params?: { year?: number }) => {
    return api.get<any, ApiResponse<RevenueData[]>>('/analytics/revenue-trend', { params }).catch(() => ({ data: [] as RevenueData[] }));
  },

  // 班级对比 - 后端实际端点: GET /analytics/class-comparison
  getClassComparison: () => {
    return api.get<any, ApiResponse<{
      className: string;
      studentCount: number;
      avgScore: number;
      passRate: number;
    }[]>>('/analytics/class-comparison').catch(() => ({ data: [] as { className: string; studentCount: number; avgScore: number; passRate: number }[] }));
  },
};
