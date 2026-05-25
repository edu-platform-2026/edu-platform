import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Input, message, Card, Space, Typography, Empty } from 'antd';
import { UploadOutlined, EyeOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { assignmentService } from '../../services/assignmentService';
import { AssignmentSubmission, SubmissionStatus } from '../../types/assignment';

const { TextArea } = Input;
const { Text } = Typography;

const statusTextMap: Record<string, string> = {
  [SubmissionStatus.PENDING]: '待提交',
  [SubmissionStatus.SUBMITTED]: '已提交',
  [SubmissionStatus.GRADED]: '已批改',
  [SubmissionStatus.RETURNED]: '已退回',
};
const statusColorMap: Record<string, string> = {
  [SubmissionStatus.PENDING]: 'warning',
  [SubmissionStatus.SUBMITTED]: 'blue',
  [SubmissionStatus.GRADED]: 'green',
  [SubmissionStatus.RETURNED]: 'orange',
};

function unwrapResponse(res: any): any {
  const d = res?.data ?? res;
  if (d && typeof d === 'object' && 'code' in d && 'data' in d) return d.data;
  return d;
}

const StudentAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<any>(null);
  const [submitContent, setSubmitContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<AssignmentSubmission | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignRes, subRes] = await Promise.allSettled([
        assignmentService.getAssignments({ status: 2 }),
        assignmentService.getMySubmissions(),
      ]);
      if (assignRes.status === 'fulfilled') {
        const raw = unwrapResponse(assignRes.value);
        setAssignments(Array.isArray(raw) ? raw : raw?.items || []);
      }
      if (subRes.status === 'fulfilled') {
        const raw = unwrapResponse(subRes.value);
        setSubmissions(Array.isArray(raw) ? raw : raw?.items || []);
      }
    } catch { message.error('加载数据失败'); } finally { setLoading(false); }
  };

  const getSubmission = (assignmentId: string) => submissions.find(s => s.assignmentId === assignmentId);

  const handleSubmit = async () => {
    if (!submitContent.trim()) { message.warning('请输入提交内容'); return; }
    if (!currentAssignment) return;
    setSubmitting(true);
    try {
      await assignmentService.submitAssignment(currentAssignment.id, { content: submitContent });
      message.success('提交成功');
      setSubmitModalVisible(false); setSubmitContent(''); setCurrentAssignment(null); fetchData();
    } catch (error: any) { message.error(error?.message || '提交失败'); } finally { setSubmitting(false); }
  };

  const columns = [
    { title: '作业标题', dataIndex: 'title', key: 'title', render: (t: string) => <Text strong>{t}</Text> },
    { title: '课程', key: 'courseName', width: 100, render: (_: any, r: any) => r.course?.name || r.courseName || '-' },
    { title: '截止日期', dataIndex: 'dueDate', key: 'dueDate', width: 120, render: (t: string) => t ? new Date(t).toLocaleDateString('zh-CN') : '-' },
    { title: '满分', key: 'maxScore', width: 70, render: (_: any, r: any) => r.maxScore || 100 },
    { title: '状态', key: 'status', width: 90, render: (_: any, r: any) => {
      const sub = getSubmission(r.id);
      return sub ? <Tag color={statusColorMap[sub.status] || 'default'}>{statusTextMap[sub.status] || sub.status}</Tag> : <Tag color="warning">未提交</Tag>;
    }},
    { title: '分数', key: 'score', width: 70, render: (_: any, r: any) => {
      const sub = getSubmission(r.id);
      return sub?.score != null ? <Text strong style={{ color: Number(sub.score) >= 60 ? '#52c41a' : '#ff4d4f' }}>{String(sub.score)}</Text> : '-';
    }},
    { title: '操作', key: 'action', width: 140, render: (_: any, r: any) => {
      const sub = getSubmission(r.id);
      return (
        <Space>
          {!sub && <Button type="primary" size="small" icon={<UploadOutlined />} onClick={() => { setCurrentAssignment(r); setSubmitContent(''); setSubmitModalVisible(true); }}>提交</Button>}
          {sub && <Button size="small" icon={<EyeOutlined />} onClick={() => { setCurrentSubmission(sub); setDetailModalVisible(true); }}>详情</Button>}
        </Space>
      );
    }},
  ];

  return (
    <div>
      <PageHeader title="我的作业" subtitle="查看和提交作业" />
      <Card bordered={false}>
        <Table columns={columns} dataSource={assignments} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} locale={{ emptyText: <Empty description="暂无作业" /> }} />
      </Card>

      <Modal title="提交作业" open={submitModalVisible} onOk={handleSubmit} onCancel={() => { setSubmitModalVisible(false); setCurrentAssignment(null); }} okText="提交" cancelText="取消" confirmLoading={submitting} width={600}>
        {currentAssignment && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <Text strong>{currentAssignment.title}</Text>
            {currentAssignment.description && <div style={{ marginTop: 8, color: '#666' }}>{currentAssignment.description}</div>}
          </div>
        )}
        <TextArea rows={6} value={submitContent} onChange={(e) => setSubmitContent(e.target.value)} placeholder="输入提交内容..." />
      </Modal>

      <Modal title="提交详情" open={detailModalVisible} onCancel={() => { setDetailModalVisible(false); setCurrentSubmission(null); }} footer={null} width={600}>
        {currentSubmission && (
          <div>
            <p><Text strong>状态：</Text><Tag color={statusColorMap[currentSubmission.status]}>{statusTextMap[currentSubmission.status]}</Tag></p>
            <p><Text strong>内容：</Text>{currentSubmission.content}</p>
            <p><Text strong>提交时间：</Text>{currentSubmission.submittedAt ? new Date(currentSubmission.submittedAt).toLocaleString('zh-CN') : '-'}</p>
            {currentSubmission.score != null && <p><Text strong>分数：</Text><Text style={{ color: Number(currentSubmission.score) >= 60 ? '#52c41a' : '#ff4d4f' }}>{String(currentSubmission.score)}</Text></p>}
            {currentSubmission.feedback && <p><Text strong>批语：</Text>{currentSubmission.feedback}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentAssignments;
