import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin, message } from 'antd';
import {
  UserOutlined, BookOutlined, TeamOutlined, FileTextOutlined,
  ApartmentOutlined, CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { useAuthStore } from '../../stores/authStore';
import { analyticsService } from '../../services/analyticsService';
import { courseService } from '../../services/courseService';
import { Course } from '../../types/course';

const { Text } = Typography;

const courseColumns = [
  { title: '课程名称', dataIndex: 'name', key: 'name' },
  { title: '授课教师', dataIndex: 'teacherName', key: 'teacherName', render: (v: string) => v || '-' },
  { title: '学生人数', dataIndex: 'currentStudents', key: 'currentStudents', render: (v: number) => v ?? '-' },
  {
    title: '状态', dataIndex: 'status', key: 'status',
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

interface OverviewData {
  users?: { total?: number; active?: number; roleDistribution?: any[] };
  classes?: { total?: number };
  courses?: { total?: number };
  assignments?: { total?: number };
  resources?: { total?: number };
  feedbacks?: { total?: number; pending?: number };
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, coursesRes] = await Promise.allSettled([
        analyticsService.getDashboardStats(),
        courseService.getCourses({ pageSize: 10 }),
      ]);

      if (statsRes.status === 'fulfilled') {
        const res = statsRes.value as any;
        const data = res?.data;
        if (data) {
          setOverview(data);
        }
      } else {
        console.error('获取仪表盘数据失败:', statsRes.reason);
      }

      if (coursesRes.status === 'fulfilled') {
        const res = coursesRes.value as any;
        const data = res?.data;
        if (data) {
          const items = Array.isArray(data) ? data : data.items || [];
          setCourses(items);
        }
      }
    } catch {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // Extract stats from overview data
  const totalUsers = overview?.users?.total || 0;
  const activeUsers = overview?.users?.active || 0;
  const totalClasses = overview?.classes?.total || 0;
  const totalCourses = overview?.courses?.total || 0;
  const totalAssignments = overview?.assignments?.total || 0;
  const totalResources = overview?.resources?.total || 0;
  const totalFeedbacks = overview?.feedbacks?.total || 0;
  const pendingFeedbacks = overview?.feedbacks?.pending || 0;

  // Get teacher and student counts from role distribution
  const roleDistribution = overview?.users?.roleDistribution || [];
  const teacherCount = roleDistribution.find((r: any) => r.roleCode === 'TEACHER')?.count || 0;
  const studentCount = roleDistribution.find((r: any) => r.roleCode === 'STUDENT')?.count || 0;
  const parentCount = roleDistribution.find((r: any) => r.roleCode === 'PARENT')?.count || 0;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="管理后台" subtitle={`欢迎回来，${user?.name || user?.realName || '管理员'}`} />

      {/* 主要统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={6}>
          <Card bordered={false}>
            <Statistic title="用户总数" value={totalUsers} prefix={<TeamOutlined style={{ color: '#1677ff' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card bordered={false}>
            <Statistic title="学生人数" value={studentCount} prefix={<UserOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card bordered={false}>
            <Statistic title="教师人数" value={teacherCount} prefix={<UserOutlined style={{ color: '#722ed1' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card bordered={false}>
            <Statistic title="班级数量" value={totalClasses} prefix={<ApartmentOutlined style={{ color: '#fa8c16' }} />} />
          </Card>
        </Col>
      </Row>

      {/* 次要统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={6}>
          <Card bordered={false}>
            <Statistic title="课程数量" value={totalCourses} prefix={<BookOutlined style={{ color: '#13c2c2' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card bordered={false}>
            <Statistic title="作业数量" value={totalAssignments} prefix={<FileTextOutlined style={{ color: '#eb2f96' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card bordered={false}>
            <Statistic title="教学资源" value={totalResources} prefix={<FileTextOutlined style={{ color: '#1890ff' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card bordered={false}>
            <Statistic
              title="待处理反馈"
              value={pendingFeedbacks}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              suffix={<span style={{ fontSize: 14, color: '#999' }}>/ {totalFeedbacks}</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* 课程列表 */}
      <Card title="近期课程" bordered={false}>
        <Table
          dataSource={courses}
          columns={courseColumns}
          rowKey="id"
          pagination={false}
          size="middle"
          locale={{ emptyText: '暂无课程数据' }}
        />
      </Card>
    </div>
  );
};

export default AdminDashboard;
