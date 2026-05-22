import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Select, message, Space, Typography, Row, Col, Statistic, Tooltip, Empty, Image } from 'antd';
import { TeamOutlined, UserAddOutlined, CheckCircleOutlined, CopyOutlined, PlusOutlined } from '@ant-design/icons';
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
  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const [createdCode, setCreatedCode] = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [showResult, setShowResult] = useState(false);

  useEffect(() => { fetchInvitations(); }, []);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res = await invitationService.getMyInvitations();
      const data = (res as any)?.data;
      setInvitations(Array.isArray(data) ? data : data?.items || []);
    } catch { message.error('Failed to load invitations'); } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await invitationService.createInvitation(selectedRole);
      const newInvitation = (res as any)?.data;
      if (newInvitation?.code) {
        const link = `${window.location.origin}/register?code=${newInvitation.code}`;
        setCreatedCode(newInvitation.code);
        setCreatedLink(link);
        setShowResult(true);
        setCreateModalVisible(false);
        message.success('Invitation created');
        fetchInvitations();
        try { await navigator.clipboard.writeText(link); message.info('Link copied'); } catch { /* ignore */ }
      } else { message.error('Failed: no code returned'); }
    } catch (err: any) { message.error(err?.message || 'Create failed'); } finally { setCreating(false); }
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/register?code=${code}`;
    navigator.clipboard.writeText(link).then(() => message.success('Link copied')).catch(() => message.warning('Copy failed'));
  };

  const totalInvitations = invitations.length;
  const usedInvitations = invitations.filter(i => i.status === 1).length;
  const unusedInvitations = totalInvitations - usedInvitations;

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code', render: (code: string) => <Tag color="blue">{code}</Tag> },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (role: string) => {
      const map: Record<string, { color: string; label: string }> = { STUDENT: { color: 'green', label: 'Student' }, PARENT: { color: 'purple', label: 'Parent' }, TEACHER: { color: 'orange', label: 'Teacher' } };
      const r = map[role] || { color: 'default', label: role };
      return <Tag color={r.color}>{r.label}</Tag>;
    }},
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: number) => status === 1 ? <Tag color="green">Used</Tag> : <Tag color="orange">Unused</Tag> },
    { title: 'Invitee', key: 'invitee', render: (_: any, r: any) => r.invitee?.realName || r.invitee?.username || '-' },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-' },
    { title: 'Used At', key: 'usedAt', render: (_: any, r: any) => r.usedAt ? new Date(r.usedAt).toLocaleString('zh-CN') : '-' },
    { title: 'Action', key: 'action', render: (_: any, r: any) => r.status !== 1 && (
      <Tooltip title="Copy link"><Button type="link" size="small" icon={<CopyOutlined />} onClick={() => copyLink(r.code)}>Copy</Button></Tooltip>
    )},
  ];

  const qrCodeUrl = createdLink ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(createdLink)}` : '';

  return (
    <div>
      <PageHeader title="Invitations" subtitle="Invite students and parents to join" />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={8}><Card bordered={false} bodyStyle={{ padding: 16 }}><Statistic title="Total" value={totalInvitations} prefix={<TeamOutlined />} /></Card></Col>
        <Col xs={8}><Card bordered={false} bodyStyle={{ padding: 16 }}><Statistic title="Used" value={usedInvitations} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} /></Card></Col>
        <Col xs={8}><Card bordered={false} bodyStyle={{ padding: 16 }}><Statistic title="Unused" value={unusedInvitations} valueStyle={{ color: '#cf1322' }} prefix={<UserAddOutlined />} /></Card></Col>
      </Row>
      <Card bordered={false}>
        <div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>Create Invitation</Button></div>
        {invitations.length > 0 ? <Table dataSource={invitations} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} /> : <Empty description="No invitations yet" />}
      </Card>
      <Modal title="Create Invitation" open={createModalVisible} onOk={handleCreate} onCancel={() => setCreateModalVisible(false)} okText="Create" cancelText="Cancel" confirmLoading={creating}>
        <div style={{ marginBottom: 16 }}><Text>Select role:</Text></div>
        <Select value={selectedRole} onChange={setSelectedRole} style={{ width: '100%' }} size="large">
          <Select.Option value="STUDENT">Student</Select.Option>
          <Select.Option value="PARENT">Parent</Select.Option>
        </Select>
        <div style={{ marginTop: 16, padding: '8px 12px', background: '#f0f5ff', borderRadius: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>An invitation code and QR code will be generated after creation.</Text>
        </div>
      </Modal>
      <Modal title="Invitation Created" open={showResult} onCancel={() => setShowResult(false)} footer={<Button onClick={() => setShowResult(false)}>Close</Button>} width={400}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ marginBottom: 16 }}><Text strong style={{ fontSize: 16 }}>Code: </Text><Tag color="blue" style={{ fontSize: 18, padding: '4px 16px', marginLeft: 8 }}>{createdCode}</Tag></div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Link:</Text>
            <div style={{ marginTop: 8, padding: '8px 12px', background: '#f5f5f5', borderRadius: 6, wordBreak: 'break-all' }}>
              <Text copyable={{ text: createdLink }} style={{ fontSize: 12 }}>{createdLink}</Text>
            </div>
          </div>
          {qrCodeUrl && (
            <div style={{ marginBottom: 16 }}><Text strong>QR Code:</Text><div style={{ marginTop: 8 }}><Image src={qrCodeUrl} width={200} height={200} style={{ borderRadius: 8 }} /></div></div>
          )}
          <Text type="secondary" style={{ fontSize: 12 }}>Share the code or QR code with users to register</Text>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherInvitations;
