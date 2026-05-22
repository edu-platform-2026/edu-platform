import React, { useState, useEffect } from 'react';
import { Table, Tag, Progress, Card, Spin, Empty, message } from 'antd';
import PageHeader from '../../components/common/PageHeader';
import { courseService } from '../../services/courseService';
import { Course, CourseStatus } from '../../types/course';

/* ======================================================
   状态映射
   ====================================================== */
const statusTextMap: Record<string, string> = {
  [CourseStatus.ACTIVE]: '进行中',
  [CourseStatus.COMPLETED]: '已结课',
  [CourseStatus.DRAFT]: '未开课',
};

/* ======================================================
   组件
   ====================================================== */
const StudentCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const res = await courseService.getCourses() as any;
        const data = res?.data;
        setCourses(Array.isArray(data) ? data : data?.items || []);
      } catch (err) {
        message.error('加载课程数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const columns = [
    {
      title: '课程名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    { title: '授课教师', dataIndex: 'teacherName', key: 'teacherName' },
    { title: '课程描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '学习进度',
      key: 'progress',
      width: 200,
      render: (_: unknown, record: Course) => {
        const total = record.totalHours || 1;
        const completed = record.completedHours || 0;
        const percent = Math.round((completed / total) * 100);
        return (
          <Progress
            percent={percent}
            size="small"
            status={percent >= 100 ? 'success' : 'active'}
          />
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const text = statusTextMap[status] || status;
        const color = status === CourseStatus.COMPLETED ? 'green' : status === CourseStatus.ACTIVE ? 'blue' : 'default';
        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  return (
    <Spin spinning={loading}>
      <div>
        <PageHeader title="我的课程" subtitle="查看已选课程及学习进度" />
        <Card bordered={false}>
          {courses.length > 0 ? (
            <Table
              dataSource={courses}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          ) : (
            <Empty description="暂无课程数据" />
          )}
        </Card>
      </div>
    </Spin>
  );
};

export default StudentCourses;
