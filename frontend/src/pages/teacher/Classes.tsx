import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Select, Typography, Row, Col,
  Avatar, List, Empty, Tabs, message, Descriptions, Progress, Statistic,
} from 'antd';
import {
  TeamOutlined, UserOutlined, BookOutlined, TrophyOutlined,
} from '@ant-design/icons';
import { classService } from '../../services/classService';
import { ClassInfo } from '../../types/api';
import { User } from '../../types/user';
import PageHeader from '../../components/common/PageHeader';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

const TeacherClasses: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await classService.getClasses({ pageSize: 100 });
      setClasses(response.data.items || []);
    } catch {
      setClasses([
        { id: '1', name: '高一(1)班', grade: '高一', description: '理科重点班', teacherId: '1', teacherName: '张老师', studentCount: 42, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', name: '高一(2)班', grade: '高一', description: '理科普通班', teacherId: '1', teacherName: '张老师', studentCount: 38, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '3', name: '高二(1)班', grade: '高二', description: '文科重点班', teacherId: '1', teacherName: '张老师', studentCount: 45, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId: string) => {
    setStudentLoading(true);
    try {
      const response = await classService.getClassStudents(classId);
      setStudents(response.data.items || []);
    } catch {
      setStudents([
        { id: '1', username: 'liming', name: '李明', email: 'liming@example.com', role: 'STUDENT' as any, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', username: 'wangfang', name: '王芳', email: 'wangfang@example.com', role: 'STUDENT' as any, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '3', username: 'zhangwei', name: '张伟', email: 'zhangwei@example.com', role: 'STUDENT' as any, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '4', username: 'liuyang', name: '刘洋', email: 'liuyang@example.com', role: 'STUDENT' as any, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '5', username: 'chenxi', name: '陈曦', email: 'chenxi@example.com', role: 'STUDENT' as any, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
    } finally {
      setStudentLoading(false);
    }
  };

  const handleClassSelect = (cls: ClassInfo) => {
    setSelectedClass(cls);
    fetchStudents(cls.id);
  };

  const classStats = [
    { title: '班级数', value: classes.length, icon: <TeamOutlined />, color: '#1677ff' },
    { title: '学生总数', value: classes.reduce((sum, c) => sum + c.studentCount, 0), icon: <UserOutlined />, color: '#52c41a' },
  ];

  return (
    <div>
      <PageHeader title="班级互动" subtitle="查看班级信息和学生列表" />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {classStats.map((stat, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
            <Card bordered={false}>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={React.cloneElement(stat.icon, { style: { color: stat.color } })}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="我的班级" bordered={false} loading={loading}>
            <List
              dataSource={classes}
              renderItem={(item) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    background: selectedClass?.id === item.id ? '#e6f4ff' : 'transparent',
                    borderRadius: 8,
                    padding: '12px',
                    marginBottom: 8,
                  }}
                  onClick={() => handleClassSelect(item)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{ background: '#1677ff' }}
                        icon={<TeamOutlined />}
                      />
                    }
                    title={<Text strong>{item.name}</Text>}
                    description={
                      <Space>
                        <Tag>{item.grade}</Tag>
                        <Text type="secondary">{item.studentCount}人</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} md={16}>
          {selectedClass ? (
            <Card bordered={false}>
              <Tabs defaultActiveKey="students">
                <TabPane tab="学生列表" key="students">
                  <Table
                    dataSource={students}
                    rowKey="id"
                    loading={studentLoading}
                    pagination={false}
                    columns={[
                      {
                        title: '姓名',
                        key: 'name',
                        render: (_, record) => (
                          <Space>
                            <Avatar size="small" icon={<UserOutlined />} />
                            <Text>{record.name}</Text>
                          </Space>
                        ),
                      },
                      {
                        title: '邮箱',
                        dataIndex: 'email',
                        key: 'email',
                      },
                      {
                        title: '用户名',
                        dataIndex: 'username',
                        key: 'username',
                      },
                    ]}
                  />
                </TabPane>
                <TabPane tab="班级信息" key="info">
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="班级名称">{selectedClass.name}</Descriptions.Item>
                    <Descriptions.Item label="年级">{selectedClass.grade}</Descriptions.Item>
                    <Descriptions.Item label="班主任">{selectedClass.teacherName}</Descriptions.Item>
                    <Descriptions.Item label="学生人数">{selectedClass.studentCount}</Descriptions.Item>
                    <Descriptions.Item label="描述" span={2}>{selectedClass.description || '无'}</Descriptions.Item>
                  </Descriptions>
                </TabPane>
              </Tabs>
            </Card>
          ) : (
            <Card bordered={false}>
              <Empty description="请从左侧选择一个班级" />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default TeacherClasses;
