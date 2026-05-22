import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Button, Badge, Drawer, theme } from 'antd';
import {
  DashboardOutlined, BookOutlined, FileTextOutlined, LineChartOutlined, CloudOutlined,
  LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, BellOutlined,
  TrophyOutlined, ShareAltOutlined, MenuOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { notificationService } from '../services/notificationService';
import { useIsMobile } from '../hooks/useIsMobile';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

interface StudentLayoutProps { children: React.ReactNode; }

const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token: themeToken } = theme.useToken();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchUnread = async () => {
      try { const res = await notificationService.getUnreadCount(); setUnreadCount((res as any)?.data?.unreadCount ?? 0); } catch {}
    };
    fetchUnread();
    const timer = setInterval(fetchUnread, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { if (isMobile) setCollapsed(true); }, [isMobile]);
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const menuItems: MenuProps['items'] = [
    { key: '/student/dashboard', icon: <DashboardOutlined />, label: '学习首页' },
    { key: '/student/courses', icon: <BookOutlined />, label: '我的课程' },
    { key: '/student/assignments', icon: <FileTextOutlined />, label: '我的作业' },
    { key: '/student/mock-exam', icon: <TrophyOutlined />, label: '模拟考试' },
    { key: '/student/progress', icon: <LineChartOutlined />, label: '学习进度' },
    { key: '/student/wrong-answers', icon: <BookOutlined />, label: '错题本' },
    { key: '/student/resources', icon: <CloudOutlined />, label: '教学资源' },
    { key: '/student/invite', icon: <ShareAltOutlined />, label: '邀请好友' },
    { key: '/student/messages', icon: <BellOutlined />, label: '消息中心' },
    { key: '/student/notifications-center', icon: <BellOutlined />, label: '通知中心' },
  ];

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleMenuClick = (info: { key: string }) => { navigate(info.key); };
  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') { logout(); navigate('/login', { replace: true }); }
    else if (key === 'profile') { navigate('/student/profile'); }
  };

  const siderWidth = collapsed ? 80 : 220;

  const menuContent = (
    <>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed && !isMobile ? 16 : 18, fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {collapsed && !isMobile ? '学' : '学生中心'}
      </div>
      <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={handleMenuClick} />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {isMobile ? (
        <Drawer placement="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} width={220}
          bodyStyle={{ padding: 0, background: '#001529' }} headerStyle={{ display: 'none' }}>
          {menuContent}
        </Drawer>
      ) : (
        <Sider trigger={null} collapsible collapsed={collapsed} width={220}
          style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0 }}>
          {menuContent}
        </Sider>
      )}
      <Layout style={{ marginLeft: isMobile ? 0 : siderWidth, transition: 'all 0.2s' }}>
        <Header style={{
          padding: isMobile ? '0 12px' : '0 24px', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 10,
          height: isMobile ? 56 : 64,
        }}>
          <Button type="text"
            icon={isMobile ? <MenuOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            onClick={() => isMobile ? setDrawerOpen(true) : setCollapsed(!collapsed)}
            style={{ fontSize: isMobile ? 18 : 14 }} />
          <Space size={isMobile ? 'small' : 'middle'}>
            <Badge count={unreadCount} size="small">
              <BellOutlined style={{ fontSize: isMobile ? 18 : 20, cursor: 'pointer' }} onClick={() => navigate('/student/notifications-center')} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }} size={4}>
                <Avatar icon={<UserOutlined />} src={user?.avatar} style={{ backgroundColor: themeToken.colorPrimary }} size={isMobile ? 'small' : 'default'} />
                {!isMobile && <span>{user?.realName || user?.name || '学生'}</span>}
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: isMobile ? 8 : 24, minHeight: 280 }}>{children}</Content>
      </Layout>
    </Layout>
  );
};

export default StudentLayout;
