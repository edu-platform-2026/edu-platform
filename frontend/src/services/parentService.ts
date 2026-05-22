import api from './api';

export interface BoundStudent {
  id: string;
  username: string;
  realName: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  classes: { id: string; name: string; grade?: string }[];
}

export interface StudentAssignment {
  id: string;
  title: string;
  description?: string;
  courseName: string;
  dueDate?: string;
  maxScore: number;
  submission?: {
    id: string;
    score?: number;
    status: number;
    submittedAt?: string;
    gradedAt?: string;
    comment?: string;
  } | null;
}

export interface StudentProgress {
  totalSubmissions: number;
  averageScore: number;
  courseStats: { courseId: string; courseName: string; count: number; avgScore: number }[];
  recentGrades: { assignmentTitle: string; courseName: string; score: number; maxScore: number; gradedAt?: string }[];
}

export const parentService = {
  getBoundStudents: () => {
    return api.get<any, { data: BoundStudent[] }>('/parent/students');
  },
  searchStudents: (keyword: string) => {
    return api.get<any, { data: any[] }>('/parent/search-students', { params: { keyword } });
  },
  bindStudent: (studentId: string) => {
    return api.post('/parent/bind-student', { studentId });
  },
  unbindStudent: (studentId: string) => {
    return api.delete(`/parent/unbind-student/${studentId}`);
  },
  getStudentAssignments: (studentId: string) => {
    return api.get<any, { data: StudentAssignment[] }>('/parent/student-assignments', { params: { studentId } });
  },
  getStudentProgress: (studentId: string) => {
    return api.get<any, { data: StudentProgress }>('/parent/student-progress', { params: { studentId } });
  },
};