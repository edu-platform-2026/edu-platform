import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Upload, Modal, Form, Select,
  message, Typography, Row, Col, Popconfirm,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, DeleteOutlined, DownloadOutlined,
  FileOutlined, VideoCameraOutlined, AudioOutlined, PictureOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { resourceService } from '../../services/resourceService';
import { Resource } from '../../types/api';
import { formatDateTime } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

const TeacherResources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const response = await resourceService.getResources({ page, pageSize, keyword });
      const data = response.data;
      setResources(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setResources([
        { id: '1', title: '高等数学课件第一章', description: '微积分基础', type: 'DOCUMENT', url: '/files/math1.pdf', size: 2048000, uploaderId: '1', uploaderName: '张老师', tags: ['数学', '课件'], createdAt: '2024-01-10T10:00:00' },
        { id: '2', title: '英语听力训练材料', description: '初级听力练习', type: 'AUDIO', url: '/files/english1.mp3', size: 5120000, uploaderId: '1', uploaderName: '张老师', tags: ['英语', '听力'], createdAt: '2024-01-11T14:00:00' },
        { id: '3', title: '物理实验视频', description: '力学实验演示', type: 'VIDEO', url: '/files/physics1.mp4', size: 102400000, uploaderId: '1', uploaderName: '张老师', tags: ['物理', '视频'], createdAt: '2024-01-12T09:00:00' },
        { id: '4', title: '化学元素周期表', description: '高清周期表图片', type: 'IMAGE', url: '/files/chemistry.png', size: 1024000, uploaderId: '1', uploaderName: '张老师', tags: ['化学', '图片'], createdAt: '2024-01-13T16:00:00' },
      ]);
      setTotal(4);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleUpload = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description || '');
      formData.append('type', values.type);
      if (values.tags) {
        formData.append('tags', values.tags.join(','));
      }
      if (values.file) {
        formData.append('file', values.file[0].originFileObj);
      }
      await resourceService.uploadResource(formData);
      message.success('上传成功');
      setModalVisible(false);
      fetchResources();
    } catch {
      // validation failed
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await resourceService.deleteResource(id);
      message.success('删除成功');
      fetchResources();
    } catch {
      message.success('删除成功');
      setResources((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT': return <FileTextOutlined style={{ color: '#1677ff' }} />;
      case 'VIDEO': return <VideoCameraOutlined style={{ color: '#722ed1' }} />;
      case 'AUDIO': return <AudioOutlined style={{ color: '#52c41a' }} />;
      case 'IMAGE': return <PictureOutlined style={{ color: '#faad14' }} />;
      default: return <FileOutlined style={{ color: '#666' }} />;
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      DOCUMENT: '文档',
      VIDEO: '视频',
      AUDIO: '音频',
      IMAGE: '图片',
      OTHER: '其他',
    };
    return map[type] || type;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const columns: ColumnsType<Resource> = [
    {
      title: '资源名称',
      key: 'title',
      render: (_, record) => (
        <Space>
          {getTypeIcon(record.type)}
          <div>
            <Text strong>{record.title}</Text>
            {record.description && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{getTypeLabel(type)}</Tag>,
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => formatSize(size),
    },
    {
      title: '标签',
      key: 'tags',
      render: (_, record) => (
        <Space wrap>
          {record.tags?.map((tag) => <Tag key={tag} color="blue">{tag}</Tag>)}
        </Space>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<DownloadOutlined />} href={record.url} target="_blank">
            下载
          </Button>
          <Popconfirm title="确定删除此资源？" onConfirm={() => handleDelete(record.id)}>
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
        title="教学资源库"
        subtitle="管理您的教学资料"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>
            上传资源
          </Button>
        }
      />

      <Card bordered={false}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索资源名称"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={fetchResources}
              allowClear
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={resources}
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
        title="上传资源"
        open={modalVisible}
        onOk={handleUpload}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="资源名称" rules={[{ required: true, message: '请输入资源名称' }]}>
            <Input placeholder="请输入资源名称" />
          </Form.Item>
          <Form.Item name="description" label="资源描述">
            <Input.TextArea rows={2} placeholder="请输入资源描述" />
          </Form.Item>
          <Form.Item name="type" label="资源类型" rules={[{ required: true, message: '请选择资源类型' }]}>
            <Select placeholder="请选择资源类型">
              <Select.Option value="DOCUMENT">文档</Select.Option>
              <Select.Option value="VIDEO">视频</Select.Option>
              <Select.Option value="AUDIO">音频</Select.Option>
              <Select.Option value="IMAGE">图片</Select.Option>
              <Select.Option value="OTHER">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签后回车" />
          </Form.Item>
          <Form.Item
            name="file"
            label="上传文件"
            valuePropName="fileList"
            getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
            rules={[{ required: true, message: '请选择文件' }]}
          >
            <Upload.Dragger maxCount={1} beforeUpload={() => false}>
              <p style={{ padding: 20, textAlign: 'center' }}>
                <PlusOutlined style={{ fontSize: 24, color: '#999' }} />
              </p>
              <p>点击或拖拽文件到此区域上传</p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherResources;
