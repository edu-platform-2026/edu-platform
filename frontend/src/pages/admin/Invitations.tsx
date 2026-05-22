import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Row, Col, Statistic, Typography, message } from 'antd';
import { TeamOutlined, UserAddOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { invitationService } from '../../services/invitationService';

const { Title } = Typography;

const Invitations: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [invitations, setInvitations] = useState<any>({ items: [], meta: {} });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        invitationService.getStatistics(),
        invitationService.getAllInvitations({ page: 1, pageSize: 50 }),
      ]);
      setStats((statsRes as any)?.data || {});
      setInvitations((listRes as any)?.data || { items: [], meta: {} });
    } catch {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '邀请码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '邀请人',
      key: 'inviter',
      render: (_: any, r: any) => r.inviter?.realName || r.inviter?.username || '-',
    },
    {
      title: '邀请人角色',
      key: 'inviterRole',
      render: (_: any, r: any) => r.inviter?.role || '-',
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
        s === 1 ? <Tag color="green">已注册</Tag> : <Tag color="orange">未使用</Tag>,
    },
    {
      title: '被邀请人',
      key: 'invitee',
      render: (_: any, r: any) => r.invitee?.realName || '-',
    },
    {
      title: '被邀请人手机',
      key: 'phone',
      render: (_: any, r: any) => r.invitee?.phone || '-',
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
      render: (_: any, r: any) =>
        r.usedAt ? new Date(r.usedAt).toLocaleString('zh-CN') : '-',
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>邀请数据统计</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总邀请数" value={stats.total || 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已注册"
              value={stats.used || 0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="未使用" value={stats.unused || 0} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="转化率"
              value={stats.total ? ((stats.used / stats.total) * 100).toFixed(1) : 0}
              suffix="%"
              prefix={<UserAddOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {stats.topInviters && stats.topInviters.length > 0 && (
        <Card title="邀请排行榜" style={{ marginBottom: 24 }}>
          <Table
            dataSource={stats.topInviters}
            rowKey="inviterId"
            pagination={false}
            columns={[
              {
                title: '排名',
                key: 'rank',
                render: (_: any, __: any, idx: number) => idx + 1,
              },
              {
                title: '邀请人',
                key: 'name',
                render: (_: any, r: any) =>
                  r.inviter?.realName || r.inviter?.username || '-',
              },
              {
                title: '角色',
                key: 'role',
                render: (_: any, r: any) => r.inviter?.role || '-',
              },
              {
                title: '邀请数量',
                dataIndex: 'count',
                key: 'count',
                sorter: (a: any, b: any) => a.count - b.count,
              },
            ]}
          />
        </Card>
      )}

      <Card title="全部邀请记录">
        <Table
          columns={columns}
          dataSource={invitations.items || []}
          rowKey="id"
          loading={loading}
          pagination={{
            total: invitations.meta?.total,
            pageSize: 20,
            onChange: (page) => {
              invitationService
                .getAllInvitations({ page, pageSize: 20 })
                .then((res) =>
                  setInvitations((res as any)?.data || { items: [], meta: {} })
                );
            },
          }}
        />
      </Card>
    </div>
  );
};

export default Invitations;
