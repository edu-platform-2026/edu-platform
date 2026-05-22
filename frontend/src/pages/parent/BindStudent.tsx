import React, { useState, useEffect } from 'react';
import { Card, Input, Button, List, Avatar, Tag, message, Space, Typography, Empty, Popconfirm } from 'antd';
import { SearchOutlined, UserAddOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { parentService, BoundStudent } from '../../services/parentService';

const { Text } = Typography;

const BindStudent: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [boundStudents, setBoundStudents] = useState<BoundStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBoundStudents(); }, []);

  const fetchBoundStudents = async () => {
    setLoading(true);
    try {
      const res = await parentService.getBoundStudents();
      setBoundStudents((res as any)?.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleSearch = async () => {
    if (!keyword.trim()) { message.warning('Please enter a keyword'); return; }
    setSearching(true);
    try {
      const res = await parentService.searchStudents(keyword.trim());
      setSearchResults((res as any)?.data || []);
    } catch { message.error('Search failed'); } finally { setSearching(false); }
  };

  const handleBind = async (studentId: string) => {
    try {
      await parentService.bindStudent(studentId);
      message.success('Bind successful');
      fetchBoundStudents();
      setSearchResults([]);
      setKeyword('');
    } catch (err: any) { message.error(err?.message || 'Bind failed'); }
  };

  const handleUnbind = async (studentId: string) => {
    try {
      await parentService.unbindStudent(studentId);
      message.success('Unbind successful');
      fetchBoundStudents();
    } catch (err: any) { message.error(err?.message || 'Unbind failed'); }
  };

  const isBound = (studentId: string) => boundStudents.some(s => s.id === studentId);

  return (
    <div>
      <PageHeader title="Bind Student" subtitle="Search and bind your child to view their learning data" />
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input placeholder="Search by name, username or phone" value={keyword}
            onChange={e => setKeyword(e.target.value)} onPressEnter={handleSearch} size="large" />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={searching} size="large">Search</Button>
        </Space.Compact>
        {searchResults.length > 0 && (
          <List style={{ marginTop: 16 }} header={<Text strong>Search Results</Text>} dataSource={searchResults}
            renderItem={(item: any) => (
              <List.Item actions={[
                isBound(item.id) ? <Tag color="green" icon={<CheckCircleOutlined />}>Bound</Tag>
                  : <Button type="primary" size="small" icon={<UserAddOutlined />} onClick={() => handleBind(item.id)}>Bind</Button>
              ]}>
                <List.Item.Meta
                  avatar={<Avatar style={{ background: '#1677ff' }}>{(item.realName || item.username || '?').charAt(0)}</Avatar>}
                  title={item.realName || item.username}
                  description={<Space><Text type="secondary">Username: {item.username}</Text>{item.phone && <Text type="secondary">Phone: {item.phone}</Text>}</Space>}
                />
              </List.Item>
            )}
          />
        )}
        {searchResults.length === 0 && keyword && !searching && <Empty description="No students found" style={{ marginTop: 16 }} />}
      </Card>
      <Card bordered={false} title={`Bound Students (${boundStudents.length})`} loading={loading}>
        {boundStudents.length > 0 ? (
          <List dataSource={boundStudents} renderItem={(item: BoundStudent) => (
            <List.Item actions={[
              <Popconfirm title="Unbind this student?" onConfirm={() => handleUnbind(item.id)} okText="Yes" cancelText="No">
                <Button type="link" danger icon={<DeleteOutlined />}>Unbind</Button>
              </Popconfirm>
            ]}>
              <List.Item.Meta
                avatar={<Avatar style={{ background: '#52c41a' }}>{(item.realName || item.username || '?').charAt(0)}</Avatar>}
                title={item.realName || item.username}
                description={<Space>{item.classes?.map(c => <Tag key={c.id} color="blue">{c.name}</Tag>)}{item.phone && <Text type="secondary">{item.phone}</Text>}</Space>}
              />
            </List.Item>
          )} />
        ) : <Empty description="No bound students yet" />}
      </Card>
    </div>
  );
};

export default BindStudent;
