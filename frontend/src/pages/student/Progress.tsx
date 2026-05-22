import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, Table, Tag, Spin, Empty, message } from 'antd';
import { TrophyOutlined, CheckCircleOutlined, RiseOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { useAuthStore } from '../../stores/authStore';
import { analyticsService } from '../../services/analyticsService';

/* ======================================================
   颜色与等级工具函数
   ====================================================== */
function scoreColor(s: number) {
  if (s >= 90) return '#52c41a';
  if (s >= 80) return '#1677ff';
  if (s >= 70) return '#faad14';
  return '#ff4d4f';
}

function scoreTag(s: number) {
  if (s >= 90) return <Tag color="green">优秀</Tag>;
  if (s >= 80) return <Tag color="blue">良好</Tag>;
  if (s >= 70) return <Tag color="orange">中等</Tag>;
  return <Tag color="red">需努力</Tag>;
}

/* ======================================================
   组件
   ====================================================== */
const StudentProgress: React.FC = () => {
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState<{ key: string; subject: string; score: number }[]>([]);
  const [trend, setTrend] = useState<{ key: string; month: string; avgScore: number; rank?: number }[]>([]);
  const [overallAvg, setOverallAvg] = useState<number>(0);
  const [completionRate, setCompletionRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [progressRes, trendRes] = await Promise.allSettled([
          analyticsService.getStudentProgress(user.id),
          analyticsService.getStudentTrend(),
        ]);

        if (progressRes.status === 'fulfilled') {
          const res = progressRes.value as any;
          const data = res?.data;
          const items = Array.isArray(data) ? data : data?.items || [];
          if (items.length > 0) {
            const mapped = items.map((item: any, idx: number) => ({
              key: String(idx + 1),
              subject: item.courseName || item.subject || '未知科目',
              score: item.avgScore || item.score || 0,
            }));
            setSubjects(mapped);
            const total = mapped.reduce((sum: number, s: any) => sum + s.score, 0);
            setOverallAvg(Math.round((total / mapped.length) * 10) / 10);
          }

          // 从 progress 数据计算完成率
          if (items.length > 0) {
            const totalAssignments = items.reduce((sum: number, item: any) => sum + (item.assignmentCount || 0), 0);
            setCompletionRate(totalAssignments > 0 ? Math.min(100, Math.round((totalAssignments / (items.length * 10)) * 100)) : 0);
          }
        }

        if (trendRes.status === 'fulfilled') {
          const res = trendRes.value as any;
          const data = res?.data;
          const items = Array.isArray(data) ? data : [];
          if (items.length > 0) {
            setTrend(items.map((item: any, idx: number) => ({
              key: String(idx + 1),
              month: item.date || item.month || `第${idx + 1}月`,
              avgScore: item.count || item.avgScore || 0,
              rank: item.rank,
            })));
          }
        }
      } catch (err) {
        message.error('加载学习进度数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const subjectCols = [
    { title: '科目', dataIndex: 'subject', key: 'subject' },
    {
      title: '成绩', dataIndex: 'score', key: 'score', width: 260,
      render: (s: number) => (
        <Progress
          percent={s}
          strokeColor={scoreColor(s)}
          status={s >= 60 ? 'active' as const : 'exception' as const}
          format={(p) => `${p}分`}
        />
      ),
    },
    {
      title: '等级', dataIndex: 'score', key: 'level',
      render: (s: number) => scoreTag(s),
    },
  ];

  const trendCols = [
    { title: '月份', dataIndex: 'month', key: 'month' },
    {
      title: '平均分', dataIndex: 'avgScore', key: 'avgScore',
      render: (s: number) => <span style={{ color: scoreColor(s), fontWeight: 600 }}>{s}分</span>,
    },
    {
      title: '班级排名', dataIndex: 'rank', key: 'rank',
      render: (r: number | undefined) => r !== undefined ? <span style={{ fontWeight: 600 }}>第 {r} 名</span> : '-',
    },
  ];

  const hasData = subjects.length > 0;

  return (
    <Spin spinning={loading}>
      <div>
        <PageHeader title="学习进度" subtitle="查看各科成绩及学习趋势" />
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic title="平均分" value={hasData ? overallAvg : '-'} suffix={hasData ? '分' : ''}
                prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic title="作业完成率" value={hasData ? completionRate : '-'} suffix={hasData ? '%' : ''}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false}>
              <Statistic title="已学科目" value={hasData ? subjects.length : '-'} suffix={hasData ? '科' : ''}
                prefix={<RiseOutlined style={{ color: '#1677ff' }} />}
                valueStyle={{ color: '#1677ff' }} />
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="各科成绩" bordered={false}>
              {hasData ? (
                <Table dataSource={subjects} columns={subjectCols} pagination={false} size="small" />
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="成绩趋势" bordered={false}>
              {trend.length > 0 ? (
                <Table dataSource={trend} columns={trendCols} pagination={false} size="small" />
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
};

export default StudentProgress;
