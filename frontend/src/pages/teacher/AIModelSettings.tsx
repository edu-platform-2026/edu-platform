import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, message, Divider, Tag, Space, Alert, Switch, Descriptions,
} from 'antd';
import {
  RobotOutlined, SaveOutlined, ThunderboltOutlined, KeyOutlined, LinkOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { getAIConfig, saveAIConfig, testAIConnection, AIConfig } from '../../services/aiModelService';

const AIModelSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);
  const [config, setConfig] = useState<AIConfig | null>(null);

  useEffect(() => {
    const saved = getAIConfig();
    setConfig(saved);
    form.setFieldsValue(saved);
  }, []);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      saveAIConfig(values);
      setConfig(values);
      message.success('AI模型配置已保存');
    } catch {
      message.error('请完善配置信息');
    }
  };

  const handleTest = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setTestResult(null);
      const ok = await testAIConnection(values);
      setTestResult(ok ? 'success' : 'fail');
      message[ok ? 'success' : 'error'](ok ? '连接测试成功！' : '连接测试失败，请检查配置');
    } catch {
      message.error('请先填写完整配置');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaults: AIConfig = {
      apiUrl: '/ai-api',
      apiKey: 'tp-ch774hvzep3v61vqxhlkbbnnxsal6z7hrr6ruzdqowm0hb4e',
      modelName: 'mimo-v2.5-pro',
    };
    form.setFieldsValue(defaults);
    saveAIConfig(defaults);
    setConfig(defaults);
    message.info('已恢复默认配置');
  };

  return (
    <div>
      <PageHeader title="AI模型配置" subtitle="配置用于出题识别、AI出题、智能批改的大模型参数" />

      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Alert
          type="info"
          showIcon
          icon={<RobotOutlined />}
          message="AI模型说明"
          description="配置OpenAI兼容的大模型API。系统将使用该模型进行：1）文件内容识别出题 2）AI智能出题 3）问答题AI辅助批改。默认已配置小米MiMo模型。"
          style={{ marginBottom: 24 }}
        />

        <Form form={form} layout="vertical" initialValues={{
          apiUrl: '/ai-api',
          apiKey: 'tp-ch774hvzep3v61vqxhlkbbnnxsal6z7hrr6ruzdqowm0hb4e',
          modelName: 'mimo-v2.5-pro',
        }}>
          <Form.Item
            label="API地址"
            name="apiUrl"
            rules={[{ required: true, message: '请输入API地址' }]}
            extra="默认使用代理地址 /ai-api，系统会自动转发到小米MiMo API"
          >
            <Input prefix={<LinkOutlined />} placeholder="https://api.openai.com/v1" />
          </Form.Item>

          <Form.Item
            label="API密钥"
            name="apiKey"
            rules={[{ required: true, message: '请输入API密钥' }]}
            extra="模型服务的API Key"
          >
            <Input.Password prefix={<KeyOutlined />} placeholder="sk-..." />
          </Form.Item>

          <Form.Item
            label="模型名称"
            name="modelName"
            rules={[{ required: true, message: '请输入模型名称' }]}
            extra="如 gpt-4o、mimo-v2.5-pro、qwen-turbo 等"
          >
            <Input prefix={<ThunderboltOutlined />} placeholder="mimo-v2.5-pro" />
          </Form.Item>

          <Divider />

          <Space>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              保存配置
            </Button>
            <Button icon={<ThunderboltOutlined />} loading={loading} onClick={handleTest}>
              测试连接
            </Button>
            <Button onClick={handleReset}>
              恢复默认
            </Button>
          </Space>
        </Form>

        {testResult && (
          <Alert
            type={testResult === 'success' ? 'success' : 'error'}
            message={testResult === 'success' ? '连接成功' : '连接失败'}
            description={testResult === 'success' ? 'API地址和密钥有效，模型可正常调用' : '请检查API地址、密钥和模型名称是否正确'}
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {/* 当前配置概览 */}
      {config && (
        <Card bordered={false} title="当前配置">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="API地址">{config.apiUrl}</Descriptions.Item>
            <Descriptions.Item label="API密钥">
              <Tag color="blue">{config.apiKey?.substring(0, 12)}...{config.apiKey?.slice(-4)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="模型名称">
              <Tag color="purple">{config.modelName}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default AIModelSettings;
