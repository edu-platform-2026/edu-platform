import api from './api';
import {
  Assignment,
  AssignmentSubmission,
  CreateAssignmentRequest,
  GradeSubmissionRequest,
} from '../types/assignment';
import { ApiResponse, PaginatedResponse, QueryParams } from '../types/api';

export const assignmentService = {
  getAssignments: (params?: QueryParams) => {
    return api.get<any, PaginatedResponse<Assignment>>('/assignments', { params });
  },

  getAssignment: (id: string) => {
    return api.get<any, ApiResponse<Assignment>>(`/assignments/${id}`);
  },

  createAssignment: (data: CreateAssignmentRequest) => {
    return api.post<any, ApiResponse<Assignment>>('/assignments', data);
  },

  updateAssignment: (id: string, data: Partial<CreateAssignmentRequest>) => {
    return api.patch<any, ApiResponse<Assignment>>(`/assignments/${id}`, data);
  },

  deleteAssignment: (id: string) => {
    return api.delete<any, ApiResponse<void>>(`/assignments/${id}`);
  },

  publishAssignment: (id: string) => {
    return api.patch<any, ApiResponse<Assignment>>(`/assignments/${id}/publish`);
  },

  getSubmissions: (assignmentId: string, params?: QueryParams) => {
    return api.get<any, PaginatedResponse<AssignmentSubmission>>(
      `/assignments/${assignmentId}/submissions`,
      { params }
    );
  },

  gradeSubmission: (submissionId: string, data: GradeSubmissionRequest) => {
    return api.patch<any, ApiResponse<AssignmentSubmission>>(
      `/submissions/${submissionId}/grade`,
      data
    );
  },

  submitAssignment: (assignmentId: string, data: { content: string; attachments?: string[] }) => {
    return api.post<any, ApiResponse<AssignmentSubmission>>(
      `/assignments/${assignmentId}/submit`,
      data
    );
  },
};
