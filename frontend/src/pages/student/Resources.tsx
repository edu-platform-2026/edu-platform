import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Card, message, Spin, Empty } from 'antd';
import { DownloadOutlined, FilePdfOutlined, FileTextOutlined, PlayCircleOutlined, FileOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { resourceService } from '../../services/resourceService';
import { Resource } from '../../types/api';

/* ======================================================
   类型图标映射
   ====================================================== */
const typeIconMap: Record<string, React.ReactNode> = {
  DOCUMENT: <FilePdfOutlined style={{ color: '#ff4d4f' }} />,
  VIDEO: <PlayCircleOutlined style={{ color: '#722ed1' }} />,
  AUDIO: <PlayCircleOutlined style={{ color: '#1677ff' }} />,
  IMAGE: <FileTextOutlined style={{ color: '#faad14' }} />,
  OTHER: <FileOutlined style={{ color: '#999' }} />,
};

const typeColorMap: Record<string, string> = {
  DOCUMENT: 'red',
  VIDEO: 'purple',
  AUDIO: 'blue',
  IMAGE: 'orange',
  OTHER: 'default',
};

const typeNameMap: Record<string, string> = {
  DOCUMENT: '文档',
  VIDEO: '视频',
  AUDIO: '音频',
  IMAGE: '图片',
  OTHER: '其他',
};

/* ======================================================
   格式化文件大小
   ====================================================== */
function formatFileSize(bytes: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/* ======================================================
   组件
   ====================================================== */
const StudentResources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const res = await resourceService.getResources() as any;
        const data = res?.data;
        setResources(Array.isArray(data) ? data : data?.items || []);
      } catch (err) {
        message.error('加载资源数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const handleDownload = async (record: Resource) => {
    try {
      await resourceService.downloadResource(record.id);
      message.success(`开始下载：${record.title}`);
    } catch (err) {
      message.error('下载失败，请重试');
    }
  };

  const columns = [
    {
      title: '资源名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Resource) => (
        <span>
          {typeIconMap[record.type] || null}{' '}
          <span style={{ fontWeight: 500 }}>{text}</span>
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color={typeColorMap[type] || 'default'}>{typeNameMap[type] || type}</Tag>,
    },
    { title: '上传教师', dataIndex: 'uploaderName', key: 'uploaderName' },
    {
      title: '文件大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t: string) => t ? new Date(t).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Resource) => (
        <Button
          type="link"
          icon={<DownloadOutlined />}
          onClick={() => handleDownload(record)}
        >
          下载
        </Button>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div>
        <PageHeader title="教学资源" subtitle="下载课程相关的学习资料" />
        <Card bordered={false}>
          {resources.length > 0 ? (
            <Table
              dataSource={resources}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          ) : (
            <Empty description="暂无教学资源" />
          )}
        </Card>
      </div>
    </Spin>
  );
};

export default StudentResources;
