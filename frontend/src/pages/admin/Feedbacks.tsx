import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Modal, Form, Select, message,
  Typography, Row, Col, Descriptions,
} from 'antd';
import {
  SearchOutlined, EyeOutlined, MessageOutlined, CheckOutlined,
} from '@ant-design/icons';
import { feedbackService } from '../../services/feedbackService';
import { Feedback } from '../../types/api';
import { formatDateTime } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;
const { Text } = Typography;

const AdminFeedbacks: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [replyVisible, setReplyVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyForm] = Form.useForm();

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await feedbackService.getFeedbacks({
        page, pageSize, keyword,
        status: statusFilter || undefined,
      });
      const data = response.data;
      setFeedbacks(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setFeedbacks([
        { id: '1', userId: '1', userName: '张家长', userRole: 'PARENT', title: '关于课后辅导时间', content: '希望学校能延长课后辅导时间，方便家长接送。', type: 'SUGGESTION', status: 'RESOLVED', reply: '感谢您的建议，我们会考虑调整辅导时间安排。', repliedAt: '2024-01-15T10:00:00', createdAt: '2024-01-10T08:00:00' },
        { id: '2', userId: '2', userName: '李家长', userRole: 'PARENT', title: '食堂菜品建议', content: '建议食堂增加更多健康菜品选择。', type: 'SUGGESTION', status: 'PROCESSING', createdAt: '2024-01-12T14:00:00' },
        { id: '3', userId: '3', userName: '王同学', userRole: 'STUDENT', title: '图书馆开放时间', content: '建议图书馆延长开放时间至晚上10点。', type: 'SUGGESTION', status: 'PENDING', createdAt: '2024-01-14T09:00:00' },
        { id: '4', userId: '4', userName: '赵家长', userRole: 'PARENT', title: '作业量问题', content: '孩子每天作业量太大，影响休息。', type: 'COMPLAINT', status: 'PENDING', createdAt: '2024-01-15T11:00:00' },
      ]);
      setTotal(4);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, statusFilter]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleViewDetail = (record: Feedback) => {
    setSelectedFeedback(record);
    setDetailVisible(true);
  };

  const handleReply = (record: Feedback) => {
    setSelectedFeedback(record);
    replyForm.resetFields();
    setReplyVisible(true);
  };

  const handleReplySubmit = async () => {
    try {
      const values = await replyForm.validateFields();
      if (selectedFeedback) {
        await feedbackService.replyFeedback(selectedFeedback.id, { reply: values.reply });
        message.success('回复成功');
        setReplyVisible(false);
        fetchFeedbacks();
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || '回复失败，请重试');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await feedbackService.updateFeedback(id, { status });
      message.success('状态更新成功');
      fetchFeedbacks();
    } catch {
      message.error('状态更新失败，请重试');
    }
  };

  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'warning', text: '待处理' },
      PROCESSING: { color: 'processing', text: '处理中' },
      RESOLVED: { color: 'success', text: '已解决' },
      CLOSED: { color: 'default', text: '已关闭' },
    };
    const { color, text } = map[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      SUGGESTION: '建议',
      COMPLAINT: '投诉',
      QUESTION: '咨询',
      OTHER: '其他',
    };
    return map[type] || type;
  };

  const columns: ColumnsType<Feedback> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '提交人',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{getTypeLabel(type)}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          {record.status !== 'RESOLVED' && record.status !== 'CLOSED' && (
            <Button type="link" icon={<MessageOutlined />} onClick={() => handleReply(record)}>
              回复
            </Button>
          )}
          {record.status === 'PENDING' && (
            <Button type="link" icon={<CheckOutlined />} onClick={() => handleUpdateStatus(record.id, 'PROCESSING')}>
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="反馈处理" subtitle="处理用户反馈和建议" />

      <Card bordered={false}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索反馈标题"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={fetchFeedbacks}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="筛选状态"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="">全部状态</Select.Option>
              <Select.Option value="PENDING">待处理</Select.Option>
              <Select.Option value="PROCESSING">处理中</Select.Option>
              <Select.Option value="RESOLVED">已解决</Select.Option>
              <Select.Option value="CLOSED">已关闭</Select.Option>
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={feedbacks}
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
        title="反馈详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={640}
      >
        {selectedFeedback && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="标题">{selectedFeedback.title}</Descriptions.Item>
            <Descriptions.Item label="提交人">{selectedFeedback.userName}</Descriptions.Item>
            <Descriptions.Item label="类型">{getTypeLabel(selectedFeedback.type)}</Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(selectedFeedback.status)}</Descriptions.Item>
            <Descriptions.Item label="提交时间">{formatDateTime(selectedFeedback.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="内容">{selectedFeedback.content}</Descriptions.Item>
            {selectedFeedback.reply && (
              <>
                <Descriptions.Item label="回复时间">
                  {selectedFeedback.repliedAt ? formatDateTime(selectedFeedback.repliedAt) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="回复内容">
                  <Text type="success">{selectedFeedback.reply}</Text>
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="回复反馈"
        open={replyVisible}
        onOk={handleReplySubmit}
        onCancel={() => setReplyVisible(false)}
        destroyOnClose
      >
        {selectedFeedback && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">反馈内容：</Text>
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 6, marginTop: 8 }}>
              {selectedFeedback.content}
            </div>
          </div>
        )}
        <Form form={replyForm} layout="vertical">
          <Form.Item name="reply" label="回复内容" rules={[{ required: true, message: '请输入回复内容' }]}>
            <TextArea rows={4} placeholder="请输入回复内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminFeedbacks;
