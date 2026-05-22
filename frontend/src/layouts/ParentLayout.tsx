import React, { useState, useEffect } from 'react';
import { Layout, Avatar, Space, Badge } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  LineChartOutlined,
  MessageOutlined,
  UserOutlined,
  BellOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { notificationService } from '../services/notificationService';

const { Header, Content } = Layout;

interface ParentLayoutProps {
  children: React.ReactNode;
}

const ParentLayout: React.FC<ParentLayoutProps> = ({ children }) => {
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

  const tabs = [
    { key: '/parent/dashboard', title: '首页', icon: HomeOutlined },
    { key: '/parent/assignments', title: '作业', icon: FileTextOutlined },
    { key: '/parent/progress', title: '进度', icon: LineChartOutlined },
    { key: '/parent/feedback', title: '反馈', icon: MessageOutlined },
    { key: '/parent/messages', title: '私信', icon: BellOutlined },
    { key: '/parent/notifications-center', title: '通知', icon: BellOutlined },
    { key: '/parent/profile', title: '我的', icon: UserOutlined },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header
        style={{
          background: '#1677ff',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Space>
          <span style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
            家长端
          </span>
        </Space>
        <Space>
          <Badge count={unreadCount} size="small"><BellOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#fff' }} onClick={() => navigate('/parent/notifications-center')} /></Badge>
          <Avatar
            size="small"
            icon={<UserOutlined />}
            src={user?.avatar}
            onClick={handleLogout}
            style={{ cursor: 'pointer' }}
          />
        </Space>
      </Header>
      <Content style={{ padding: '16px', paddingBottom: '70px' }}>
        {children}
      </Content>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          boxShadow: '0 -1px 4px rgba(0,0,0,0.08)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-around',
          padding: '8px 0',
        }}
      >
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.key;
          const Icon = tab.icon;
          return (
            <div
              key={tab.key}
              onClick={() => navigate(tab.key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '4px 12px',
                color: isActive ? '#1677ff' : '#999',
                transition: 'color 0.2s',
              }}
            >
              <Icon style={{ fontSize: 20 }} />
              <span style={{ fontSize: 12, marginTop: 4 }}>{tab.title}</span>
            </div>
          );
        })}
      </div>
    </Layout>
  );
};

export default ParentLayout;
