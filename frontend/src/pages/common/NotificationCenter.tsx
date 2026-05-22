import React, { useState, useEffect } from 'react';
import {
  Card, List, Tag, Badge, Button, Space, Empty, Tabs, message, Popconfirm, Typography, Avatar, Spin,
} from 'antd';
import {
  BellOutlined, CheckOutlined, DeleteOutlined,
  FileTextOutlined, TeamOutlined, SettingOutlined, BookOutlined,
} from '@ant-design/icons';
import { notificationService } from '../../services/notificationService';
import { Notification } from '../../types/api';

const { Text } = Typography;

/** 通知类型映射：后端枚举 -> 中文标签 */
const typeLabelMap: Record<string, string> = {
  SYSTEM: '系统',
  ASSIGNMENT: '作业',
  COURSE: '课程',
  GENERAL: '公告',
};

const typeIcons: Record<string, React.ReactNode> = {
  SYSTEM: <SettingOutlined style={{ color: '#1677ff' }} />,
  ASSIGNMENT: <FileTextOutlined style={{ color: '#722ed1' }} />,
  COURSE: <BookOutlined style={{ color: '#faad14' }} />,
  GENERAL: <TeamOutlined style={{ color: '#eb2f96' }} />,
};

const typeColors: Record<string, string> = {
  SYSTEM: 'blue',
  ASSIGNMENT: 'purple',
  COURSE: 'gold',
  GENERAL: 'magenta',
};

/** 格式化时间 */
const formatTime = (createdAt: string): string => {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  return date.toLocaleDateString('zh-CN');
};

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getMyNotifications({ pageSize: 100 });
      const items = res?.data?.items || [];
      setNotifications(items);
    } catch {
      message.error('获取通知列表失败');
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : activeTab === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications.filter(n => n.type === activeTab);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      message.success('已标记为已读');
    } catch {
      message.error('操作失败');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      message.success('全部标记为已读');
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      message.success('已删除');
    } catch {
      message.error('删除失败');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>
        <Badge count={unreadCount} size="small">
          <BellOutlined style={{ fontSize: 24, marginRight: 8 }} />
        </Badge>
        消息通知
        {unreadCount > 0 && (
          <Button type="link" onClick={handleMarkAllRead} style={{ marginLeft: 16 }}>全部已读</Button>
        )}
      </h2>

      <Card bordered={false}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: `全部 (${notifications.length})` },
            { key: 'unread', label: `未读 (${unreadCount})` },
            { key: 'SYSTEM', label: '系统' },
            { key: 'ASSIGNMENT', label: '作业' },
            { key: 'COURSE', label: '课程' },
            { key: 'GENERAL', label: '公告' },
          ]}
        />

        {filteredNotifications.length === 0 ? (
          <Empty description="暂无消息" />
        ) : (
          <List
            dataSource={filteredNotifications}
            renderItem={item => (
              <List.Item
                style={{ background: item.isRead ? 'transparent' : '#f0f5ff', padding: '12px 16px', borderRadius: 8, marginBottom: 4 }}
                actions={[
                  !item.isRead && <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleMarkRead(item.id)}>已读</Button>,
                  <Popconfirm title="确定删除？" onConfirm={() => handleDelete(item.id)}>
                    <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
                  </Popconfirm>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={typeIcons[item.type] || <BellOutlined />} style={{ background: '#f5f5f5' }} />}
                  title={
                    <Space>
                      <Tag color={typeColors[item.type] || 'default'}>{typeLabelMap[item.type] || item.type}</Tag>
                      <Text strong={!item.isRead}>{item.title}</Text>
                      {!item.isRead && <Badge status="processing" />}
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ color: '#666', marginBottom: 4 }}>{item.content}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{formatTime(item.createdAt)}</Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default NotificationCenter;
