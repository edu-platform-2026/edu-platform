import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Tag, List, Avatar, Space, Statistic, Empty, Spin } from 'antd';
import {
  BookOutlined, FileTextOutlined, TrophyOutlined, CalendarOutlined,
  ClockCircleOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { formatTime } from '../../utils/date';

const { Text, Title } = Typography;

interface ChildInfo {
  id: string;
  name: string;
  grade: string;
  className: string;
}

interface TodayCourse {
  id: string;
  name: string;
  time: string;
  room: string;
  teacher: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

interface RecentAssignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
}

const ParentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);

  const childInfo: ChildInfo = {
    id: '1',
    name: '小明',
    grade: '高一',
    className: '高一(1)班',
  };

  const todayCourses: TodayCourse[] = [
    { id: '1', name: '高等数学', time: '08:00-09:40', room: 'A201', teacher: '张老师', status: 'completed' },
    { id: '2', name: '英语写作', time: '10:00-11:40', room: 'B305', teacher: '李老师', status: 'ongoing' },
    { id: '3', name: '物理实验', time: '14:00-15:40', room: 'C102', teacher: '王老师', status: 'upcoming' },
    { id: '4', name: '计算机基础', time: '16:00-17:40', room: 'D401', teacher: '赵老师', status: 'upcoming' },
  ];

  const recentAssignments: RecentAssignment[] = [
    { id: '1', title: '高等数学期中测试', course: '高等数学', dueDate: '2024-01-15', status: 'graded', score: 85 },
    { id: '2', title: '英语作文-议论文', course: '英语写作', dueDate: '2024-01-18', status: 'submitted' },
    { id: '3', title: '物理实验报告', course: '物理实验', dueDate: '2024-01-20', status: 'pending' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#52c41a';
      case 'ongoing': return '#1677ff';
      case 'upcoming': return '#999';
      case 'graded': return '#52c41a';
      case 'submitted': return '#1677ff';
      case 'pending': return '#faad14';
      default: return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '已结束';
      case 'ongoing': return '进行中';
      case 'upcoming': return '未开始';
      case 'graded': return '已批改';
      case 'submitted': return '已提交';
      case 'pending': return '待完成';
      default: return status;
    }
  };

  return (
    <div>
      {/* 孩子信息卡片 */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Avatar size={64} style={{ background: '#1677ff', fontSize: 24 }}>
              {childInfo.name.charAt(0)}
            </Avatar>
          </Col>
          <Col flex="1">
            <Title level={4} style={{ marginBottom: 4 }}>{childInfo.name}</Title>
            <Space>
              <Tag color="blue">{childInfo.grade}</Tag>
              <Tag>{childInfo.className}</Tag>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card bordered={false} bodyStyle={{ padding: '16px 12px', textAlign: 'center' }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>今日课程</span>}
              value={todayCourses.length}
              prefix={<BookOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} bodyStyle={{ padding: '16px 12px', textAlign: 'center' }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>待完成作业</span>}
              value={recentAssignments.filter((a) => a.status === 'pending').length}
              prefix={<FileTextOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} bodyStyle={{ padding: '16px 12px', textAlign: 'center' }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>平均分</span>}
              value={85}
              prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 今日课程 */}
      <Card
        title="今日课程"
        bordered={false}
        style={{ marginBottom: 16 }}
        extra={<Tag color="blue">{todayCourses.filter((c) => c.status === 'ongoing').length} 进行中</Tag>}
      >
        <List
          dataSource={todayCourses}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      background: `${getStatusColor(item.status)}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ClockCircleOutlined style={{ fontSize: 20, color: getStatusColor(item.status) }} />
                  </div>
                }
                title={
                  <Space>
                    <Text strong>{item.name}</Text>
                    <Tag color={getStatusColor(item.status)}>{getStatusLabel(item.status)}</Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.room} | {item.teacher}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 最新作业 */}
      <Card title="最新作业" bordered={false}>
        <List
          dataSource={recentAssignments}
          renderItem={(item) => (
            <List.Item
              extra={
                item.status === 'graded' ? (
                  <Text strong style={{ color: '#52c41a' }}>{item.score}分</Text>
                ) : (
                  <Tag color={getStatusColor(item.status)}>{getStatusLabel(item.status)}</Tag>
                )
              }
            >
              <List.Item.Meta
                title={<Text>{item.title}</Text>}
                description={
                  <Space>
                    <Tag color="blue">{item.course}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>截止：{item.dueDate}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default ParentDashboard;
