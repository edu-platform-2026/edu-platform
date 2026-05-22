import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 全局 token 存储
 * 使用模块级变量，登录时立即设置，API 请求时立即读取
 * 避免 Zustand persist 异步写入 localStorage 的时序问题
 */
let _globalToken: string | null = null;

/** 设置 token（登录成功后立即调用） */
export function setGlobalToken(token: string | null) {
  _globalToken = token;
}

/** 获取 token */
export function getGlobalToken(): string | null {
  return _globalToken;
}

/** 清除 token（登出时调用） */
export function clearGlobalToken() {
  _globalToken = null;
}

/**
 * 从 localStorage 恢复 token（页面刷新时调用）
 */
export function restoreTokenFromStorage() {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      const token = parsed?.state?.token || null;
      if (token) {
        _globalToken = token;
      }
    }
  } catch {
    // ignore
  }
}

// 模块加载时立即尝试从 localStorage 恢复
restoreTokenFromStorage();

/**
 * 请求拦截器 — 自动添加 Authorization 头
 */
api.interceptors.request.use(
  (config) => {
    // 优先从内存读取，其次从 localStorage
    let token = _globalToken;
    if (!token) {
      restoreTokenFromStorage();
      token = _globalToken;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * 响应拦截器
 */
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
