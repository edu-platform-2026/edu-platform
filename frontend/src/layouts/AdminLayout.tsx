import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Button, Badge, Drawer, theme } from 'antd';
import {
  DashboardOutlined, UserOutlined, TeamOutlined, BookOutlined, FileTextOutlined,
  BellOutlined, SettingOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  BarChartOutlined, CommentOutlined, DollarOutlined, ShareAltOutlined, MenuOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { notificationService } from '../services/notificationService';
import { useIsMobile } from '../hooks/useIsMobile';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

interface AdminLayoutProps { children: React.ReactNode; }

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
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
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: 'user-group', label: '用户管理', icon: <UserOutlined />,
      children: [{ key: '/admin/users', label: '用户列表' }, { key: '/admin/user-import', label: '批量导入' }] },
    { key: '/admin/classes', icon: <TeamOutlined />, label: '班级管理' },
    { key: '/admin/courses', icon: <BookOutlined />, label: '课程管理' },
    { key: '/admin/notifications', icon: <BellOutlined />, label: '通知管理' },
    { key: '/admin/feedbacks', icon: <CommentOutlined />, label: '反馈处理' },
    { key: '/admin/analytics', icon: <BarChartOutlined />, label: '数据分析' },
    { key: '/admin/payment', icon: <DollarOutlined />, label: '学费管理' },
    { key: '/admin/invitations', icon: <ShareAltOutlined />, label: '邀请数据' },
    { key: '/admin/settings', icon: <SettingOutlined />, label: '系统设置' },
    { key: '/admin/logs', icon: <FileTextOutlined />, label: '操作日志' },
    { key: '/admin/messages', icon: <CommentOutlined />, label: '消息中心' },
    { key: '/admin/notifications-center', icon: <BellOutlined />, label: '通知中心' },
  ];

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleMenuClick = (info: { key: string }) => { navigate(info.key); };
  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') { logout(); navigate('/login', { replace: true }); }
    else if (key === 'profile') { navigate('/admin/profile'); }
  };

  const siderWidth = collapsed ? 80 : 220;

  const menuContent = (
    <>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed && !isMobile ? 16 : 18, fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {collapsed && !isMobile ? '管' : '管理后台'}
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
              <BellOutlined style={{ fontSize: isMobile ? 18 : 20, cursor: 'pointer' }} onClick={() => navigate('/admin/notifications-center')} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }} size={4}>
                <Avatar icon={<UserOutlined />} src={user?.avatar} style={{ backgroundColor: themeToken.colorPrimary }} size={isMobile ? 'small' : 'default'} />
                {!isMobile && <span>{user?.realName || user?.name || '管理员'}</span>}
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: isMobile ? 8 : 24, minHeight: 280 }}>{children}</Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
