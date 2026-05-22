import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Table, Tag, Space, Modal, message, Statistic, Row, Col, Select, Progress, Alert,
} from 'antd';
import {
  QrcodeOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined,
  UserOutlined, ReloadOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { classService } from '../../services/classService';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { ClassInfo } from '../../types/api';

const { Option } = Select;

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName?: string;
  scheduleId?: string;
  classId?: string;
  className?: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remark?: string;
}

interface AttendanceStats {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

const AttendancePage: React.FC = () => {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [signCode, setSignCode] = useState('');
  const [codeModalVisible, setCodeModalVisible] = useState(false);

  // 加载班级列表
  const fetchClasses = useCallback(async () => {
    try {
      const response = await classService.getClasses({ pageSize: 100 });
      setClasses(response.data?.items || []);
    } catch (error: any) {
      message.error(error?.message || '加载班级列表失败');
    }
  }, []);

  // 加载考勤记录
  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { pageSize: 200 };
      if (selectedClassId) params.classId = selectedClassId;
      const response = await api.get('/attendances', { params });
      const responseData = response.data?.data || response.data;
      const items: AttendanceRecord[] = responseData?.items || responseData || [];
      setRecords(items);
      // 本地计算统计（备用）
      const total = items.length;
      const present = items.filter((r) => r.status === 'PRESENT').length;
      const late = items.filter((r) => r.status === 'LATE').length;
      const absent = items.filter((r) => r.status === 'ABSENT').length;
      const excused = items.filter((r) => r.status === 'EXCUSED').length;
      setStats({
        totalStudents: total,
        presentCount: present,
        lateCount: late,
        absentCount: absent,
        excusedCount: excused,
        attendanceRate: total > 0 ? Math.round((present + late) / total * 100) : 0,
      });
    } catch (error: any) {
      message.error(error?.message || '加载考勤记录失败');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  // 加载考勤统计
  const fetchStatistics = useCallback(async () => {
    try {
      const params: Record<string, any> = {};
      if (selectedClassId) params.classId = selectedClassId;
      const response = await api.get('/attendances/statistics', { params });
      const data = response.data?.data || response.data;
      if (data) {
        setStats({
          totalStudents: data.totalStudents || data.total || 0,
          presentCount: data.presentCount || data.present || 0,
          absentCount: data.absentCount || data.absent || 0,
          lateCount: data.lateCount || data.late || 0,
          excusedCount: data.excusedCount || data.excused || 0,
          attendanceRate: data.attendanceRate || 0,
        });
      }
    } catch {
      // 统计接口失败时使用本地计算的统计数据
    }
  }, [selectedClassId]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchAttendance();
    fetchStatistics();
  }, [fetchAttendance, fetchStatistics]);

  // 生成签到码
  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSignCode(code);
    setCodeModalVisible(true);
    message.success('签到码已生成，有效期5分钟');
  };

  // 补签
  const handleSign = async (record: AttendanceRecord) => {
    try {
      await api.put(`/attendances/${record.id}`, { status: 'PRESENT' });
      message.success('补签成功');
      fetchAttendance();
    } catch (error: any) {
      message.error(error?.message || '补签失败');
    }
  };

  // 标记请假
  const handleMarkExcused = async (record: AttendanceRecord) => {
    try {
      await api.put(`/attendances/${record.id}`, { status: 'EXCUSED' });
      message.success('已标记请假');
      fetchAttendance();
    } catch (error: any) {
      message.error(error?.message || '标记请假失败');
    }
  };

  const statusColors: Record<string, string> = {
    PRESENT: 'green',
    ABSENT: 'red',
    LATE: 'orange',
    EXCUSED: 'blue',
  };

  const statusLabels: Record<string, string> = {
    PRESENT: '已签到',
    ABSENT: '未签到',
    LATE: '迟到',
    EXCUSED: '请假',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    PRESENT: <CheckCircleOutlined />,
    ABSENT: <CloseCircleOutlined />,
    LATE: <ClockCircleOutlined />,
    EXCUSED: <UserOutlined />,
  };

  const columns = [
    { title: '学号', dataIndex: 'studentId', key: 'studentId', width: 100 },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => (
        <Tag color={statusColors[s]} icon={statusIcons[s]}>
          {statusLabels[s] || s}
        </Tag>
      ),
    },
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 120,
      render: (t: string) => t || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: AttendanceRecord) =>
        record.status === 'ABSENT' ? (
          <Space>
            <Button type="link" size="small" onClick={() => handleSign(record)}>
              补签
            </Button>
            <Button type="link" size="small" onClick={() => handleMarkExcused(record)}>
              请假
            </Button>
          </Space>
        ) : (
          '-'
        ),
    },
  ];

  const { attendanceRate, presentCount, lateCount, absentCount, excusedCount, totalStudents } = stats;

  return (
    <div>
      <PageHeader title="考勤签到" subtitle="发起签到、查看出勤统计" />

      {/* 考勤统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic
              title="出勤率"
              value={attendanceRate}
              suffix="%"
              valueStyle={{ color: attendanceRate >= 90 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic
              title="已签到"
              value={presentCount}
              suffix={`/ ${totalStudents}`}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic
              title="迟到"
              value={lateCount}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic
              title="缺勤/请假"
              value={absentCount + excusedCount}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="选择班级"
            style={{ width: 200 }}
            allowClear
            onChange={(v) => setSelectedClassId(v)}
          >
            {classes.map((c) => (
              <Option key={c.id} value={c.id}>
                {c.name}
              </Option>
            ))}
          </Select>
          <Button type="primary" icon={<QrcodeOutlined />} onClick={generateCode}>
            发起签到
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchAttendance}>
            刷新数据
          </Button>
        </Space>
      </Card>

      {/* 考勤详情 */}
      <Card bordered={false}>
        <div style={{ marginBottom: 16 }}>
          <Progress percent={attendanceRate} status={attendanceRate >= 90 ? 'success' : 'active'} />
        </div>
        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
          size="small"
        />
      </Card>

      {/* 签到码弹窗 */}
      <Modal
        title="签到码"
        open={codeModalVisible}
        onCancel={() => setCodeModalVisible(false)}
        footer={null}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          <QrcodeOutlined style={{ fontSize: 64, color: '#1677ff', marginBottom: 16 }} />
          <h1 style={{ fontSize: 48, letterSpacing: 8, color: '#1677ff', margin: '16px 0' }}>
            {signCode}
          </h1>
          <p style={{ color: '#999' }}>请学生输入此签到码完成签到</p>
          <p style={{ color: '#999' }}>有效期：5分钟</p>
          <Alert
            type="info"
            message="学生可在学生端输入签到码完成签到"
            style={{ marginTop: 16 }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AttendancePage;
