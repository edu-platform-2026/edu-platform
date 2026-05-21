import api from './api';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/user';
import { ApiResponse } from '../types/api';

export const authService = {
  login: (data: LoginRequest) => {
    return api.post<any, ApiResponse<AuthResponse>>('/auth/login', data);
  },

  register: (data: RegisterRequest) => {
    return api.post<any, ApiResponse<AuthResponse>>('/auth/register', data);
  },

  getProfile: () => {
    return api.get<any, ApiResponse<User>>('/auth/profile');
  },

  refreshToken: () => {
    return api.post<any, ApiResponse<{ access_token: string }>>('/auth/refresh');
  },
};
