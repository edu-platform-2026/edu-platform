import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Tag, Button, Modal, Form, InputNumber, Select, Space, message, Row, Col, Statistic, Input, Popconfirm, Spin, Empty,
} from 'antd';
import {
  PlusOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, DeleteOutlined, SearchOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import api from '../../services/api';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface Payment {
  id: string;
  studentId?: string;
  studentName?: string;
  amount: number;
  type?: string | number;
  status: string;
  description?: string;
  remark?: string;
  paidAt?: string;
  createdAt: string;
}

interface StudentOption {
  id: string;
  realName: string;
  username: string;
}

const TYPE_MAP: Record<string, number> = { TUITION: 1, MATERIAL: 2, EXAM: 3, OTHER: 4 };
const TYPE_LABELS: Record<number, string> = { 1: '学费', 2: '教材费', 3: '考试费', 4: '其他' };

const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/payments');
      const data = res?.data;
      const items: Payment[] = Array.isArray(data) ? data : data?.items || [];
      setPayments(items);
    } catch {
      message.error('加载缴费数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleSearchStudents = async (keyword: string) => {
    if (!keyword || keyword.length < 2) { setStudents([]); return; }
    setSearchingStudents(true);
    try {
      const res: any = await api.get('/users', { params: { keyword, role: 'STUDENT', pageSize: 20 } });
      const data = res?.data;
      const items: any[] = Array.isArray(data) ? data : data?.items || [];
      setStudents(items.map((u: any) => ({ id: u.id, realName: u.realName || u.name || u.username, username: u.username })));
    } catch {
      // 静默
    } finally {
      setSearchingStudents(false);
    }
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      // 后端要求: studentId (必填), amount (必填), type (数字1-4, 必填), description (可选)
      await api.post('/payments', {
        studentId: values.studentId,
        amount: values.amount,
        type: TYPE_MAP[values.type] || values.type,
        description: values.description || undefined,
      });
      message.success('缴费记录创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      fetchPayments();
    } catch (err: any) {
      if (err?.errorFields) return;
      const errMsg = err?.response?.data?.message || '创建失败，请重试';
      message.error(Array.isArray(errMsg) ? errMsg.join(', ') : errMsg);
    } finally {
      setCreating(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await api.put(`/payments/${id}/pay`);
      message.success('已标记为已缴费');
      fetchPayments();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/payments/${id}`);
      message.success('删除成功');
      fetchPayments();
    } catch {
      message.error('删除失败');
    }
  };

  const totalAmount = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const paidAmount = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + (p.amount || 0), 0);
  const pendingCount = payments.filter(p => p.status === 'PENDING').length;
  const paidCount = payments.filter(p => p.status === 'PAID').length;

  const statusColors: Record<string, string> = { PENDING: 'orange', PAID: 'green', CANCELLED: 'red', OVERDUE: 'red' };
  const statusLabels: Record<string, string> = { PENDING: '待缴费', PAID: '已缴费', CANCELLED: '已取消', OVERDUE: '已逾期' };

  const getTypeLabel = (t: string | number | undefined) => {
    if (!t) return '-';
    if (typeof t === 'number') return TYPE_LABELS[t] || `类型${t}`;
    return t;
  };

  const columns: ColumnsType<Payment> = [
    { title: '学生', dataIndex: 'studentName', key: 'studentName', width: 100, render: v => v || '-' },
    { title: '类型', dataIndex: 'type', key: 'type', width: 80, render: t => <Tag color="blue">{getTypeLabel(t)}</Tag> },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 100, render: v => <span style={{ fontWeight: 600, color: '#1677ff' }}>¥{(v || 0).toLocaleString()}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: s => <Tag color={statusColors[s] || 'default'}>{statusLabels[s] || s}</Tag> },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, render: v => v || '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: t => t ? new Date(t).toLocaleString('zh-CN') : '-' },
    { title: '缴费时间', dataIndex: 'paidAt', key: 'paidAt', width: 160, render: t => t ? new Date(t).toLocaleString('zh-CN') : '-' },
    {
      title: '操作', key: 'action', width: 150,
      render: (_: any, r: Payment) => (
        <Space>
          {r.status === 'PENDING' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleMarkPaid(r.id)}>标记已缴</Button>
          )}
          <Popconfirm title="确定删除此记录？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="缴费管理" subtitle="管理学生缴费记录" />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="总缴费金额" value={totalAmount} prefix="¥" valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="已缴费金额" value={paidAmount} prefix="¥" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="待缴费" value={pendingCount} suffix="笔" valueStyle={{ color: '#faad14' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="已缴费" value={paidCount} suffix="笔" valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false}>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>新建缴费</Button>
            <Button icon={<DollarOutlined />} onClick={fetchPayments}>刷新</Button>
          </Space>
        </div>
        <Table
          dataSource={payments}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 条记录` }}
          size="small"
          scroll={{ x: 1000 }}
          locale={{ emptyText: <Empty description="暂无缴费记录" /> }}
        />
      </Card>

      <Modal
        title="新建缴费记录"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => { setCreateModalVisible(false); form.resetFields(); }}
        okText="创建"
        cancelText="取消"
        confirmLoading={creating}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="选择学生" name="studentId" rules={[{ required: true, message: '请选择学生' }]}>
            <Select
              showSearch
              placeholder="输入学生姓名搜索..."
              filterOption={false}
              onSearch={handleSearchStudents}
              loading={searchingStudents}
              notFoundContent={searchingStudents ? <Spin size="small" /> : '输入至少2个字符搜索'}
              allowClear
            >
              {students.map(s => (
                <Option key={s.id} value={s.id}>{s.realName} ({s.username})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="缴费类型" name="type" rules={[{ required: true, message: '请选择缴费类型' }]}>
            <Select placeholder="选择缴费类型">
              <Option value="TUITION">学费</Option>
              <Option value="MATERIAL">教材费</Option>
              <Option value="EXAM">考试费</Option>
              <Option value="OTHER">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item label="缴费金额（元）" name="amount" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber min={0.01} max={100000} style={{ width: '100%' }} prefix="¥" placeholder="请输入金额" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input placeholder="缴费描述（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentManagement;
