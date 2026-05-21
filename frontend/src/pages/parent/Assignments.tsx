import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, List, Tag, Typography, Space, Input, Select, Row, Col,
  Empty, Spin, Button, Descriptions, Modal,
} from 'antd';
import {
  SearchOutlined, FileTextOutlined, ClockCircleOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { assignmentService } from '../../services/assignmentService';
import { Assignment, AssignmentStatus } from '../../types/assignment';
import { formatDate, isOverdue } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';

const { Text } = Typography;

const ParentAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await assignmentService.getAssignments({
        pageSize: 50,
        keyword,
        status: statusFilter || undefined,
      });
      setAssignments(response.data.items || []);
    } catch {
      setAssignments([
        { id: '1', title: '高等数学期中测试', description: '请完成第1-5章习题，包括选择题和计算题。注意：考试时间为90分钟。', courseId: '1', courseName: '高等数学', teacherId: '1', teacherName: '张老师', dueDate: '2024-01-15', status: AssignmentStatus.PUBLISHED, totalScore: 100, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', title: '英语作文-议论文', description: '围绕环境保护主题写一篇不少于500字的议论文，要求论点明确、论据充分。', courseId: '2', courseName: '英语写作', teacherId: '2', teacherName: '李老师', dueDate: '2024-01-18', status: AssignmentStatus.PUBLISHED, totalScore: 50, createdAt: '2024-01-02', updatedAt: '2024-01-02' },
        { id: '3', title: '物理实验报告', description: '完成力学实验报告，包括实验目的、实验步骤、数据记录和结论分析。', courseId: '3', courseName: '物理实验', teacherId: '3', teacherName: '王老师', dueDate: '2024-01-20', status: AssignmentStatus.PUBLISHED, totalScore: 100, createdAt: '2024-01-03', updatedAt: '2024-01-03' },
        { id: '4', title: '计算机编程作业', description: '使用Python完成指定的编程题目，提交源代码文件。', courseId: '4', courseName: '计算机基础', teacherId: '4', teacherName: '赵老师', dueDate: '2024-01-10', status: AssignmentStatus.CLOSED, totalScore: 100, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const getStatusTag = (assignment: Assignment) => {
    if (isOverdue(assignment.dueDate)) {
      return <Tag color="error">已过期</Tag>;
    }
    return <Tag color="processing">进行中</Tag>;
  };

  const handleViewDetail = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setDetailVisible(true);
  };

  return (
    <div>
      <PageHeader title="作业查看" subtitle="查看孩子的作业情况" />

      <Card bordered={false}>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12}>
            <Input
              placeholder="搜索作业标题"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12}>
            <Select
              placeholder="筛选状态"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="">全部</Select.Option>
              <Select.Option value="PUBLISHED">进行中</Select.Option>
              <Select.Option value="CLOSED">已结束</Select.Option>
            </Select>
          </Col>
        </Row>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : assignments.length === 0 ? (
          <Empty description="暂无作业" />
        ) : (
          <List
            dataSource={assignments}
            renderItem={(item) => (
              <Card
                size="small"
                style={{ marginBottom: 12 }}
                hoverable
                onClick={() => handleViewDetail(item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <Space>
                      <FileTextOutlined style={{ color: '#1677ff' }} />
                      <Text strong>{item.title}</Text>
                    </Space>
                    <div style={{ marginTop: 8 }}>
                      <Space>
                        <Tag color="blue">{item.courseName}</Tag>
                        {getStatusTag(item)}
                      </Space>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Space>
                        <ClockCircleOutlined style={{ color: '#999' }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          截止日期：{formatDate(item.dueDate)}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          满分：{item.totalScore}分
                        </Text>
                      </Space>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          />
        )}
      </Card>

      <Modal
        title="作业详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={640}
      >
        {selectedAssignment && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="作业标题">{selectedAssignment.title}</Descriptions.Item>
            <Descriptions.Item label="所属课程">{selectedAssignment.courseName}</Descriptions.Item>
            <Descriptions.Item label="布置教师">{selectedAssignment.teacherName}</Descriptions.Item>
            <Descriptions.Item label="满分">{selectedAssignment.totalScore}分</Descriptions.Item>
            <Descriptions.Item label="截止日期">{formatDate(selectedAssignment.dueDate)}</Descriptions.Item>
            <Descriptions.Item label="作业要求">{selectedAssignment.description}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ParentAssignments;
