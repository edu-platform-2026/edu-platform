import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Typography, Spin, Empty, message } from 'antd';
import {
  BookOutlined, FileTextOutlined, TrophyOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { useAuthStore } from '../../stores/authStore';
import { courseService } from '../../services/courseService';
import { assignmentService } from '../../services/assignmentService';
import { analyticsService } from '../../services/analyticsService';
import { Schedule } from '../../types/course';
import { AssignmentSubmission, SubmissionStatus } from '../../types/assignment';

const { Text } = Typography;

/* ======================================================
   状态标签颜色映射
   ====================================================== */
const statusColorMap: Record<string, string> = {
  'SUBMITTED': 'blue',
  'PENDING': 'warning',
  'GRADED': 'green',
  'RETURNED': 'green',
};

const statusTextMap: Record<string, string> = {
  'SUBMITTED': '已提交',
  'PENDING': '待提交',
  'GRADED': '已批改',
  'RETURNED': '已批改',
};

/* ======================================================
   星期映射
   ====================================================== */
const dayOfWeekMap: Record<number, string> = {
  1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 7: '周日',
};

/* ======================================================
   组件
   ====================================================== */
const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [avgScore, setAvgScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [schedulesRes, submissionsRes, progressRes] = await Promise.allSettled([
          courseService.getMySchedules(),
          assignmentService.getMySubmissions(),
          user?.id ? analyticsService.getStudentProgress(user.id) : Promise.reject(),
        ]);

        if (schedulesRes.status === 'fulfilled') {
          const res = schedulesRes.value as any;
          const data = res?.data;
          setSchedules(Array.isArray(data) ? data : data?.items || []);
        }

        if (submissionsRes.status === 'fulfilled') {
          const res = submissionsRes.value as any;
          const data = res?.data;
          setSubmissions(Array.isArray(data) ? data : data?.items || []);
        }

        if (progressRes.status === 'fulfilled') {
          const res = progressRes.value as any;
          const data = res?.data;
          if (Array.isArray(data) && data.length > 0) {
            const total = data.reduce((sum: number, item: any) => sum + (item.avgScore || 0), 0);
            setAvgScore(Math.round((total / data.length) * 10) / 10);
          }
        }
      } catch (err) {
        message.error('加载仪表盘数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  // 获取今天是星期几
  const today = new Date().getDay() || 7; // 0=周日 -> 7
  const todaySchedules = schedules.filter(s => s.dayOfWeek === today);
  const pendingCount = submissions.filter(s => s.status === SubmissionStatus.PENDING).length;

  const statsCards = [
    {
      title: '今日课程',
      value: todaySchedules.length,
      icon: <BookOutlined style={{ fontSize: 32, color: '#1677ff' }} />,
      color: '#e6f4ff',
      border: '#91caff',
      suffix: '节',
    },
    {
      title: '待完成作业',
      value: pendingCount,
      icon: <FileTextOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      color: '#fffbe6',
      border: '#ffe58f',
      suffix: '项',
    },
    {
      title: '平均成绩',
      value: avgScore,
      icon: <TrophyOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      color: '#f6ffed',
      border: '#b7eb8f',
      suffix: '分',
    },
  ];

  const courseColumns = [
    { title: '课程名称', dataIndex: 'courseName', key: 'courseName' },
    { title: '授课教师', dataIndex: 'teacherName', key: 'teacherName' },
    {
      title: '上课时间', key: 'time',
      render: (_: unknown, record: Schedule) => `${record.startTime || ''} - ${record.endTime || ''}`,
    },
    { title: '教室', dataIndex: 'room', key: 'room' },
    {
      title: '星期', dataIndex: 'dayOfWeek', key: 'dayOfWeek',
      render: (d: number) => dayOfWeekMap[d] || `周${d}`,
    },
  ];

  const recentSubmissions = submissions.slice(0, 5);

  const assignmentColumns = [
    { title: '作业标题', dataIndex: 'assignmentId', key: 'assignmentId' },
    {
      title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt',
      render: (t: string) => t ? new Date(t).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (status: string) => <Tag color={statusColorMap[status] || 'default'}>{statusTextMap[status] || status}</Tag>,
    },
    {
      title: '分数', dataIndex: 'score', key: 'score',
      render: (score: number | undefined) => (score !== undefined && score !== null ? `${score}分` : '-'),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div>
        <PageHeader title={`欢迎回来，${user?.realName || user?.name || '同学'}`} subtitle="今天也要加油学习哦" />

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          {statsCards.map((card, index) => (
            <Col xs={24} sm={8} key={index}>
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
                      {card.value}{card.suffix}
                    </div>
                  </div>
                  <div>{card.icon}</div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 今日课程 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="今日课程" bordered={false}>
              {todaySchedules.length > 0 ? (
                <Table
                  dataSource={todaySchedules}
                  columns={courseColumns}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                />
              ) : (
                <Empty description="今天没有课程安排" />
              )}
            </Card>
          </Col>
        </Row>

        {/* 最新作业 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="最新作业" bordered={false}>
              {recentSubmissions.length > 0 ? (
                <Table
                  dataSource={recentSubmissions}
                  columns={assignmentColumns}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                />
              ) : (
                <Empty description="暂无作业记录" />
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
};

export default StudentDashboard;
