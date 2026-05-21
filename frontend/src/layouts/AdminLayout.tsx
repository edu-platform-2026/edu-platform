import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Button, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  BellOutlined,
  CommentOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import NotificationBell from '../components/common/NotificationBell';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token: themeToken } = theme.useToken();

  const menuItems: MenuProps['items'] = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: '/admin/classes',
      icon: <TeamOutlined />,
      label: '班级管理',
    },
    {
      key: '/admin/courses',
      icon: <BookOutlined />,
      label: '课程管理',
    },
    {
      key: '/admin/notifications',
      icon: <BellOutlined />,
      label: '通知管理',
    },
    {
      key: '/admin/feedbacks',
      icon: <CommentOutlined />,
      label: '反馈处理',
    },
    {
      key: '/admin/analytics',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleMenuClick = (info: { key: string }) => {
    navigate(info.key);
  };

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 16 : 20,
            fontWeight: 600,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {collapsed ? '管' : '管理后台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Space size="middle">
            <NotificationBell />
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} src={user?.avatar} style={{ backgroundColor: themeToken.colorPrimary }} />
                <span>{user?.name || '管理员'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
