import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../utils/permission';

export const usePermission = () => {
  const user = useAuthStore((state) => state.user);

  const check = useMemo(() => {
    return (permission: string): boolean => {
      if (!user) return false;
      return hasPermission(user.role, permission);
    };
  }, [user]);

  const checkAny = useMemo(() => {
    return (permissions: string[]): boolean => {
      if (!user) return false;
      return hasAnyPermission(user.role, permissions);
    };
  }, [user]);

  const checkAll = useMemo(() => {
    return (permissions: string[]): boolean => {
      if (!user) return false;
      return hasAllPermissions(user.role, permissions);
    };
  }, [user]);

  return {
    hasPermission: check,
    hasAnyPermission: checkAny,
    hasAllPermissions: checkAll,
  };
};
