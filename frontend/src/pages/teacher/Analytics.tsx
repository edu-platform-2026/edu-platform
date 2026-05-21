import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Select, Space, Spin } from 'antd';
import ReactECharts from 'echarts-for-react';
import { analyticsService } from '../../services/analyticsService';
import PageHeader from '../../components/common/PageHeader';

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

  const trendOption = {
    tooltip: {
      trigger: 'axis' as const,
    },
    xAxis: {
      type: 'category' as const,
      data: studentTrend.map((d) => d.date),
    },
    yAxis: {
      type: 'value' as const,
      name: '学生数',
    },
    series: [
      {
        name: '学生数',
        type: 'line',
        data: studentTrend.map((d) => d.count),
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
            ],
          },
        },
        itemStyle: {
          color: '#1677ff',
        },
      },
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
  };

  const pieOption = {
    tooltip: {
      trigger: 'item' as const,
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical' as const,
      left: 'left' as const,
    },
    series: [
      {
        name: '课程分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center' as const,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold' as const,
          },
        },
        labelLine: {
          show: false,
        },
        data: courseDistribution.map((d) => ({
          name: d.name,
          value: d.value,
        })),
      },
    ],
  };

  const assignmentOption = {
    tooltip: {
      trigger: 'axis' as const,
    },
    legend: {
      data: ['布置数', '提交数', '批改数'],
    },
    xAxis: {
      type: 'category' as const,
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: {
      type: 'value' as const,
    },
    series: [
      {
        name: '布置数',
        type: 'bar',
        data: [5, 8, 6, 9, 7, 10],
        itemStyle: { color: '#1677ff' },
      },
      {
        name: '提交数',
        type: 'bar',
        data: [4, 7, 5, 8, 6, 9],
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '批改数',
        type: 'bar',
        data: [3, 6, 4, 7, 5, 8],
        itemStyle: { color: '#faad14' },
      },
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
  };

  const scoreOption = {
    tooltip: {
      trigger: 'axis' as const,
    },
    radar: {
      indicator: [
        { name: '高等数学', max: 100 },
        { name: '英语写作', max: 100 },
        { name: '物理实验', max: 100 },
        { name: '计算机基础', max: 100 },
        { name: '化学基础', max: 100 },
      ],
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [82, 75, 88, 90, 78],
            name: '平均分',
            areaStyle: {
              color: 'rgba(22, 119, 255, 0.2)',
            },
            lineStyle: {
              color: '#1677ff',
            },
          },
        ],
      },
    ],
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
      <PageHeader title="教学数据分析" subtitle="查看教学相关统计数据" />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="学生人数趋势" bordered={false}>
            <ReactECharts option={trendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="课程学生分布" bordered={false}>
            <ReactECharts option={pieOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="作业统计" bordered={false}>
            <ReactECharts option={assignmentOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="课程成绩雷达图" bordered={false}>
            <ReactECharts option={scoreOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherAnalytics;
