import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Select, message, Space, Typography, Row, Col, Statistic, Tooltip, Empty, Divider, Input } from 'antd';
import { TeamOutlined, UserAddOutlined, CheckCircleOutlined, CopyOutlined, LinkOutlined, PlusOutlined, QrcodeOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { invitationService } from '../../services/invitationService';
import { useAuthStore } from '../../stores/authStore';

const { Text } = Typography;

const TeacherInvitations: React.FC = () => {
  const { user } = useAuthStore();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('STUDENT');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrInviteCode, setQrInviteCode] = useState('');
  const [qrInviteLink, setQrInviteLink] = useState('');

  useEffect(() => { fetchInvitations(); }, []);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res = await invitationService.getMyInvitations();
      const data = (res as any)?.data;
      setInvitations(Array.isArray(data) ? data : data?.items || []);
    } catch { message.error('加载邀请列表失败'); } finally { setLoading(false); }
  };

  const generateQrUrl = (link: string) => {
    return `https://quickchart.io/qr?text=${encodeURIComponent(link)}&size=300&margin=3&ecLevel=H&dark=1890ff&light=ffffff&format=png`;
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await invitationService.createInvitation(selectedRole);
      const newInv = (res as any)?.data;
      if (newInv?.code) {
        const link = `${window.location.origin}/register?code=${newInv.code}`;
        setQrInviteCode(newInv.code);
        setQrInviteLink(link);
        setQrCodeUrl(generateQrUrl(link));
        setCreateModalVisible(false);
        setQrModalVisible(true);
        message.success('邀请码创建成功');
        fetchInvitations();
      }
    } catch (error: any) {
      message.error(error?.message || '创建邀请失败');
    } finally { setCreating(false); }
  };

  const showQrCode = (code: string) => {
    const link = `${window.location.origin}/register?code=${code}`;
    setQrInviteCode(code);
    setQrInviteLink(link);
    setQrCodeUrl(generateQrUrl(link));
    setQrModalVisible(true);
  };

  const copyToClipboard = (text: string, msg: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => message.success(msg));
    } else {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      message.success(msg);
    }
  };

  const totalInv = invitations.length;
  const usedInv = invitations.filter(i => i.status === 1).length;
  const unusedInv = totalInv - usedInv;

  const columns = [
    { title: '邀请码', dataIndex: 'code', key: 'code', render: (code: string) => (
      <Space>
        <Tag color="blue" style={{ fontSize: 14, padding: '2px 12px', fontFamily: 'monospace' }}>{code}</Tag>
        <Tooltip title="复制邀请码"><Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(code, '邀请码已复制')} /></Tooltip>
      </Space>
    )},
    { title: '角色', dataIndex: 'role', key: 'role', width: 80, render: (role: string) => {
      const map: Record<string, { color: string; label: string }> = { STUDENT: { color: 'green', label: '学生' }, PARENT: { color: 'purple', label: '家长' } };
      const r = map[role] || { color: 'default', label: role };
      return <Tag color={r.color}>{r.label}</Tag>;
    }},
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: number) => s === 1 ? <Tag color="green">已使用</Tag> : <Tag color="orange">未使用</Tag> },
    { title: '被邀请人', key: 'invitee', render: (_: any, r: any) => r.invitee?.realName || r.invitee?.username || '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-' },
    { title: '使用时间', key: 'usedAt', width: 160, render: (_: any, r: any) => r.usedAt ? new Date(r.usedAt).toLocaleString('zh-CN') : '-' },
    { title: '操作', key: 'action', width: 160, render: (_: any, r: any) => (
      <Space>
        {r.status !== 1 && <>
          <Tooltip title="查看二维码"><Button type="link" size="small" icon={<QrcodeOutlined />} onClick={() => showQrCode(r.code)}>QR</Button></Tooltip>
          <Tooltip title="复制链接"><Button type="link" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(`${window.location.origin}/register?code=${r.code}`, '链接已复制')}>复制</Button></Tooltip>
        </>}
      </Space>
    )},
  ];

  return (
    <div>
      <PageHeader title="邀请管理" subtitle="邀请学生和家长加入平台" />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={8}><Card bordered={false} bodyStyle={{ padding: 16 }}><Statistic title="总邀请数" value={totalInv} prefix={<TeamOutlined />} /></Card></Col>
        <Col xs={8}><Card bordered={false} bodyStyle={{ padding: 16 }}><Statistic title="已注册" value={usedInv} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} /></Card></Col>
        <Col xs={8}><Card bordered={false} bodyStyle={{ padding: 16 }}><Statistic title="未使用" value={unusedInv} valueStyle={{ color: '#cf1322' }} prefix={<UserAddOutlined />} /></Card></Col>
      </Row>
      <Card bordered={false}>
        <div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>创建邀请</Button></div>
        {invitations.length > 0 ? <Table dataSource={invitations} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} /> : <Empty description="暂无邀请记录，点击上方按钮创建" />}
      </Card>

      <Modal title="创建邀请" open={createModalVisible} onOk={handleCreate} onCancel={() => setCreateModalVisible(false)} okText="创建" cancelText="取消" confirmLoading={creating}>
        <div style={{ marginBottom: 16 }}><Text>选择邀请角色：</Text></div>
        <Select value={selectedRole} onChange={setSelectedRole} style={{ width: '100%' }} size="large">
          <Select.Option value="STUDENT">学生</Select.Option>
          <Select.Option value="PARENT">家长</Select.Option>
        </Select>
        <div style={{ marginTop: 16, padding: '8px 12px', background: '#f0f5ff', borderRadius: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>创建后将生成二维码和邀请链接，分享给学生或家长注册即可。</Text>
        </div>
      </Modal>

      <Modal
        title={<Space><QrcodeOutlined /><span>邀请二维码</span></Space>}
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="copyCode" icon={<CopyOutlined />} onClick={() => copyToClipboard(qrInviteCode, '邀请码已复制')}>复制邀请码</Button>,
          <Button key="copyLink" type="primary" icon={<LinkOutlined />} onClick={() => copyToClipboard(qrInviteLink, '邀请链接已复制')}>复制链接</Button>,
          <Button key="close" onClick={() => setQrModalVisible(false)}>关闭</Button>,
        ]}
        width={440}
        centered
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          {qrCodeUrl && (
            <div style={{ display: 'inline-block', padding: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, boxShadow: '0 8px 24px rgba(102,126,234,0.3)' }}>
              <div style={{ padding: 16, background: '#fff', borderRadius: 12 }}>
                <img src={qrCodeUrl} alt="邀请二维码" style={{ width: 300, height: 300, display: 'block' }} />
              </div>
            </div>
          )}
          <Divider />
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>邀请码</Text>
            <div style={{ marginTop: 4 }}>
              <Tag color="blue" style={{ fontSize: 20, padding: '4px 24px', fontFamily: 'monospace', letterSpacing: 3 }}>{qrInviteCode}</Tag>
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 13 }}>邀请链接</Text>
            <div style={{ marginTop: 4 }}>
              <Input value={qrInviteLink} readOnly style={{ textAlign: 'center' }} suffix={<Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(qrInviteLink, '链接已复制')} />} />
            </div>
          </div>
          <div style={{ marginTop: 16, padding: '10px 16px', background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>扫描二维码或分享链接，邀请用户注册加入平台</Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherInvitations;
