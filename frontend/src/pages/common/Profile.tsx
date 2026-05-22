import React, { useState } from 'react';
import {
  Card, Form, Input, Button, Avatar, Upload, message, Row, Col, Divider, Space, Tag, Descriptions, Modal,
} from 'antd';
import {
  UserOutlined, CameraOutlined, SaveOutlined, LockOutlined, MailOutlined, PhoneOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { getRoleLabel } from '../../utils/permission';
import api from '../../services/api';

const Profile: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      // 调用后端 API 真实保存
      const response = await api.put('/auth/profile', values);
      const updatedUser = response.data;
      // 同步更新 store 中的用户信息（同时更新 name 和 realName）
      if (user) {
        setUser({
          ...user,
          ...updatedUser,
          name: updatedUser.name || updatedUser.realName || values.realName,
          realName: updatedUser.realName || values.realName,
        });
      }
      message.success('个人信息更新成功');
      setEditing(false);
    } catch {
      message.error('保存失败，请检查填写信息');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const values = await pwdForm.validateFields();
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的密码不一致');
        return;
      }
      setLoading(true);
      await api.put('/auth/password', {
        currentPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('密码修改成功');
      setPasswordModal(false);
      pwdForm.resetFields();
    } catch (err: any) {
      const msg = err?.response?.data?.message || '密码修改失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>个人信息</h2>

      <Row gutter={24}>
        {/* 左侧头像卡片 */}
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ textAlign: 'center', padding: '24px 0' }}>
            <Upload
              showUploadList={false}
              beforeUpload={() => {
                message.info('头像上传功能开发中');
                return false;
              }}
            >
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  size={120}
                  icon={<UserOutlined />}
                  src={user?.avatar}
                  style={{ backgroundColor: '#1677ff', cursor: 'pointer' }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  background: '#1677ff', borderRadius: '50%', width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', border: '2px solid #fff',
                }}>
                  <CameraOutlined style={{ color: '#fff', fontSize: 14 }} />
                </div>
              </div>
            </Upload>
            <h3 style={{ marginTop: 16, marginBottom: 4 }}>{user?.realName || user?.name || user?.username}</h3>
            <Tag color="blue">{getRoleLabel(user?.role)}</Tag>
            <Divider />
            <Descriptions column={1} size="small">
              <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{user?.email || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="手机">{user?.phone || '未设置'}</Descriptions.Item>
            </Descriptions>
            <Button
              block
              icon={<LockOutlined />}
              style={{ marginTop: 16 }}
              onClick={() => setPasswordModal(true)}
            >
              修改密码
            </Button>
          </Card>
        </Col>

        {/* 右侧信息表单 */}
        <Col xs={24} md={16}>
          <Card
            bordered={false}
            title="基本信息"
            extra={
              editing ? (
                <Space>
                  <Button onClick={() => { setEditing(false); form.resetFields(); }}>取消</Button>
                  <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSave}>
                    保存
                  </Button>
                </Space>
              ) : (
                <Button type="primary" onClick={() => {
                  setEditing(true);
                  form.setFieldsValue({
                    realName: user?.realName || user?.name,
                    email: user?.email,
                    phone: user?.phone,
                  });
                }}>
                  编辑
                </Button>
              )
            }
          >
            <Form
              form={form}
              layout="vertical"
              disabled={!editing}
              initialValues={{
                username: user?.username,
                realName: user?.realName || user?.name,
                email: user?.email,
                phone: user?.phone,
                role: getRoleLabel(user?.role),
              }}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="用户名" name="username">
                    <Input disabled prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="角色" name="role">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="真实姓名"
                    name="realName"
                    rules={[{ required: true, message: '请输入真实姓名' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="请输入真实姓名" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="邮箱"
                    name="email"
                    rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="手机号"
                    name="phone"
                    rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* 修改密码弹窗 */}
      {passwordModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.45)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={() => setPasswordModal(false)}
        >
          <Card
            title="修改密码"
            style={{ width: 420 }}
            onClick={e => e.stopPropagation()}
            extra={<Button type="text" onClick={() => setPasswordModal(false)}>✕</Button>}
          >
            <Form form={pwdForm} layout="vertical">
              <Form.Item
                label="当前密码"
                name="oldPassword"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
              </Form.Item>
              <Form.Item
                label="新密码"
                name="newPassword"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6位' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" />
              </Form.Item>
              <Form.Item
                label="确认新密码"
                name="confirmPassword"
                rules={[{ required: true, message: '请确认新密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
              </Form.Item>
              <Button type="primary" block loading={loading} onClick={handleChangePassword}>
                确认修改
              </Button>
            </Form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Profile;
