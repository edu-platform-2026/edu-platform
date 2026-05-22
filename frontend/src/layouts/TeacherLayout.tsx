import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Button, Badge } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  BookOutlined,
  CalendarOutlined,
  FolderOutlined,
  TeamOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  VideoCameraOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { notificationService } from '../services/notificationService';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

interface TeacherLayoutProps {
  children: React.ReactNode;
}

const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        setUnreadCount((res as any)?.data?.unreadCount ?? 0);
      } catch { /* ignore */ }
    };
    fetchUnread();
    const timer = setInterval(fetchUnread, 60000);
    return () => clearInterval(timer);
  }, []);

  const menuItems: MenuProps['items'] = [
    {
      key: '/teacher/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/teacher/courses',
      icon: <BookOutlined />,
      label: '课程管理',
    },
    {
      key: 'assignment-group',
      label: '作业管理',
      icon: <FileTextOutlined />,
      children: [
        { key: '/teacher/assignments', label: '作业列表' },
        { key: '/teacher/create-assignment', label: '在线出题' },
        { key: '/teacher/grading', label: '批改作业' },
      ],
    },
    {
      key: '/teacher/schedule',
      icon: <CalendarOutlined />,
      label: '课表查看',
    },
    {
      key: '/teacher/resources',
      icon: <FolderOutlined />,
      label: '教学资源',
    },
    {
      key: '/teacher/course-videos',
      icon: <VideoCameraOutlined />,
      label: '课程视频',
    },
    {
      key: '/teacher/classes',
      icon: <TeamOutlined />,
      label: '班级互动',
    },
    {
      key: '/teacher/analytics',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
    {
      key: '/teacher/attendance',
      icon: <CheckCircleOutlined />,
      label: '考勤签到',
    },
    {
      key: '/teacher/ai-settings',
      icon: <RobotOutlined />,
      label: 'AI模型配置',
    },
    {
      key: '/teacher/invitations',
      icon: <ShareAltOutlined />,
      label: '邀请管理',
    },
    {
      key: '/teacher/messages',
      icon: <MessageOutlined />,
      label: '消息中心',
    },
    {
      key: '/teacher/notifications-center',
      icon: <BellOutlined />,
      label: '通知中心',
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
    } else if (key === 'profile') {
      navigate('/teacher/profile');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
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
          {collapsed ? '教' : '教师工作台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'all 0.2s' }}>
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
            <Badge count={unreadCount} size="small"><BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} onClick={() => navigate('/teacher/notifications-center')} /></Badge>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} src={user?.avatar} />
                <span>{user?.realName || user?.name || '教师'}</span>
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

export default TeacherLayout;
