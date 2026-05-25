import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card, List, Avatar, Input, Button, Badge, Space, Tag, Empty, Typography, Spin, message, Modal,
} from 'antd';
import {
  SendOutlined, UserOutlined, SearchOutlined, PlusOutlined, TeamOutlined, UserAddOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const { Text } = Typography;

interface ApiMessage {
  id: string;
  senderId: string;
  senderName: string;
  sender?: { id: string; username: string; realName: string; avatarUrl?: string };
  receiverId: string;
  receiverName: string;
  receiver?: { id: string; username: string; realName: string; avatarUrl?: string };
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

interface UserSearchResult {
  id: string;
  username: string;
  realName: string;
  role?: string;
  avatarUrl?: string;
}

/** 安全提取名称字符串，防止后端返回对象 */
function extractName(val: any, fallback: string = '未知用户'): string {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.realName || val.name || val.username || fallback;
  return fallback;
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

  const [addContactVisible, setAddContactVisible] = useState(false);
  const [userSearchKeyword, setUserSearchKeyword] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/messages/my');
      const data = res?.data;
      const items: ApiMessage[] = Array.isArray(data) ? data : data?.items || [];

      const grouped: Record<string, ApiMessage[]> = {};
      const contactMap: Record<string, Contact> = {};

      items.forEach((msg: ApiMessage) => {
        const isSelf = msg.senderId === currentUserId;
        const contactId = isSelf ? msg.receiverId : msg.senderId;
        // 安全提取联系人名称：优先用对象中的 realName，再用扁平字段
        const contactName = isSelf
          ? extractName(msg.receiver || msg.receiverName)
          : extractName(msg.sender || msg.senderName);

        if (!grouped[contactId]) grouped[contactId] = [];
        grouped[contactId].push(msg);

        if (!contactMap[contactId]) {
          contactMap[contactId] = {
            id: contactId,
            name: contactName,
            lastMessage: msg.content,
            lastTime: msg.createdAt,
            unread: 0,
          };
        }

        if (new Date(msg.createdAt) > new Date(contactMap[contactId].lastTime)) {
          contactMap[contactId].lastMessage = msg.content;
          contactMap[contactId].lastTime = msg.createdAt;
        }

        if (!isSelf && !msg.isRead) {
          contactMap[contactId].unread += 1;
        }
      });

      Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });

      const contactList = Object.values(contactMap).sort(
        (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
      );

      setContacts(contactList);
      setMessagesMap(grouped);
      if (contactList.length > 0 && !selectedContact) {
        setSelectedContact(contactList[0]);
      }
    } catch {
      message.error('加载消息失败');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selectedContact, messagesMap]);

  const handleSearchUsers = async (keyword: string) => {
    if (!keyword || keyword.length < 2) {
      setUserSearchResults([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const res: any = await api.get('/users', { params: { keyword, pageSize: 20 } });
      const data = res?.data;
      const items: any[] = Array.isArray(data) ? data : data?.items || [];
      const results: UserSearchResult[] = items
        .filter((u: any) => u.id !== currentUserId)
        .map((u: any) => ({
          id: u.id,
          username: u.username,
          realName: u.realName || u.name || u.username,
          role: u.role || (Array.isArray(u.roles) ? (typeof u.roles[0] === 'string' ? u.roles[0] : u.roles[0]?.code || u.roles[0]?.name) : '') || '',
          avatarUrl: u.avatarUrl || u.avatar,
        }));
      setUserSearchResults(results);
    } catch {
      // 静默
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleAddContact = (targetUser: UserSearchResult) => {
    const existing = contacts.find(c => c.id === targetUser.id);
    if (existing) {
      setSelectedContact(existing);
    } else {
      const newContact: Contact = {
        id: targetUser.id,
        name: targetUser.realName,
        role: targetUser.role,
        lastMessage: '',
        lastTime: new Date().toISOString(),
        unread: 0,
      };
      setContacts(prev => [newContact, ...prev]);
      setSelectedContact(newContact);
    }
    setAddContactVisible(false);
    setUserSearchKeyword('');
    setUserSearchResults([]);
    message.success(`已添加联系人：${targetUser.realName}`);
  };

  const markAsRead = async (contactId: string) => {
    const msgs = messagesMap[contactId] || [];
    const unreadMsgs = msgs.filter(m => m.senderId === contactId && !m.isRead);
    for (const msg of unreadMsgs) {
      try { await api.put(`/messages/${msg.id}/read`); } catch {}
    }
    setMessagesMap(prev => {
      const updated = { ...prev };
      if (updated[contactId]) {
        updated[contactId] = updated[contactId].map(m =>
          m.senderId === contactId ? { ...m, isRead: true } : m
        );
      }
      return updated;
    });
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, unread: 0 } : c));
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    if (contact.unread > 0) markAsRead(contact.id);
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
      setContacts(prev => prev.map(c =>
        c.id === selectedContact.id
          ? { ...c, lastMessage: newMsg.content, lastTime: newMsg.createdAt }
          : c
      ));
      setInputValue('');
    } catch {
      message.error('发送失败');
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchValue.toLowerCase()) || c.lastMessage.includes(searchValue)
  );

  const currentMessages = selectedContact ? (messagesMap[selectedContact.id] || []) : [];

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" tip="加载中..." /></div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>消息中心</h2>
      <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', height: '100%' }}>
          {/* 左侧：联系人列表 */}
          <div style={{ width: 300, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="搜索联系人"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                allowClear
                style={{ flex: 1 }}
              />
              <Button icon={<UserAddOutlined />} onClick={() => setAddContactVisible(true)} title="添加联系人" type="primary" />
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {filteredContacts.length > 0 ? filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer',
                    background: selectedContact?.id === contact.id ? '#e6f4ff' : 'transparent',
                    borderBottom: '1px solid #f5f5f5', transition: 'background 0.2s',
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
                    <Text type="secondary" ellipsis style={{ fontSize: 13 }}>{contact.lastMessage || '暂无消息'}</Text>
                  </div>
                </div>
              )) : (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <Empty description="暂无消息" />
                  <Button type="link" icon={<UserAddOutlined />} onClick={() => setAddContactVisible(true)}>添加联系人开始聊天</Button>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：聊天区域 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedContact ? (
              <>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
                  <Space>
                    <Avatar icon={<UserOutlined />} />
                    <Text strong>{selectedContact.name}</Text>
                    {selectedContact.role && <Tag color="blue" style={{ fontSize: 11 }}>{selectedContact.role}</Tag>}
                  </Space>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '16px', background: '#fafafa' }}>
                  {currentMessages.length > 0 ? currentMessages.map(msg => {
                    const isSelf = msg.senderId === currentUserId;
                    const senderDisplayName = isSelf ? '我' : extractName(msg.sender || msg.senderName);
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isSelf ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                        <div style={{ maxWidth: '70%' }}>
                          <div style={{ fontSize: 12, color: '#999', marginBottom: 4, textAlign: isSelf ? 'right' : 'left' }}>
                            {senderDisplayName} {formatTime(msg.createdAt)}
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
                      <Empty description="暂无消息，发条消息打个招呼吧！" />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
                  <Input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onPressEnter={handleSend}
                    placeholder="输入消息..."
                    style={{ flex: 1 }}
                    disabled={sending}
                  />
                  <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={sending} disabled={!inputValue.trim()}>发送</Button>
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

      {/* 添加联系人弹窗 */}
      <Modal
        title="添加联系人"
        open={addContactVisible}
        onCancel={() => { setAddContactVisible(false); setUserSearchKeyword(''); setUserSearchResults([]); }}
        footer={null}
        width={450}
      >
        <div style={{ marginBottom: 12 }}><Text type="secondary">搜索用户姓名或用户名来添加联系人</Text></div>
        <Input
          prefix={<SearchOutlined />}
          placeholder="输入姓名或用户名搜索..."
          value={userSearchKeyword}
          onChange={e => { setUserSearchKeyword(e.target.value); handleSearchUsers(e.target.value); }}
          allowClear
          style={{ marginBottom: 16 }}
          size="large"
        />
        {searchingUsers ? (
          <div style={{ textAlign: 'center', padding: 20 }}><Spin tip="搜索中..." /></div>
        ) : userSearchResults.length > 0 ? (
          <List
            dataSource={userSearchResults}
            renderItem={(item: UserSearchResult) => (
              <List.Item
                style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: 8 }}
                onClick={() => handleAddContact(item)}
                actions={[<Button type="primary" size="small" icon={<PlusOutlined />}>添加</Button>]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} style={{ background: '#1677ff' }} />}
                  title={item.realName}
                  description={<Space><Text type="secondary" style={{ fontSize: 12 }}>@{item.username}</Text>{item.role && <Tag color="blue" style={{ fontSize: 11 }}>{item.role}</Tag>}</Space>}
                />
              </List.Item>
            )}
          />
        ) : userSearchKeyword.length >= 2 ? (
          <Empty description="未找到相关用户" />
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
            <TeamOutlined style={{ fontSize: 32, marginBottom: 8 }} />
            <div>输入至少2个字符进行搜索</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Messages;
