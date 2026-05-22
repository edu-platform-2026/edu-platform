import api from './api';
import { Notification } from '../types/api';
import { ApiResponse, PaginatedResponse, QueryParams } from '../types/api';

export const notificationService = {
  getNotifications: (params?: QueryParams) => {
    return api.get<any, PaginatedResponse<Notification>>('/notifications', { params });
  },

  getMyNotifications: (params?: QueryParams) => {
    return api.get<any, PaginatedResponse<Notification>>('/notifications/my', { params });
  },

  getUnreadCount: () => {
    return api.get<any, ApiResponse<{ count: number }>>('/notifications/unread-count');
  },

  markAsRead: (id: string) => {
    return api.post<any, ApiResponse<void>>(`/notifications/${id}/read`);
  },

  markAllAsRead: () => {
    return api.post<any, ApiResponse<void>>('/notifications/read-batch');
  },

  deleteNotification: (id: string) => {
    return api.delete<any, ApiResponse<void>>(`/notifications/${id}`);
  },

  sendNotification: (data: { title: string; content: string; type: number; targetRole?: string; targetUsers?: string[] }) => {
    return api.post<any, ApiResponse<Notification>>('/notifications', data);
  },
};
