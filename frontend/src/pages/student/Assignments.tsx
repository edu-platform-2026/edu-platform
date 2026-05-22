import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Input, message, Card, Space, Spin, Empty } from 'antd';
import { EditOutlined, UploadOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { assignmentService } from '../../services/assignmentService';
import { Assignment, AssignmentSubmission, SubmissionStatus, AssignmentStatus } from '../../types/assignment';

const { TextArea } = Input;

/* ======================================================
   状态映射
   ====================================================== */
const submissionStatusTextMap: Record<string, string> = {
  [SubmissionStatus.PENDING]: '待提交',
  [SubmissionStatus.SUBMITTED]: '已提交',
  [SubmissionStatus.GRADED]: '已批改',
  [SubmissionStatus.RETURNED]: '已批改',
};

const statusColorMap: Record<string, string> = {
  [SubmissionStatus.PENDING]: 'warning',
  [SubmissionStatus.SUBMITTED]: 'blue',
  [SubmissionStatus.GRADED]: 'green',
  [SubmissionStatus.RETURNED]: 'green',
};

/* ======================================================
   组件
   ====================================================== */
const StudentAssignments: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [submitContent, setSubmitContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<AssignmentSubmission | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignRes, subRes] = await Promise.allSettled([
        assignmentService.getAssignments(),
        assignmentService.getMySubmissions(),
      ]);

      if (assignRes.status === 'fulfilled') {
        const res = assignRes.value as any;
        const data = res?.data;
        const items = Array.isArray(data) ? data : data?.items || [];
        setAssignments(items.filter((a: Assignment) => a.status === AssignmentStatus.PUBLISHED));
      }

      if (subRes.status === 'fulfilled') {
        const res = subRes.value as any;
        const data = res?.data;
        setSubmissions(Array.isArray(data) ? data : data?.items || []);
      }
    } catch (err) {
      message.error('加载作业数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取某作业的提交状态
  const getSubmission = (assignmentId: string): AssignmentSubmission | undefined => {
    return submissions.find(s => s.assignmentId === assignmentId);
  };

  const handleSubmit = async () => {
    if (!submitContent.trim()) {
      message.warning('请输入作业内容');
      return;
    }
    if (!currentAssignment) return;

    setSubmitting(true);
    try {
      await assignmentService.submitAssignment(currentAssignment.id, { content: submitContent });
      message.success('作业提交成功');
      setSubmitModalVisible(false);
      setSubmitContent('');
      setCurrentAssignment(null);
      fetchData(); // 刷新数据
    } catch (err) {
      message.error('作业提交失败，请重试');
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
      title: '作业标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => (
        <span style={{ fontWeight: 500 }}>{text}</span>
      ),
    },
    { title: '课程', dataIndex: 'courseName', key: 'courseName' },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (t: string) => t ? new Date(t).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, record: Assignment) => {
        const sub = getSubmission(record.id);
        if (sub) {
          return <Tag color={statusColorMap[sub.status] || 'default'}>{submissionStatusTextMap[sub.status] || sub.status}</Tag>;
        }
        return <Tag color="warning">待提交</Tag>;
      },
    },
    {
      title: '分数',
      key: 'score',
      render: (_: unknown, record: Assignment) => {
        const sub = getSubmission(record.id);
        if (sub?.score !== undefined && sub?.score !== null) {
          return <span style={{ fontWeight: 600, color: sub.score >= 60 ? '#52c41a' : '#ff4d4f' }}>{sub.score}分</span>;
        }
        return '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Assignment) => {
        const sub = getSubmission(record.id);
        if (!sub || sub.status === SubmissionStatus.PENDING) {
          return (
            <Button type="primary" size="small" icon={<UploadOutlined />} onClick={() => openSubmitModal(record)}>
              提交作业
            </Button>
          );
        }
        if (sub.status === SubmissionStatus.GRADED || sub.status === SubmissionStatus.RETURNED) {
          return (
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetailModal(sub)}>
              查看详情
            </Button>
          );
        }
        return <Tag color="blue">已提交</Tag>;
      },
    },
  ];

  return (
    <Spin spinning={loading}>
      <div>
        <PageHeader title="我的作业" subtitle="查看和提交作业" />
        <Card bordered={false}>
          {assignments.length > 0 ? (
            <Table
              dataSource={assignments}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          ) : (
            <Empty description="暂无作业" />
          )}
        </Card>

        <Modal
          title={`提交作业：${currentAssignment?.title || ''}`}
          open={submitModalVisible}
          onOk={handleSubmit}
          onCancel={() => {
            setSubmitModalVisible(false);
            setSubmitContent('');
            setCurrentAssignment(null);
          }}
          okText="提交"
          cancelText="取消"
          confirmLoading={submitting}
          destroyOnClose
        >
          <TextArea
            rows={6}
            placeholder="请输入作业内容..."
            value={submitContent}
            onChange={(e) => setSubmitContent(e.target.value)}
          />
        </Modal>

        <Modal
          title="作业批改详情"
          open={detailModalVisible}
          onCancel={() => {
            setDetailModalVisible(false);
            setCurrentSubmission(null);
          }}
          footer={<Button onClick={() => { setDetailModalVisible(false); setCurrentSubmission(null); }}>关闭</Button>}
          destroyOnClose
        >
          {currentSubmission && (
            <div style={{ lineHeight: 2 }}>
              <p><strong>提交内容：</strong></p>
              <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                {currentSubmission.content || '无内容'}
              </div>
              <p><strong>得分：</strong>
                <span style={{ fontWeight: 600, fontSize: 18, color: (currentSubmission.score ?? 0) >= 60 ? '#52c41a' : '#ff4d4f' }}>
                  {currentSubmission.score ?? '-'}分
                </span>
              </p>
              <p><strong>教师评语：</strong>{currentSubmission.feedback || '暂无评语'}</p>
              <p><strong>提交时间：</strong>{currentSubmission.submittedAt ? new Date(currentSubmission.submittedAt).toLocaleString('zh-CN') : '-'}</p>
              <p><strong>批改时间：</strong>{currentSubmission.gradedAt ? new Date(currentSubmission.gradedAt).toLocaleString('zh-CN') : '-'}</p>
            </div>
          )}
        </Modal>
      </div>
    </Spin>
  );
};

export default StudentAssignments;
