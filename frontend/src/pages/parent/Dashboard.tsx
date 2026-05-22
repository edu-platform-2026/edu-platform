import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Tag, List, Avatar, Space, Statistic, Empty, Spin, Select, Button } from 'antd';
import { FileTextOutlined, TrophyOutlined, LinkOutlined, CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { parentService, BoundStudent, StudentAssignment, StudentProgress } from '../../services/parentService';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

const ParentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<BoundStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);

  useEffect(() => { fetchStudents(); }, []);
  useEffect(() => { if (selectedStudentId) fetchStudentData(selectedStudentId); }, [selectedStudentId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await parentService.getBoundStudents();
      const data = (res as any)?.data || [];
      setStudents(data);
      if (data.length > 0) setSelectedStudentId(data[0].id);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const fetchStudentData = async (studentId: string) => {
    try {
      const [assignRes, progressRes] = await Promise.allSettled([
        parentService.getStudentAssignments(studentId),
        parentService.getStudentProgress(studentId),
      ]);
      if (assignRes.status === 'fulfilled') setAssignments((assignRes.value as any)?.data || []);
      if (progressRes.status === 'fulfilled') { const d = (progressRes.value as any)?.data; if (d) setProgress(d); }
    } catch { /* ignore */ }
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" tip="Loading..." /></div>;

  if (students.length === 0) {
    return (
      <Card bordered={false}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Avatar size={64} icon={<LinkOutlined />} style={{ background: '#1677ff', marginBottom: 16 }} />
          <Title level={4}>Welcome to Parent Portal</Title>
          <Text type="secondary">Please bind a student account first to view learning data</Text>
          <div style={{ marginTop: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/parent/bind-student')}>Bind Student</Button>
          </div>
        </div>
      </Card>
    );
  }

  const pendingAssignments = assignments.filter(a => !a.submission || a.submission.status === 0);
  const gradedAssignments = assignments.filter(a => a.submission?.status === 2);
  const avgScore = progress?.averageScore || 0;

  return (
    <div>
      {students.length > 1 && (
        <Card bordered={false} style={{ marginBottom: 12 }}>
          <Space><Text>Select child:</Text>
            <Select value={selectedStudentId} onChange={setSelectedStudentId} style={{ width: 200 }}>
              {students.map(s => <Select.Option key={s.id} value={s.id}>{s.realName || s.username}</Select.Option>)}
            </Select>
          </Space>
        </Card>
      )}
      {selectedStudent && (
        <Card bordered={false} style={{ marginBottom: 12 }}>
          <Row gutter={16} align="middle">
            <Col><Avatar size={48} style={{ background: '#1677ff', fontSize: 20 }}>{(selectedStudent.realName || selectedStudent.username || '?').charAt(0)}</Avatar></Col>
            <Col flex="1">
              <Title level={5} style={{ marginBottom: 4 }}>{selectedStudent.realName || selectedStudent.username}</Title>
              <Space>{selectedStudent.classes?.map(c => <Tag key={c.id} color="blue">{c.name}</Tag>)}</Space>
            </Col>
          </Row>
        </Card>
      )}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col span={8}>
          <Card bordered={false} bodyStyle={{ padding: 12, textAlign: 'center' }}>
            <Statistic title={<span style={{ fontSize: 11 }}>Pending</span>} value={pendingAssignments.length}
              prefix={<FileTextOutlined style={{ color: '#faad14' }} />} valueStyle={{ fontSize: 22 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} bodyStyle={{ padding: 12, textAlign: 'center' }}>
            <Statistic title={<span style={{ fontSize: 11 }}>Avg Score</span>} value={avgScore}
              prefix={<TrophyOutlined style={{ color: avgScore >= 60 ? '#52c41a' : '#ff4d4f' }} />}
              suffix="pts" valueStyle={{ fontSize: 22 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} bodyStyle={{ padding: 12, textAlign: 'center' }}>
            <Statistic title={<span style={{ fontSize: 11 }}>Graded</span>} value={gradedAssignments.length}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} valueStyle={{ fontSize: 22 }} />
          </Card>
        </Col>
      </Row>
      {progress?.courseStats && progress.courseStats.length > 0 && (
        <Card title="Course Scores" bordered={false} style={{ marginBottom: 12 }}>
          <List dataSource={progress.courseStats} renderItem={item => (
            <List.Item>
              <List.Item.Meta avatar={<Avatar style={{ background: '#1677ff' }}>{item.courseName.charAt(0)}</Avatar>}
                title={item.courseName} description={`Graded ${item.count} times`} />
              <Text strong style={{ color: item.avgScore >= 60 ? '#52c41a' : '#ff4d4f', fontSize: 18 }}>{item.avgScore}pts</Text>
            </List.Item>
          )} />
        </Card>
      )}
      <Card title="Recent Assignments" bordered={false}>
        {assignments.length > 0 ? (
          <List dataSource={assignments.slice(0, 10)} renderItem={item => {
            const sub = item.submission;
            const statusTag = !sub ? <Tag color="warning">Pending</Tag>
              : sub.status === 2 ? <Tag color="green">{Number(sub.score)}pts</Tag>
              : <Tag color="blue">Submitted</Tag>;
            return (
              <List.Item extra={statusTag}>
                <List.Item.Meta title={item.title}
                  description={<Space><Tag color="blue">{item.courseName}</Tag>{item.dueDate && <Text type="secondary" style={{ fontSize: 12 }}>Due: {new Date(item.dueDate).toLocaleDateString('zh-CN')}</Text>}</Space>} />
              </List.Item>
            );
          }} />
        ) : <Empty description="No assignments" />}
      </Card>
    </div>
  );
};

export default ParentDashboard;
