import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types/user';
import { getRoleHomePath } from '../utils/permission';
import { useCallback } from 'react';

export const useAuth = () => {
  const { user, token, isAuthenticated, loading, login: storeLogin, logout: storeLogout, fetchProfile } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(async (username: string, password: string, role: UserRole) => {
    const homePath = await storeLogin(username, password, role);
    navigate(homePath, { replace: true });
  }, [storeLogin, navigate]);

  const logout = useCallback(() => {
    storeLogout();
    navigate('/login', { replace: true });
  }, [storeLogout, navigate]);

  const isRole = useCallback((role: UserRole) => {
    return user?.role === role;
  }, [user]);

  const goHome = useCallback(() => {
    if (user) {
      navigate(getRoleHomePath(user.role), { replace: true });
    }
  }, [user, navigate]);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    fetchProfile,
    isRole,
    goHome,
  };
};
