import React, { useState } from 'react';
import { Card, Input, Button, List, Avatar, Tag, message, Space, Typography, Empty, Popconfirm } from 'antd';
import { SearchOutlined, UserAddOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { parentService, BoundStudent } from '../../services/parentService';
import { useEffect } from 'react';

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
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!keyword.trim()) {
      message.warning('璇疯緭鍏ユ悳绱㈠叧閿瘝');
      return;
    }
    setSearching(true);
    try {
      const res = await parentService.searchStudents(keyword.trim());
      setSearchResults((res as any)?.data || []);
    } catch {
      message.error('鎼滅储澶辫触');
    } finally {
      setSearching(false);
    }
  };

  const handleBind = async (studentId: string) => {
    try {
      await parentService.bindStudent(studentId);
      message.success('缁戝畾鎴愬姛');
      fetchBoundStudents();
      setSearchResults([]);
      setKeyword('');
    } catch (err: any) {
      message.error(err?.message || '缁戝畾澶辫触');
    }
  };

  const handleUnbind = async (studentId: string) => {
    try {
      await parentService.unbindStudent(studentId);
      message.success('瑙ｇ粦鎴愬姛');
      fetchBoundStudents();
    } catch (err: any) {
      message.error(err?.message || '瑙ｇ粦澶辫触');
    }
  };

  const isBound = (studentId: string) => boundStudents.some(s => s.id === studentId);

  return (
    <div>
      <PageHeader title="缁戝畾瀛︾敓" subtitle="鎼滅储骞剁粦瀹氭偍鐨勫瀛愶紝鍗冲彲鏌ョ湅瀛︿範鏁版嵁" />

      {/* Search */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="杈撳叆瀛︾敓濮撳悕銆佺敤鎴峰悕鎴栨墜鏈哄彿鎼滅储"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            size="large"
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={searching} size="large">
            鎼滅储
          </Button>
        </Space.Compact>

        {searchResults.length > 0 && (
          <List
            style={{ marginTop: 16 }}
            header={<Text strong>鎼滅储缁撴灉</Text>}
            dataSource={searchResults}
            renderItem={(item: any) => (
              <List.Item
                actions={[
                  isBound(item.id) ? (
                    <Tag color="green" icon={<CheckCircleOutlined />}>宸茬粦瀹?/Tag>
                  ) : (
                    <Button type="primary" size="small" icon={<UserAddOutlined />} onClick={() => handleBind(item.id)}>
                      缁戝畾
                    </Button>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar style={{ background: '#1677ff' }}>{(item.realName || item.username || '?').charAt(0)}</Avatar>}
                  title={item.realName || item.username}
                  description={<Space><Text type="secondary">鐢ㄦ埛鍚嶏細{item.username}</Text>{item.phone && <Text type="secondary">鎵嬫満锛歿item.phone}</Text>}</Space>}
                />
              </List.Item>
            )}
          />
        )}
        {searchResults.length === 0 && keyword && !searching && (
          <Empty description="鏈壘鍒板尮閰嶇殑瀛︾敓" style={{ marginTop: 16 }} />
        )}
      </Card>

      {/* Bound students */}
      <Card bordered={false} title={`宸茬粦瀹氱殑瀛︾敓 (${boundStudents.length})`} loading={loading}>
        {boundStudents.length > 0 ? (
          <List
            dataSource={boundStudents}
            renderItem={(item: BoundStudent) => (
              <List.Item
                actions={[
                  <Popconfirm title="纭畾瑙ｇ粦璇ュ鐢燂紵" onConfirm={() => handleUnbind(item.id)} okText="纭畾" cancelText="鍙栨秷">
                    <Button type="link" danger icon={<DeleteOutlined />}>瑙ｇ粦</Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar style={{ background: '#52c41a' }}>{(item.realName || item.username || '?').charAt(0)}</Avatar>}
                  title={item.realName || item.username}
                  description={
                    <Space>
                      {item.classes?.map(c => <Tag key={c.id} color="blue">{c.name}</Tag>)}
                      {item.phone && <Text type="secondary">{item.phone}</Text>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="灏氭湭缁戝畾瀛︾敓锛岃鎼滅储骞剁粦瀹? />
        )}
      </Card>
    </div>
  );
};

export default BindStudent;