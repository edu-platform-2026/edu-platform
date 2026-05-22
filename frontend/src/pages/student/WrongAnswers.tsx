import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Space, message, Row, Col, Statistic, Select, Spin, Empty,
} from 'antd';
import {
  TrophyOutlined, ReloadOutlined, BookOutlined, CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { assignmentService } from '../../services/assignmentService';
import { AssignmentSubmission, SubmissionStatus } from '../../types/assignment';

const { Option } = Select;

/* ======================================================
   组件
   ====================================================== */
const WrongAnswers: React.FC = () => {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await assignmentService.getMySubmissions() as any;
      const data = res?.data;
      const items: AssignmentSubmission[] = Array.isArray(data) ? data : data?.items || [];
      // 只保留已批改且分数低于60的提交
      const failed = items.filter(
        (s: AssignmentSubmission) =>
          (s.status === SubmissionStatus.GRADED || s.status === SubmissionStatus.RETURNED) &&
          s.score !== undefined && s.score !== null && s.score < 60
      );
      setSubmissions(failed);
    } catch (err) {
      message.error('加载错题数据失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    // 根据 assignmentId 可能无法直接过滤课程，这里简单保留所有
    return true;
  });

  const totalWrong = submissions.length;
  const withFeedback = submissions.filter(s => s.feedback).length;
  const withoutFeedback = totalWrong - withFeedback;

  const columns = [
    {
      title: '作业ID', dataIndex: 'assignmentId', key: 'assignmentId', width: 120,
      render: (id: string) => <Tag color="blue">{id}</Tag>,
    },
    {
      title: '提交内容', dataIndex: 'content', key: 'content', ellipsis: true,
      render: (content: string) => content || '-',
    },
    {
      title: '得分', dataIndex: 'score', key: 'score', width: 80,
      render: (score: number) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{score}分</span>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (status: string) => <Tag color="red">不及格</Tag>,
    },
    {
      title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', width: 120,
      render: (t: string) => t ? new Date(t).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '批改时间', dataIndex: 'gradedAt', key: 'gradedAt', width: 120,
      render: (t: string) => t ? new Date(t).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '教师反馈', dataIndex: 'feedback', key: 'feedback', ellipsis: true,
      render: (fb: string) => fb ? <span style={{ color: '#faad14' }}>{fb}</span> : <span style={{ color: '#ccc' }}>暂无反馈</span>,
    },
  ];

  return (
    <Spin spinning={loading}>
      <div>
        <PageHeader title="错题本" subtitle="自动收集低分提交，专项复习" />

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}>
            <Card bordered={false} bodyStyle={{ padding: 16 }}>
              <Statistic title="总错题数" value={totalWrong} prefix={<BookOutlined />} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card bordered={false} bodyStyle={{ padding: 16 }}>
              <Statistic title="有教师反馈" value={withFeedback} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card bordered={false} bodyStyle={{ padding: 16 }}>
              <Statistic title="无反馈" value={withoutFeedback} valueStyle={{ color: '#cf1322' }} prefix={<CloseCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card bordered={false} bodyStyle={{ padding: 16 }}>
              <Statistic title="平均分" value={totalWrong > 0 ? Math.round(submissions.reduce((s, sub) => s + (sub.score || 0), 0) / totalWrong) : 0} suffix="分" prefix={<TrophyOutlined />} />
            </Card>
          </Col>
        </Row>

        <Card bordered={false} style={{ marginBottom: 16 }}>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
          </Space>
        </Card>

        <Card bordered={false}>
          {submissions.length > 0 ? (
            <Table dataSource={filteredSubmissions} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
          ) : (
            <Empty description="暂无错题" />
          )}
        </Card>
      </div>
    </Spin>
  );
};

export default WrongAnswers;
