import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '../types/user';
import { authService } from '../services/authService';
import { getRoleHomePath } from '../utils/permission';

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
  }) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

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
          const { access_token, user } = response.data;
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
          const response = await authService.register(data);
          const { access_token, user } = response.data;
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
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      fetchProfile: async () => {
        try {
          const response = await authService.getProfile();
          set({ user: response.data });
        } catch {
          get().logout();
        }
      },

      setUser: (user: User) => set({ user }),
      setToken: (token: string) => set({ token, isAuthenticated: true }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
