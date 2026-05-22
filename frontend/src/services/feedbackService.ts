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
    return api.post<any, ApiResponse<Feedback>>(`/feedback/${id}/reply`, data);
  },

  updateFeedback: (id: string, data: Partial<{ status: string; reply: string }>) => {
    return api.put<any, ApiResponse<Feedback>>(`/feedback/${id}`, data);
  },

  deleteFeedback: (id: string) => {
    return api.delete<any, ApiResponse<void>>(`/feedback/${id}`);
  },

  getMyFeedbacks: (params?: QueryParams) => {
    return api.get<any, PaginatedResponse<Feedback>>('/feedback/my', { params });
  },
};
