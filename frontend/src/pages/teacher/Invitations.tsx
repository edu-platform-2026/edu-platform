import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Select, message, Space, Typography, Tooltip, Row, Col, Statistic, Empty } from 'antd';
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
      message.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await invitationService.createInvitation(selectedRole);
      const newInvitation = (res as any)?.data;
      message.success('Invitation code created');
      setCreateModalVisible(false);
      fetchInvitations();
      // Copy invite link to clipboard
      if (newInvitation?.code) {
        const link = `${window.location.origin}/register?code=${newInvitation.code}`;
        navigator.clipboard.writeText(link).then(() => {
          message.success('Invite link copied to clipboard');
        });
      }
    } catch {
      message.error('Failed to create invitation');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/register?code=${code}`;
    navigator.clipboard.writeText(link).then(() => {
      message.success('Invite link copied');
    });
  };

  const totalInvitations = invitations.length;
  const usedInvitations = invitations.filter(i => i.status === 1).length;
  const unusedInvitations = totalInvitations - usedInvitations;

  const columns = [
    {
      title: 'Invitation Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Invite Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const map: Record<string, { color: string; label: string }> = {
          STUDENT: { color: 'green', label: 'Student' },
          PARENT: { color: 'purple', label: 'Parent' },
        };
        const r = map[role] || { color: 'default', label: role };
        return <Tag color={r.color}>{r.label}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: number) => s === 1 ? <Tag color="green">Used</Tag> : <Tag color="orange">Unused</Tag>,
    },
    {
      title: 'Invitee',
      key: 'invitee',
      render: (_: any, r: any) => r.invitee?.realName || r.invitee?.username || '-',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t: string) => new Date(t).toLocaleString('zh-CN'),
    },
    {
      title: 'Used',
      key: 'usedAt',
      render: (_: any, r: any) => r.usedAt ? new Date(r.usedAt).toLocaleString('zh-CN') : '-',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, r: any) => r.status !== 1 && (
        <Tooltip title="Copy invite link">
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => copyLink(r.code)}>
            Copy Link
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Invite Friends" subtitle="Invite students and parents to join" />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={8}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="Total Invitations" value={totalInvitations} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="Registered" value={usedInvitations} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="Unused" value={unusedInvitations} valueStyle={{ color: '#cf1322' }} prefix={<UserAddOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false}>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            Create Invitation
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
          <Empty description="No invitations yet. Create one to invite students or parents!" />
        )}
      </Card>

      <Modal
        title="Create Invitation"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => setCreateModalVisible(false)}
        okText="Create"
        cancelText="Cancel"
        confirmLoading={creating}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Select the role to invite:</Text>
        </div>
        <Select
          value={selectedRole}
          onChange={setSelectedRole}
          style={{ width: '100%' }}
          size="large"
        >
          <Select.Option value="STUDENT">Student</Select.Option>
          <Select.Option value="PARENT">Parent</Select.Option>
        </Select>
        <div style={{ marginTop: 16, padding: '8px 12px', background: '#f0f5ff', borderRadius: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            After creating, the invite link will be automatically copied. Share it with your students or parents.
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherInvitations;
