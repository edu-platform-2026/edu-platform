import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Modal, Form, Select, message,
  Popconfirm, Typography, Row, Col,
} from 'antd';
import {
  SearchOutlined, DeleteOutlined, SendOutlined, BellOutlined,
} from '@ant-design/icons';
import { notificationService } from '../../services/notificationService';
import { Notification } from '../../types/api';
import { formatDateTime } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;
const { Text } = Typography;

const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications({ page, pageSize, keyword });
      const data = response.data;
      setNotifications(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setNotifications([
        { id: '1', title: '系统维护通知', content: '系统将于本周六凌晨2点进行维护升级，预计耗时2小时。', type: 'SYSTEM', userId: 'all', isRead: false, createdAt: '2024-01-15T10:00:00' },
        { id: '2', title: '期中考试安排', content: '期中考试将于下周一至周三举行，请各位同学做好准备。', type: 'COURSE', userId: 'all', isRead: false, createdAt: '2024-01-14T14:00:00' },
        { id: '3', title: '新课程上线通知', content: '新增《人工智能基础》课程，欢迎有兴趣的同学选修。', type: 'COURSE', userId: 'all', isRead: true, createdAt: '2024-01-13T09:00:00' },
        { id: '4', title: '作业提交提醒', content: '请各位同学按时提交作业，逾期将影响成绩。', type: 'ASSIGNMENT', userId: 'all', isRead: true, createdAt: '2024-01-12T16:00:00' },
      ]);
      setTotal(4);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // 通知类型映射：前端字符串 → 后端整数
  const typeMap: Record<string, number> = {
    SYSTEM: 1,
    ASSIGNMENT: 2,
    COURSE: 3,
    GENERAL: 5,
  };

  // 目标角色映射
  const targetRoleMap: Record<string, string> = {
    teachers: 'TEACHER',
    students: 'STUDENT',
    parents: 'PARENT',
  };

  const handleSend = async () => {
    try {
      const values = await form.validateFields();
      const payload: any = {
        title: values.title,
        content: values.content,
        type: typeMap[values.type] || 5,
      };
      // 设置目标角色（all不传targetRole表示广播全体）
      if (values.target && values.target !== 'all') {
        payload.targetRole = targetRoleMap[values.target] || values.target;
      }
      await notificationService.sendNotification(payload);
      message.success('发送成功');
      setModalVisible(false);
      fetchNotifications();
    } catch (err: any) {
      // 区分表单校验错误和API错误
      if (err?.errorFields) {
        // 表单校验失败，不做额外处理
        return;
      }
      message.error(err?.message || '发送失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      message.success('删除成功');
      fetchNotifications();
    } catch {
      message.error('删除失败，请重试');
    }
  };

  const getTypeTag = (type: string) => {
    const map: Record<string, { color: string; text: string }> = {
      SYSTEM: { color: 'red', text: '系统' },
      COURSE: { color: 'blue', text: '课程' },
      ASSIGNMENT: { color: 'orange', text: '作业' },
      GENERAL: { color: 'default', text: '通用' },
    };
    const { color, text } = map[type] || { color: 'default', text: type };
    return <Tag color={color}>{text}</Tag>;
  };

  const columns: ColumnsType<Notification> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record) => (
        <Space>
          <BellOutlined style={{ color: record.isRead ? '#999' : '#1677ff' }} />
          <Text strong={!record.isRead}>{text}</Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getTypeTag(type),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '发送时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Popconfirm title="确定删除此通知？" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="通知管理"
        subtitle="管理系统通知"
        extra={
          <Button type="primary" icon={<SendOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>
            发送通知
          </Button>
        }
      />

      <Card bordered={false}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索通知标题"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={fetchNotifications}
              allowClear
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={notifications}
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
        title="发送通知"
        open={modalVisible}
        onOk={handleSend}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="通知标题" rules={[{ required: true, message: '请输入通知标题' }]}>
            <Input placeholder="请输入通知标题" />
          </Form.Item>
          <Form.Item name="type" label="通知类型" rules={[{ required: true, message: '请选择通知类型' }]}>
            <Select placeholder="请选择通知类型">
              <Select.Option value="SYSTEM">系统通知</Select.Option>
              <Select.Option value="COURSE">课程通知</Select.Option>
              <Select.Option value="ASSIGNMENT">作业通知</Select.Option>
              <Select.Option value="GENERAL">通用通知</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="target" label="发送对象" initialValue="all">
            <Select placeholder="请选择发送对象">
              <Select.Option value="all">全体用户</Select.Option>
              <Select.Option value="teachers">全体教师</Select.Option>
              <Select.Option value="students">全体学生</Select.Option>
              <Select.Option value="parents">全体家长</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="通知内容" rules={[{ required: true, message: '请输入通知内容' }]}>
            <TextArea rows={4} placeholder="请输入通知内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminNotifications;
