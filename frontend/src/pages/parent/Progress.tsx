import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Progress, List, Tag, Space, Spin, Statistic, Table } from 'antd';
import {
  BookOutlined, TrophyOutlined, RiseOutlined, FallOutlined,
} from '@ant-design/icons';
import { analyticsService } from '../../services/analyticsService';
import PageHeader from '../../components/common/PageHeader';

const { Text } = Typography;

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
      setCourseProgress((response.data || []).map((item: any) => ({ ...item, trend: item.trend || 'stable' })));
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

  /* ---- 成绩趋势 Table ---- */
  const scoreTrendData = [
    { key: 1, test: '第1次', math: 72, english: 68, physics: 80, cs: 85 },
    { key: 2, test: '第2次', math: 75, english: 70, physics: 82, cs: 88 },
    { key: 3, test: '第3次', math: 78, english: 72, physics: 85, cs: 90 },
    { key: 4, test: '第4次', math: 80, english: 75, physics: 88, cs: 92 },
    { key: 5, test: '第5次', math: 82, english: 78, physics: 86, cs: 91 },
    { key: 6, test: '第6次', math: 85, english: 76, physics: 90, cs: 95 },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#1677ff';
    if (score >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const trendColumns = [
    { title: '考试', dataIndex: 'test', key: 'test' },
    {
      title: '高等数学',
      dataIndex: 'math',
      key: 'math',
      render: (score: number) => <span style={{ color: getScoreColor(score), fontWeight: 600 }}>{score}</span>,
    },
    {
      title: '英语写作',
      dataIndex: 'english',
      key: 'english',
      render: (score: number) => <span style={{ color: getScoreColor(score), fontWeight: 600 }}>{score}</span>,
    },
    {
      title: '物理实验',
      dataIndex: 'physics',
      key: 'physics',
      render: (score: number) => <span style={{ color: getScoreColor(score), fontWeight: 600 }}>{score}</span>,
    },
    {
      title: '计算机基础',
      dataIndex: 'cs',
      key: 'cs',
      render: (score: number) => <span style={{ color: getScoreColor(score), fontWeight: 600 }}>{score}</span>,
    },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <RiseOutlined style={{ color: '#52c41a' }} />;
      case 'down': return <FallOutlined style={{ color: '#ff4d4f' }} />;
      default: return <span style={{ color: '#999' }}>-</span>;
    }
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
        <Table
          dataSource={scoreTrendData}
          columns={trendColumns}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default ParentProgress;
