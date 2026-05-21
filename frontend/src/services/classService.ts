import api from './api';
import { ClassInfo } from '../types/api';
import { ApiResponse, PaginatedResponse, QueryParams } from '../types/api';
import { User } from '../types/user';

export const classService = {
  getClasses: (params?: QueryParams) => {
    return api.get<any, PaginatedResponse<ClassInfo>>('/classes', { params });
  },

  getClass: (id: string) => {
    return api.get<any, ApiResponse<ClassInfo>>(`/classes/${id}`);
  },

  createClass: (data: { name: string; grade: string; description?: string; teacherId?: string }) => {
    return api.post<any, ApiResponse<ClassInfo>>('/classes', data);
  },

  updateClass: (id: string, data: Partial<{ name: string; grade: string; description: string; teacherId: string }>) => {
    return api.patch<any, ApiResponse<ClassInfo>>(`/classes/${id}`, data);
  },

  deleteClass: (id: string) => {
    return api.delete<any, ApiResponse<void>>(`/classes/${id}`);
  },

  getClassStudents: (classId: string, params?: QueryParams) => {
    return api.get<any, PaginatedResponse<User>>(`/classes/${classId}/students`, { params });
  },

  addStudentToClass: (classId: string, studentId: string) => {
    return api.post<any, ApiResponse<void>>(`/classes/${classId}/students`, { studentId });
  },

  removeStudentFromClass: (classId: string, studentId: string) => {
    return api.delete<any, ApiResponse<void>>(`/classes/${classId}/students/${studentId}`);
  },
};
