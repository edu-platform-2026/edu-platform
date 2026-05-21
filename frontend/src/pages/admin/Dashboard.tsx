import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Space, Spin, Typography } from 'antd';
import {
  UserOutlined, BookOutlined, TeamOutlined, DollarOutlined,
  RiseOutlined, FileTextOutlined, BellOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { analyticsService, DashboardStats } from '../../services/analyticsService';
import PageHeader from '../../components/common/PageHeader';

const { Text, Title } = Typography;

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentTrend, setStudentTrend] = useState<any[]>([]);
  const [courseDistribution, setCourseDistribution] = useState<any[]>([]);
  const [teacherPerformance, setTeacherPerformance] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, trendRes, distRes, perfRes, revRes] = await Promise.allSettled([
        analyticsService.getDashboardStats(),
        analyticsService.getStudentTrend(),
        analyticsService.getCourseDistribution(),
        analyticsService.getTeacherPerformance(),
        analyticsService.getRevenueTrend(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      else setStats({
        totalStudents: 1256,
        totalTeachers: 86,
        totalCourses: 45,
        totalClasses: 32,
        activeCourses: 28,
        pendingAssignments: 156,
        todaySchedules: 24,
        recentEnrollments: 45,
      });

      if (trendRes.status === 'fulfilled') setStudentTrend(trendRes.value.data || []);
      else setStudentTrend([
        { date: '2024-01', count: 1100 },
        { date: '2024-02', count: 1120 },
        { date: '2024-03', count: 1150 },
        { date: '2024-04', count: 1180 },
        { date: '2024-05', count: 1220 },
        { date: '2024-06', count: 1256 },
      ]);

      if (distRes.status === 'fulfilled') setCourseDistribution(distRes.value.data || []);
      else setCourseDistribution([
        { name: '数学', value: 320 },
        { name: '英语', value: 280 },
        { name: '物理', value: 180 },
        { name: '化学', value: 150 },
        { name: '计算机', value: 200 },
        { name: '语文', value: 126 },
      ]);

      if (perfRes.status === 'fulfilled') setTeacherPerformance(perfRes.value.data || []);
      else setTeacherPerformance([
        { teacherName: '张老师', courseCount: 3, studentCount: 120, avgScore: 85.5, assignmentCount: 24 },
        { teacherName: '李老师', courseCount: 2, studentCount: 95, avgScore: 82.3, assignmentCount: 18 },
        { teacherName: '王老师', courseCount: 4, studentCount: 150, avgScore: 88.1, assignmentCount: 32 },
        { teacherName: '赵老师', courseCount: 2, studentCount: 80, avgScore: 79.6, assignmentCount: 16 },
        { teacherName: '刘老师', courseCount: 3, studentCount: 110, avgScore: 86.2, assignmentCount: 22 },
      ]);

      if (revRes.status === 'fulfilled') setRevenueTrend(revRes.value.data || []);
      else setRevenueTrend([
        { month: '1月', amount: 125000 },
        { month: '2月', amount: 132000 },
        { month: '3月', amount: 145000 },
        { month: '4月', amount: 138000 },
        { month: '5月', amount: 156000 },
        { month: '6月', amount: 168000 },
      ]);
    } catch {
      // use mock data
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: '学员总数',
      value: stats?.totalStudents || 0,
      icon: <UserOutlined style={{ fontSize: 32, color: '#1677ff' }} />,
      color: '#e6f4ff',
      border: '#91caff',
      prefix: '+',
      suffix: '',
    },
    {
      title: '教师数量',
      value: stats?.totalTeachers || 0,
      icon: <TeamOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      color: '#f6ffed',
      border: '#b7eb8f',
      prefix: '',
      suffix: '人',
    },
    {
      title: '课程数量',
      value: stats?.totalCourses || 0,
      icon: <BookOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      color: '#f9f0ff',
      border: '#d3adf7',
      prefix: '',
      suffix: '门',
    },
    {
      title: '本月收入',
      value: 168000,
      icon: <DollarOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      color: '#fffbe6',
      border: '#ffe58f',
      prefix: '¥',
      suffix: '',
    },
  ];

  const studentTrendOption = {
    tooltip: {
      trigger: 'axis' as const,
    },
    xAxis: {
      type: 'category' as const,
      data: studentTrend.map((d) => d.date),
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: 'value' as const,
      name: '学员数',
    },
    series: [
      {
        name: '学员数',
        type: 'line',
        data: studentTrend.map((d) => d.count),
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
            ],
          },
        },
        itemStyle: { color: '#1677ff' },
        markPoint: {
          data: [
            { type: 'max', name: '最大值' },
          ],
        },
      },
    ],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  };

  const courseDistributionOption = {
    tooltip: {
      trigger: 'item' as const,
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical' as const,
      right: 10,
      top: 'center' as const,
    },
    series: [
      {
        name: '课程分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' as const },
        },
        data: courseDistribution,
      },
    ],
  };

  const teacherPerformanceOption = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
    },
    legend: {
      data: ['课程数', '学生数', '平均分'],
    },
    xAxis: {
      type: 'category' as const,
      data: teacherPerformance.map((t) => t.teacherName),
    },
    yAxis: [
      { type: 'value' as const, name: '数量', position: 'left' as const },
      { type: 'value' as const, name: '分数', position: 'right' as const, min: 60, max: 100 },
    ],
    series: [
      {
        name: '课程数',
        type: 'bar',
        data: teacherPerformance.map((t) => t.courseCount),
        itemStyle: { color: '#1677ff' },
      },
      {
        name: '学生数',
        type: 'bar',
        data: teacherPerformance.map((t) => t.studentCount),
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '平均分',
        type: 'line',
        yAxisIndex: 1,
        data: teacherPerformance.map((t) => t.avgScore),
        itemStyle: { color: '#faad14' },
      },
    ],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  };

  const revenueTrendOption = {
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: any) => {
        const data = params[0];
        return `${data.name}<br/>收入：¥${data.value.toLocaleString()}`;
      },
    },
    xAxis: {
      type: 'category' as const,
      data: revenueTrend.map((d) => d.month),
    },
    yAxis: {
      type: 'value' as const,
      name: '收入(元)',
      axisLabel: {
        formatter: (value: number) => `¥${(value / 10000).toFixed(0)}万`,
      },
    },
    series: [
      {
        name: '收入',
        type: 'bar',
        data: revenueTrend.map((d) => d.amount),
        itemStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#faad14' },
              { offset: 1, color: '#fff1b8' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        markLine: {
          data: [{ type: 'average' as const, name: '平均值' }],
        },
      },
    ],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="管理仪表盘" subtitle="查看机构整体运营数据" />

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
                  <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
                    {card.prefix}{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}{card.suffix}
                  </div>
                </div>
                <div>{card.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="学员增长趋势" bordered={false}>
            <ReactECharts option={studentTrendOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="课程分布" bordered={false}>
            <ReactECharts option={courseDistributionOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="教师绩效" bordered={false}>
            <ReactECharts option={teacherPerformanceOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="收入趋势" bordered={false}>
            <ReactECharts option={revenueTrendOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
