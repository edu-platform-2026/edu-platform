import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, DatePicker, Select, Space, Button, Row, Col, Statistic, Spin, message, Empty } from 'antd';
import { SearchOutlined, ReloadOutlined, LoginOutlined, EditOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import api from '../../services/api';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface LogEntry {
  id: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  module: string;
  detail?: string;
  ip?: string;
  createdAt: string;
}

const OperationLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // 筛选条件
  const [actionFilter, setActionFilter] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const fetchLogs = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (actionFilter) params.action = actionFilter;
      if (moduleFilter) params.module = moduleFilter;
      if (dateRange) {
        params.startDate = dateRange[0];
        params.endDate = dateRange[1];
      }

      const res: any = await api.get('/operation-logs', { params });
      const data = res?.data;
      const items: LogEntry[] = Array.isArray(data) ? data : data?.items || [];
      const totalCount = data?.total ?? items.length;

      setLogs(items);
      setTotal(totalCount);
      setPagination({ current: page, pageSize });
    } catch (err) {
      message.error('加载操作日志失败');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, moduleFilter, dateRange]);

  useEffect(() => {
    fetchLogs(1, pagination.pageSize);
  }, [fetchLogs]);

  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchLogs(pag.current || 1, pag.pageSize || 10);
  };

  const handleSearch = () => {
    fetchLogs(1, pagination.pageSize);
  };

  const handleReset = () => {
    setActionFilter('');
    setModuleFilter('');
    setDateRange(null);
  };

  const handleDateChange = (dates: any, dateStrings: [string, string]) => {
    if (dates) {
      setDateRange([dateStrings[0], dateStrings[1]]);
    } else {
      setDateRange(null);
    }
  };

  const actionColors: Record<string, string> = {
    '登录': 'blue', '创建': 'green', '修改': 'orange', '删除': 'red',
    '发布': 'purple', '提交': 'cyan', '批改': 'geekblue', '考勤': 'gold', '批量导入': 'lime',
  };

  const roleMap: Record<string, string> = { ADMIN: '管理员', TEACHER: '教师', STUDENT: '学生', PARENT: '家长' };

  // 统计数据
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.createdAt?.startsWith(todayStr));
  const loginCount = logs.filter(l => l.action === '登录').length;
  const modifyCount = logs.filter(l => ['创建', '修改', '删除', '发布', '批量导入'].includes(l.action)).length;

  const columns: ColumnsType<LogEntry> = [
    {
      title: '时间', dataIndex: 'createdAt', key: 'time', width: 180,
      render: (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
    { title: '操作人', dataIndex: 'userName', key: 'user', width: 120, render: (v: string) => v || '-' },
    {
      title: '角色', dataIndex: 'userRole', key: 'role', width: 80,
      render: (r: string) => <Tag>{roleMap[r] || r || '-'}</Tag>,
    },
    {
      title: '操作', dataIndex: 'action', key: 'action', width: 100,
      render: (a: string) => <Tag color={actionColors[a] || 'default'}>{a}</Tag>,
    },
    { title: '模块', dataIndex: 'module', key: 'module', width: 100 },
    { title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true, render: (v: string) => v || '-' },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 130, render: (v: string) => v || '-' },
  ];

  return (
    <div>
      <PageHeader title="操作日志" subtitle="记录系统所有操作，方便溯源审计" />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="当前页操作" value={logs.length} suffix="次" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="今日操作" value={todayLogs.length} suffix="次" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="登录次数" value={loginCount} prefix={<LoginOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} bodyStyle={{ padding: 16 }}>
            <Statistic title="数据变更" value={modifyCount} prefix={<EditOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select placeholder="操作类型" allowClear style={{ width: 120 }} value={actionFilter || undefined} onChange={v => setActionFilter(v || '')}>
            {Object.keys(actionColors).map(a => <Option key={a} value={a}>{a}</Option>)}
          </Select>
          <Select placeholder="模块" allowClear style={{ width: 120 }} value={moduleFilter || undefined} onChange={v => setModuleFilter(v || '')}>
            <Option value="认证">认证</Option>
            <Option value="用户管理">用户管理</Option>
            <Option value="作业管理">作业管理</Option>
            <Option value="通知管理">通知管理</Option>
            <Option value="签到">签到</Option>
          </Select>
          <RangePicker onChange={handleDateChange} />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { handleReset(); }}>重置</Button>
        </Space>
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
          }}
          onChange={handleTableChange}
          size="small"
          locale={{ emptyText: <Empty description="暂无操作日志" /> }}
        />
      </Card>
    </div>
  );
};

export default OperationLogs;
