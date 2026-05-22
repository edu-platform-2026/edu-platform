import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Button, Badge, Drawer } from 'antd';
import {
  DashboardOutlined, FileTextOutlined, BookOutlined, CalendarOutlined, FolderOutlined,
  TeamOutlined, BarChartOutlined, UserOutlined, LogoutOutlined, MenuFoldOutlined,
  MenuUnfoldOutlined, BellOutlined, RobotOutlined, CheckCircleOutlined, MessageOutlined,
  VideoCameraOutlined, ShareAltOutlined, MenuOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { notificationService } from '../services/notificationService';
import { useIsMobile } from '../hooks/useIsMobile';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

interface TeacherLayoutProps { children: React.ReactNode; }

const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchUnread = async () => {
      try { const res = await notificationService.getUnreadCount(); setUnreadCount((res as any)?.data?.unreadCount ?? 0); } catch {}
    };
    fetchUnread();
    const timer = setInterval(fetchUnread, 60000);
    return () => clearInterval(timer);
  }, []);

  // 手机端自动收起侧边栏
  useEffect(() => { if (isMobile) setCollapsed(true); }, [isMobile]);

  // 路由变化时关闭抽屉
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const menuItems: MenuProps['items'] = [
    { key: '/teacher/dashboard', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/teacher/courses', icon: <BookOutlined />, label: '课程管理' },
    { key: 'assignment-group', label: '作业管理', icon: <FileTextOutlined />,
      children: [
        { key: '/teacher/assignments', label: '作业列表' },
        { key: '/teacher/create-assignment', label: '在线出题' },
        { key: '/teacher/grading', label: '批改作业' },
      ],
    },
    { key: '/teacher/schedule', icon: <CalendarOutlined />, label: '课表查看' },
    { key: '/teacher/resources', icon: <FolderOutlined />, label: '教学资源' },
    { key: '/teacher/course-videos', icon: <VideoCameraOutlined />, label: '课程视频' },
    { key: '/teacher/classes', icon: <TeamOutlined />, label: '班级互动' },
    { key: '/teacher/analytics', icon: <BarChartOutlined />, label: '数据分析' },
    { key: '/teacher/attendance', icon: <CheckCircleOutlined />, label: '考勤签到' },
    { key: '/teacher/ai-settings', icon: <RobotOutlined />, label: 'AI模型配置' },
    { key: '/teacher/invitations', icon: <ShareAltOutlined />, label: '邀请管理' },
    { key: '/teacher/messages', icon: <MessageOutlined />, label: '消息中心' },
    { key: '/teacher/notifications-center', icon: <BellOutlined />, label: '通知中心' },
  ];

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleMenuClick = (info: { key: string }) => { navigate(info.key); };
  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') { logout(); navigate('/login', { replace: true }); }
    else if (key === 'profile') { navigate('/teacher/profile'); }
  };

  const siderWidth = collapsed ? 80 : 220;

  const menuContent = (
    <>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed && !isMobile ? 16 : 20, fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {collapsed && !isMobile ? '教' : '教师工作台'}
      </div>
      <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={handleMenuClick} />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 手机端：抽屉式侧边栏 */}
      {isMobile ? (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={220}
          bodyStyle={{ padding: 0, background: '#001529' }}
          headerStyle={{ display: 'none' }}
        >
          {menuContent}
        </Drawer>
      ) : (
        /* 电脑端：固定侧边栏 */
        <Sider trigger={null} collapsible collapsed={collapsed} width={220}
          style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0 }}>
          {menuContent}
        </Sider>
      )}

      <Layout style={{ marginLeft: isMobile ? 0 : siderWidth, transition: 'all 0.2s' }}>
        <Header style={{
          padding: isMobile ? '0 12px' : '0 24px',
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 10,
          height: isMobile ? 56 : 64,
        }}>
          <Button
            type="text"
            icon={isMobile ? <MenuOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            onClick={() => isMobile ? setDrawerOpen(true) : setCollapsed(!collapsed)}
            style={{ fontSize: isMobile ? 18 : 14 }}
          />
          <Space size={isMobile ? 'small' : 'middle'}>
            <Badge count={unreadCount} size="small">
              <BellOutlined style={{ fontSize: isMobile ? 18 : 20, cursor: 'pointer' }} onClick={() => navigate('/teacher/notifications-center')} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }} size={4}>
                <Avatar icon={<UserOutlined />} src={user?.avatar} size={isMobile ? 'small' : 'default'} />
                {!isMobile && <span>{user?.realName || user?.name || '教师'}</span>}
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: isMobile ? 8 : 24, minHeight: 280 }}>{children}</Content>
      </Layout>
    </Layout>
  );
};

export default TeacherLayout;
