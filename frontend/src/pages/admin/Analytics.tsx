import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Select, Space, Spin, Statistic, Table, Progress, Empty, message } from 'antd';
import {
  TeamOutlined, BookOutlined, DollarOutlined,
} from '@ant-design/icons';
import { analyticsService } from '../../services/analyticsService';
import PageHeader from '../../components/common/PageHeader';

const AdminAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(2024);
  const [studentTrend, setStudentTrend] = useState<any[]>([]);
  const [courseDistribution, setCourseDistribution] = useState<any[]>([]);
  const [teacherPerformance, setTeacherPerformance] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [classComparison, setClassComparison] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trendRes, distRes, perfRes, revRes, classRes] = await Promise.allSettled([
        analyticsService.getStudentTrend(),
        analyticsService.getCourseDistribution(),
        analyticsService.getTeacherPerformance(),
        analyticsService.getRevenueTrend({ year }),
        analyticsService.getClassComparison(),
      ]);

      if (trendRes.status === 'fulfilled') {
        setStudentTrend(trendRes.value.data || []);
      } else {
        setStudentTrend([]);
        message.error('获取学员趋势数据失败');
      }

      if (distRes.status === 'fulfilled') {
        setCourseDistribution(distRes.value.data || []);
      } else {
        setCourseDistribution([]);
        message.error('获取课程分布数据失败');
      }

      if (perfRes.status === 'fulfilled') {
        setTeacherPerformance(perfRes.value.data || []);
      } else {
        setTeacherPerformance([]);
        message.error('获取教师绩效数据失败');
      }

      if (revRes.status === 'fulfilled') {
        setRevenueTrend(revRes.value.data || []);
      } else {
        setRevenueTrend([]);
        message.error('获取收入趋势数据失败');
      }

      if (classRes.status === 'fulfilled') {
        setClassComparison(classRes.value.data || []);
      } else {
        setClassComparison([]);
        message.error('获取班级对比数据失败');
      }
    } catch {
      message.error('获取分析数据失败');
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = studentTrend.length > 0 ? studentTrend[studentTrend.length - 1].count : 0;
  const totalCourses = courseDistribution.reduce((sum, d) => sum + d.value, 0);
  const totalRevenue = revenueTrend.reduce((sum, d) => sum + d.amount, 0);

  const trendColumns = [
    { title: '月份', dataIndex: 'date', key: 'date' },
    {
      title: '学员数',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => <span style={{ fontWeight: 600, color: '#1677ff' }}>{count}</span>,
    },
  ];

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
          percent={Math.round((value / totalCourses) * 100)}
          size="small"
          strokeColor="#1677ff"
        />
      ),
    },
  ];

  const teacherColumns = [
    { title: '教师', dataIndex: 'teacherName', key: 'teacherName' },
    { title: '课程数', dataIndex: 'courseCount', key: 'courseCount' },
    { title: '学生数', dataIndex: 'studentCount', key: 'studentCount' },
    {
      title: '平均分',
      dataIndex: 'avgScore',
      key: 'avgScore',
      render: (score: number) => (
        <span style={{ color: score >= 85 ? '#52c41a' : score >= 80 ? '#1677ff' : '#faad14', fontWeight: 600 }}>
          {score}
        </span>
      ),
    },
    { title: '作业数', dataIndex: 'assignmentCount', key: 'assignmentCount' },
  ];

  const revenueColumns = [
    { title: '月份', dataIndex: 'month', key: 'month' },
    {
      title: '收入',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span style={{ fontWeight: 600, color: '#faad14' }}>¥{amount.toLocaleString()}</span>
      ),
    },
  ];

  const classColumns = [
    { title: '班级', dataIndex: 'className', key: 'className' },
    { title: '学生数', dataIndex: 'studentCount', key: 'studentCount' },
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
      <PageHeader
        title="数据分析"
        subtitle="多维度数据统计分析"
        extra={
          <Space>
            <Select value={year} onChange={setYear} style={{ width: 100 }}>
              <Select.Option value={2023}>2023年</Select.Option>
              <Select.Option value={2024}>2024年</Select.Option>
              <Select.Option value={2025}>2025年</Select.Option>
            </Select>
          </Space>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="总学员数"
              value={totalStudents}
              prefix={<TeamOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="课程总人次"
              value={totalCourses}
              prefix={<BookOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="年度总收入"
              value={totalRevenue}
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
              formatter={(value) => `¥${Number(value).toLocaleString()}`}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="学员增长趋势" bordered={false}>
            {studentTrend.length > 0 ? (
              <Table dataSource={studentTrend} columns={trendColumns} pagination={false} size="middle" />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="课程分布" bordered={false}>
            {courseDistribution.length > 0 ? (
              <Table dataSource={courseDistribution} columns={courseColumns} pagination={false} size="middle" />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="教师绩效" bordered={false}>
            {teacherPerformance.length > 0 ? (
              <Table dataSource={teacherPerformance} columns={teacherColumns} pagination={false} size="middle" />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="收入趋势" bordered={false}>
            {revenueTrend.length > 0 ? (
              <Table dataSource={revenueTrend} columns={revenueColumns} pagination={false} size="middle" />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="班级对比" bordered={false}>
            {classComparison.length > 0 ? (
              <Table dataSource={classComparison} columns={classColumns} pagination={false} size="middle" />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="作业统计" bordered={false}>
            <Empty description="暂无数据" />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminAnalytics;
