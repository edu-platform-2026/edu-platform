import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card, List, Avatar, Input, Button, Badge, Space, Tag, Empty, Typography, Spin, message, Modal, Select,
} from 'antd';
import {
  SendOutlined, UserOutlined, SearchOutlined, PlusOutlined, TeamOutlined,
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

interface UserSearchResult {
  id: string;
  username: string;
  realName: string;
  role?: string;
  avatarUrl?: string;
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

  // New chat modal state
  const [newChatVisible, setNewChatVisible] = useState(false);
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
        const contactName = isSelf ? msg.receiverName : msg.senderName;

        if (!grouped[contactId]) grouped[contactId] = [];
        grouped[contactId].push(msg);

        if (!contactMap[contactId]) {
          contactMap[contactId] = {
            id: contactId,
            name: contactName || 'Unknown',
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
    } catch (err) {
      message.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selectedContact, messagesMap]);

  // Search users for new chat
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
          role: u.role || u.roles?.[0],
          avatarUrl: u.avatarUrl || u.avatar,
        }));
      setUserSearchResults(results);
    } catch {
      // Silent fail
    } finally {
      setSearchingUsers(false);
    }
  };

  // Start new chat with a user
  const handleStartChat = (targetUser: UserSearchResult) => {
    // Check if contact already exists
    const existingContact = contacts.find(c => c.id === targetUser.id);
    if (existingContact) {
      setSelectedContact(existingContact);
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
    setNewChatVisible(false);
    setUserSearchKeyword('');
    setUserSearchResults([]);
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
        senderName: user?.name || 'Me',
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
    } catch (err) {
      message.error('Failed to send');
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
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Messages</h2>
      <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', height: '100%' }}>
          {/* Left: Contact list */}
          <div style={{ width: 300, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search contacts"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                allowClear
                style={{ flex: 1 }}
              />
              <Button icon={<PlusOutlined />} onClick={() => setNewChatVisible(true)} title="New Chat" />
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
                    <Text type="secondary" ellipsis style={{ fontSize: 13 }}>{contact.lastMessage || 'Start chatting...'}</Text>
                  </div>
                </div>
              )) : (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <Empty description="No messages yet" />
                  <Button type="link" icon={<PlusOutlined />} onClick={() => setNewChatVisible(true)}>
                    Start new chat
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Chat area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedContact ? (
              <>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                      <Text strong>{selectedContact.name}</Text>
                      {selectedContact.role && <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>{selectedContact.role}</Tag>}
                    </div>
                  </Space>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '16px', background: '#fafafa' }}>
                  {currentMessages.length > 0 ? currentMessages.map(msg => {
                    const isSelf = msg.senderId === currentUserId;
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isSelf ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                        <div style={{ maxWidth: '70%' }}>
                          <div style={{ fontSize: 12, color: '#999', marginBottom: 4, textAlign: isSelf ? 'right' : 'left' }}>
                            {isSelf ? (user?.name || 'Me') : msg.senderName} {formatTime(msg.createdAt)}
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
                      <Empty description="No messages yet. Say hello!" />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
                  <Input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onPressEnter={handleSend}
                    placeholder="Type a message..."
                    style={{ flex: 1 }}
                    disabled={sending}
                  />
                  <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={sending} disabled={!inputValue.trim()}>
                    Send
                  </Button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="Select a contact to start chatting" />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* New Chat Modal */}
      <Modal
        title="New Chat"
        open={newChatVisible}
        onCancel={() => { setNewChatVisible(false); setUserSearchKeyword(''); setUserSearchResults([]); }}
        footer={null}
        width={400}
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search by name or username..."
          value={userSearchKeyword}
          onChange={e => {
            setUserSearchKeyword(e.target.value);
            handleSearchUsers(e.target.value);
          }}
          allowClear
          style={{ marginBottom: 16 }}
        />
        {searchingUsers ? (
          <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
        ) : userSearchResults.length > 0 ? (
          <List
            dataSource={userSearchResults}
            renderItem={(item: UserSearchResult) => (
              <List.Item
                style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: 8 }}
                onClick={() => handleStartChat(item)}
                actions={[<Button type="link" size="small">Chat</Button>]}
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
          <Empty description="No users found" />
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
            <TeamOutlined style={{ fontSize: 32, marginBottom: 8 }} />
            <div>Type at least 2 characters to search</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Messages;
