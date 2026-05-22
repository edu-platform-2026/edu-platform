import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Modal, Form, Select, DatePicker,
  InputNumber, Upload, Typography, Row, Col, Descriptions, Divider, Progress,
  message, Popconfirm,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  CheckOutlined, SendOutlined, UploadOutlined, DownloadOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { assignmentService } from '../../services/assignmentService';
import { courseService } from '../../services/courseService';
import {
  Assignment, AssignmentSubmission, CreateAssignmentRequest,
  AssignmentStatus, SubmissionStatus,
} from '../../types/assignment';
import { Course } from '../../types/course';
import { formatDate, formatDateTime } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';
import { useAuthStore } from '../../stores/authStore';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

// ===================== 扩展接口 =====================
interface SubmissionWithAttachments extends AssignmentSubmission {
  attachments: string[];
}

const TeacherAssignments: React.FC = () => {
  // ---- 用户信息 ----
  const { user } = useAuthStore();

  // ---- 主列表状态 ----
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ---- 布置/编辑作业 Modal ----
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createForm] = Form.useForm();
  const [createFileList, setCreateFileList] = useState<UploadFile[]>([]);

  // ---- 查看提交 Modal ----
  const [submissionsModalVisible, setSubmissionsModalVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithAttachments[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // ---- 批改 Modal ----
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<SubmissionWithAttachments | null>(null);
  const [gradeForm] = Form.useForm();
  const [gradeFileList, setGradeFileList] = useState<UploadFile[]>([]);

  // ===================== 数据加载 =====================
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await assignmentService.getAssignments({
        page,
        pageSize,
        keyword,
        teacherId: user?.id,
      });
      const data = response.data;
      setAssignments(data.items || []);
      setTotal(data.total || 0);
    } catch (error: any) {
      message.error(error?.message || '加载作业列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, user?.id]);

  const fetchCourses = async () => {
    try {
      const response = await courseService.getMyCourses();
      setCourses(response.data || []);
    } catch (error: any) {
      message.error(error?.message || '加载课程列表失败');
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
  }, [fetchAssignments]);

  // ===================== 状态映射 =====================
  const assignmentStatusMap: Record<AssignmentStatus, { color: string; text: string }> = {
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

  // ===================== 布置/编辑作业 =====================
  const handleCreate = () => {
    setEditingId(null);
    createForm.resetFields();
    setCreateFileList([]);
    setCreateModalVisible(true);
  };

  const handleEdit = (record: Assignment) => {
    setEditingId(record.id);
    createForm.setFieldsValue({
      title: record.title,
      description: record.description,
      courseId: record.courseId,
      dueDate: record.dueDate,
      totalScore: record.totalScore,
    });
    setCreateFileList([]);
    setCreateModalVisible(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      const attachments = createFileList.map((f) => f.name);
      const data: CreateAssignmentRequest = {
        title: values.title,
        description: values.description,
        courseId: values.courseId,
        dueDate: values.dueDate?.format?.('YYYY-MM-DD') || values.dueDate,
        totalScore: values.totalScore,
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
        message.error(error?.message || (editingId ? '作业更新失败' : '作业布置失败'));
      }
    } catch {
      // 表单校验失败
    }
  };

  // ===================== 发布作业 =====================
  const handlePublish = async (id: string) => {
    try {
      await assignmentService.publishAssignment(id);
      message.success('作业发布成功');
      fetchAssignments();
    } catch (error: any) {
      message.error(error?.message || '作业发布失败');
    }
  };

  // ===================== 删除作业 =====================
  const handleDelete = async (id: string) => {
    try {
      await assignmentService.deleteAssignment(id);
      message.success('作业删除成功');
      fetchAssignments();
    } catch (error: any) {
      message.error(error?.message || '作业删除失败');
    }
  };

  // ===================== 查看提交 =====================
  const handleViewSubmissions = async (record: Assignment) => {
    setSelectedAssignment(record);
    setSubmissionsModalVisible(true);
    setSubmissionsLoading(true);
    try {
      const response = await assignmentService.getSubmissions(record.id);
      setSubmissions((response.data.items || []) as SubmissionWithAttachments[]);
    } catch (error: any) {
      message.error(error?.message || '加载提交列表失败');
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // ===================== 批改 =====================
  const handleOpenGrade = (submission: SubmissionWithAttachments) => {
    setGradingSubmission(submission);
    gradeForm.setFieldsValue({
      score: submission.score,
      feedback: submission.feedback,
    });
    setGradeFileList([]);
    setGradeModalVisible(true);
  };

  const handleGradeSubmit = async () => {
    try {
      const values = await gradeForm.validateFields();
      const gradeAttachments = gradeFileList.map((f) => f.name);
      try {
        await assignmentService.gradeSubmission(gradingSubmission!.id, {
          score: values.score,
          feedback: values.feedback,
        });
        message.success('批改成功');
        setGradeModalVisible(false);
        // 更新本地 submissions 数据
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === gradingSubmission!.id
              ? {
                  ...s,
                  score: values.score,
                  feedback: values.feedback,
                  status: SubmissionStatus.GRADED,
                  gradedAt: new Date().toISOString(),
                  gradeAttachments,
                }
              : s
          )
        );
        // 刷新主列表
        fetchAssignments();
      } catch (error: any) {
        message.error(error?.message || '批改失败');
      }
    } catch {
      // 表单校验失败
    }
  };

  // ===================== 上传配置 =====================
  const createUploadProps = {
    fileList: createFileList,
    beforeUpload: (file: UploadFile) => {
      const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
      const ext = '.' + (file.name?.split('.').pop() || '').toLowerCase();
      if (!allowedExts.includes(ext)) {
        message.error('仅支持 PDF、PNG、JPG、DOC、DOCX 格式的文件');
        return Upload.LIST_IGNORE;
      }
      if ((file.size || 0) > 20 * 1024 * 1024) {
        message.error('文件大小不能超过 20MB');
        return Upload.LIST_IGNORE;
      }
      setCreateFileList((prev) => [...prev, file]);
      return false;
    },
    onRemove: (file: UploadFile) => {
      setCreateFileList((prev) => prev.filter((f) => f.uid !== file.uid));
    },
  };

  const gradeUploadProps = {
    fileList: gradeFileList,
    beforeUpload: (file: UploadFile) => {
      const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
      const ext = '.' + (file.name?.split('.').pop() || '').toLowerCase();
      if (!allowedExts.includes(ext)) {
        message.error('仅支持 PDF、PNG、JPG、DOC、DOCX 格式的文件');
        return Upload.LIST_IGNORE;
      }
      if ((file.size || 0) > 20 * 1024 * 1024) {
        message.error('文件大小不能超过 20MB');
        return Upload.LIST_IGNORE;
      }
      setGradeFileList((prev) => [...prev, file]);
      return false;
    },
    onRemove: (file: UploadFile) => {
      setGradeFileList((prev) => prev.filter((f) => f.uid !== file.uid));
    },
  };

  // ===================== 主列表列定义 =====================
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
      width: 120,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 130,
      render: (date: string) => formatDate(date),
    },
    {
      title: '提交人数/总人数',
      key: 'submission',
      width: 150,
      render: (_, record) => {
        const submitted = record.submissionCount || 0;
        const totalStudents = record.totalStudents || 0;
        const percent = totalStudents > 0 ? Math.round((submitted / totalStudents) * 100) : 0;
        return (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Text>{submitted}/{totalStudents}</Text>
            <Progress percent={percent} size="small" showInfo={false} />
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AssignmentStatus) => {
        const { color, text } = assignmentStatusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewSubmissions(record)}>
            查看提交
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.status === AssignmentStatus.DRAFT && (
            <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handlePublish(record.id)}>
              发布
            </Button>
          )}
          <Popconfirm title="确定删除此作业？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ===================== 提交列表列定义 =====================
  const submissionColumns: ColumnsType<SubmissionWithAttachments> = [
    {
      title: '学生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 100,
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 170,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: SubmissionStatus) => {
        const { color, text } = submissionStatusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '附件',
      key: 'attachments',
      width: 180,
      render: (_, record) => {
        const attachments = record.attachments || [];
        if (attachments.length === 0) return <Text type="secondary">无</Text>;
        return (
          <Space direction="vertical" size={2}>
            {attachments.map((file, idx) => (
              <Space key={idx} size={4}>
                <FileOutlined style={{ color: '#1677ff' }} />
                <Text style={{ fontSize: 12 }}>{file}</Text>
              </Space>
            ))}
          </Space>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<CheckOutlined />}
          onClick={() => handleOpenGrade(record)}
        >
          批改
        </Button>
      ),
    },
  ];

  // ===================== 渲染 =====================
  return (
    <div>
      <PageHeader
        title="作业管理"
        subtitle="管理您布置的作业，查看学生提交并进行批改"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            布置作业
          </Button>
        }
      />

      {/* 搜索 */}
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
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      {/* ========== 布置/编辑作业 Modal ========== */}
      <Modal
        title={editingId ? '编辑作业' : '布置作业'}
        open={createModalVisible}
        onOk={handleCreateSubmit}
        onCancel={() => setCreateModalVisible(false)}
        okText={editingId ? '保存' : '布置'}
        cancelText="取消"
        width={640}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="title"
            label="作业标题"
            rules={[{ required: true, message: '请输入作业标题' }]}
          >
            <Input placeholder="请输入作业标题" />
          </Form.Item>
          <Form.Item
            name="courseId"
            label="所属课程"
            rules={[{ required: true, message: '请选择课程' }]}
          >
            <Select placeholder="请选择课程">
              {courses.map((course) => (
                <Select.Option key={course.id} value={course.id}>
                  {course.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="作业要求"
            rules={[{ required: true, message: '请输入作业要求' }]}
          >
            <TextArea rows={4} placeholder="请输入作业要求和说明" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dueDate"
                label="截止日期"
                rules={[{ required: true, message: '请选择截止日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择截止日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalScore"
                label="满分分值"
                rules={[{ required: true, message: '请输入满分分值' }]}
              >
                <InputNumber min={1} max={1000} style={{ width: '100%' }} placeholder="请输入满分分值" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="附件上传">
            <Upload {...createUploadProps}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            <Text type="secondary" style={{ fontSize: 12 }}>
              支持 PDF、PNG、JPG、DOC、DOCX 格式，单个文件不超过 20MB
            </Text>
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== 查看提交 Modal ========== */}
      <Modal
        title={`提交列表 - ${selectedAssignment?.title || ''}`}
        open={submissionsModalVisible}
        onCancel={() => setSubmissionsModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        {selectedAssignment && (
          <>
            <Descriptions bordered column={3} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="所属课程">{selectedAssignment.courseName}</Descriptions.Item>
              <Descriptions.Item label="满分">{selectedAssignment.totalScore}分</Descriptions.Item>
              <Descriptions.Item label="截止日期">{formatDate(selectedAssignment.dueDate)}</Descriptions.Item>
              <Descriptions.Item label="作业要求" span={3}>
                {selectedAssignment.description}
              </Descriptions.Item>
              <Descriptions.Item label="提交率" span={3}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Progress
                    percent={Math.round(((selectedAssignment.submissionCount || 0) / (selectedAssignment.totalStudents || 1)) * 100)}
                    style={{ flex: 1, marginBottom: 0 }}
                  />
                  <Text>{selectedAssignment.submissionCount || 0}/{selectedAssignment.totalStudents || 0}</Text>
                </div>
              </Descriptions.Item>
            </Descriptions>

            <Table
              columns={submissionColumns}
              dataSource={submissions}
              rowKey="id"
              size="small"
              loading={submissionsLoading}
              pagination={false}
            />
          </>
        )}
      </Modal>

      {/* ========== 批改 Modal ========== */}
      <Modal
        title="批改作业"
        open={gradeModalVisible}
        onOk={handleGradeSubmit}
        onCancel={() => setGradeModalVisible(false)}
        okText="提交批改"
        cancelText="取消"
        width={640}
        destroyOnClose
      >
        {gradingSubmission && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="学生姓名">{gradingSubmission.studentName}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{formatDateTime(gradingSubmission.submittedAt)}</Descriptions.Item>
              <Descriptions.Item label="提交内容">
                <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                  {gradingSubmission.content || '（未填写内容）'}
                </Paragraph>
              </Descriptions.Item>
              {gradingSubmission.attachments && gradingSubmission.attachments.length > 0 && (
                <Descriptions.Item label="学生附件">
                  <Space direction="vertical">
                    {gradingSubmission.attachments.map((file, idx) => (
                      <Button
                        key={idx}
                        type="link"
                        size="small"
                        icon={<DownloadOutlined />}
                        style={{ padding: 0 }}
                        href={file}
                        target="_blank"
                      >
                        {file}
                      </Button>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left" plain>评分与评语</Divider>

            <Form form={gradeForm} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="score"
                    label="评分"
                    rules={[{ required: true, message: '请输入评分' }]}
                  >
                    <InputNumber
                      min={0}
                      max={selectedAssignment?.totalScore || 100}
                      style={{ width: '100%' }}
                      placeholder={`0-${selectedAssignment?.totalScore || 100}`}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <div style={{ paddingTop: 30, paddingLeft: 8 }}>
                    <Text type="secondary">满分：{selectedAssignment?.totalScore || 100}分</Text>
                  </div>
                </Col>
              </Row>
              <Form.Item name="feedback" label="评语">
                <TextArea rows={3} placeholder="请输入评语（可选）" />
              </Form.Item>
              <Form.Item label="上传批改文件">
                <Upload {...gradeUploadProps}>
                  <Button icon={<UploadOutlined />}>选择文件</Button>
                </Upload>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  可上传批改后的文件供学生下载，支持 PDF、PNG、JPG、DOC、DOCX 格式
                </Text>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default TeacherAssignments;
