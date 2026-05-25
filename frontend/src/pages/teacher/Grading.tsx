import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Button, Space, Tag, Input, Modal, Form, InputNumber, Typography, Row, Col, Descriptions, message, Select } from 'antd';
import { CheckOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { assignmentService } from '../../services/assignmentService';
import { formatDate, formatDateTime } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';
import { useAuthStore } from '../../stores/authStore';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;
const { Text } = Typography;

function unwrapResponse(res: any): any {
  const d = res?.data ?? res;
  if (d && typeof d === 'object' && 'code' in d && 'data' in d) return d.data;
  return d;
}

const TeacherGrading: React.FC = () => {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [submissionsModalVisible, setSubmissionsModalVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [gradeForm] = Form.useForm();

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await assignmentService.getAssignments({ page: 1, pageSize: 100, teacherId: user?.id });
      const raw = unwrapResponse(response);
      setAssignments(Array.isArray(raw) ? raw : raw?.items || []);
    } catch (error: any) {
      message.error(error?.message || '加载作业列表失败');
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const handleViewSubmissions = async (record: any) => {
    setSelectedAssignment(record);
    setSubmissionsModalVisible(true);
    setSubmissionsLoading(true);
    try {
      const response = await assignmentService.getSubmissions(record.id);
      const raw = unwrapResponse(response);
      setSubmissions(Array.isArray(raw) ? raw : raw?.items || []);
    } catch (error: any) {
      message.error(error?.message || '加载提交列表失败');
      setSubmissions([]);
    } finally { setSubmissionsLoading(false); }
  };

  const handleOpenGrade = (submission: any) => {
    setGradingSubmission(submission);
    gradeForm.setFieldsValue({ score: submission.score, feedback: submission.feedback || submission.comment });
    setGradeModalVisible(true);
  };

  const handleGradeSubmit = async () => {
    try {
      const values = await gradeForm.validateFields();
      await assignmentService.gradeSubmission(gradingSubmission!.id, { score: values.score, feedback: values.feedback });
      message.success('批改成功');
      setGradeModalVisible(false);
      if (selectedAssignment) handleViewSubmissions(selectedAssignment);
      fetchAssignments();
    } catch (error: any) {
      if (error?.message) message.error(error.message);
    }
  };

  const statusMap: Record<number, { color: string; text: string }> = {
    0: { color: 'default', text: '草稿' },
    1: { color: 'default', text: '草稿' },
    2: { color: 'processing', text: '已发布' },
    3: { color: 'error', text: '已关闭' },
  };
  const subStatusMap: Record<string, { color: string; text: string }> = {
    PENDING: { color: 'default', text: '未提交' },
    SUBMITTED: { color: 'processing', text: '已提交' },
    GRADED: { color: 'success', text: '已批改' },
    RETURNED: { color: 'warning', text: '已退回' },
    '1': { color: 'default', text: '未提交' },
    '2': { color: 'processing', text: '已提交' },
    '3': { color: 'success', text: '已批改' },
  };

  const columns: ColumnsType<any> = [
    { title: '作业标题', dataIndex: 'title', key: 'title', ellipsis: true, render: (t: string) => <Text strong>{t}</Text> },
    { title: '班级', key: 'className', width: 100, render: (_: any, r: any) => r.class?.name || '-' },
    { title: '截止日期', dataIndex: 'dueDate', key: 'dueDate', width: 120, render: (d: string) => d ? formatDate(d) : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: number) => { const m = statusMap[s]; return m ? <Tag color={m.color}>{m.text}</Tag> : <Tag>{String(s)}</Tag>; }},
    { title: '操作', key: 'action', width: 100, render: (_: any, r: any) => <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => handleViewSubmissions(r)}>查看提交</Button> },
  ];

  const subColumns: ColumnsType<any> = [
    { title: '学生', key: 'student', width: 100, render: (_: any, r: any) => r.student?.realName || r.studentName || '-' },
    { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', width: 160, render: (d: string) => d ? formatDateTime(d) : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: any) => { const m = subStatusMap[String(s)] || subStatusMap[s]; return m ? <Tag color={m.color}>{m.text}</Tag> : <Tag>{String(s)}</Tag>; }},
    { title: '分数', dataIndex: 'score', key: 'score', width: 70, render: (v: any) => v != null ? <Text strong>{String(v)}</Text> : '-' },
    { title: '操作', key: 'action', width: 70, render: (_: any, r: any) => <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleOpenGrade(r)}>批改</Button> },
  ];

  return (
    <div>
      <PageHeader title="作业批改" subtitle="查看学生提交并进行批改评分" />
      <Card bordered={false}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input placeholder="搜索作业" prefix={<SearchOutlined />} value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear />
          </Col>
        </Row>
        <Table columns={columns} dataSource={assignments.filter((a: any) => !keyword || a.title?.includes(keyword))} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={`提交列表 - ${selectedAssignment?.title || ''}`} open={submissionsModalVisible} onCancel={() => setSubmissionsModalVisible(false)} footer={null} width={800}>
        <Table columns={subColumns} dataSource={submissions} rowKey="id" loading={submissionsLoading} pagination={{ pageSize: 10 }} size="small" />
      </Modal>

      <Modal title="批改作业" open={gradeModalVisible} onOk={handleGradeSubmit} onCancel={() => setGradeModalVisible(false)} okText="提交批改" cancelText="取消" width={520} destroyOnClose>
        {gradingSubmission && (
          <div style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="学生">{gradingSubmission.student?.realName || gradingSubmission.studentName || '-'}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{gradingSubmission.submittedAt ? formatDateTime(gradingSubmission.submittedAt) : '-'}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
        <Form form={gradeForm} layout="vertical">
          <Form.Item name="score" label="分数" rules={[{ required: true, message: '请输入分数' }]}><InputNumber min={0} max={1000} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="feedback" label="批语"><TextArea rows={4} placeholder="对学生的反馈" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherGrading;
