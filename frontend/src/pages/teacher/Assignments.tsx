import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Modal, Form, Select, DatePicker,
  InputNumber, Upload, Typography, Row, Col, Descriptions, Progress,
  message, Popconfirm,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  CheckOutlined, SendOutlined, UploadOutlined, FileOutlined,
} from '@ant-design/icons';
import { assignmentService } from '../../services/assignmentService';
import { courseService } from '../../services/courseService';
import { classService } from '../../services/classService';
import { Assignment, AssignmentSubmission, SubmissionStatus } from '../../types/assignment';
import { Course } from '../../types/course';
import { formatDate, formatDateTime } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';
import { useAuthStore } from '../../stores/authStore';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload';
const { TextArea } = Input;
const { Text } = Typography;

interface SubmissionWithAttachments extends AssignmentSubmission {
  attachments: string[];
}

function unwrapResponse(res: any): any {
  const d = res?.data ?? res;
  if (d && typeof d === 'object' && 'code' in d && 'data' in d) return d.data;
  return d;
}

const TeacherAssignments: React.FC = () => {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createForm] = Form.useForm();
  const [createFileList, setCreateFileList] = useState<UploadFile[]>([]);
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
      const response = await assignmentService.getAssignments({
        page, pageSize,
        keyword: keyword || undefined,
        teacherId: user?.id,
      });
      const raw = unwrapResponse(response);
      const items = raw?.items || (Array.isArray(raw) ? raw : []);
      const totalCount = raw?.total ?? raw?.meta?.total ?? items.length ?? 0;
      setAssignments(items);
      setTotal(totalCount);
    } catch (error: any) {
      message.error(error?.message || '加载作业列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, user?.id]);

  const fetchCourses = async () => {
    try {
      const response = await courseService.getMyCourses();
      const raw = unwrapResponse(response);
      setCourses(Array.isArray(raw) ? raw : raw?.items || []);
    } catch {}
  };

  const fetchClasses = async () => {
    try {
      const response = await classService.getClasses({ pageSize: 100 });
      const raw = unwrapResponse(response);
      setClasses(Array.isArray(raw) ? raw : raw?.items || []);
    } catch {}
  };

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
    fetchClasses();
  }, [fetchAssignments]);

  const statusMap: Record<number, { color: string; text: string }> = {
    0: { color: 'default', text: '草稿' },
    1: { color: 'default', text: '草稿' },
    2: { color: 'processing', text: '已发布' },
    3: { color: 'error', text: '已关闭' },
  };

  const subStatusMap: Record<string, { color: string; text: string }> = {
    [SubmissionStatus.PENDING]: { color: 'default', text: '未提交' },
    [SubmissionStatus.SUBMITTED]: { color: 'processing', text: '已提交' },
    [SubmissionStatus.GRADED]: { color: 'success', text: '已批改' },
    [SubmissionStatus.RETURNED]: { color: 'warning', text: '已退回' },
  };

  const handleCreate = () => {
    setEditingId(null);
    createForm.resetFields();
    setCreateFileList([]);
    setCreateModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    createForm.setFieldsValue({
      title: record.title,
      description: record.description,
      classId: record.classId,
      courseId: record.courseId,
      type: record.type || 1,
      subject: record.subject,
      dueDate: record.dueDate,
      maxScore: record.maxScore || 100,
    });
    setCreateFileList([]);
    setCreateModalVisible(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      const attachments = createFileList.map((f) => f.name);
      const data: any = {
        title: values.title,
        description: values.description || '',
        classId: values.classId,
        courseId: values.courseId || undefined,
        type: values.type || 1,
        subject: values.subject || undefined,
        dueDate: values.dueDate?.format?.('YYYY-MM-DD') || values.dueDate || undefined,
        maxScore: values.maxScore || 100,
        attachments,
      };
      try {
        if (editingId) {
          await assignmentService.updateAssignment(editingId, data);
          message.success('作业更新成功');
        } else {
          await assignmentService.createAssignment(data);
          message.success('作业布置成功');
        }
        setCreateModalVisible(false);
        fetchAssignments();
      } catch (error: any) {
        message.error(error?.message || '保存作业失败');
      }
    } catch {}
  };

  const handlePublish = async (id: string) => {
    try {
      await assignmentService.publishAssignment(id);
      message.success('作业发布成功');
      fetchAssignments();
    } catch (error: any) {
      message.error(error?.message || '发布失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await assignmentService.deleteAssignment(id);
      message.success('作业删除成功');
      fetchAssignments();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
    }
  };

  const handleViewSubmissions = async (record: any) => {
    setSelectedAssignment(record);
    setSubmissionsModalVisible(true);
    setSubmissionsLoading(true);
    try {
      const response = await assignmentService.getSubmissions(record.id);
      const raw = unwrapResponse(response);
      const items = raw?.items || (Array.isArray(raw) ? raw : []);
      setSubmissions(items);
    } catch (error: any) {
      message.error(error?.message || '加载提交列表失败');
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleOpenGrade = (submission: any) => {
    setGradingSubmission(submission);
    gradeForm.setFieldsValue({ score: submission.score, feedback: submission.feedback || submission.comment });
    setGradeModalVisible(true);
  };

  const handleGradeSubmit = async () => {
    try {
      const values = await gradeForm.validateFields();
      await assignmentService.gradeSubmission(gradingSubmission!.id, {
        score: values.score,
        feedback: values.feedback,
      });
      message.success('批改成功');
      setGradeModalVisible(false);
      fetchAssignments();
      if (selectedAssignment) handleViewSubmissions(selectedAssignment);
    } catch (error: any) {
      if (error?.message) message.error(error.message);
    }
  };

  const uploadProps = {
    fileList: createFileList,
    beforeUpload: (file: UploadFile) => {
      const ext = '.' + (file.name?.split('.').pop() || '').toLowerCase();
      if (!['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'].includes(ext)) {
        message.error('仅支持 PDF、PNG、JPG、DOC、DOCX 格式');
        return Upload.LIST_IGNORE;
      }
      if ((file.size || 0) > 20 * 1024 * 1024) {
        message.error('文件大小不能超过 20MB');
        return Upload.LIST_IGNORE;
      }
      setCreateFileList((prev) => [...prev, file]);
      return false;
    },
    onRemove: (file: UploadFile) => setCreateFileList((prev) => prev.filter((f) => f.uid !== file.uid)),
  };

  const columns: ColumnsType<any> = [
    { title: '作业标题', dataIndex: 'title', key: 'title', ellipsis: true, render: (t: string) => <Text strong>{t}</Text> },
    { title: '班级', key: 'className', width: 100, render: (_: any, r: any) => <Tag color="blue">{r.class?.name || '-'}</Tag> },
    { title: '课程', key: 'courseName', width: 100, render: (_: any, r: any) => <Tag color="cyan">{r.course?.name || '-'}</Tag> },
    { title: '截止日期', dataIndex: 'dueDate', key: 'dueDate', width: 120, render: (d: string) => d ? formatDate(d) : '-' },
    { title: '提交情况', key: 'submission', width: 130, render: (_: any, r: any) => {
      const submitted = r.submissionCount || 0;
      const totalS = r.class?._count?.classStudents || r.totalStudents || 0;
      const pct = totalS > 0 ? Math.round((submitted / totalS) * 100) : 0;
      return (<Space direction="vertical" size={0} style={{ width: '100%' }}><Text>{submitted}/{totalS}</Text><Progress percent={pct} size="small" showInfo={false} /></Space>);
    }},
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: number) => { const { color, text } = statusMap[s] || { color: 'default', text: String(s) }; return <Tag color={color}>{text}</Tag>; }},
    { title: '操作', key: 'action', width: 260, render: (_: any, r: any) => (
      <Space>
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewSubmissions(r)}>查看</Button>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
        {(r.status === 0 || r.status === 1) && <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handlePublish(r.id)}>发布</Button>}
        <Popconfirm title="确定删除此作业？" onConfirm={() => handleDelete(r.id)}><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
      </Space>
    )},
  ];

  const subColumns: ColumnsType<any> = [
    { title: '学生', key: 'student', width: 100, render: (_: any, r: any) => r.student?.realName || r.studentName || '-' },
    { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', width: 160, render: (d: string) => d ? formatDateTime(d) : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => { const m = subStatusMap[s]; return m ? <Tag color={m.color}>{m.text}</Tag> : <Tag>{s}</Tag>; }},
    { title: '分数', dataIndex: 'score', key: 'score', width: 70, render: (v: any) => v != null ? <Text strong>{String(v)}</Text> : '-' },
    { title: '操作', key: 'action', width: 70, render: (_: any, r: any) => <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleOpenGrade(r)}>批改</Button> },
  ];

  return (
    <div>
      <PageHeader title="作业管理" subtitle="管理您布置的作业，查看学生提交并进行批改" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>布置作业</Button>} />
      <Card bordered={false}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input placeholder="搜索作业标题" prefix={<SearchOutlined />} value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={() => { setPage(1); fetchAssignments(); }} allowClear />
          </Col>
        </Row>
        <Table columns={columns} dataSource={assignments} rowKey="id" loading={loading}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `\u5171 ${t} \u6761`, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }}
        />
      </Card>

      <Modal title={editingId ? '编辑作业' : '布置作业'} open={createModalVisible} onOk={handleCreateSubmit} onCancel={() => setCreateModalVisible(false)} okText={editingId ? '保存' : '布置'} cancelText="取消" width={640} destroyOnClose>
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="作业标题" rules={[{ required: true, message: '请输入作业标题' }]}><Input placeholder="作业标题" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="classId" label="班级" rules={[{ required: true, message: '请选择班级' }]}><Select placeholder="选择班级">{classes.map((c: any) => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="courseId" label="课程"><Select placeholder="选择课程（可选）" allowClear>{courses.map((c) => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}</Select></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="type" label="类型" initialValue={1}><Select><Select.Option value={1}>日常作业</Select.Option><Select.Option value={2}>测验</Select.Option><Select.Option value={3}>考试</Select.Option></Select></Form.Item></Col>
            <Col span={8}><Form.Item name="subject" label="学科"><Input placeholder="如数学" /></Form.Item></Col>
            <Col span={8}><Form.Item name="maxScore" label="满分" initialValue={100}><InputNumber min={1} max={1000} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="dueDate" label="截止日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="description" label="作业描述"><TextArea rows={4} placeholder="作业要求和说明" /></Form.Item>
          <Form.Item label="附件"><Upload {...uploadProps}><Button icon={<UploadOutlined />}>上传文件</Button></Upload></Form.Item>
        </Form>
      </Modal>

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

export default TeacherAssignments;
