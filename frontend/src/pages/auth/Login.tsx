import React, { useState } from 'react';
import { Card, Form, Input, Button, Select, Typography, Divider, Space, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/user';
import { getRoleLabel } from '../../utils/permission';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values: { username: string; password: string; role: UserRole }) => {
    setLoading(true);
    try {
      await login(values.username, values.password, values.role);
      message.success('登录成功');
    } catch (error: any) {
      const msg = error?.response?.data?.message || '登录失败，请检查用户名和密码';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" bordered={false}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 8 }}>教育管理平台</Title>
          <Text type="secondary">欢迎回来，请登录您的账号</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          size="large"
          initialValues={{ role: UserRole.TEACHER }}
        >
          <Form.Item
            name="role"
            rules={[{ required: true, message: '请选择登录角色' }]}
          >
            <Select
              placeholder="请选择角色"
              suffixIcon={<SafetyCertificateOutlined />}
            >
              {Object.values(UserRole).map((role) => (
                <Select.Option key={role} value={role}>
                  {getRoleLabel(role)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary" style={{ fontSize: 12 }}>其他操作</Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Space>
            <Text type="secondary">还没有账号？</Text>
            <Link to="/register">立即注册</Link>
          </Space>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/" style={{ color: 'rgba(0,0,0,0.45)' }}>
            返回首页
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
