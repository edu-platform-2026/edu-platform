import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Space, Modal, message, Row, Col, Statistic, Typography } from 'antd';
import { PlusOutlined, ShareAltOutlined, UserAddOutlined, TeamOutlined } from '@ant-design/icons';
import { invitationService } from '../../services/invitationService';
import InvitePoster from '../../components/InvitePoster';
import { useAuthStore } from '../../stores/authStore';

const { Title } = Typography;

const Invite: React.FC = () => {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [posterVisible, setPosterVisible] = useState(false);
  const [currentCode, setCurrentCode] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [generating, setGenerating] = useState(false);
  const user = useAuthStore((s) => s.user);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res = await invitationService.getMyInvitations();
      setInvitations((res as any)?.data || []);
    } catch {
      message.error('获取邀请列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleGenerate = async (role: string) => {
    setGenerating(true);
    try {
      const res = await invitationService.createInvitation(role);
      setCurrentCode((res as any)?.data?.code);
      setCurrentRole(role);
      setPosterVisible(true);
      message.success('邀请码已生成');
      fetchInvitations();
    } catch {
      message.error('生成邀请码失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    const url = `${window.location.origin}/register?code=${code}`;
    navigator.clipboard.writeText(url);
    message.success('邀请链接已复制');
  };

  const stats = {
    total: invitations.length,
    used: invitations.filter((i) => i.status === 1).length,
    unused: invitations.filter((i) => i.status === 0).length,
  };

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
      render: (role: string) =>
        ({ STUDENT: '学生', PARENT: '家长', TEACHER: '教师' }[role] || role),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: number) =>
        s === 1 ? <Tag color="green">已使用</Tag> : <Tag color="orange">未使用</Tag>,
    },
    {
      title: '被邀请人',
      key: 'invitee',
      render: (_: any, r: any) => r.invitee?.realName || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t: string) => new Date(t).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, r: any) => (
        <Button
          type="link"
          size="small"
          icon={<ShareAltOutlined />}
          onClick={() => handleCopyCode(r.code)}
        >
          复制链接
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>邀请好友</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="总邀请数" value={stats.total} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已注册"
              value={stats.used}
              valueStyle={{ color: '#3f8600' }}
              prefix={<UserAddOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="未使用" value={stats.unused} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      <Card title="生成邀请码" style={{ marginBottom: 24 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={generating}
            onClick={() => handleGenerate('STUDENT')}
          >
            邀请学生
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={generating}
            onClick={() => handleGenerate('PARENT')}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            邀请家长
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={generating}
            onClick={() => handleGenerate('TEACHER')}
            style={{ background: '#722ed1', borderColor: '#722ed1' }}
          >
            邀请教师
          </Button>
        </Space>
      </Card>

      <Card title="我的邀请记录">
        <Table
          columns={columns}
          dataSource={invitations}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="邀请海报"
        open={posterVisible}
        onCancel={() => setPosterVisible(false)}
        footer={null}
        width={420}
      >
        <InvitePoster
          code={currentCode}
          role={currentRole}
          userName={user?.realName || user?.username || ''}
        />
      </Modal>
    </div>
  );
};

export default Invite;
