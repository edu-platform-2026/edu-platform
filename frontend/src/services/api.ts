import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch {
        // ignore parse error
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError<{ message?: string; statusCode?: number }>) => {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.message || '请求失败，请稍后重试';

    if (status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
      message.error('登录已过期，请重新登录');
    } else if (status === 403) {
      message.error('没有权限执行此操作');
    } else if (status === 404) {
      message.error('请求的资源不存在');
    } else if (status === 500) {
      message.error('服务器内部错误');
    } else {
      message.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default api;
