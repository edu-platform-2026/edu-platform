import React from 'react';
import { Layout, Menu, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getRoleHomePath } from '../utils/permission';

const { Header, Content, Footer } = Layout;

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 600, color: '#1677ff' }}>
          小黑教育管理平台
        </div>
        <Space>
          {isAuthenticated && user ? (
            <Button type="primary" onClick={() => navigate(getRoleHomePath(user.role))}>
              进入工作台
            </Button>
          ) : (
            <>
              <Button onClick={() => navigate('/login')}>登录</Button>
              <Button type="primary" onClick={() => navigate('/register')}>注册</Button>
            </>
          )}
        </Space>
      </Header>
      <Content>{children}</Content>
      <Footer style={{ textAlign: 'center', background: '#001529', color: 'rgba(255,255,255,0.65)' }}>
        小黑大王 &copy; {new Date().getFullYear()} 版权所有
      </Footer>
    </Layout>
  );
};

export default PublicLayout;
