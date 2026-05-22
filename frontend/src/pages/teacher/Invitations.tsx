import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Select, message, Space, Typography, Row, Col, Statistic, Tooltip, Empty } from 'antd';
import { TeamOutlined, UserAddOutlined, CheckCircleOutlined, CopyOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { invitationService } from '../../services/invitationService';
import { useAuthStore } from '../../stores/authStore';

const { Text } = Typography;

const TeacherInvitations: React.FC = () => {
  const { user } = useAuthStore();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('STUDENT');

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res = await invitationService.getMyInvitations();
      setInvitations((res as any)?.data || []);
    } catch {
      message.error('加载邀请列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await invitationService.createInvitation(selectedRole);
      const newInvitation = (res as any)?.data;
      message.success('邀请码创建成功');
      setCreateModalVisible(false);
      fetchInvitations();
      // 复制邀请链接到剪贴板
      if (newInvitation?.code) {
        const link = `${window.location.origin}/register?code=${newInvitation.code}`;
        navigator.clipboard.writeText(link).then(() => {
          message.success('邀请链接已复制到剪贴板');
        });
      }
    } catch {
      message.error('创建邀请失败');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/register?code=${code}`;
    navigator.clipboard.writeText(link).then(() => {
      message.success('邀请链接已复制');
    });
  };

  const totalInvitations = invitations.length;
  const usedInvitations = invitations.filter(i => i.status === 1).length;
  const unusedInvitations = totalInvitations - usedInvitations;

  const columns = [
    {
      title: '邀请码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '邀请角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const map: Record<string, { color: string; label: string }> = {
          STUDENT: { color: 'green', label: '学生' },
          PARENT: { color: 'purple', label: '家长' },
        };
        const r = map[role] || { color: 'default', label: role };
        return <Tag color={r.color}>{r.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => status === 1 ? <Tag color="green">已使用</Tag> : <Tag color="orange">未使用</Tag>,
    },
    {
      title: '被邀请人',
      key: 'invitee',
      render: (_: any, r: any) => r.invitee?.realName || r.invitee?.username || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t: string) => new Date(t).toLocaleString('zh-CN'),
    },
    {
      title: '使用时间',
      key: 'usedAt',
      render: (_: any, r: any) => r.usedAt ? new Date(r.usedAt).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, r: any) => r.status !== 1 && (
        <Tooltip title="复制邀请链接">
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => copyLink(r.code)}>
            复制链接
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="邀请好友" subtitle="邀请学生和家长加入平台" />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={8}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="总邀请数" value={totalInvitations} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="已注册" value={usedInvitations} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="未使用" value={unusedInvitations} valueStyle={{ color: '#cf1322' }} prefix={<UserAddOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false}>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            创建邀请
          </Button>
        </div>
        {invitations.length > 0 ? (
          <Table
            dataSource={invitations}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Empty description="暂无邀请记录，点击上方按钮创建邀请" />
        )}
      </Card>

      <Modal
        title="创建邀请"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => setCreateModalVisible(false)}
        okText="创建"
        cancelText="取消"
        confirmLoading={creating}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>选择邀请角色：</Text>
        </div>
        <Select
          value={selectedRole}
          onChange={setSelectedRole}
          style={{ width: '100%' }}
          size="large"
        >
          <Select.Option value="STUDENT">学生</Select.Option>
          <Select.Option value="PARENT">家长</Select.Option>
        </Select>
        <div style={{ marginTop: 16, padding: '8px 12px', background: '#f0f5ff', borderRadius: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            创建后邀请链接将自动复制到剪贴板，请分享给您的学生或家长。
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherInvitations;
