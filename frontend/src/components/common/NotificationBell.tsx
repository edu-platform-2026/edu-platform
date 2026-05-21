import React, { useEffect, useState } from 'react';
import { Badge, Dropdown, List, Typography, Button, Empty, Spin } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useNotificationStore } from '../../stores/notificationStore';
import { getRelativeTime } from '../../utils/date';
import { useNavigate } from 'react-router-dom';
import type { MenuProps } from 'antd';

const { Text, Paragraph } = Typography;

interface NotificationBellProps {
  color?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ color }) => {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open && notifications.length === 0) {
      fetchNotifications();
    }
  }, [open, fetchNotifications, notifications.length]);

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  const dropdownContent = (
    <div
      style={{
        width: 360,
        maxHeight: 400,
        overflow: 'auto',
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08)',
        padding: '12px 0',
      }}
    >
      <div
        style={{
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Text strong>通知</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllAsRead}>
            全部已读
          </Button>
        )}
      </div>
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ padding: 40 }}>
          <Empty description="暂无通知" />
        </div>
      ) : (
        <List
          dataSource={notifications.slice(0, 10)}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: item.isRead ? 'transparent' : '#f6f6f6',
              }}
              onClick={() => handleNotificationClick(item.id)}
            >
              <List.Item.Meta
                title={
                  <Text
                    strong={!item.isRead}
                    style={{ fontSize: 13 }}
                    ellipsis={{ tooltip: item.title }}
                  >
                    {item.title}
                  </Text>
                }
                description={
                  <>
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      style={{ marginBottom: 4, fontSize: 12 }}
                    >
                      {item.content}
                    </Paragraph>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {getRelativeTime(item.createdAt)}
                    </Text>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <BellOutlined
          style={{ fontSize: 20, cursor: 'pointer', color: color || undefined }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;
