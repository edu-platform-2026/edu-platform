import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Input, message, Card, Space, Spin, Empty } from 'antd';
import { UploadOutlined, EyeOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { assignmentService } from '../../services/assignmentService';
import { Assignment, AssignmentSubmission, SubmissionStatus } from '../../types/assignment';

const { TextArea } = Input;

const submissionStatusTextMap: Record<string, string> = {
  [SubmissionStatus.PENDING]: 'Pending',
  [SubmissionStatus.SUBMITTED]: 'Submitted',
  [SubmissionStatus.GRADED]: 'Graded',
  [SubmissionStatus.RETURNED]: 'Graded',
};

const statusColorMap: Record<string, string> = {
  [SubmissionStatus.PENDING]: 'warning',
  [SubmissionStatus.SUBMITTED]: 'blue',
  [SubmissionStatus.GRADED]: 'green',
  [SubmissionStatus.RETURNED]: 'green',
};

function safeGetData(res: any): any {
  if (res && typeof res === 'object' && 'data' in res) {
    const d = res.data;
    if (d && typeof d === 'object' && 'code' in d && 'data' in d) return d.data;
    return d;
  }
  return res;
}

const StudentAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
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
        const data = safeGetData(assignRes.value);
        setAssignments(Array.isArray(data) ? data : data?.items || []);
      }
      if (subRes.status === 'fulfilled') {
        const data = safeGetData(subRes.value);
        setSubmissions(Array.isArray(data) ? data : data?.items || []);
      }
    } catch { message.error('Failed to load data'); } finally { setLoading(false); }
  };

  const getSubmission = (assignmentId: string) => submissions.find(s => s.assignmentId === assignmentId);

  const handleSubmit = async () => {
    if (!submitContent.trim()) { message.warning('Please enter content'); return; }
    if (!currentAssignment) return;
    setSubmitting(true);
    try {
      await assignmentService.submitAssignment(currentAssignment.id, { content: submitContent });
      message.success('Submitted successfully');
      setSubmitModalVisible(false); setSubmitContent(''); setCurrentAssignment(null); fetchData();
    } catch { message.error('Submission failed'); } finally { setSubmitting(false); }
  };

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span> },
    { title: 'Course', dataIndex: 'courseName', key: 'courseName', render: (t: any) => t || '-' },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: (t: string) => t ? new Date(t).toLocaleDateString('zh-CN') : '-' },
    { title: 'Status', key: 'status', render: (_: unknown, record: Assignment) => {
      const sub = getSubmission(record.id);
      return sub ? <Tag color={statusColorMap[sub.status] || 'default'}>{submissionStatusTextMap[sub.status] || sub.status}</Tag> : <Tag color="warning">Pending</Tag>;
    }},
    { title: 'Score', key: 'score', render: (_: unknown, record: Assignment) => {
      const sub = getSubmission(record.id);
      return sub?.score != null ? <span style={{ fontWeight: 600, color: sub.score >= 60 ? '#52c41a' : '#ff4d4f' }}>{String(sub.score)}pts</span> : '-';
    }},
    { title: 'Action', key: 'action', render: (_: unknown, record: Assignment) => {
      const sub = getSubmission(record.id);
      if (!sub || sub.status === SubmissionStatus.PENDING) return <Button type="primary" size="small" icon={<UploadOutlined />} onClick={() => { setCurrentAssignment(record); setSubmitContent(''); setSubmitModalVisible(true); }}>Submit</Button>;
      if (sub.status === SubmissionStatus.GRADED || sub.status === SubmissionStatus.RETURNED) return <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setCurrentSubmission(sub); setDetailModalVisible(true); }}>View</Button>;
      return <Tag color="blue">Submitted</Tag>;
    }},
  ];

  return (
    <Spin spinning={loading}>
      <div>
        <PageHeader title="My Assignments" subtitle="View and submit assignments" />
        <Card bordered={false}>
          {assignments.length > 0 ? <Table dataSource={assignments} columns={columns} rowKey="id" pagination={false} size="middle" /> : <Empty description="No assignments" />}
        </Card>
        <Modal title={`Submit: ${currentAssignment?.title || ''}`} open={submitModalVisible} onOk={handleSubmit}
          onCancel={() => { setSubmitModalVisible(false); setSubmitContent(''); setCurrentAssignment(null); }}
          okText="Submit" cancelText="Cancel" confirmLoading={submitting} destroyOnClose>
          <TextArea rows={6} placeholder="Enter your work..." value={submitContent} onChange={(e) => setSubmitContent(e.target.value)} />
        </Modal>
        <Modal title="Assignment Details" open={detailModalVisible}
          onCancel={() => { setDetailModalVisible(false); setCurrentSubmission(null); }}
          footer={<Button onClick={() => { setDetailModalVisible(false); setCurrentSubmission(null); }}>Close</Button>} destroyOnClose>
          {currentSubmission && (
            <div style={{ lineHeight: 2 }}>
              <p><strong>Content:</strong></p>
              <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, marginBottom: 16, whiteSpace: 'pre-wrap' }}>{currentSubmission.content || 'No content'}</div>
              <p><strong>Score:</strong> <span style={{ fontWeight: 600, fontSize: 18, color: (currentSubmission.score ?? 0) >= 60 ? '#52c41a' : '#ff4d4f' }}>{currentSubmission.score ?? '-'}pts</span></p>
              <p><strong>Comment:</strong> {(currentSubmission as any).feedback || (currentSubmission as any).comment || 'None'}</p>
              <p><strong>Submitted:</strong> {currentSubmission.submittedAt ? new Date(currentSubmission.submittedAt).toLocaleString('zh-CN') : '-'}</p>
              <p><strong>Graded:</strong> {currentSubmission.gradedAt ? new Date(currentSubmission.gradedAt).toLocaleString('zh-CN') : '-'}</p>
            </div>
          )}
        </Modal>
      </div>
    </Spin>
  );
};

export default StudentAssignments;
