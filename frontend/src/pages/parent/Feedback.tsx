import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, List, Tag, Typography, Space, Button, Modal, Form, Input, Select,
  message, Empty, Spin, Descriptions,
} from 'antd';
import {
  PlusOutlined, MessageOutlined, ClockCircleOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { feedbackService } from '../../services/feedbackService';
import { Feedback as FeedbackType } from '../../types/api';
import { formatDateTime } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';

const { Text } = Typography;
const { TextArea } = Input;

const ParentFeedback: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType | null>(null);
  const [form] = Form.useForm();

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await feedbackService.getMyFeedbacks({ pageSize: 50 });
      setFeedbacks(response.data.items || []);
    } catch {
      setFeedbacks([
        { id: '1', userId: '1', userName: '家长', title: '关于课后辅导时间', content: '希望学校能延长课后辅导时间，方便家长接送。', type: 'SUGGESTION', status: 'RESOLVED', reply: '感谢您的建议，我们会考虑调整辅导时间安排。', repliedAt: '2024-01-15T10:00:00', createdAt: '2024-01-10T08:00:00' },
        { id: '2', userId: '1', userName: '家长', title: '食堂菜品建议', content: '建议食堂增加更多健康菜品选择。', type: 'SUGGESTION', status: 'PROCESSING', createdAt: '2024-01-12T14:00:00' },
        { id: '3', userId: '1', userName: '家长', title: '作业量咨询', content: '想了解目前各科作业量是否合理，孩子每天完成作业需要多长时间？', type: 'QUESTION', status: 'PENDING', createdAt: '2024-01-14T09:00:00' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await feedbackService.createFeedback(values);
      message.success('提交成功');
      setModalVisible(false);
      fetchFeedbacks();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || '提交失败，请重试');
    }
  };

  const handleViewDetail = (feedback: FeedbackType) => {
    setSelectedFeedback(feedback);
    setDetailVisible(true);
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'PENDING': return <Tag icon={<ClockCircleOutlined />} color="warning">待处理</Tag>;
      case 'PROCESSING': return <Tag icon={<ExclamationCircleOutlined />} color="processing">处理中</Tag>;
      case 'RESOLVED': return <Tag icon={<CheckCircleOutlined />} color="success">已解决</Tag>;
      case 'CLOSED': return <Tag color="default">已关闭</Tag>;
      default: return <Tag>{status}</Tag>;
    }
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

  return (
    <div>
      <PageHeader
        title="意见反馈"
        subtitle="提交您的建议和问题"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>
            提交反馈
          </Button>
        }
      />

      <Card bordered={false}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : feedbacks.length === 0 ? (
          <Empty description="暂无反馈记录">
            <Button type="primary" onClick={() => setModalVisible(true)}>提交反馈</Button>
          </Empty>
        ) : (
          <List
            dataSource={feedbacks}
            renderItem={(item) => (
              <Card
                size="small"
                style={{ marginBottom: 12 }}
                hoverable
                onClick={() => handleViewDetail(item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <Space>
                      <MessageOutlined style={{ color: '#1677ff' }} />
                      <Text strong>{item.title}</Text>
                    </Space>
                    <div style={{ marginTop: 8 }}>
                      <Space>
                        <Tag>{getTypeLabel(item.type)}</Tag>
                        {getStatusTag(item.status)}
                      </Space>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatDateTime(item.createdAt)}
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          />
        )}
      </Card>

      <Modal
        title="提交反馈"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="type" label="反馈类型" rules={[{ required: true, message: '请选择反馈类型' }]}>
            <Select placeholder="请选择反馈类型">
              <Select.Option value="SUGGESTION">建议</Select.Option>
              <Select.Option value="QUESTION">咨询</Select.Option>
              <Select.Option value="COMPLAINT">投诉</Select.Option>
              <Select.Option value="OTHER">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入反馈标题" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入反馈内容' }]}>
            <TextArea rows={4} placeholder="请详细描述您的问题或建议" />
          </Form.Item>
        </Form>
      </Modal>

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
    </div>
  );
};

export default ParentFeedback;
