import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Select, Space, Spin, Statistic } from 'antd';
import ReactECharts from 'echarts-for-react';
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

      setStudentTrend(trendRes.status === 'fulfilled' ? trendRes.value.data || [] : [
        { date: '2024-01', count: 1100 }, { date: '2024-02', count: 1120 },
        { date: '2024-03', count: 1150 }, { date: '2024-04', count: 1180 },
        { date: '2024-05', count: 1220 }, { date: '2024-06', count: 1256 },
      ]);

      setCourseDistribution(distRes.status === 'fulfilled' ? distRes.value.data || [] : [
        { name: '数学', value: 320 }, { name: '英语', value: 280 },
        { name: '物理', value: 180 }, { name: '化学', value: 150 },
        { name: '计算机', value: 200 }, { name: '语文', value: 126 },
      ]);

      setTeacherPerformance(perfRes.status === 'fulfilled' ? perfRes.value.data || [] : [
        { teacherName: '张老师', courseCount: 3, studentCount: 120, avgScore: 85.5, assignmentCount: 24 },
        { teacherName: '李老师', courseCount: 2, studentCount: 95, avgScore: 82.3, assignmentCount: 18 },
        { teacherName: '王老师', courseCount: 4, studentCount: 150, avgScore: 88.1, assignmentCount: 32 },
        { teacherName: '赵老师', courseCount: 2, studentCount: 80, avgScore: 79.6, assignmentCount: 16 },
        { teacherName: '刘老师', courseCount: 3, studentCount: 110, avgScore: 86.2, assignmentCount: 22 },
      ]);

      setRevenueTrend(revRes.status === 'fulfilled' ? revRes.value.data || [] : [
        { month: '1月', amount: 125000 }, { month: '2月', amount: 132000 },
        { month: '3月', amount: 145000 }, { month: '4月', amount: 138000 },
        { month: '5月', amount: 156000 }, { month: '6月', amount: 168000 },
      ]);

      setClassComparison(classRes.status === 'fulfilled' ? classRes.value.data || [] : [
        { className: '高一(1)班', studentCount: 42, avgScore: 82, passRate: 92 },
        { className: '高一(2)班', studentCount: 38, avgScore: 78, passRate: 88 },
        { className: '高二(1)班', studentCount: 45, avgScore: 85, passRate: 95 },
        { className: '高二(2)班', studentCount: 40, avgScore: 80, passRate: 90 },
        { className: '高三(1)班', studentCount: 48, avgScore: 88, passRate: 96 },
      ]);
    } catch {
      // use mock data
    } finally {
      setLoading(false);
    }
  };

  const studentTrendOption = {
    tooltip: { trigger: 'axis' as const },
    xAxis: {
      type: 'category' as const,
      data: studentTrend.map((d) => d.date),
      axisLabel: { rotate: 30 },
    },
    yAxis: { type: 'value' as const, name: '学员数' },
    series: [{
      name: '学员数',
      type: 'line',
      data: studentTrend.map((d) => d.count),
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
            { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
          ],
        },
      },
      itemStyle: { color: '#1677ff' },
    }],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  };

  const courseDistributionOption = {
    tooltip: { trigger: 'item' as const, formatter: '{a} <br/>{b}: {c} ({d}%)' },
    legend: { orient: 'vertical' as const, right: 10, top: 'center' as const },
    series: [{
      name: '课程分布',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' as const } },
      data: courseDistribution,
    }],
  };

  const teacherPerformanceOption = {
    tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
    legend: { data: ['课程数', '学生数', '平均分'] },
    xAxis: {
      type: 'category' as const,
      data: teacherPerformance.map((t) => t.teacherName),
    },
    yAxis: [
      { type: 'value' as const, name: '数量', position: 'left' as const },
      { type: 'value' as const, name: '分数', position: 'right' as const, min: 60, max: 100 },
    ],
    series: [
      { name: '课程数', type: 'bar', data: teacherPerformance.map((t) => t.courseCount), itemStyle: { color: '#1677ff' } },
      { name: '学生数', type: 'bar', data: teacherPerformance.map((t) => t.studentCount), itemStyle: { color: '#52c41a' } },
      { name: '平均分', type: 'line', yAxisIndex: 1, data: teacherPerformance.map((t) => t.avgScore), itemStyle: { color: '#faad14' } },
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
    xAxis: { type: 'category' as const, data: revenueTrend.map((d) => d.month) },
    yAxis: {
      type: 'value' as const,
      name: '收入(元)',
      axisLabel: { formatter: (value: number) => `¥${(value / 10000).toFixed(0)}万` },
    },
    series: [{
      name: '收入',
      type: 'bar',
      data: revenueTrend.map((d) => d.amount),
      itemStyle: {
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#faad14' },
            { offset: 1, color: '#fff1b8' },
          ],
        },
        borderRadius: [4, 4, 0, 0],
      },
      markLine: { data: [{ type: 'average' as const, name: '平均值' }] },
    }],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  };

  const classComparisonOption = {
    tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
    legend: { data: ['学生数', '平均分', '及格率'] },
    xAxis: {
      type: 'category' as const,
      data: classComparison.map((c) => c.className),
      axisLabel: { rotate: 15 },
    },
    yAxis: [
      { type: 'value' as const, name: '人数', position: 'left' as const },
      { type: 'value' as const, name: '分数/百分比', position: 'right' as const, min: 0, max: 100 },
    ],
    series: [
      { name: '学生数', type: 'bar', data: classComparison.map((c) => c.studentCount), itemStyle: { color: '#1677ff' } },
      { name: '平均分', type: 'line', yAxisIndex: 1, data: classComparison.map((c) => c.avgScore), itemStyle: { color: '#52c41a' } },
      { name: '及格率', type: 'line', yAxisIndex: 1, data: classComparison.map((c) => c.passRate), itemStyle: { color: '#faad14' } },
    ],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  };

  const assignmentOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['布置数', '提交数', '批改数'] },
    xAxis: { type: 'category' as const, data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value' as const },
    series: [
      { name: '布置数', type: 'bar', data: [45, 52, 48, 56, 50, 58], itemStyle: { color: '#1677ff' } },
      { name: '提交数', type: 'bar', data: [42, 48, 45, 52, 47, 55], itemStyle: { color: '#52c41a' } },
      { name: '批改数', type: 'bar', data: [40, 46, 43, 50, 45, 53], itemStyle: { color: '#faad14' } },
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

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="学员增长趋势" bordered={false}>
            <ReactECharts option={studentTrendOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="课程分布" bordered={false}>
            <ReactECharts option={courseDistributionOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="教师绩效" bordered={false}>
            <ReactECharts option={teacherPerformanceOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="收入趋势" bordered={false}>
            <ReactECharts option={revenueTrendOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="班级对比" bordered={false}>
            <ReactECharts option={classComparisonOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="作业统计" bordered={false}>
            <ReactECharts option={assignmentOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminAnalytics;
