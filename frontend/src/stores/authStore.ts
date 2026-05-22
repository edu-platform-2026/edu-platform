import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '../types/user';
import { authService } from '../services/authService';
import { getRoleHomePath } from '../utils/permission';
import { setGlobalToken, clearGlobalToken, restoreTokenFromStorage } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;

  login: (username: string, password: string, role: UserRole) => Promise<string>;
  register: (data: {
    username: string;
    password: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    invitationCode?: string;
  }) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

/**
 * 从后端响应中提取实际数据
 * 后端 TransformInterceptor 会包装成 { code, message, data, timestamp }
 * api 拦截器已剥离 axios 包装，所以 response 就是后端响应体
 */
function unwrapResponse<T = any>(response: any): T {
  if (response && typeof response === 'object' && 'data' in response && 'code' in response) {
    return response.data as T;
  }
  return response as T;
}

/**
 * 认证状态管理
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      login: async (username: string, password: string, role: UserRole) => {
        set({ loading: true });
        try {
          const response = await authService.login({ username, password, role });
          const { access_token, user } = unwrapResponse<{ access_token: string; user: User }>(response);

          if (!access_token || !user) {
            throw new Error('登录响应数据格式异常');
          }

          if (user.role) {
            user.role = user.role.toUpperCase() as UserRole;
          }

          // ★ 关键：立即同步设置全局 token
          setGlobalToken(access_token);

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            loading: false,
          });

          return getRoleHomePath(user.role);
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ loading: true });
        try {
          // 映射前端字段到后端字段
          const apiData: any = {
            username: data.username,
            password: data.password,
            realName: data.name,
            email: data.email,
            phone: data.phone,
            role: data.role,
          };
          if (data.invitationCode) {
            apiData.invitationCode = data.invitationCode;
          }
          const response = await authService.register(apiData);
          const { access_token, user } = unwrapResponse<{ access_token: string; user: User }>(response);

          if (user?.role) {
            user.role = user.role.toUpperCase() as UserRole;
          }

          setGlobalToken(access_token);

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      logout: () => {
        clearGlobalToken();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      fetchProfile: async () => {
        try {
          const response = await authService.getProfile();
          const user = unwrapResponse<User>(response);

          if (user && !user.role && user.roles && user.roles.length > 0) {
            user.role = user.roles[0].toUpperCase() as UserRole;
          }
          if (user?.role) {
            user.role = user.role.toUpperCase() as UserRole;
          }

          set({ user });
        } catch {
          get().logout();
        }
      },

      setUser: (user: User) => set({ user }),
      setToken: (token: string) => {
        setGlobalToken(token);
        set({ token, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // ★ 页面刷新时，从 localStorage 恢复 token 到全局变量
      onRehydrateStorage: () => {
        return () => {
          restoreTokenFromStorage();
        };
      },
    }
  )
);
