import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Tag, Button, Modal, InputNumber, Space, message, Descriptions,
  Divider, Input, Alert, Select, Empty,
} from 'antd';
import {
  EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, RobotOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { assignmentService } from '../../services/assignmentService';
import { aiGradeEssay, AIGradingResult } from '../../services/aiModelService';
import { useAuthStore } from '../../stores/authStore';
import { Assignment, AssignmentSubmission, AssignmentStatus, SubmissionStatus } from '../../types/assignment';
import { formatDateTime } from '../../utils/date';

const { TextArea } = Input;

interface GradingSubmission extends AssignmentSubmission {
  assignmentTitle?: string;
  courseName?: string;
}

const Grading: React.FC = () => {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | undefined>(undefined);
  const [submissions, setSubmissions] = useState<GradingSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<GradingSubmission | null>(null);
  const [gradingScore, setGradingScore] = useState<number | null>(null);
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [aiGradingLoading, setAiGradingLoading] = useState(false);
  const [aiGradingResult, setAiGradingResult] = useState<AIGradingResult | null>(null);
  const [saving, setSaving] = useState(false);

  // 加载作业列表
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await assignmentService.getAssignments({ teacherId: user?.id, pageSize: 100 });
      const resData = response?.data;
      const items = resData?.items || (Array.isArray(resData) ? resData : []);
      setAssignments(items);
      // 默认选择第一个已发布的作业
      if (items.length > 0 && !selectedAssignmentId) {
        const published = items.find((a: Assignment) => a.status === AssignmentStatus.PUBLISHED) || items[0];
        setSelectedAssignmentId(published.id);
      }
    } catch (error: any) {
      message.error(error?.message || '加载作业列表失败');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 加载提交列表
  const fetchSubmissions = useCallback(async (assignmentId: string) => {
    setSubmissionsLoading(true);
    try {
      const assignment = assignments.find(a => a.id === assignmentId);
      const response = await assignmentService.getSubmissions(assignmentId);
      const subData = response?.data;
      const subItems = subData?.items || (Array.isArray(subData) ? subData : []);
      const items = subItems.map((s: AssignmentSubmission) => ({
        ...s,
        assignmentTitle: assignment?.title || '',
        courseName: assignment?.courseName || '',
      }));
      setSubmissions(items);
    } catch (error: any) {
      message.error(error?.message || '加载提交列表失败');
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  }, [assignments]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    if (selectedAssignmentId) {
      fetchSubmissions(selectedAssignmentId);
    }
  }, [selectedAssignmentId, fetchSubmissions]);

  const openGradingModal = (sub: GradingSubmission) => {
    setCurrentSubmission(sub);
    setGradingScore(sub.score ?? null);
    setGradingFeedback(sub.feedback || '');
    setAiGradingResult(null);
    setGradingModalVisible(true);
  };

  // AI批改
  const handleAIGrade = async () => {
    if (!currentSubmission) return;
    const assignment = assignments.find(a => a.id === currentSubmission.assignmentId);
    setAiGradingLoading(true);
    try {
      const result = await aiGradeEssay(
        assignment?.title || '作业',
        assignment?.description || '',
        currentSubmission.content || '',
        assignment?.totalScore || 100
      );
      setAiGradingResult(result);
      setGradingScore(result.score);
      message.success('AI批改完成，请确认或调整分数');
    } catch (err: any) {
      message.error(`AI批改失败：${err.message}`);
    } finally {
      setAiGradingLoading(false);
    }
  };

  // 保存批改结果
  const handleSaveGrading = async () => {
    if (!currentSubmission) return;
    if (gradingScore === null || gradingScore === undefined) {
      message.warning('请输入评分');
      return;
    }
    setSaving(true);
    try {
      await assignmentService.gradeSubmission(currentSubmission.id, {
        score: gradingScore,
        feedback: gradingFeedback,
      });
      message.success(`批改完成！${currentSubmission.studentName} 得分：${gradingScore}分`);
      setGradingModalVisible(false);
      // 刷新提交列表
      if (selectedAssignmentId) {
        fetchSubmissions(selectedAssignmentId);
      }
    } catch (error: any) {
      message.error(error?.message || '批改保存失败');
    } finally {
      setSaving(false);
    }
  };

  const selectedAssignment = assignments.find(a => a.id === selectedAssignmentId);

  const columns = [
    { title: '学生姓名', dataIndex: 'studentName', key: 'studentName', width: 100 },
    {
      title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', width: 170,
      render: (t: string) => formatDateTime(t),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: SubmissionStatus) => (
        <Tag
          color={s === SubmissionStatus.GRADED ? 'green' : s === SubmissionStatus.SUBMITTED ? 'blue' : 'default'}
          icon={s === SubmissionStatus.GRADED ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
        >
          {s === SubmissionStatus.GRADED ? '已批改' : s === SubmissionStatus.SUBMITTED ? '待批改' : s === SubmissionStatus.PENDING ? '未提交' : '已退回'}
        </Tag>
      ),
    },
    {
      title: '得分', dataIndex: 'score', key: 'score', width: 80,
      render: (s: number | undefined, record: GradingSubmission) => (
        record.status === SubmissionStatus.GRADED
          ? <span style={{ fontWeight: 700, color: (s || 0) >= 60 ? '#52c41a' : '#ff4d4f' }}>{s}分</span>
          : <span style={{ color: '#999' }}>待评</span>
      ),
    },
    {
      title: '操作', key: 'action', width: 120,
      render: (_: any, record: GradingSubmission) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => openGradingModal(record)}>
          {record.status === SubmissionStatus.GRADED ? '查看' : '批改'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="作业批改" subtitle="支持AI智能批改问答题，教师可确认或调整AI评分" />

      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space>
          <span>选择作业：</span>
          <Select
            placeholder="请选择作业"
            style={{ width: 300 }}
            value={selectedAssignmentId}
            onChange={setSelectedAssignmentId}
            loading={loading}
            allowClear
          >
            {assignments.map(a => (
              <Select.Option key={a.id} value={a.id}>
                {a.title} ({a.courseName})
              </Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      <Card bordered={false}>
        {selectedAssignmentId ? (
          <Table
            dataSource={submissions}
            columns={columns}
            rowKey="id"
            loading={submissionsLoading}
            pagination={false}
            size="middle"
          />
        ) : (
          <Empty description="请先选择一个作业" />
        )}
      </Card>

      <Modal
        title={`批改作业 - ${currentSubmission?.studentName || ''}`}
        open={gradingModalVisible}
        onCancel={() => setGradingModalVisible(false)}
        width={800}
        footer={
          currentSubmission?.status !== SubmissionStatus.GRADED ? (
            <Space>
              <Button onClick={() => setGradingModalVisible(false)}>取消</Button>
              <Button icon={<RobotOutlined />} loading={aiGradingLoading} onClick={handleAIGrade}>
                AI智能批改
              </Button>
              <Button type="primary" loading={saving} onClick={handleSaveGrading}>
                保存批改结果
              </Button>
            </Space>
          ) : (
            <Button onClick={() => setGradingModalVisible(false)}>关闭</Button>
          )
        }
      >
        {currentSubmission && (
          <>
            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="学生">{currentSubmission.studentName}</Descriptions.Item>
              <Descriptions.Item label="作业">{currentSubmission.assignmentTitle || selectedAssignment?.title}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{formatDateTime(currentSubmission.submittedAt)}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={currentSubmission.status === SubmissionStatus.GRADED ? 'green' : 'blue'}>
                  {currentSubmission.status === SubmissionStatus.GRADED ? '已批改' : '待批改'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" plain>学生提交内容</Divider>

            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                {currentSubmission.content || '（未填写内容）'}
              </p>
              {currentSubmission.attachments && currentSubmission.attachments.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontWeight: 500 }}>附件：</span>
                  {currentSubmission.attachments.map((file: string, idx: number) => (
                    <Tag key={idx} color="blue" style={{ marginLeft: 4 }}>{file}</Tag>
                  ))}
                </div>
              )}
            </div>

            {/* AI批改结果 */}
            {aiGradingResult && (
              <Alert
                type="success"
                showIcon
                icon={<ThunderboltOutlined />}
                message={
                  <span>
                    AI批改结果{' '}
                    <Tag color="purple">建议 {aiGradingResult.score}/{aiGradingResult.maxScore} 分</Tag>
                  </span>
                }
                description={
                  <div>
                    <p style={{ margin: '4px 0' }}><strong>评语：</strong>{aiGradingResult.comment}</p>
                    {aiGradingResult.strengths.length > 0 && (
                      <p style={{ margin: '4px 0' }}><strong>优点：</strong>{aiGradingResult.strengths.join('；')}</p>
                    )}
                    {aiGradingResult.improvements.length > 0 && (
                      <p style={{ margin: '4px 0' }}><strong>建议：</strong>{aiGradingResult.improvements.join('；')}</p>
                    )}
                  </div>
                }
                style={{ marginBottom: 16 }}
              />
            )}

            <Divider orientation="left" plain>评分与评语</Divider>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
              <span>评分：</span>
              <InputNumber
                min={0}
                max={selectedAssignment?.totalScore || 100}
                value={gradingScore}
                onChange={v => setGradingScore(v)}
                addonAfter={`/ ${selectedAssignment?.totalScore || 100}分`}
                style={{ width: 180 }}
              />
            </div>
            <div>
              <span>教师评语：</span>
              <TextArea
                rows={3}
                value={gradingFeedback}
                onChange={e => setGradingFeedback(e.target.value)}
                placeholder="请输入评语（选填）"
                style={{ marginTop: 4 }}
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Grading;
