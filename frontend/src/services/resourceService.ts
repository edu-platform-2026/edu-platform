import api from './api';
import { Resource } from '../types/api';
import { ApiResponse, PaginatedResponse, QueryParams } from '../types/api';

export const resourceService = {
  getResources: (params?: QueryParams) => {
    return api.get<any, PaginatedResponse<Resource>>('/resources', { params });
  },

  getResource: (id: string) => {
    return api.get<any, ApiResponse<Resource>>(`/resources/${id}`);
  },

  uploadResource: (data: FormData) => {
    return api.post<any, ApiResponse<Resource>>('/resources', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateResource: (id: string, data: Partial<Resource>) => {
    return api.put<any, ApiResponse<Resource>>(`/resources/${id}`, data);
  },

  deleteResource: (id: string) => {
    return api.delete<any, ApiResponse<void>>(`/resources/${id}`);
  },

  downloadResource: (id: string) => {
    return api.get<any, ApiResponse<Resource>>(`/resources/${id}/download`);
  },

  searchResources: (keyword: string) => {
    return api.get<any, ApiResponse<Resource[]>>('/resources/search', { params: { keyword } });
  },

  getCategories: () => {
    return api.get<any, ApiResponse<string[]>>('/resources/categories');
  },
};
