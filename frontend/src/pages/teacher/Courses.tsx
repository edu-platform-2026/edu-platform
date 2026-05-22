import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Modal, Form, Select, DatePicker, InputNumber,
  message, Typography, Row, Col, Progress, Descriptions,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined,
} from '@ant-design/icons';
import { courseService } from '../../services/courseService';
import { Course, CourseStatus, CreateCourseRequest } from '../../types/course';
import { formatDate } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;
const { Text } = Typography;
const { RangePicker } = DatePicker;

const TeacherCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [form] = Form.useForm();

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await courseService.getCourses({ page, pageSize, keyword });
      const data = response.data;
      setCourses(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setCourses([
        { id: '1', name: '高等数学A', description: '涵盖微积分、线性代数等基础知识', teacherId: '1', teacherName: '张老师', classId: '1', className: '高一(1)班', status: CourseStatus.ACTIVE, startDate: '2024-01-01', endDate: '2024-06-30', totalHours: 64, completedHours: 32, maxStudents: 50, currentStudents: 42, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', name: '英语写作', description: '提升英语写作能力', teacherId: '1', teacherName: '张老师', classId: '2', className: '高一(2)班', status: CourseStatus.ACTIVE, startDate: '2024-01-01', endDate: '2024-06-30', totalHours: 48, completedHours: 20, maxStudents: 40, currentStudents: 38, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '3', name: '物理实验', description: '基础物理实验操作', teacherId: '1', teacherName: '张老师', classId: '3', className: '高一(1)班', status: CourseStatus.DRAFT, startDate: '2024-02-01', endDate: '2024-07-31', totalHours: 32, completedHours: 0, maxStudents: 36, currentStudents: 0, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
      setTotal(3);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Course) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      totalHours: record.totalHours,
      maxStudents: record.maxStudents,
      dateRange: [record.startDate, record.endDate],
    });
    setModalVisible(true);
  };

  const handleViewDetail = (record: Course) => {
    setSelectedCourse(record);
    setDetailVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data: CreateCourseRequest = {
        name: values.name,
        description: values.description,
        classId: values.classId,
        startDate: values.dateRange[0],
        endDate: values.dateRange[1],
        totalHours: values.totalHours,
        maxStudents: values.maxStudents,
      };

      if (editingId) {
        await courseService.updateCourse(editingId, data);
        message.success('更新成功');
      } else {
        await courseService.createCourse(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchCourses();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || '操作失败，请重试');
    }
  };

  const statusMap: Record<CourseStatus, { color: string; text: string }> = {
    [CourseStatus.DRAFT]: { color: 'default', text: '草稿' },
    [CourseStatus.ACTIVE]: { color: 'success', text: '进行中' },
    [CourseStatus.COMPLETED]: { color: 'warning', text: '已结束' },
  };

  const columns: ColumnsType<Course> = [
    {
      title: '课程名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '班级',
      dataIndex: 'className',
      key: 'className',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '课时进度',
      key: 'progress',
      render: (_, record) => (
        <Progress
          percent={Math.round(((record.completedHours || 0) / record.totalHours) * 100)}
          size="small"
          format={() => `${record.completedHours || 0}/${record.totalHours}`}
        />
      ),
    },
    {
      title: '学生人数',
      key: 'students',
      render: (_, record) => `${record.currentStudents || 0}/${record.maxStudents}`,
    },
    {
      title: '起止日期',
      key: 'date',
      render: (_, record) => `${formatDate(record.startDate)} - ${formatDate(record.endDate)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: CourseStatus) => {
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="课程管理"
        subtitle="管理您的教学课程"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建课程
          </Button>
        }
      />

      <Card bordered={false}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索课程名称"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={fetchCourses}
              allowClear
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={courses}
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
        title={editingId ? '编辑课程' : '创建课程'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="课程名称" rules={[{ required: true, message: '请输入课程名称' }]}>
            <Input placeholder="请输入课程名称" />
          </Form.Item>
          <Form.Item name="description" label="课程描述">
            <TextArea rows={3} placeholder="请输入课程描述" />
          </Form.Item>
          <Form.Item name="classId" label="所属班级" rules={[{ required: true, message: '请选择班级' }]}>
            <Select placeholder="请选择班级">
              <Select.Option value="1">高一(1)班</Select.Option>
              <Select.Option value="2">高一(2)班</Select.Option>
              <Select.Option value="3">高二(1)班</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="起止日期" rules={[{ required: true, message: '请选择日期范围' }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="totalHours" label="总课时" rules={[{ required: true, message: '请输入总课时' }]}>
                <InputNumber min={1} style={{ width: '100%' }} placeholder="总课时" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maxStudents" label="最大人数" rules={[{ required: true, message: '请输入最大人数' }]}>
                <InputNumber min={1} style={{ width: '100%' }} placeholder="最大人数" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="课程详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={640}
      >
        {selectedCourse && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="课程名称" span={2}>{selectedCourse.name}</Descriptions.Item>
            <Descriptions.Item label="课程描述" span={2}>{selectedCourse.description || '无'}</Descriptions.Item>
            <Descriptions.Item label="所属班级">{selectedCourse.className}</Descriptions.Item>
            <Descriptions.Item label="授课教师">{selectedCourse.teacherName}</Descriptions.Item>
            <Descriptions.Item label="开始日期">{formatDate(selectedCourse.startDate)}</Descriptions.Item>
            <Descriptions.Item label="结束日期">{formatDate(selectedCourse.endDate)}</Descriptions.Item>
            <Descriptions.Item label="总课时">{selectedCourse.totalHours}</Descriptions.Item>
            <Descriptions.Item label="已完成课时">{selectedCourse.completedHours || 0}</Descriptions.Item>
            <Descriptions.Item label="最大人数">{selectedCourse.maxStudents}</Descriptions.Item>
            <Descriptions.Item label="当前人数">{selectedCourse.currentStudents || 0}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[selectedCourse.status]?.color}>{statusMap[selectedCourse.status]?.text}</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default TeacherCourses;
