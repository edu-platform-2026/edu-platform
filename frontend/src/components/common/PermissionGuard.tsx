import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();
  const navigate = useNavigate();

  const checkPermission = (): boolean => {
    if (permission) {
      return hasPermission(permission);
    }
    if (permissions.length > 0) {
      return requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
    }
    return true;
  };

  if (!checkPermission()) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问此页面"
        extra={
          <Button type="primary" onClick={() => navigate(-1)}>
            返回上一页
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
};

export default PermissionGuard;
