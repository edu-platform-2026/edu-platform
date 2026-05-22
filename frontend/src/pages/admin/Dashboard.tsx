import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin, Empty, message } from 'antd';
import {
  UserOutlined, BookOutlined, TeamOutlined, FileTextOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { useAuthStore } from '../../stores/authStore';
import { analyticsService, DashboardStats } from '../../services/analyticsService';
import { courseService } from '../../services/courseService';
import { Course } from '../../types/course';

const { Text } = Typography;

const courseColumns = [
  { title: '课程名称', dataIndex: 'name', key: 'name' },
  { title: '授课教师', dataIndex: 'teacherName', key: 'teacherName', render: (v: string) => v || '-' },
  { title: '学生人数', dataIndex: 'currentStudents', key: 'currentStudents', render: (v: number) => v ?? '-' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const map: Record<string, { color: string; text: string }> = {
        ACTIVE: { color: 'green', text: '进行中' },
        DRAFT: { color: 'default', text: '未开始' },
        CANCELLED: { color: 'red', text: '已取消' },
        COMPLETED: { color: 'default', text: '已结束' },
      };
      const info = map[status] || { color: 'default', text: status };
      return <Tag color={info.color}>{info.text}</Tag>;
    },
  },
];

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, coursesRes] = await Promise.allSettled([
        analyticsService.getDashboardStats(),
        courseService.getCourses({ pageSize: 10 }),
      ]);

      if (statsRes.status === 'fulfilled') {
        const data = statsRes.value?.data;
        if (data) {
          setStats(data);
        }
      } else {
        message.error('获取仪表盘统计数据失败');
      }

      if (coursesRes.status === 'fulfilled') {
        const data = coursesRes.value?.data;
        if (data) {
          // PaginatedResponse: { items, total, ... }
          const items = Array.isArray(data) ? data : data.items || [];
          setCourses(items);
        }
      } else {
        message.error('获取课程列表失败');
      }
    } catch {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="管理后台"
        subtitle={`欢迎回来，${user?.name || user?.realName || '管理员'}`}
      />

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="学员总数"
              value={stats?.totalStudents ?? 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            {stats?.recentActivity?.newStudents != null && (
              <Text type="success">新增 {stats.recentActivity.newStudents} 名学员</Text>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="教师总数"
              value={stats?.totalTeachers ?? 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="课程总数"
              value={stats?.totalCourses ?? 0}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            {stats?.activeCourses != null && (
              <Text type="secondary">{stats.activeCourses} 门进行中</Text>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="班级总数"
              value={stats?.totalClasses ?? 0}
              prefix={<ApartmentOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            {stats?.totalAssignments != null && (
              <Text type="secondary">作业 {stats.totalAssignments} 份</Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* 最近活动统计 */}
      {stats?.recentActivity && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="新增学员"
                value={stats.recentActivity.newStudents ?? 0}
                prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="新增作业"
                value={stats.recentActivity.newAssignments ?? 0}
                prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="新增提交"
                value={stats.recentActivity.newSubmissions ?? 0}
                prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 课程列表 */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="近期课程" size="small">
            {courses.length > 0 ? (
              <Table
                columns={courseColumns}
                dataSource={courses}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="暂无课程数据" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
