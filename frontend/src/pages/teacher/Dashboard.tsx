import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Typography, Space, Spin, Empty, Table, message } from 'antd';
import {
  BookOutlined, TeamOutlined, FileTextOutlined, CalendarOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { analyticsService } from '../../services/analyticsService';
import { courseService } from '../../services/courseService';
import { assignmentService } from '../../services/assignmentService';
import { formatTime } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';
import { useAuthStore } from '../../stores/authStore';

const { Text } = Typography;

function unwrapResponse(res: any): any {
  const d = res?.data ?? res;
  if (d && typeof d === 'object' && 'code' in d && 'data' in d) return d.data;
  return d;
}

const dayNames = ['\u5468\u65E5', '\u5468\u4E00', '\u5468\u4E8C', '\u5468\u4E09', '\u5468\u56DB', '\u5468\u4E94', '\u5468\u516D'];

const TeacherDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, schedulesRes, assignRes] = await Promise.allSettled([
        analyticsService.getDashboardStats(),
        courseService.getMySchedules(),
        assignmentService.getAssignments({ page: 1, pageSize: 5, teacherId: user?.id }),
      ]);

      // Stats
      if (statsRes.status === 'fulfilled') {
        const raw = unwrapResponse(statsRes.value);
        setStats(raw);
      } else {
        setStats(null);
      }

      // Schedules
      if (schedulesRes.status === 'fulfilled') {
        const raw = unwrapResponse(schedulesRes.value);
        const schedules = Array.isArray(raw) ? raw : raw?.items || [];
        setAllSchedules(schedules);
        const today = new Date().getDay();
        const todayItems = schedules.filter((s: any) => s.dayOfWeek === today);
        setTodaySchedules(todayItems);
      } else {
        setAllSchedules([]);
        setTodaySchedules([]);
      }

      // Recent assignments
      if (assignRes.status === 'fulfilled') {
        const raw = unwrapResponse(assignRes.value);
        const items = raw?.items || (Array.isArray(raw) ? raw : []);
        setRecentAssignments(items);
      } else {
        setRecentAssignments([]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      message.error('\u52A0\u8F7D\u5DE5\u4F5C\u53F0\u6570\u636E\u5931\u8D25');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derive weekly course distribution from real schedule data
  const weekCourseData = [1, 2, 3, 4, 5, 6, 0].map(dayOfWeek => {
    const count = allSchedules.filter((s: any) => s.dayOfWeek === dayOfWeek).length;
    return { key: dayOfWeek, day: dayNames[dayOfWeek], count };
  });

  const statsCards = [
    {
      title: '\u6211\u7684\u8BFE\u7A0B',
      value: stats?.activeCourses ?? stats?.courses?.total ?? 0,
      icon: <BookOutlined style={{ fontSize: 32, color: '#1677ff' }} />,
      color: '#e6f4ff',
      border: '#91caff',
    },
    {
      title: '\u5B66\u751F\u603B\u6570',
      value: stats?.totalStudents ?? stats?.students?.total ?? 0,
      icon: <TeamOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      color: '#f6ffed',
      border: '#b7eb8f',
    },
    {
      title: '\u5F85\u6279\u6539\u4F5C\u4E1A',
      value: stats?.pendingAssignments ?? stats?.assignments?.pending ?? 0,
      icon: <FileTextOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      color: '#fffbe6',
      border: '#ffe58f',
    },
    {
      title: '\u4ECA\u65E5\u8BFE\u7A0B',
      value: todaySchedules.length,
      icon: <CalendarOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      color: '#f9f0ff',
      border: '#d3adf7',
    },
  ];

  const weekCourseColumns = [
    { title: '\u661F\u671F', dataIndex: 'day', key: 'day' },
    { title: '\u8BFE\u7A0B\u6570', dataIndex: 'count', key: 'count', render: (count: number) => <span style={{ fontWeight: 600, color: '#1677ff' }}>{count} \u8282</span> },
  ];

  if (loading) {
    return (<div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>);
  }

  return (
    <div>
      <PageHeader title="\u6559\u5E08\u5DE5\u4F5C\u53F0" subtitle={'\u6B22\u8FCE\u56DE\u6765\uFF0C' + (user?.realName || user?.username || '')} />

      <Row gutter={[16, 16]}>
        {statsCards.map((card, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
            <Card bordered={false} style={{ background: card.color, border: '1px solid ' + card.border, borderRadius: 8 }} bodyStyle={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 14 }}>{card.title}</Text>
                  <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>{card.value}</div>
                </div>
                <div>{card.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="\u672C\u5468\u8BFE\u7A0B\u5206\u5E03" bordered={false}>
            {allSchedules.length > 0 ? (
              <Table dataSource={weekCourseData} columns={weekCourseColumns} pagination={false} size="middle" />
            ) : (
              <Empty description="\u6682\u65E0\u8BFE\u7A0B\u6570\u636E" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="\u4ECA\u65E5\u8BFE\u7A0B" bordered={false} extra={<Tag color="blue">{todaySchedules.length} \u8282\u8BFE</Tag>}>
            {todaySchedules.length === 0 ? (
              <Empty description="\u4ECA\u65E5\u65E0\u8BFE\u7A0B\u5B89\u6392" />
            ) : (
              <List
                dataSource={todaySchedules}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<div style={{ width: 48, height: 48, borderRadius: 8, background: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><ClockCircleOutlined style={{ fontSize: 20 }} /></div>}
                      title={<Text strong>{item.courseName || item.course?.name || '-'}</Text>}
                      description={<Space><Text type="secondary">{formatTime(item.startTime)} - {formatTime(item.endTime)}</Text><Tag>{item.room || '-'}</Tag></Space>}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="\u6700\u8FD1\u4F5C\u4E1A" bordered={false}>
            {recentAssignments.length > 0 ? (
              <List
                dataSource={recentAssignments}
                renderItem={(item: any) => (
                  <List.Item
                    extra={
                      <Tag color={item.submissionCount >= (item.totalStudents || 0) && item.totalStudents > 0 ? 'green' : 'orange'}>
                        {item.submissionCount || 0}/{item.totalStudents || item.class?._count?.classStudents || '?'} \u5DF2\u63D0\u4EA4
                      </Tag>
                    }
                  >
                    <List.Item.Meta
                      title={<Text strong>{item.title}</Text>}
                      description={
                        <Space>
                          <Tag color="blue">{item.course?.name || item.courseName || '-'}</Tag>
                          <Tag>{item.class?.name || '-'}</Tag>
                          <Text type="secondary">{item.dueDate ? new Date(item.dueDate).toLocaleDateString('zh-CN') : '\u65E0\u622A\u6B62\u65E5\u671F'}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="\u6682\u65E0\u4F5C\u4E1A\u6570\u636E" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherDashboard;
