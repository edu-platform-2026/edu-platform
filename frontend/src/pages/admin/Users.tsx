import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Modal, Form, Select, message,
  Popconfirm, Typography, Row, Col, Avatar,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import { User, UserRole } from '../../types/user';
import { getRoleLabel } from '../../utils/permission';
import { formatDateTime } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/users', {
        params: { page, pageSize, keyword, role: roleFilter || undefined },
      });
      const data = response.data;
      setUsers(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setUsers([
        { id: '1', username: 'zhangsan', name: '张三', email: 'zhangsan@example.com', role: UserRole.TEACHER, phone: '13800138001', createdAt: '2024-01-01T00:00:00', updatedAt: '2024-01-01T00:00:00' },
        { id: '2', username: 'lisi', name: '李四', email: 'lisi@example.com', role: UserRole.TEACHER, phone: '13800138002', createdAt: '2024-01-01T00:00:00', updatedAt: '2024-01-01T00:00:00' },
        { id: '3', username: 'wangwu', name: '王五', email: 'wangwu@example.com', role: UserRole.STUDENT, phone: '13800138003', createdAt: '2024-01-01T00:00:00', updatedAt: '2024-01-01T00:00:00' },
        { id: '4', username: 'zhaoliu', name: '赵六', email: 'zhaoliu@example.com', role: UserRole.PARENT, phone: '13800138004', createdAt: '2024-01-01T00:00:00', updatedAt: '2024-01-01T00:00:00' },
        { id: '5', username: 'sunqi', name: '孙七', email: 'sunqi@example.com', role: UserRole.ADMIN, phone: '13800138005', createdAt: '2024-01-01T00:00:00', updatedAt: '2024-01-01T00:00:00' },
      ]);
      setTotal(5);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingId(record.id);
    form.setFieldsValue({
      username: record.username,
      name: record.name,
      email: record.email,
      phone: record.phone,
      role: record.role,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      message.success('删除成功');
      fetchUsers();
    } catch {
      message.error('删除失败，请重试');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        // Only send fields that backend accepts
        const updateData: any = {
          realName: values.name || values.realName,
          email: values.email,
          phone: values.phone,
          role: values.role,
        };
        await api.put(`/users/${editingId}`, updateData);
        message.success('更新成功');
      } else {
        await api.post('/users', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchUsers();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || '操作失败，请重试');
    }
  };

  const roleColorMap: Record<string, string> = {
    ADMIN: 'red',
    TEACHER: 'blue',
    PARENT: 'green',
    STUDENT: 'orange',
  };

  const columns: ColumnsType<User> = [
    {
      title: '用户',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={record.avatar} />
          <div>
            <div><Text strong>{record.name}</Text></div>
            <div><Text type="secondary" style={{ fontSize: 12 }}>@{record.username}</Text></div>
          </div>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => (
        <Tag color={roleColorMap[role]}>{getRoleLabel(role)}</Tag>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手机',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此用户？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="用户管理"
        subtitle="管理系统用户"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            添加用户
          </Button>
        }
      />

      <Card bordered={false}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索用户名/姓名/邮箱"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={fetchUsers}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="筛选角色"
              value={roleFilter}
              onChange={setRoleFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="">全部角色</Select.Option>
              {Object.values(UserRole).map((role) => (
                <Select.Option key={role} value={role}>{getRoleLabel(role)}</Select.Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" disabled={!!editingId} />
          </Form.Item>
          {!editingId && (
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="手机">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="请选择角色">
              {Object.values(UserRole).map((role) => (
                <Select.Option key={role} value={role}>{getRoleLabel(role)}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUsers;
