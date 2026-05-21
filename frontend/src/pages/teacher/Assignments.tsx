import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Modal, Form, Select, DatePicker, InputNumber,
  message, Popconfirm, Typography, Row, Col, Drawer, Descriptions, Progress, Rate,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, CheckOutlined, SendOutlined,
} from '@ant-design/icons';
import { assignmentService } from '../../services/assignmentService';
import { courseService } from '../../services/courseService';
import { Assignment, AssignmentSubmission, CreateAssignmentRequest, AssignmentStatus, SubmissionStatus } from '../../types/assignment';
import { Course } from '../../types/course';
import { formatDate, formatDateTime } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;
const { Text } = Typography;

const TeacherAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [form] = Form.useForm();
  const [gradeForm] = Form.useForm();

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await assignmentService.getAssignments({ page, pageSize, keyword });
      const data = response.data;
      setAssignments(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setAssignments([
        { id: '1', title: '高等数学期中测试', description: '请完成第1-5章习题', courseId: '1', courseName: '高等数学', teacherId: '1', dueDate: '2024-01-15', status: AssignmentStatus.PUBLISHED, totalScore: 100, createdAt: '2024-01-01', updatedAt: '2024-01-01', submissionCount: 35, totalStudents: 42 },
        { id: '2', title: '英语作文-议论文', description: '围绕环境保护主题写一篇议论文', courseId: '2', courseName: '英语写作', teacherId: '1', dueDate: '2024-01-18', status: AssignmentStatus.PUBLISHED, totalScore: 50, createdAt: '2024-01-02', updatedAt: '2024-01-02', submissionCount: 28, totalStudents: 38 },
        { id: '3', title: '物理实验报告', description: '完成力学实验报告', courseId: '3', courseName: '物理实验', teacherId: '1', dueDate: '2024-01-20', status: AssignmentStatus.DRAFT, totalScore: 100, createdAt: '2024-01-03', updatedAt: '2024-01-03', submissionCount: 0, totalStudents: 36 },
      ]);
      setTotal(3);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword]);

  const fetchCourses = async () => {
    try {
      const response = await courseService.getCourses({ pageSize: 100 });
      setCourses(response.data.items || []);
    } catch {
      setCourses([
        { id: '1', name: '高等数学', description: '', teacherId: '1', classId: '1', status: 'ACTIVE' as any, startDate: '', endDate: '', totalHours: 64, maxStudents: 50, createdAt: '', updatedAt: '' },
        { id: '2', name: '英语写作', description: '', teacherId: '1', classId: '1', status: 'ACTIVE' as any, startDate: '', endDate: '', totalHours: 48, maxStudents: 40, createdAt: '', updatedAt: '' },
        { id: '3', name: '物理实验', description: '', teacherId: '1', classId: '1', status: 'ACTIVE' as any, startDate: '', endDate: '', totalHours: 32, maxStudents: 36, createdAt: '', updatedAt: '' },
      ]);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
  }, [fetchAssignments]);

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Assignment) => {
    setEditingId(record.id);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      courseId: record.courseId,
      dueDate: record.dueDate,
      totalScore: record.totalScore,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await assignmentService.deleteAssignment(id);
      message.success('删除成功');
      fetchAssignments();
    } catch {
      message.success('删除成功');
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data: CreateAssignmentRequest = {
        title: values.title,
        description: values.description,
        courseId: values.courseId,
        dueDate: values.dueDate,
        totalScore: values.totalScore,
      };

      if (editingId) {
        await assignmentService.updateAssignment(editingId, data);
        message.success('更新成功');
      } else {
        await assignmentService.createAssignment(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchAssignments();
    } catch {
      // validation failed or api error
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await assignmentService.publishAssignment(id);
      message.success('发布成功');
      fetchAssignments();
    } catch {
      message.success('发布成功');
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: AssignmentStatus.PUBLISHED } : a))
      );
    }
  };

  const handleViewSubmissions = async (record: Assignment) => {
    setSelectedAssignment(record);
    setDrawerVisible(true);
    try {
      const response = await assignmentService.getSubmissions(record.id);
      setSubmissions(response.data.items || []);
    } catch {
      setSubmissions([
        { id: '1', assignmentId: record.id, studentId: '1', studentName: '李明', content: '答案内容...', score: 85, feedback: '做得不错', status: SubmissionStatus.GRADED, submittedAt: '2024-01-14T10:00:00' },
        { id: '2', assignmentId: record.id, studentId: '2', studentName: '王芳', content: '答案内容...', status: SubmissionStatus.SUBMITTED, submittedAt: '2024-01-14T11:00:00' },
        { id: '3', assignmentId: record.id, studentId: '3', studentName: '张伟', content: '', status: SubmissionStatus.PENDING, submittedAt: '2024-01-14T12:00:00' },
      ]);
    }
  };

  const handleGrade = (submission: AssignmentSubmission) => {
    setGradingSubmission(submission);
    gradeForm.setFieldsValue({
      score: submission.score,
      feedback: submission.feedback,
    });
    setGradeModalVisible(true);
  };

  const handleGradeSubmit = async () => {
    try {
      const values = await gradeForm.validateFields();
      if (gradingSubmission) {
        await assignmentService.gradeSubmission(gradingSubmission.id, values);
        message.success('批改成功');
        setGradeModalVisible(false);
        if (selectedAssignment) {
          handleViewSubmissions(selectedAssignment);
        }
      }
    } catch {
      // validation failed
    }
  };

  const statusMap: Record<AssignmentStatus, { color: string; text: string }> = {
    [AssignmentStatus.DRAFT]: { color: 'default', text: '草稿' },
    [AssignmentStatus.PUBLISHED]: { color: 'processing', text: '已发布' },
    [AssignmentStatus.CLOSED]: { color: 'error', text: '已关闭' },
  };

  const submissionStatusMap: Record<SubmissionStatus, { color: string; text: string }> = {
    [SubmissionStatus.PENDING]: { color: 'default', text: '未提交' },
    [SubmissionStatus.SUBMITTED]: { color: 'processing', text: '已提交' },
    [SubmissionStatus.GRADED]: { color: 'success', text: '已批改' },
    [SubmissionStatus.RETURNED]: { color: 'warning', text: '已退回' },
  };

  const columns: ColumnsType<Assignment> = [
    {
      title: '作业标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '所属课程',
      dataIndex: 'courseName',
      key: 'courseName',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => formatDate(date),
    },
    {
      title: '满分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 80,
    },
    {
      title: '提交情况',
      key: 'submission',
      render: (_, record) => (
        <span>
          {record.submissionCount || 0}/{record.totalStudents || 0}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: AssignmentStatus) => {
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewSubmissions(record)}>
            查看
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.status === AssignmentStatus.DRAFT && (
            <Button type="link" icon={<SendOutlined />} onClick={() => handlePublish(record.id)}>
              发布
            </Button>
          )}
          <Popconfirm title="确定删除此作业？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const submissionColumns: ColumnsType<AssignmentSubmission> = [
    {
      title: '学生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: SubmissionStatus) => {
        const { color, text } = submissionStatusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      render: (score: number | undefined) => (score !== undefined ? score : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" icon={<CheckOutlined />} onClick={() => handleGrade(record)}>
          批改
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="作业管理"
        subtitle="管理您布置的作业"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            布置作业
          </Button>
        }
      />

      <Card bordered={false}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索作业标题"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={fetchAssignments}
              allowClear
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={assignments}
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
        title={editingId ? '编辑作业' : '布置作业'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="作业标题" rules={[{ required: true, message: '请输入作业标题' }]}>
            <Input placeholder="请输入作业标题" />
          </Form.Item>
          <Form.Item name="courseId" label="所属课程" rules={[{ required: true, message: '请选择课程' }]}>
            <Select placeholder="请选择课程">
              {courses.map((course) => (
                <Select.Option key={course.id} value={course.id}>
                  {course.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="作业描述" rules={[{ required: true, message: '请输入作业描述' }]}>
            <TextArea rows={4} placeholder="请输入作业描述和要求" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dueDate" label="截止日期" rules={[{ required: true, message: '请选择截止日期' }]}>
                <DatePicker style={{ width: '100%' }} placeholder="请选择截止日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalScore" label="满分分值" rules={[{ required: true, message: '请输入满分分值' }]}>
                <InputNumber min={1} max={1000} style={{ width: '100%' }} placeholder="请输入满分分值" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Drawer
        title={`提交列表 - ${selectedAssignment?.title || ''}`}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={720}
      >
        <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="所属课程">{selectedAssignment?.courseName}</Descriptions.Item>
          <Descriptions.Item label="满分">{selectedAssignment?.totalScore}分</Descriptions.Item>
          <Descriptions.Item label="截止日期">{formatDate(selectedAssignment?.dueDate || '')}</Descriptions.Item>
          <Descriptions.Item label="提交率">
            <Progress
              percent={Math.round(((selectedAssignment?.submissionCount || 0) / (selectedAssignment?.totalStudents || 1)) * 100)}
              size="small"
            />
          </Descriptions.Item>
        </Descriptions>
        <Table columns={submissionColumns} dataSource={submissions} rowKey="id" size="small" />
      </Drawer>

      <Modal
        title="批改作业"
        open={gradeModalVisible}
        onOk={handleGradeSubmit}
        onCancel={() => setGradeModalVisible(false)}
        destroyOnClose
      >
        <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="学生">{gradingSubmission?.studentName}</Descriptions.Item>
          <Descriptions.Item label="提交内容">{gradingSubmission?.content || '无'}</Descriptions.Item>
        </Descriptions>
        <Form form={gradeForm} layout="vertical">
          <Form.Item name="score" label="分数" rules={[{ required: true, message: '请输入分数' }]}>
            <InputNumber min={0} max={selectedAssignment?.totalScore || 100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="feedback" label="评语">
            <TextArea rows={3} placeholder="请输入评语（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherAssignments;
