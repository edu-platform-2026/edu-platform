import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Progress, List, Tag, Space, Spin, Statistic } from 'antd';
import {
  BookOutlined, TrophyOutlined, RiseOutlined, FallOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { analyticsService } from '../../services/analyticsService';
import PageHeader from '../../components/common/PageHeader';

const { Text, Title } = Typography;

interface CourseProgress {
  courseName: string;
  progress: number;
  avgScore: number;
  assignmentCount: number;
  trend: 'up' | 'down' | 'stable';
}

const ParentProgress: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await analyticsService.getStudentProgress('1');
      setCourseProgress(response.data || []);
    } catch {
      setCourseProgress([
        { courseName: '高等数学', progress: 75, avgScore: 82, assignmentCount: 8, trend: 'up' },
        { courseName: '英语写作', progress: 60, avgScore: 78, assignmentCount: 6, trend: 'stable' },
        { courseName: '物理实验', progress: 85, avgScore: 88, assignmentCount: 5, trend: 'up' },
        { courseName: '计算机基础', progress: 90, avgScore: 92, assignmentCount: 7, trend: 'up' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const scoreTrendOption = {
    tooltip: {
      trigger: 'axis' as const,
    },
    legend: {
      data: ['高等数学', '英语写作', '物理实验', '计算机基础'],
    },
    xAxis: {
      type: 'category' as const,
      data: ['第1次', '第2次', '第3次', '第4次', '第5次', '第6次'],
    },
    yAxis: {
      type: 'value' as const,
      min: 50,
      max: 100,
      name: '分数',
    },
    series: [
      {
        name: '高等数学',
        type: 'line',
        data: [72, 75, 78, 80, 82, 85],
        smooth: true,
      },
      {
        name: '英语写作',
        type: 'line',
        data: [68, 70, 72, 75, 78, 76],
        smooth: true,
      },
      {
        name: '物理实验',
        type: 'line',
        data: [80, 82, 85, 88, 86, 90],
        smooth: true,
      },
      {
        name: '计算机基础',
        type: 'line',
        data: [85, 88, 90, 92, 91, 95],
        smooth: true,
      },
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <RiseOutlined style={{ color: '#52c41a' }} />;
      case 'down': return <FallOutlined style={{ color: '#ff4d4f' }} />;
      default: return <span style={{ color: '#999' }}>-</span>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#1677ff';
    if (score >= 70) return '#faad14';
    return '#ff4d4f';
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
      <PageHeader title="学习进度" subtitle="查看孩子的学习情况" />

      {/* 总体统计 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card bordered={false} bodyStyle={{ padding: '16px 12px', textAlign: 'center' }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>平均分</span>}
              value={85}
              prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ fontSize: 24, color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} bodyStyle={{ padding: '16px 12px', textAlign: 'center' }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>课程数</span>}
              value={courseProgress.length}
              prefix={<BookOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} bodyStyle={{ padding: '16px 12px', textAlign: 'center' }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>作业完成</span>}
              value={26}
              suffix="/ 30"
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 课程进度 */}
      <Card title="各科进度" bordered={false} style={{ marginBottom: 16 }}>
        <List
          dataSource={courseProgress}
          renderItem={(item) => (
            <List.Item>
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Space>
                    <Text strong>{item.courseName}</Text>
                    {getTrendIcon(item.trend)}
                  </Space>
                  <Space>
                    <Tag color={getScoreColor(item.avgScore)}>{item.avgScore}分</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.assignmentCount}次作业</Text>
                  </Space>
                </div>
                <Progress
                  percent={item.progress}
                  strokeColor={getScoreColor(item.avgScore)}
                  format={(percent) => `${percent}%`}
                />
              </div>
            </List.Item>
          )}
        />
      </Card>

      {/* 成绩趋势 */}
      <Card title="成绩趋势" bordered={false}>
        <ReactECharts option={scoreTrendOption} style={{ height: 300 }} />
      </Card>
    </div>
  );
};

export default ParentProgress;
