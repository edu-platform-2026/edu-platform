import api from './api';
import { Notification } from '../types/api';
import { ApiResponse, PaginatedResponse, QueryParams } from '../types/api';

export const notificationService = {
  getNotifications: (params?: QueryParams) => {
    return api.get<any, PaginatedResponse<Notification>>('/notifications', { params });
  },

  getUnreadCount: () => {
    return api.get<any, ApiResponse<{ count: number }>>('/notifications/unread-count');
  },

  markAsRead: (id: string) => {
    return api.patch<any, ApiResponse<void>>(`/notifications/${id}/read`);
  },

  markAllAsRead: () => {
    return api.patch<any, ApiResponse<void>>('/notifications/read-all');
  },

  deleteNotification: (id: string) => {
    return api.delete<any, ApiResponse<void>>(`/notifications/${id}`);
  },

  sendNotification: (data: { title: string; content: string; type: string; userIds?: string[] }) => {
    return api.post<any, ApiResponse<Notification>>('/notifications', data);
  },
};
