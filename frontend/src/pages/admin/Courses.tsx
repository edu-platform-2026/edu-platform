import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Modal, Form, Select, DatePicker, InputNumber,
  message, Popconfirm, Typography, Row, Col, Progress,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { courseService } from '../../services/courseService';
import { Course, CourseStatus } from '../../types/course';
import { formatDate, formatDateTime } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;
const { Text } = Typography;
const { RangePicker } = DatePicker;

const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
        { id: '1', name: '高等数学A', description: '涵盖微积分、线性代数等基础知识', teacherId: '1', teacherName: '张老师', classId: '1', className: '高一(1)班', status: CourseStatus.ACTIVE, startDate: '2024-01-01', endDate: '2024-06-30', totalHours: 64, completedHours: 32, maxStudents: 50, currentStudents: 42, createdAt: '2024-01-01T00:00:00', updatedAt: '2024-01-01T00:00:00' },
        { id: '2', name: '英语写作', description: '提升英语写作能力', teacherId: '2', teacherName: '李老师', classId: '2', className: '高一(2)班', status: CourseStatus.ACTIVE, startDate: '2024-01-01', endDate: '2024-06-30', totalHours: 48, completedHours: 20, maxStudents: 40, currentStudents: 38, createdAt: '2024-01-01T00:00:00', updatedAt: '2024-01-01T00:00:00' },
        { id: '3', name: '物理实验', description: '基础物理实验操作', teacherId: '3', teacherName: '王老师', classId: '3', className: '高二(1)班', status: CourseStatus.DRAFT, startDate: '2024-02-01', endDate: '2024-07-31', totalHours: 32, completedHours: 0, maxStudents: 36, currentStudents: 0, createdAt: '2024-01-01T00:00:00', updatedAt: '2024-01-01T00:00:00' },
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
      teacherId: record.teacherId,
      classId: record.classId,
      totalHours: record.totalHours,
      maxStudents: record.maxStudents,
      dateRange: [record.startDate, record.endDate],
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await courseService.deleteCourse(id);
      message.success('删除成功');
      fetchCourses();
    } catch {
      message.error('删除失败，请重试');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        name: values.name,
        description: values.description,
        teacherId: values.teacherId,
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
      title: '授课教师',
      dataIndex: 'teacherName',
      key: 'teacherName',
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
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此课程？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="课程管理"
        subtitle="管理系统课程"
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="teacherId" label="授课教师" rules={[{ required: true, message: '请选择教师' }]}>
                <Select placeholder="请选择教师">
                  <Select.Option value="1">张老师</Select.Option>
                  <Select.Option value="2">李老师</Select.Option>
                  <Select.Option value="3">王老师</Select.Option>
                  <Select.Option value="4">赵老师</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="classId" label="所属班级" rules={[{ required: true, message: '请选择班级' }]}>
                <Select placeholder="请选择班级">
                  <Select.Option value="1">高一(1)班</Select.Option>
                  <Select.Option value="2">高一(2)班</Select.Option>
                  <Select.Option value="3">高二(1)班</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
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
    </div>
  );
};

export default AdminCourses;
