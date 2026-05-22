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

  useEffect(() => {
    if (inviteCode) {
      form.setFieldsValue({ invitationCode: inviteCode });
      invitationService.checkCode(inviteCode).then((res: any) => {
        if (res?.data) {
          setInviteInfo(res.data);
          if (res.data.role) {
            form.setFieldsValue({ role: res.data.role });
          }
          message.success('邀请码验证成功');
        }
      }).catch(() => {
        message.warning('邀请码无效');
      });
    }
  }, [inviteCode, form]);

  const onFinish = async (values: any) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
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
      message.success('注册成功');
      navigate('/login');
    } catch (error: any) {
      const msg = error?.response?.data?.message || '注册失败，请稍后重试';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" bordered={false}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 8 }}>账号注册</Title>
          <Text type="secondary">创建您的账号</Text>
        </div>

        {inviteInfo && (
          <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
            <Tag color="green" icon={<GiftOutlined />}>邀请人: {inviteInfo.inviter?.realName || inviteInfo.inviter?.username || '未知'}</Tag>
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

          <Form.Item name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="请选择角色" suffixIcon={<SafetyCertificateOutlined />}
              disabled={!!inviteInfo?.role}>
              {[UserRole.PARENT, UserRole.STUDENT].map((role) => (
                <Select.Option key={role} value={role}>
                  {getRoleLabel(role)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="username" rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, message: '用户名至少3个字符' },
          ]}>
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input prefix={<IdcardOutlined />} placeholder="请输入真实姓名" />
          </Form.Item>

          <Form.Item name="email" rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}>
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item name="phone">
            <Input prefix={<PhoneOutlined />} placeholder="请输入手机号（可选）" />
          </Form.Item>

          <Form.Item name="password" rules={[
            { required: true, message: '请输入密码' },
            { min: 8, message: '密码至少8个字符' },
          ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码（至少8位）" />
          </Form.Item>

          <Form.Item name="confirmPassword" rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve();
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请确认密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              注册
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary" style={{ fontSize: 12 }}>其他操作</Text>
        </Divider>
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Text type="secondary">已有账号？</Text>
            <Link to="/login">立即登录</Link>
          </Space>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/" style={{ color: 'rgba(0,0,0,0.45)' }}>返回首页</Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
