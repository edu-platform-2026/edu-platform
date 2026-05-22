import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Typography, Space, Spin, Empty, Table } from 'antd';
import {
  BookOutlined,
  TeamOutlined,
  FileTextOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { analyticsService, DashboardStats } from '../../services/analyticsService';
import { courseService } from '../../services/courseService';
import { Schedule } from '../../types/course';
import { formatTime, getDayOfWeekLabel } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';

const { Text } = Typography;

const TeacherDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, schedulesRes] = await Promise.allSettled([
        analyticsService.getDashboardStats(),
        courseService.getMySchedules(),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      } else {
        setStats({
          totalStudents: 156,
          totalTeachers: 24,
          totalCourses: 18,
          totalClasses: 12,
          activeCourses: 8,
          pendingAssignments: 15,
          todaySchedules: 4,
          recentEnrollments: 23,
        });
      }

      if (schedulesRes.status === 'fulfilled') {
        const schedules = schedulesRes.value.data;
        const today = new Date().getDay();
        const todayItems = Array.isArray(schedules)
          ? schedules.filter((s) => s.dayOfWeek === today)
          : [];
        setTodaySchedules(todayItems);
      } else {
        setTodaySchedules([
          { id: '1', courseId: '1', courseName: '高等数学', dayOfWeek: 1, startTime: '08:00', endTime: '09:40', room: 'A201', teacherName: '张老师' },
          { id: '2', courseId: '2', courseName: '英语写作', dayOfWeek: 1, startTime: '10:00', endTime: '11:40', room: 'B305', teacherName: '张老师' },
          { id: '3', courseId: '3', courseName: '物理实验', dayOfWeek: 1, startTime: '14:00', endTime: '15:40', room: 'C102', teacherName: '张老师' },
          { id: '4', courseId: '4', courseName: '计算机基础', dayOfWeek: 1, startTime: '16:00', endTime: '17:40', room: 'D401', teacherName: '张老师' },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: '我的课程',
      value: stats?.activeCourses || 0,
      icon: <BookOutlined style={{ fontSize: 32, color: '#1677ff' }} />,
      color: '#e6f4ff',
      border: '#91caff',
    },
    {
      title: '学生总数',
      value: stats?.totalStudents || 0,
      icon: <TeamOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      color: '#f6ffed',
      border: '#b7eb8f',
    },
    {
      title: '待批改作业',
      value: stats?.pendingAssignments || 0,
      icon: <FileTextOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      color: '#fffbe6',
      border: '#ffe58f',
    },
    {
      title: '今日课程',
      value: todaySchedules.length,
      icon: <CalendarOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      color: '#f9f0ff',
      border: '#d3adf7',
    },
  ];

  /* ---- 本周课程分布 Table ---- */
  const weekCourseData = [
    { key: 1, day: '周一', count: 4 },
    { key: 2, day: '周二', count: 3 },
    { key: 3, day: '周三', count: 5 },
    { key: 4, day: '周四', count: 2 },
    { key: 5, day: '周五', count: 4 },
    { key: 6, day: '周六', count: 1 },
    { key: 7, day: '周日', count: 0 },
  ];

  const weekCourseColumns = [
    { title: '星期', dataIndex: 'day', key: 'day' },
    {
      title: '课程数',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => <span style={{ fontWeight: 600, color: '#1677ff' }}>{count} 节</span>,
    },
  ];

  const recentAssignments = [
    { id: '1', title: '高等数学期中测试', course: '高等数学', dueDate: '2024-01-15', submitted: 35, total: 42 },
    { id: '2', title: '英语作文-议论文', course: '英语写作', dueDate: '2024-01-18', submitted: 28, total: 38 },
    { id: '3', title: '物理实验报告', course: '物理实验', dueDate: '2024-01-20', submitted: 20, total: 36 },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="教师工作台" subtitle="欢迎回来，祝您今天工作愉快" />

      <Row gutter={[16, 16]}>
        {statsCards.map((card, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
            <Card
              bordered={false}
              style={{
                background: card.color,
                border: `1px solid ${card.border}`,
                borderRadius: 8,
              }}
              bodyStyle={{ padding: '20px 24px' }}
            >
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
          <Card title="本周课程分布" bordered={false}>
            <Table
              dataSource={weekCourseData}
              columns={weekCourseColumns}
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title="今日课程"
            bordered={false}
            extra={<Tag color="blue">{todaySchedules.length} 节课</Tag>}
          >
            {todaySchedules.length === 0 ? (
              <Empty description="今日无课程安排" />
            ) : (
              <List
                dataSource={todaySchedules}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 8,
                            background: '#1677ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}
                        >
                          <ClockCircleOutlined style={{ fontSize: 20 }} />
                        </div>
                      }
                      title={<Text strong>{item.courseName}</Text>}
                      description={
                        <Space>
                          <Text type="secondary">{formatTime(item.startTime)} - {formatTime(item.endTime)}</Text>
                          <Tag>{item.room}</Tag>
                        </Space>
                      }
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
          <Card title="最近作业" bordered={false}>
            <List
              dataSource={recentAssignments}
              renderItem={(item) => (
                <List.Item
                  extra={
                    <Tag color={item.submitted === item.total ? 'green' : 'orange'}>
                      已提交 {item.submitted}/{item.total}
                    </Tag>
                  }
                >
                  <List.Item.Meta
                    title={<Text strong>{item.title}</Text>}
                    description={
                      <Space>
                        <Tag color="blue">{item.course}</Tag>
                        <Text type="secondary">截止日期：{item.dueDate}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherDashboard;
