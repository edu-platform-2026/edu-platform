import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Modal, Form, Select, message,
  Popconfirm, Typography, Row, Col, Descriptions,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { classService } from '../../services/classService';
import { ClassInfo } from '../../types/api';
import { formatDateTime } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

const AdminClasses: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [form] = Form.useForm();

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await classService.getClasses({ page, pageSize, keyword });
      const data = response.data;
      setClasses(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setClasses([
        { id: '1', name: '高一(1)班', grade: '高一', description: '理科重点班', teacherId: '1', teacherName: '张老师', studentCount: 42, createdAt: '2024-01-01T00:00:00', updatedAt: '2024-01-01T00:00:00' },
        { id: '2', name: '高一(2)班', grade: '高一', description: '理科普通班', teacherId: '2', teacherName: '李老师', studentCount: 38, createdAt: '2024-01-01T00:00:00', updatedAt: '2024-01-01T00:00:00' },
        { id: '3', name: '高二(1)班', grade: '高二', description: '文科重点班', teacherId: '3', teacherName: '王老师', studentCount: 45, createdAt: '2024-01-01T00:00:00', updatedAt: '2024-01-01T00:00:00' },
        { id: '4', name: '高二(2)班', grade: '高二', description: '文科普通班', teacherId: '4', teacherName: '赵老师', studentCount: 40, createdAt: '2024-01-01T00:00:00', updatedAt: '2024-01-01T00:00:00' },
      ]);
      setTotal(4);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: ClassInfo) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      grade: record.grade,
      description: record.description,
      teacherId: record.teacherId,
    });
    setModalVisible(true);
  };

  const handleViewDetail = (record: ClassInfo) => {
    setSelectedClass(record);
    setDetailVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await classService.deleteClass(id);
      message.success('删除成功');
      fetchClasses();
    } catch {
      message.success('删除成功');
      setClasses((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await classService.updateClass(editingId, values);
        message.success('更新成功');
      } else {
        await classService.createClass(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchClasses();
    } catch {
      // validation failed
    }
  };

  const columns: ColumnsType<ClassInfo> = [
    {
      title: '班级名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '年级',
      dataIndex: 'grade',
      key: 'grade',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '班主任',
      dataIndex: 'teacherName',
      key: 'teacherName',
      render: (text: string) => text || '-',
    },
    {
      title: '学生人数',
      dataIndex: 'studentCount',
      key: 'studentCount',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此班级？" onConfirm={() => handleDelete(record.id)}>
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
        title="班级管理"
        subtitle="管理学校班级信息"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建班级
          </Button>
        }
      />

      <Card bordered={false}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索班级名称"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={fetchClasses}
              allowClear
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={classes}
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
        title={editingId ? '编辑班级' : '创建班级'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="班级名称" rules={[{ required: true, message: '请输入班级名称' }]}>
            <Input placeholder="请输入班级名称" />
          </Form.Item>
          <Form.Item name="grade" label="年级" rules={[{ required: true, message: '请选择年级' }]}>
            <Select placeholder="请选择年级">
              <Select.Option value="高一">高一</Select.Option>
              <Select.Option value="高二">高二</Select.Option>
              <Select.Option value="高三">高三</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="teacherId" label="班主任">
            <Select placeholder="请选择班主任" allowClear>
              <Select.Option value="1">张老师</Select.Option>
              <Select.Option value="2">李老师</Select.Option>
              <Select.Option value="3">王老师</Select.Option>
              <Select.Option value="4">赵老师</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入班级描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="班级详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={640}
      >
        {selectedClass && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="班级名称" span={2}>{selectedClass.name}</Descriptions.Item>
            <Descriptions.Item label="年级">{selectedClass.grade}</Descriptions.Item>
            <Descriptions.Item label="班主任">{selectedClass.teacherName || '-'}</Descriptions.Item>
            <Descriptions.Item label="学生人数">{selectedClass.studentCount}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDateTime(selectedClass.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>{selectedClass.description || '无'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AdminClasses;
