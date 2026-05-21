import api from './api';
import { Course, Schedule, CreateCourseRequest, Attendance } from '../types/course';
import { ApiResponse, PaginatedResponse, QueryParams } from '../types/api';

export const courseService = {
  getCourses: (params?: QueryParams) => {
    return api.get<any, PaginatedResponse<Course>>('/courses', { params });
  },

  getCourse: (id: string) => {
    return api.get<any, ApiResponse<Course>>(`/courses/${id}`);
  },

  createCourse: (data: CreateCourseRequest) => {
    return api.post<any, ApiResponse<Course>>('/courses', data);
  },

  updateCourse: (id: string, data: Partial<CreateCourseRequest>) => {
    return api.patch<any, ApiResponse<Course>>(`/courses/${id}`, data);
  },

  deleteCourse: (id: string) => {
    return api.delete<any, ApiResponse<void>>(`/courses/${id}`);
  },

  getSchedules: (params?: QueryParams) => {
    return api.get<any, ApiResponse<Schedule[]>>('/courses/schedules', { params });
  },

  getMySchedules: () => {
    return api.get<any, ApiResponse<Schedule[]>>('/courses/schedules/my');
  },

  createAttendance: (data: { scheduleId: string; records: { studentId: string; status: string; remark?: string }[] }) => {
    return api.post<any, ApiResponse<Attendance[]>>('/courses/attendance', data);
  },

  getAttendance: (scheduleId: string, date: string) => {
    return api.get<any, ApiResponse<Attendance[]>>(`/courses/attendance`, {
      params: { scheduleId, date },
    });
  },
};
