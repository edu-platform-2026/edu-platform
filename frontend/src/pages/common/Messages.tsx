import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card, List, Avatar, Input, Button, Badge, Space, Tag, Empty, Typography, Spin, message,
} from 'antd';
import {
  SendOutlined, UserOutlined, SearchOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const { Text } = Typography;

interface ApiMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Contact {
  id: string;
  name: string;
  role?: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

const Messages: React.FC = () => {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, ApiMessage[]>>({});
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/messages/my');
      const data = res?.data;
      const items: ApiMessage[] = Array.isArray(data) ? data : data?.items || [];

      // 按联系人分组消息
      const grouped: Record<string, ApiMessage[]> = {};
      const contactMap: Record<string, Contact> = {};

      items.forEach((msg: ApiMessage) => {
        // 确定对方 ID 和名称
        const isSelf = msg.senderId === currentUserId;
        const contactId = isSelf ? msg.receiverId : msg.senderId;
        const contactName = isSelf ? msg.receiverName : msg.senderName;

        if (!grouped[contactId]) {
          grouped[contactId] = [];
        }
        grouped[contactId].push(msg);

        if (!contactMap[contactId]) {
          contactMap[contactId] = {
            id: contactId,
            name: contactName || '未知用户',
            lastMessage: msg.content,
            lastTime: msg.createdAt,
            unread: 0,
          };
        }

        // 更新最后消息
        if (new Date(msg.createdAt) > new Date(contactMap[contactId].lastTime)) {
          contactMap[contactId].lastMessage = msg.content;
          contactMap[contactId].lastTime = msg.createdAt;
        }

        // 统计未读（对方发给我的未读消息）
        if (!isSelf && !msg.isRead) {
          contactMap[contactId].unread += 1;
        }
      });

      // 对每个联系人的消息按时间排序
      Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });

      const contactList = Object.values(contactMap).sort(
        (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
      );

      setContacts(contactList);
      setMessagesMap(grouped);

      // 自动选中第一个联系人
      if (contactList.length > 0 && !selectedContact) {
        setSelectedContact(contactList[0]);
      }
    } catch (err) {
      message.error('加载消息失败');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedContact, messagesMap]);

  // 标记消息为已读
  const markAsRead = async (contactId: string) => {
    const msgs = messagesMap[contactId] || [];
    const unreadMsgs = msgs.filter(m => m.senderId === contactId && !m.isRead);
    for (const msg of unreadMsgs) {
      try {
        await api.put(`/messages/${msg.id}/read`);
      } catch {
        // 静默失败
      }
    }
    // 更新本地状态
    setMessagesMap(prev => {
      const updated = { ...prev };
      if (updated[contactId]) {
        updated[contactId] = updated[contactId].map(m =>
          m.senderId === contactId ? { ...m, isRead: true } : m
        );
      }
      return updated;
    });
    setContacts(prev =>
      prev.map(c => c.id === contactId ? { ...c, unread: 0 } : c)
    );
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    if (contact.unread > 0) {
      markAsRead(contact.id);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedContact) return;
    setSending(true);
    try {
      const res: any = await api.post('/messages', {
        receiverId: selectedContact.id,
        content: inputValue.trim(),
      });
      const newMsg: ApiMessage = res?.data || {
        id: Date.now().toString(),
        senderId: currentUserId || '',
        senderName: user?.name || '我',
        receiverId: selectedContact.id,
        receiverName: selectedContact.name,
        content: inputValue.trim(),
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setMessagesMap(prev => ({
        ...prev,
        [selectedContact.id]: [...(prev[selectedContact.id] || []), newMsg],
      }));

      // 更新联系人列表中的最后消息
      setContacts(prev =>
        prev.map(c =>
          c.id === selectedContact.id
            ? { ...c, lastMessage: newMsg.content, lastTime: newMsg.createdAt }
            : c
        )
      );

      setInputValue('');
    } catch (err) {
      message.error('发送失败，请重试');
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.includes(searchValue) || c.lastMessage.includes(searchValue)
  );

  const currentMessages = selectedContact ? (messagesMap[selectedContact.id] || []) : [];

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>消息中心</h2>
      <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', height: '100%' }}>
          {/* 左侧联系人列表 */}
          <div style={{ width: 300, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="搜索联系人"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                allowClear
              />
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {filteredContacts.length > 0 ? filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer',
                    background: selectedContact?.id === contact.id ? '#e6f4ff' : 'transparent',
                    borderBottom: '1px solid #f5f5f5',
                    transition: 'background 0.2s',
                  }}
                >
                  <Badge count={contact.unread} size="small">
                    <Avatar icon={<UserOutlined />} style={{ background: '#1677ff' }} />
                  </Badge>
                  <div style={{ flex: 1, marginLeft: 12, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong ellipsis style={{ maxWidth: 120 }}>{contact.name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{formatTime(contact.lastTime)}</Text>
                    </div>
                    <Text type="secondary" ellipsis style={{ fontSize: 13 }}>{contact.lastMessage}</Text>
                  </div>
                </div>
              )) : (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <Empty description="暂无消息" />
                </div>
              )}
            </div>
          </div>

          {/* 右侧聊天区域 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedContact ? (
              <>
                {/* 聊天头部 */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                      <Text strong>{selectedContact.name}</Text>
                      {selectedContact.role && <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>{selectedContact.role}</Tag>}
                    </div>
                  </Space>
                </div>

                {/* 消息列表 */}
                <div style={{ flex: 1, overflow: 'auto', padding: '16px', background: '#fafafa' }}>
                  {currentMessages.length > 0 ? currentMessages.map(msg => {
                    const isSelf = msg.senderId === currentUserId;
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isSelf ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                        <div style={{ maxWidth: '70%' }}>
                          <div style={{ fontSize: 12, color: '#999', marginBottom: 4, textAlign: isSelf ? 'right' : 'left' }}>
                            {isSelf ? (user?.name || '我') : msg.senderName} {formatTime(msg.createdAt)}
                          </div>
                          <div style={{
                            padding: '8px 12px', borderRadius: 12,
                            background: isSelf ? '#1677ff' : '#fff',
                            color: isSelf ? '#fff' : '#333',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          }}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <Empty description="暂无消息记录" />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* 输入区域 */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
                  <Input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onPressEnter={handleSend}
                    placeholder="输入消息..."
                    style={{ flex: 1 }}
                    disabled={sending}
                  />
                  <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={sending} disabled={!inputValue.trim()}>
                    发送
                  </Button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="选择联系人开始聊天" />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Messages;
