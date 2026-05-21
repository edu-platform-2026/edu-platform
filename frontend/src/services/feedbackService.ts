import api from './api';
import { Feedback } from '../types/api';
import { ApiResponse, PaginatedResponse, QueryParams } from '../types/api';

export const feedbackService = {
  getFeedbacks: (params?: QueryParams) => {
    return api.get<any, PaginatedResponse<Feedback>>('/feedback', { params });
  },

  getFeedback: (id: string) => {
    return api.get<any, ApiResponse<Feedback>>(`/feedback/${id}`);
  },

  createFeedback: (data: { title: string; content: string; type: string }) => {
    return api.post<any, ApiResponse<Feedback>>('/feedback', data);
  },

  replyFeedback: (id: string, data: { reply: string }) => {
    return api.patch<any, ApiResponse<Feedback>>(`/feedback/${id}/reply`, data);
  },

  updateFeedbackStatus: (id: string, status: string) => {
    return api.patch<any, ApiResponse<Feedback>>(`/feedback/${id}/status`, { status });
  },

  deleteFeedback: (id: string) => {
    return api.delete<any, ApiResponse<void>>(`/feedback/${id}`);
  },

  getMyFeedbacks: (params?: QueryParams) => {
    return api.get<any, PaginatedResponse<Feedback>>('/feedback/my', { params });
  },
};
