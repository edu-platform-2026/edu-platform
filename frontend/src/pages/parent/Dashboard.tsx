import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Tag, List, Avatar, Space, Statistic, Empty, Spin, Select, Button, message } from 'antd';
import {
  BookOutlined, FileTextOutlined, TrophyOutlined, LinkOutlined,
  ClockCircleOutlined, CheckCircleOutlined, PlusOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { parentService, BoundStudent, StudentAssignment, StudentProgress } from '../../services/parentService';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

const ParentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<BoundStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);

  useEffect(() => { fetchStudents(); }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentData(selectedStudentId);
    }
  }, [selectedStudentId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await parentService.getBoundStudents();
      const data = (res as any)?.data || [];
      setStudents(data);
      if (data.length > 0) {
        setSelectedStudentId(data[0].id);
      }
    } catch {
      // No bound students yet
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentData = async (studentId: string) => {
    try {
      const [assignRes, progressRes] = await Promise.allSettled([
        parentService.getStudentAssignments(studentId),
        parentService.getStudentProgress(studentId),
      ]);
      if (assignRes.status === 'fulfilled') {
        const data = (assignRes.value as any)?.data || [];
        setAssignments(data);
      }
      if (progressRes.status === 'fulfilled') {
        const data = (progressRes.value as any)?.data;
        if (data) setProgress(data);
      }
    } catch {
      // ignore
    }
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" tip="鍔犺浇涓?.." /></div>;
  }

  if (students.length === 0) {
    return (
      <div>
        <Card bordered={false} style={{ marginBottom: 16 }}>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Avatar size={64} icon={<LinkOutlined />} style={{ background: '#1677ff', marginBottom: 16 }} />
            <Title level={4}>娆㈣繋浣跨敤瀹堕暱绔?/Title>
            <Text type="secondary">璇峰厛缁戝畾瀛︾敓璐﹀彿锛屽嵆鍙煡鐪嬪鐢熺殑瀛︿範鏁版嵁</Text>
            <div style={{ marginTop: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/parent/bind-student')}>
                缁戝畾瀛︾敓璐﹀彿
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const pendingAssignments = assignments.filter(a => !a.submission || a.submission.status === 0);
  const gradedAssignments = assignments.filter(a => a.submission?.status === 2);
  const avgScore = progress?.averageScore || 0;

  return (
    <div>
      {/* Student selector */}
      {students.length > 1 && (
        <Card bordered={false} style={{ marginBottom: 12 }}>
          <Space>
            <Text>閫夋嫨瀛╁瓙锛?/Text>
            <Select value={selectedStudentId} onChange={setSelectedStudentId} style={{ width: 200 }}>
              {students.map(s => (
                <Select.Option key={s.id} value={s.id}>{s.realName || s.username}</Select.Option>
              ))}
            </Select>
          </Space>
        </Card>
      )}

      {/* Child info */}
      {selectedStudent && (
        <Card bordered={false} style={{ marginBottom: 12 }}>
          <Row gutter={16} align="middle">
            <Col>
              <Avatar size={48} style={{ background: '#1677ff', fontSize: 20 }}>
                {(selectedStudent.realName || selectedStudent.username || '?').charAt(0)}
              </Avatar>
            </Col>
            <Col flex="1">
              <Title level={5} style={{ marginBottom: 4 }}>{selectedStudent.realName || selectedStudent.username}</Title>
              <Space>
                {selectedStudent.classes?.map(c => (
                  <Tag key={c.id} color="blue">{c.name}</Tag>
                ))}
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col span={8}>
          <Card bordered={false} bodyStyle={{ padding: 12, textAlign: 'center' }}>
            <Statistic title={<span style={{ fontSize: 11 }}>寰呭畬鎴愪綔涓?/span>} value={pendingAssignments.length}
              prefix={<FileTextOutlined style={{ color: '#faad14' }} />} valueStyle={{ fontSize: 22 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} bodyStyle={{ padding: 12, textAlign: 'center' }}>
            <Statistic title={<span style={{ fontSize: 11 }}>骞冲潎鍒?/span>} value={avgScore}
              prefix={<TrophyOutlined style={{ color: avgScore >= 60 ? '#52c41a' : '#ff4d4f' }} />}
              suffix="鍒? valueStyle={{ fontSize: 22 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} bodyStyle={{ padding: 12, textAlign: 'center' }}>
            <Statistic title={<span style={{ fontSize: 11 }}>宸叉壒鏀?/span>} value={gradedAssignments.length}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} valueStyle={{ fontSize: 22 }} />
          </Card>
        </Col>
      </Row>

      {/* Course stats */}
      {progress?.courseStats && progress.courseStats.length > 0 && (
        <Card title="鍚勭鎴愮哗" bordered={false} style={{ marginBottom: 12 }}>
          <List
            dataSource={progress.courseStats}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar style={{ background: '#1677ff' }}>{item.courseName.charAt(0)}</Avatar>}
                  title={item.courseName}
                  description={`宸叉壒鏀?${item.count} 娆}
                />
                <Text strong style={{ color: item.avgScore >= 60 ? '#52c41a' : '#ff4d4f', fontSize: 18 }}>
                  {item.avgScore}鍒?                </Text>
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Recent assignments */}
      <Card title="鏈€杩戜綔涓? bordered={false}>
        {assignments.length > 0 ? (
          <List
            dataSource={assignments.slice(0, 10)}
            renderItem={item => {
              const sub = item.submission;
              const statusTag = !sub ? <Tag color="warning">寰呮彁浜?/Tag>
                : sub.status === 2 ? <Tag color="green">{Number(sub.score)}鍒?/Tag>
                : <Tag color="blue">宸叉彁浜?/Tag>;
              return (
                <List.Item extra={statusTag}>
                  <List.Item.Meta
                    title={item.title}
                    description={
                      <Space>
                        <Tag color="blue">{item.courseName}</Tag>
                        {item.dueDate && <Text type="secondary" style={{ fontSize: 12 }}>鎴锛歿new Date(item.dueDate).toLocaleDateString('zh-CN')}</Text>}
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty description="鏆傛棤浣滀笟" />
        )}
      </Card>
    </div>
  );
};

export default ParentDashboard;