import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Select, Space, Spin, Table, Progress, Tag, Typography } from 'antd';
import { TeamOutlined, BookOutlined, FileTextOutlined } from '@ant-design/icons';
import { analyticsService } from '../../services/analyticsService';
import PageHeader from '../../components/common/PageHeader';

const { Text } = Typography;

const TeacherAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [studentTrend, setStudentTrend] = useState<any[]>([]);
  const [courseDistribution, setCourseDistribution] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trendRes, distRes] = await Promise.allSettled([
        analyticsService.getStudentTrend(),
        analyticsService.getCourseDistribution(),
      ]);

      if (trendRes.status === 'fulfilled') {
        setStudentTrend(trendRes.value.data || []);
      } else {
        setStudentTrend([
          { date: '2024-01', count: 120 },
          { date: '2024-02', count: 132 },
          { date: '2024-03', count: 145 },
          { date: '2024-04', count: 156 },
          { date: '2024-05', count: 168 },
          { date: '2024-06', count: 175 },
        ]);
      }

      if (distRes.status === 'fulfilled') {
        setCourseDistribution(distRes.value.data || []);
      } else {
        setCourseDistribution([
          { name: '高等数学', value: 42 },
          { name: '英语写作', value: 38 },
          { name: '物理实验', value: 36 },
          { name: '计算机基础', value: 45 },
        ]);
      }
    } catch {
      // use mock data
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = courseDistribution.reduce((sum, d) => sum + d.value, 0);
  const latestStudents = studentTrend.length > 0 ? studentTrend[studentTrend.length - 1].count : 175;

  /* ---- 学生人数趋势 Table ---- */
  const trendColumns = [
    { title: '月份', dataIndex: 'date', key: 'date' },
    {
      title: '学生数',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => <span style={{ fontWeight: 600, color: '#1677ff' }}>{count}</span>,
    },
  ];

  /* ---- 课程学生分布 Table ---- */
  const courseColumns = [
    { title: '课程', dataIndex: 'name', key: 'name' },
    {
      title: '学生数',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => <span style={{ fontWeight: 600 }}>{value}</span>,
    },
    {
      title: '占比',
      dataIndex: 'value',
      key: 'percent',
      render: (value: number) => (
        <Progress
          percent={Math.round((value / totalStudents) * 100)}
          size="small"
          strokeColor="#1677ff"
        />
      ),
    },
  ];

  /* ---- 作业统计 Table ---- */
  const assignmentData = [
    { key: 1, month: '1月', assigned: 5, submitted: 4, graded: 3 },
    { key: 2, month: '2月', assigned: 8, submitted: 7, graded: 6 },
    { key: 3, month: '3月', assigned: 6, submitted: 5, graded: 4 },
    { key: 4, month: '4月', assigned: 9, submitted: 8, graded: 7 },
    { key: 5, month: '5月', assigned: 7, submitted: 6, graded: 5 },
    { key: 6, month: '6月', assigned: 10, submitted: 9, graded: 8 },
  ];

  const assignmentColumns = [
    { title: '月份', dataIndex: 'month', key: 'month' },
    { title: '布置数', dataIndex: 'assigned', key: 'assigned' },
    { title: '提交数', dataIndex: 'submitted', key: 'submitted' },
    { title: '批改数', dataIndex: 'graded', key: 'graded' },
    {
      title: '提交率',
      key: 'submitRate',
      render: (_: unknown, record: any) => (
        <Progress
          percent={Math.round((record.submitted / record.assigned) * 100)}
          size="small"
          strokeColor="#52c41a"
          format={(percent) => `${percent}%`}
        />
      ),
    },
  ];

  /* ---- 课程成绩 Table ---- */
  const scoreData = [
    { key: 1, course: '高等数学', avgScore: 82, maxScore: 98, minScore: 55, passRate: 92 },
    { key: 2, course: '英语写作', avgScore: 75, maxScore: 95, minScore: 48, passRate: 85 },
    { key: 3, course: '物理实验', avgScore: 88, maxScore: 100, minScore: 62, passRate: 96 },
    { key: 4, course: '计算机基础', avgScore: 90, maxScore: 100, minScore: 70, passRate: 98 },
    { key: 5, course: '化学基础', avgScore: 78, maxScore: 96, minScore: 50, passRate: 88 },
  ];

  const scoreColumns = [
    { title: '课程', dataIndex: 'course', key: 'course' },
    {
      title: '平均分',
      dataIndex: 'avgScore',
      key: 'avgScore',
      render: (score: number) => (
        <span style={{ color: score >= 85 ? '#52c41a' : score >= 80 ? '#1677ff' : '#faad14', fontWeight: 600 }}>
          {score}分
        </span>
      ),
    },
    { title: '最高分', dataIndex: 'maxScore', key: 'maxScore' },
    { title: '最低分', dataIndex: 'minScore', key: 'minScore' },
    {
      title: '及格率',
      dataIndex: 'passRate',
      key: 'passRate',
      render: (rate: number) => (
        <Progress
          percent={rate}
          size="small"
          strokeColor={rate >= 95 ? '#52c41a' : rate >= 90 ? '#1677ff' : '#faad14'}
          format={(percent) => `${percent}%`}
        />
      ),
    },
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
      <PageHeader title="教学数据分析" subtitle="查看教学相关统计数据" />

      {/* 总览统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="当前学生数"
              value={latestStudents}
              prefix={<TeamOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="课程总人次"
              value={totalStudents}
              prefix={<BookOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="课程数"
              value={courseDistribution.length}
              prefix={<FileTextOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="学生人数趋势" bordered={false}>
            <Table dataSource={studentTrend} columns={trendColumns} pagination={false} size="middle" />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="课程学生分布" bordered={false}>
            <Table dataSource={courseDistribution} columns={courseColumns} pagination={false} size="middle" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="作业统计" bordered={false}>
            <Table dataSource={assignmentData} columns={assignmentColumns} pagination={false} size="middle" />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="课程成绩统计" bordered={false}>
            <Table dataSource={scoreData} columns={scoreColumns} pagination={false} size="middle" />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherAnalytics;
