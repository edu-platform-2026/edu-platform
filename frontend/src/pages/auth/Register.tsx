import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Typography, Divider, Space, message, Tag } from 'antd';
import {
  UserOutlined, LockOutlined, MailOutlined, PhoneOutlined,
  SafetyCertificateOutlined, IdcardOutlined, GiftOutlined,
} from '@ant-design/icons';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/user';
import { getRoleLabel } from '../../utils/permission';
import { useAuthStore } from '../../stores/authStore';
import { invitationService } from '../../services/invitationService';

const { Title, Text } = Typography;

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, isAuthenticated, user } = useAuth();
  const registerFn = useAuthStore((state) => state.register);
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code') || '';
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [form] = Form.useForm();

  // Validate invite code on mount
  useEffect(() => {
    if (inviteCode) {
      form.setFieldsValue({ invitationCode: inviteCode });
      invitationService.checkCode(inviteCode).then((res: any) => {
        if (res?.data) {
          setInviteInfo(res.data);
          if (res.data.role) {
            form.setFieldsValue({ role: res.data.role });
          }
          message.success('Invitation code validated');
        }
      }).catch(() => {
        message.warning('Invalid invitation code');
      });
    }
  }, [inviteCode, form]);

  const onFinish = async (values: any) => {
    if (values.password !== values.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await registerFn({
        username: values.username,
        password: values.password,
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: values.role,
        invitationCode: values.invitationCode || undefined,
      });
      message.success('Registration successful');
      navigate('/login');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Registration failed';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" bordered={false}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 8 }}>Account Registration</Title>
          <Text type="secondary">Create your account</Text>
        </div>

        {inviteInfo && (
          <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
            <Tag color="green" icon={<GiftOutlined />}>Invited by: {inviteInfo.inviter?.realName || inviteInfo.inviter?.username || 'Unknown'}</Tag>
          </div>
        )}

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          size="large"
          layout="vertical"
          initialValues={{ role: UserRole.PARENT, invitationCode: inviteCode }}
        >
          <Form.Item name="invitationCode" style={{ display: 'none' }}>
            <Input />
          </Form.Item>

          <Form.Item name="role" rules={[{ required: true, message: 'Please select a role' }]}>
            <Select placeholder="Select role" suffixIcon={<SafetyCertificateOutlined />}
              disabled={!!inviteInfo?.role}>
              {[UserRole.PARENT, UserRole.STUDENT].map((role) => (
                <Select.Option key={role} value={role}>
                  {getRoleLabel(role)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="username" rules={[
            { required: true, message: 'Please enter username' },
            { min: 3, message: 'At least 3 characters' },
          ]}>
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>

          <Form.Item name="name" rules={[{ required: true, message: 'Please enter your name' }]}>
            <Input prefix={<IdcardOutlined />} placeholder="Real name" />
          </Form.Item>

          <Form.Item name="email" rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Invalid email format' },
          ]}>
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item name="phone">
            <Input prefix={<PhoneOutlined />} placeholder="Phone (optional)" />
          </Form.Item>

          <Form.Item name="password" rules={[
            { required: true, message: 'Please enter password' },
            { min: 8, message: 'At least 8 characters' },
          ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password (8+ characters)" />
          </Form.Item>

          <Form.Item name="confirmPassword" rules={[
            { required: true, message: 'Please confirm password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve();
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Register
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary" style={{ fontSize: 12 }}>Other actions</Text>
        </Divider>
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Text type="secondary">Already have an account?</Text>
            <Link to="/login">Login now</Link>
          </Space>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/" style={{ color: 'rgba(0,0,0,0.45)' }}>Back to home</Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
