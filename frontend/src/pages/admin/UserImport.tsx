import React, { useState } from 'react';
import {
  Card, Upload, Button, Table, Tag, message, Space, Alert, Progress, Select, Row, Col, Modal, Input,
} from 'antd';
import {
  UploadOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  FileExcelOutlined, UserAddOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';

const { Option } = Select;

interface ImportUser {
  key: number;
  username: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  className?: string;
  status: '待导入' | '成功' | '失败';
  errorMsg?: string;
}

const TEMPLATE_DATA = `用户名,姓名,角色,手机号,邮箱,班级
zhangsan01,张三,STUDENT,13800000001,zhangsan@school.com,高一(1)班
lisi02,李四,STUDENT,13800000002,lisi@school.com,高一(1)班
wangwu03,王五,TEACHER,13800000003,wangwu@school.com,
zhaoliu04,赵六,PARENT,13800000004,zhaoliu@school.com,`;

const UserImport: React.FC = () => {
  const [importData, setImportData] = useState<ImportUser[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [defaultPassword, setDefaultPassword] = useState('123456');
  const [defaultRole, setDefaultRole] = useState('STUDENT');

  const parseCSV = (text: string): ImportUser[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',');
    return lines.slice(1).map((line, idx) => {
      const values = line.split(',');
      const user: any = { key: idx + 1 };
      headers.forEach((h, i) => {
        const key = h.trim();
        const val = values[i]?.trim() || '';
        if (key === '用户名') user.username = val;
        if (key === '姓名') user.name = val;
        if (key === '角色') user.role = val || defaultRole;
        if (key === '手机号') user.phone = val;
        if (key === '邮箱') user.email = val;
        if (key === '班级') user.className = val;
      });
      user.status = '待导入';
      // 校验
      if (!user.username) { user.status = '失败'; user.errorMsg = '用户名为空'; }
      if (!user.name) { user.status = '失败'; user.errorMsg = '姓名为空'; }
      return user as ImportUser;
    });
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const data = parseCSV(text);
      if (data.length === 0) {
        message.error('文件内容为空或格式不正确');
        return;
      }
      setImportData(data);
      message.success(`解析成功，共 ${data.length} 条记录`);
    };
    reader.readAsText(file, 'UTF-8');
    return false;
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([TEMPLATE_DATA], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '用户导入模板.csv';
    link.click();
    URL.revokeObjectURL(url);
    message.success('模板下载成功');
  };

  const handleImport = async () => {
    const validData = importData.filter(d => d.status !== '失败');
    if (validData.length === 0) {
      message.error('没有可导入的数据');
      return;
    }
    setImporting(true);
    setImportProgress(0);

    for (let i = 0; i < validData.length; i++) {
      await new Promise(r => setTimeout(r, 200));
      const item = validData[i];
      // 模拟导入
      const success = Math.random() > 0.1;
      item.status = success ? '成功' : '失败';
      if (!success) item.errorMsg = '用户名已存在';
      setImportProgress(Math.round(((i + 1) / validData.length) * 100));
      setImportData([...importData]);
    }

    setImporting(false);
    const successCount = validData.filter(d => d.status === '成功').length;
    const failCount = validData.filter(d => d.status === '失败').length;
    message.success(`导入完成！成功 ${successCount} 条，失败 ${failCount} 条`);
  };

  const columns = [
    { title: '序号', dataIndex: 'key', key: 'key', width: 60 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    {
      title: '角色', dataIndex: 'role', key: 'role',
      render: (r: string) => {
        const map: Record<string, { color: string; text: string }> = {
          ADMIN: { color: 'red', text: '管理员' },
          TEACHER: { color: 'blue', text: '教师' },
          STUDENT: { color: 'green', text: '学生' },
          PARENT: { color: 'orange', text: '家长' },
        };
        const item = map[r] || { color: 'default', text: r };
        return <Tag color={item.color}>{item.text}</Tag>;
      },
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '班级', dataIndex: 'className', key: 'className' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => (
        <Tag color={s === '成功' ? 'green' : s === '失败' ? 'red' : 'blue'} icon={s === '成功' ? <CheckCircleOutlined /> : s === '失败' ? <CloseCircleOutlined /> : undefined}>
          {s}
        </Tag>
      ),
    },
    { title: '错误信息', dataIndex: 'errorMsg', key: 'errorMsg', render: (e: string) => e || '-' },
  ];

  const successCount = importData.filter(d => d.status === '成功').length;
  const failCount = importData.filter(d => d.status === '失败').length;

  return (
    <div>
      <PageHeader title="批量导入用户" subtitle="通过Excel/CSV文件批量创建师生账号" />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card bordered={false}>
            <h4>导入设置</h4>
            <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
              <div>
                <span style={{ marginRight: 8 }}>默认密码：</span>
                <Input
                  value={defaultPassword}
                  onChange={e => setDefaultPassword(e.target.value)}
                  style={{ width: 200 }}
                  placeholder="设置默认密码"
                />
              </div>
              <div>
                <span style={{ marginRight: 8 }}>默认角色：</span>
                <Select value={defaultRole} onChange={setDefaultRole} style={{ width: 200 }}>
                  <Option value="STUDENT">学生</Option>
                  <Option value="TEACHER">教师</Option>
                  <Option value="PARENT">家长</Option>
                </Select>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card bordered={false}>
            <h4>操作步骤</h4>
            <ol style={{ paddingLeft: 20, marginTop: 16, lineHeight: 2 }}>
              <li>下载导入模板</li>
              <li>按模板格式填写用户信息</li>
              <li>上传文件，预览数据</li>
              <li>确认无误后点击"开始导入"</li>
            </ol>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            下载导入模板
          </Button>
          <Upload
            accept=".csv,.txt"
            showUploadList={false}
            beforeUpload={handleFileUpload}
          >
            <Button icon={<UploadOutlined />}>上传CSV文件</Button>
          </Upload>
          {importData.length > 0 && (
            <>
              <Tag color="blue">共 {importData.length} 条</Tag>
              {successCount > 0 && <Tag color="green">成功 {successCount}</Tag>}
              {failCount > 0 && <Tag color="red">失败 {failCount}</Tag>}
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                loading={importing}
                onClick={handleImport}
                disabled={importData.filter(d => d.status !== '失败').length === 0}
              >
                开始导入
              </Button>
            </>
          )}
        </Space>
        {importing && <Progress percent={importProgress} status="active" style={{ marginTop: 12 }} />}
      </Card>

      {importData.length > 0 && (
        <Card bordered={false}>
          <Alert
            type={failCount > 0 ? 'warning' : 'info'}
            message={`数据预览：${importData.length} 条记录，其中 ${failCount} 条有错误`}
            style={{ marginBottom: 16 }}
          />
          <Table
            dataSource={importData}
            columns={columns}
            rowKey="key"
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Card>
      )}
    </div>
  );
};

export default UserImport;
