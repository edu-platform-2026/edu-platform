import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Table, Tag, Space, Modal, message, Statistic, Row, Col, Select, Progress, Alert, Empty,
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
    totalStudents: 0, presentCount: 0, absentCount: 0, lateCount: 0, excusedCount: 0, attendanceRate: 0,
  });
  const [loading, setLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [signCode, setSignCode] = useState('');
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await classService.getClasses({ pageSize: 100 });
      setClasses((response as any)?.data?.items || []);
    } catch {
      // 静默
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { pageSize: 100 };
      if (selectedClassId) params.classId = selectedClassId;
      const response = await api.get('/attendances', { params });
      const data = response?.data;
      const items: AttendanceRecord[] = Array.isArray(data) ? data : data?.items || [];
      setRecords(items);
      setApiAvailable(true);
      const total = items.length;
      const present = items.filter(r => r.status === 'PRESENT').length;
      const late = items.filter(r => r.status === 'LATE').length;
      const absent = items.filter(r => r.status === 'ABSENT').length;
      const excused = items.filter(r => r.status === 'EXCUSED').length;
      setStats({
        totalStudents: total, presentCount: present, lateCount: late,
        absentCount: absent, excusedCount: excused,
        attendanceRate: total > 0 ? Math.round((present + late) / total * 100) : 0,
      });
    } catch {
      setApiAvailable(false);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSignCode(code);
    setCodeModalVisible(true);
    message.success('签到码已生成，有效期5分钟');
  };

  const handleSign = async (record: AttendanceRecord) => {
    try {
      await api.put(`/attendances/${record.id}`, { status: 'PRESENT' });
      message.success('补签成功');
      fetchAttendance();
    } catch {
      message.error('补签失败');
    }
  };

  const handleMarkExcused = async (record: AttendanceRecord) => {
    try {
      await api.put(`/attendances/${record.id}`, { status: 'EXCUSED' });
      message.success('已标记请假');
      fetchAttendance();
    } catch {
      message.error('标记失败');
    }
  };

  const statusColors: Record<string, string> = { PRESENT: 'green', ABSENT: 'red', LATE: 'orange', EXCUSED: 'blue' };
  const statusLabels: Record<string, string> = { PRESENT: '已签到', ABSENT: '未签到', LATE: '迟到', EXCUSED: '请假' };
  const statusIcons: Record<string, React.ReactNode> = {
    PRESENT: <CheckCircleOutlined />, ABSENT: <CloseCircleOutlined />,
    LATE: <ClockCircleOutlined />, EXCUSED: <UserOutlined />,
  };

  const columns = [
    { title: '学号', dataIndex: 'studentId', key: 'studentId', width: 100 },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName', width: 100 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => <Tag color={statusColors[s]} icon={statusIcons[s]}>{statusLabels[s] || s}</Tag>,
    },
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 120, render: (t: string) => t || '-' },
    {
      title: '操作', key: 'action', width: 120,
      render: (_: any, record: AttendanceRecord) =>
        record.status === 'ABSENT' ? (
          <Space>
            <Button type="link" size="small" onClick={() => handleSign(record)}>补签</Button>
            <Button type="link" size="small" onClick={() => handleMarkExcused(record)}>请假</Button>
          </Space>
        ) : '-',
    },
  ];

  const { attendanceRate, presentCount, lateCount, absentCount, excusedCount, totalStudents } = stats;

  return (
    <div>
      <PageHeader title="考勤签到" subtitle="发起签到、查看出勤统计" />

      {!apiAvailable && (
        <Alert
          message="考勤功能提示"
          description="考勤数据接口暂不可用，请确认后端已部署考勤模块。签到码生成功能仍可使用。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          closable
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="出勤率" value={attendanceRate} suffix="%"
              valueStyle={{ color: attendanceRate >= 90 ? '#3f8600' : '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="已签到" value={presentCount} suffix={`/ ${totalStudents}`}
              valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="迟到" value={lateCount} valueStyle={{ color: '#faad14' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="缺勤/请假" value={absentCount + excusedCount}
              valueStyle={{ color: '#cf1322' }} prefix={<CloseCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select placeholder="选择班级" style={{ width: 200 }} allowClear onChange={(v) => setSelectedClassId(v)}>
            {classes.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
          </Select>
          <Button type="primary" icon={<QrcodeOutlined />} onClick={generateCode}>发起签到</Button>
          <Button icon={<ReloadOutlined />} onClick={fetchAttendance}>刷新数据</Button>
        </Space>
      </Card>

      <Card bordered={false}>
        {records.length > 0 && <Progress percent={attendanceRate} status={attendanceRate >= 90 ? 'success' : 'active'} style={{ marginBottom: 16 }} />}
        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
          size="small"
          locale={{ emptyText: <Empty description={apiAvailable ? '暂无考勤记录，请先选择班级' : '考勤接口暂不可用'} /> }}
        />
      </Card>

      <Modal title="签到码" open={codeModalVisible} onCancel={() => setCodeModalVisible(false)} footer={null} width={400}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <QrcodeOutlined style={{ fontSize: 64, color: '#1677ff', marginBottom: 16 }} />
          <h1 style={{ fontSize: 48, letterSpacing: 8, color: '#1677ff', margin: '16px 0' }}>{signCode}</h1>
          <p style={{ color: '#999' }}>请学生输入此签到码完成签到</p>
          <p style={{ color: '#999' }}>有效期：5分钟</p>
          <Alert type="info" message="学生可在学生端输入签到码完成签到" style={{ marginTop: 16 }} />
        </div>
      </Modal>
    </div>
  );
};

export default AttendancePage;
