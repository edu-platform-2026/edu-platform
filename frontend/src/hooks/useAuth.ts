import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types/user';
import { getRoleHomePath } from '../utils/permission';
import { useCallback } from 'react';

/**
 * 认证 Hook
 * 封装认证相关的操作，提供登录、登出、角色判断等功能
 */
export const useAuth = () => {
  const { user, token, isAuthenticated, loading, login: storeLogin, logout: storeLogout, fetchProfile, register: storeRegister } = useAuthStore();
  const navigate = useNavigate();

  /**
   * 登录操作
   * 调用 store 登录，成功后跳转到对应角色首页
   */
  const login = useCallback(async (username: string, password: string, role: UserRole) => {
    try {
      const homePath = await storeLogin(username, password, role);
      // 使用 setTimeout 确保状态更新完成后再跳转
      setTimeout(() => {
        navigate(homePath, { replace: true });
      }, 100);
    } catch (error) {
      // 错误由 store 抛出，Login 页面会捕获处理
      throw error;
    }
  }, [storeLogin, navigate]);

  /**
   * 登出操作
   * 清除认证状态并跳转到登录页
   */
  const logout = useCallback(() => {
    storeLogout();
    navigate('/login', { replace: true });
  }, [storeLogout, navigate]);

  /**
   * 判断当前用户是否为指定角色
   */
  const isRole = useCallback((role: UserRole) => {
    return (user?.role || '').toUpperCase() === role.toUpperCase();
  }, [user]);

  /**
   * 跳转到当前角色的首页
   */
  const goHome = useCallback(() => {
    if (user) {
      const role = (user.role || '').toUpperCase() as UserRole;
      navigate(getRoleHomePath(role), { replace: true });
    }
  }, [user, navigate]);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    register: storeRegister,
    fetchProfile,
    isRole,
    goHome,
  };
};
