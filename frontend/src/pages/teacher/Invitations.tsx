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
  const [selectedRole, setSelectedRole] = useState<string>('STUDENT');
  const [createdCode, setCreatedCode] = useState<string>('');
  const [createdLink, setCreatedLink] = useState<string>('');
  const [showResult, setShowResult] = useState(false);

  useEffect(() => { fetchInvitations(); }, []);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res = await invitationService.getMyInvitations();
      const data = (res as any)?.data;
      setInvitations(Array.isArray(data) ? data : data?.items || []);
    } catch {
      message.error('鍔犺浇閭€璇峰垪琛ㄥけ璐?);
    } finally {
      setLoading(false);
    }
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
        message.success('閭€璇风爜鍒涘缓鎴愬姛');
        fetchInvitations();
        try {
          await navigator.clipboard.writeText(link);
          message.info('閭€璇烽摼鎺ュ凡澶嶅埗鍒板壀璐存澘');
        } catch {
          // clipboard API not available
        }
      } else {
        message.error('鍒涘缓閭€璇峰け璐ワ細鏈繑鍥為個璇风爜');
      }
    } catch (err: any) {
      message.error(err?.message || '鍒涘缓閭€璇峰け璐?);
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/register?code=${code}`;
    navigator.clipboard.writeText(link).then(() => {
      message.success('閭€璇烽摼鎺ュ凡澶嶅埗');
    }).catch(() => {
      message.warning('澶嶅埗澶辫触锛岃鎵嬪姩澶嶅埗');
    });
  };

  const totalInvitations = invitations.length;
  const usedInvitations = invitations.filter(i => i.status === 1).length;
  const unusedInvitations = totalInvitations - usedInvitations;

  const columns = [
    { title: '閭€璇风爜', dataIndex: 'code', key: 'code', render: (code: string) => <Tag color="blue">{code}</Tag> },
    {
      title: '閭€璇疯鑹?, dataIndex: 'role', key: 'role',
      render: (role: string) => {
        const map: Record<string, { color: string; label: string }> = {
          STUDENT: { color: 'green', label: '瀛︾敓' },
          PARENT: { color: 'purple', label: '瀹堕暱' },
          TEACHER: { color: 'orange', label: '鏁欏笀' },
        };
        const r = map[role] || { color: 'default', label: role };
        return <Tag color={r.color}>{r.label}</Tag>;
      },
    },
    {
      title: '鐘舵€?, dataIndex: 'status', key: 'status',
      render: (status: number) => status === 1 ? <Tag color="green">宸蹭娇鐢?/Tag> : <Tag color="orange">鏈娇鐢?/Tag>,
    },
    { title: '琚個璇蜂汉', key: 'invitee', render: (_: any, r: any) => r.invitee?.realName || r.invitee?.username || '-' },
    { title: '鍒涘缓鏃堕棿', dataIndex: 'createdAt', key: 'createdAt', render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-' },
    { title: '浣跨敤鏃堕棿', key: 'usedAt', render: (_: any, r: any) => r.usedAt ? new Date(r.usedAt).toLocaleString('zh-CN') : '-' },
    {
      title: '鎿嶄綔', key: 'action',
      render: (_: any, r: any) => r.status !== 1 && (
        <Tooltip title="澶嶅埗閭€璇烽摼鎺?>
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => copyLink(r.code)}>澶嶅埗閾炬帴</Button>
        </Tooltip>
      ),
    },
  ];

  const qrCodeUrl = createdLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(createdLink)}`
    : '';

  return (
    <div>
      <PageHeader title="閭€璇风鐞? subtitle="閭€璇峰鐢熷拰瀹堕暱鍔犲叆骞冲彴" />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={8}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="鎬婚個璇锋暟" value={totalInvitations} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="宸叉敞鍐? value={usedInvitations} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="鏈娇鐢? value={unusedInvitations} valueStyle={{ color: '#cf1322' }} prefix={<UserAddOutlined />} />
          </Card>
        </Col>
      </Row>
      <Card bordered={false}>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>鍒涘缓閭€璇?/Button>
        </div>
        {invitations.length > 0 ? (
          <Table dataSource={invitations} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
        ) : (
          <Empty description="鏆傛棤閭€璇疯褰曪紝鐐瑰嚮涓婃柟鎸夐挳鍒涘缓閭€璇? />
        )}
      </Card>
      <Modal
        title="鍒涘缓閭€璇? open={createModalVisible} onOk={handleCreate}
        onCancel={() => setCreateModalVisible(false)} okText="鍒涘缓" cancelText="鍙栨秷" confirmLoading={creating}>
        <div style={{ marginBottom: 16 }}><Text>閫夋嫨閭€璇疯鑹诧細</Text></div>
        <Select value={selectedRole} onChange={setSelectedRole} style={{ width: '100%' }} size="large">
          <Select.Option value="STUDENT">瀛︾敓</Select.Option>
          <Select.Option value="PARENT">瀹堕暱</Select.Option>
        </Select>
        <div style={{ marginTop: 16, padding: '8px 12px', background: '#f0f5ff', borderRadius: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            鍒涘缓鍚庡皢鐢熸垚閭€璇风爜鍜屼簩缁寸爜锛岃鍒嗕韩缁欐偍鐨勫鐢熸垨瀹堕暱銆?          </Text>
        </div>
      </Modal>
      <Modal
        title="閭€璇风爜鍒涘缓鎴愬姛" open={showResult} onCancel={() => setShowResult(false)}
        footer={<Button onClick={() => setShowResult(false)}>鍏抽棴</Button>} width={400}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 16 }}>閭€璇风爜锛?/Text>
            <Tag color="blue" style={{ fontSize: 18, padding: '4px 16px', marginLeft: 8 }}>{createdCode}</Tag>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>閭€璇烽摼鎺ワ細</Text>
            <div style={{ marginTop: 8, padding: '8px 12px', background: '#f5f5f5', borderRadius: 6, wordBreak: 'break-all' }}>
              <Text copyable={{ text: createdLink }} style={{ fontSize: 12 }}>{createdLink}</Text>
            </div>
          </div>
          {qrCodeUrl && (
            <div style={{ marginBottom: 16 }}>
              <Text strong>閭€璇蜂簩缁寸爜锛?/Text>
              <div style={{ marginTop: 8 }}>
                <Image src={qrCodeUrl} width={200} height={200} style={{ borderRadius: 8 }} />
              </div>
            </div>
          )}
          <Text type="secondary" style={{ fontSize: 12 }}>璇峰皢閭€璇风爜鎴栦簩缁寸爜鍒嗕韩缁欓渶瑕佹敞鍐岀殑鐢ㄦ埛</Text>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherInvitations;