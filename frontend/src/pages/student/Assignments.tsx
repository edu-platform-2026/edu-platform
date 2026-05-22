import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Input, message, Card, Space, Spin, Empty } from 'antd';
import { UploadOutlined, EyeOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { assignmentService } from '../../services/assignmentService';
import { Assignment, AssignmentSubmission, SubmissionStatus, AssignmentStatus } from '../../types/assignment';

const { TextArea } = Input;

const submissionStatusTextMap: Record<string, string> = {
  [SubmissionStatus.PENDING]: '寰呮彁浜?,
  [SubmissionStatus.SUBMITTED]: '宸叉彁浜?,
  [SubmissionStatus.GRADED]: '宸叉壒鏀?,
  [SubmissionStatus.RETURNED]: '宸叉壒鏀?,
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
        const items = Array.isArray(data) ? data : data?.items || [];
        setAssignments(items);
      }

      if (subRes.status === 'fulfilled') {
        const data = safeGetData(subRes.value);
        const items = Array.isArray(data) ? data : data?.items || [];
        setSubmissions(items);
      }
    } catch {
      message.error('鑾峰彇鏁版嵁澶辫触');
    } finally {
      setLoading(false);
    }
  };

  const getSubmission = (assignmentId: string): AssignmentSubmission | undefined => {
    return submissions.find(s => s.assignmentId === assignmentId);
  };

  const handleSubmit = async () => {
    if (!submitContent.trim()) {
      message.warning('璇疯緭鍏ヤ綔涓氬唴瀹?);
      return;
    }
    if (!currentAssignment) return;

    setSubmitting(true);
    try {
      await assignmentService.submitAssignment(currentAssignment.id, { content: submitContent });
      message.success('浣滀笟鎻愪氦鎴愬姛');
      setSubmitModalVisible(false);
      setSubmitContent('');
      setCurrentAssignment(null);
      fetchData();
    } catch {
      message.error('浣滀笟鎻愪氦澶辫触锛岃绋嶅悗閲嶈瘯');
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmitModal = (record: Assignment) => {
    setCurrentAssignment(record);
    setSubmitContent('');
    setSubmitModalVisible(true);
  };

  const openDetailModal = (submission: AssignmentSubmission) => {
    setCurrentSubmission(submission);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: '浣滀笟鏍囬', dataIndex: 'title', key: 'title',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    { title: '璇剧▼', dataIndex: 'courseName', key: 'courseName', render: (t: any) => t || '-' },
    {
      title: '鎴鏃堕棿', dataIndex: 'dueDate', key: 'dueDate',
      render: (t: string) => t ? new Date(t).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '鐘舵€?, key: 'status',
      render: (_: unknown, record: Assignment) => {
        const sub = getSubmission(record.id);
        if (sub) {
          return <Tag color={statusColorMap[sub.status] || 'default'}>{submissionStatusTextMap[sub.status] || sub.status}</Tag>;
        }
        return <Tag color="warning">寰呮彁浜?/Tag>;
      },
    },
    {
      title: '寰楀垎', key: 'score',
      render: (_: unknown, record: Assignment) => {
        const sub = getSubmission(record.id);
        if (sub?.score !== undefined && sub?.score !== null) {
          return <span style={{ fontWeight: 600, color: sub.score >= 60 ? '#52c41a' : '#ff4d4f' }}>{String(sub.score)}鍒?/span>;
        }
        return '-';
      },
    },
    {
      title: '鎿嶄綔', key: 'action',
      render: (_: unknown, record: Assignment) => {
        const sub = getSubmission(record.id);
        if (!sub || sub.status === SubmissionStatus.PENDING) {
          return (
            <Button type="primary" size="small" icon={<UploadOutlined />} onClick={() => openSubmitModal(record)}>
              鎻愪氦浣滀笟
            </Button>
          );
        }
        if (sub.status === SubmissionStatus.GRADED || sub.status === SubmissionStatus.RETURNED) {
          return (
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetailModal(sub)}>
              鏌ョ湅璇︽儏
            </Button>
          );
        }
        return <Tag color="blue">宸叉彁浜?/Tag>;
      },
    },
  ];

  return (
    <Spin spinning={loading}>
      <div>
        <PageHeader title="鎴戠殑浣滀笟" subtitle="鏌ョ湅鍜屾彁浜や綔涓? />
        <Card bordered={false}>
          {assignments.length > 0 ? (
            <Table dataSource={assignments} columns={columns} rowKey="id" pagination={false} size="middle" />
          ) : (
            <Empty description="鏆傛棤浣滀笟" />
          )}
        </Card>
        <Modal
          title={`鎻愪氦浣滀笟锛?{currentAssignment?.title || ''}`} open={submitModalVisible}
          onOk={handleSubmit}
          onCancel={() => { setSubmitModalVisible(false); setSubmitContent(''); setCurrentAssignment(null); }}
          okText="鎻愪氦" cancelText="鍙栨秷" confirmLoading={submitting} destroyOnClose>
          <TextArea rows={6} placeholder="璇疯緭鍏ヤ綔涓氬唴瀹?.." value={submitContent} onChange={(e) => setSubmitContent(e.target.value)} />
        </Modal>
        <Modal
          title="浣滀笟璇︽儏鍙婃壒鏀圭粨鏋? open={detailModalVisible}
          onCancel={() => { setDetailModalVisible(false); setCurrentSubmission(null); }}
          footer={<Button onClick={() => { setDetailModalVisible(false); setCurrentSubmission(null); }}>鍏抽棴</Button>} destroyOnClose>
          {currentSubmission && (
            <div style={{ lineHeight: 2 }}>
              <p><strong>鎻愪氦鍐呭锛?/strong></p>
              <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                {currentSubmission.content || '鏃犲唴瀹?}
              </div>
              <p><strong>寰楀垎锛?/strong>
                <span style={{ fontWeight: 600, fontSize: 18, color: (currentSubmission.score ?? 0) >= 60 ? '#52c41a' : '#ff4d4f' }}>
                  {currentSubmission.score ?? '-'}鍒?                </span>
              </p>
              <p><strong>鏁欏笀璇勮锛?/strong>{(currentSubmission as any).feedback || (currentSubmission as any).comment || '鏆傛棤璇勮'}</p>
              <p><strong>鎻愪氦鏃堕棿锛?/strong>{currentSubmission.submittedAt ? new Date(currentSubmission.submittedAt).toLocaleString('zh-CN') : '-'}</p>
              <p><strong>鎵规敼鏃堕棿锛?/strong>{currentSubmission.gradedAt ? new Date(currentSubmission.gradedAt).toLocaleString('zh-CN') : '-'}</p>
            </div>
          )}
        </Modal>
      </div>
    </Spin>
  );
};

export default StudentAssignments;