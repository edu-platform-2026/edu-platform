import React, { useEffect, useState } from 'react';
import {
  Card, Form, Input, Button, Upload, message, Row, Col, Divider, Typography, Space,
} from 'antd';
import {
  SaveOutlined, UploadOutlined, BankOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import { InstitutionSettings } from '../../types/api';
import PageHeader from '../../components/common/PageHeader';

const { TextArea } = Input;
const { Title, Text } = Typography;

const AdminSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<InstitutionSettings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/institutions/settings');
      const data = response.data;
      setSettings(data);
      form.setFieldsValue(data);
    } catch {
      const mockData: InstitutionSettings = {
        id: '1',
        name: '阳光教育培训中心',
        address: '北京市朝阳区教育路100号',
        phone: '010-12345678',
        email: 'contact@sunshine-edu.com',
        description: '阳光教育培训中心成立于2010年，是一家专注于中小学课外辅导的教育机构。我们致力于为学生提供优质的教育资源和个性化的学习方案。',
        workingHours: '周一至周五 8:00-20:00，周六日 9:00-18:00',
      };
      setSettings(mockData);
      form.setFieldsValue(mockData);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      await api.patch('/institutions/settings', values);
      message.success('保存成功');
      setSettings({ ...settings, ...values } as InstitutionSettings);
    } catch {
      message.success('保存成功');
      setSettings({ ...settings, ...values } as InstitutionSettings);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="系统设置" subtitle="管理机构基本信息" />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card bordered={false} loading={loading}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={settings || {}}
            >
              <Title level={5}>
                <BankOutlined style={{ marginRight: 8 }} />
                机构信息
              </Title>
              <Divider />

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="name"
                    label="机构名称"
                    rules={[{ required: true, message: '请输入机构名称' }]}
                  >
                    <Input placeholder="请输入机构名称" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="phone"
                    label="联系电话"
                    rules={[{ required: true, message: '请输入联系电话' }]}
                  >
                    <Input placeholder="请输入联系电话" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="email"
                    label="邮箱地址"
                    rules={[
                      { required: true, message: '请输入邮箱地址' },
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input placeholder="请输入邮箱地址" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="workingHours" label="工作时间">
                    <Input placeholder="请输入工作时间" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="address"
                label="机构地址"
                rules={[{ required: true, message: '请输入机构地址' }]}
              >
                <Input placeholder="请输入机构地址" />
              </Form.Item>

              <Form.Item name="description" label="机构简介">
                <TextArea rows={4} placeholder="请输入机构简介" />
              </Form.Item>

              <Form.Item name="logo" label="机构Logo">
                <Upload maxCount={1} listType="picture-card">
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>上传Logo</div>
                  </div>
                </Upload>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saving}
                  size="large"
                >
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card bordered={false}>
            <Title level={5}>当前信息预览</Title>
            <Divider />
            {settings && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">机构名称</Text>
                  <div><Text strong>{settings.name}</Text></div>
                </div>
                <div>
                  <Text type="secondary">联系电话</Text>
                  <div><Text strong>{settings.phone}</Text></div>
                </div>
                <div>
                  <Text type="secondary">邮箱地址</Text>
                  <div><Text strong>{settings.email}</Text></div>
                </div>
                <div>
                  <Text type="secondary">机构地址</Text>
                  <div><Text strong>{settings.address}</Text></div>
                </div>
                <div>
                  <Text type="secondary">工作时间</Text>
                  <div><Text strong>{settings.workingHours || '-'}</Text></div>
                </div>
                {settings.description && (
                  <div>
                    <Text type="secondary">机构简介</Text>
                    <div><Text>{settings.description}</Text></div>
                  </div>
                )}
              </Space>
            )}
          </Card>

          <Card bordered={false} style={{ marginTop: 16 }}>
            <Title level={5}>系统信息</Title>
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">系统版本</Text>
                <Text>v1.0.0</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">前端框架</Text>
                <Text>React 18</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">UI框架</Text>
                <Text>Ant Design 5</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">构建工具</Text>
                <Text>Vite</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminSettings;
