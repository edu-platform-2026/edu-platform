import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Tag, Button, Modal, Form, Input, Upload, Space, message, Row, Col, Select, Popconfirm, Typography, Empty,
} from 'antd';
import {
  UploadOutlined, PlayCircleOutlined, DeleteOutlined, EyeOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { resourceService } from '../../services/resourceService';
import { Resource } from '../../types/api';

const { Option } = Select;
const { Text } = Typography;

const CourseVideos: React.FC = () => {
  const [videos, setVideos] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await resourceService.getResources({ type: 'VIDEO' });
      const data = res?.data;
      const items: Resource[] = Array.isArray(data) ? data : data?.items || [];
      setVideos(items);
    } catch (err) {
      message.error('加载视频数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleUpload = async () => {
    try {
      const values = await form.validateFields();
      if (fileList.length === 0) {
        message.warning('请选择视频文件');
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('type', 'VIDEO');
      if (values.course) formData.append('course', values.course);
      if (values.description) formData.append('description', values.description);
      formData.append('file', fileList[0].originFileObj || fileList[0]);

      await resourceService.uploadResource(formData);
      message.success('视频上传成功');
      setUploadModalVisible(false);
      form.resetFields();
      setFileList([]);
      fetchVideos();
    } catch (err: any) {
      if (err?.errorFields) return; // 表单验证错误
      message.error('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await resourceService.deleteResource(id);
      message.success('视频已删除');
      fetchVideos();
    } catch (err) {
      message.error('删除失败，请重试');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const columns = [
    {
      title: '视频', key: 'video', render: (_: any, r: Resource) => (
        <Space>
          <div style={{ width: 80, height: 45, background: '#000', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlayCircleOutlined style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{r.title}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{formatFileSize(r.size)}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '描述', dataIndex: 'description', key: 'description', ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '上传者', dataIndex: 'uploaderName', key: 'uploader', width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '标签', dataIndex: 'tags', key: 'tags', width: 150,
      render: (tags: string[]) => tags && tags.length > 0
        ? tags.map(tag => <Tag key={tag} color="blue">{tag}</Tag>)
        : '-',
    },
    {
      title: '上传时间', dataIndex: 'createdAt', key: 'time', width: 160,
      render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作', key: 'action', width: 150,
      render: (_: any, r: Resource) => (
        <Space>
          {r.url && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => window.open(r.url, '_blank')}>
              播放
            </Button>
          )}
          <Popconfirm title="确定删除该视频？" onConfirm={() => handleDelete(r.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="课程视频" subtitle="管理课程视频资源" />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{videos.length}</div>
            <div style={{ color: '#999' }}>视频总数</div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1677ff' }}>
              {formatFileSize(videos.reduce((s, v) => s + (v.size || 0), 0))}
            </div>
            <div style={{ color: '#999' }}>总大小</div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>
              {new Set(videos.map(v => v.uploaderId).filter(Boolean)).size}
            </div>
            <div style={{ color: '#999' }}>上传者数</div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#faad14' }}>
              {videos.filter(v => v.tags && v.tags.length > 0).length}
            </div>
            <div style={{ color: '#999' }}>已标记</div>
          </Card>
        </Col>
      </Row>

      <Card bordered={false}>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)}>上传视频</Button>
            <Button icon={<EyeOutlined />} onClick={fetchVideos}>刷新</Button>
          </Space>
        </div>
        <Table
          dataSource={videos}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 个视频` }}
          size="middle"
          scroll={{ x: 900 }}
          locale={{ emptyText: <Empty description="暂无视频资源" /> }}
        />
      </Card>

      <Modal
        title="上传视频"
        open={uploadModalVisible}
        onOk={handleUpload}
        onCancel={() => { setUploadModalVisible(false); form.resetFields(); setFileList([]); }}
        okText="上传"
        cancelText="取消"
        confirmLoading={uploading}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="视频标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入视频标题" />
          </Form.Item>
          <Form.Item label="所属课程" name="course">
            <Input placeholder="请输入所属课程（选填）" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea placeholder="视频描述（选填）" rows={3} />
          </Form.Item>
          <Form.Item label="视频文件" required>
            <Upload
              accept="video/*"
              maxCount={1}
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: newList }) => setFileList(newList)}
              onRemove={() => setFileList([])}
            >
              <Button icon={<UploadOutlined />}>选择视频文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CourseVideos;
