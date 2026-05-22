import React, { useState } from 'react';
import {
  Card, Form, Input, Button, Select, DatePicker, InputNumber, Space, Tag, Divider,
  Radio, message, Row, Col, Modal, Table, Popconfirm, Tooltip, Upload, Alert, Spin, Progress,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined,
  CheckCircleOutlined, RobotOutlined, UploadOutlined, ThunderboltOutlined,
  FileTextOutlined, BulbOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { extractQuestionsFromFile, generateQuestionsWithAI, readFileAsText, AIQuestion } from '../../services/aiModelService';

const { TextArea } = Input;
const { Option } = Select;

type QuestionType = 'choice' | 'truefalse' | 'essay';

interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[];
  answer?: string | boolean;
  referenceAnswer?: string;
  score: number;
}

const COURSES = ['高等数学', '大学英语', '数据结构', '有机化学', '线性代数', '概率论'];

const CreateAssignment: React.FC = () => {
  const [form] = Form.useForm();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionModalVisible, setQuestionModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm] = Form.useForm();
  const [questionType, setQuestionType] = useState<QuestionType>('choice');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [publishedList, setPublishedList] = useState<any[]>([]);
  const [viewPublished, setViewPublished] = useState<any | null>(null);

  // AI相关状态
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGenModalVisible, setAiGenModalVisible] = useState(false);
  const [aiGenForm] = Form.useForm();
  const [fileImportLoading, setFileImportLoading] = useState(false);

  // ========== 手动出题 ==========
  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionType('choice');
    questionForm.resetFields();
    questionForm.setFieldsValue({ type: 'choice', options: ['', '', '', ''], score: 10 });
    setQuestionModalVisible(true);
  };

  const handleEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQuestionType(q.type);
    questionForm.setFieldsValue({
      type: q.type,
      content: q.content,
      options: q.options || ['', '', '', ''],
      answer: q.answer,
      score: q.score,
    });
    setQuestionModalVisible(true);
  };

  const handleSaveQuestion = async () => {
    try {
      const values = await questionForm.validateFields();
      const newQuestion: Question = {
        id: editingQuestion?.id || `q_${Date.now()}`,
        type: values.type,
        content: values.content,
        options: values.type === 'choice' ? values.options : undefined,
        answer: values.answer,
        referenceAnswer: values.type === 'essay' ? values.answer : undefined,
        score: values.score,
      };
      if (editingQuestion) {
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? newQuestion : q));
        message.success('题目已更新');
      } else {
        setQuestions(prev => [...prev, newQuestion]);
        message.success('题目已添加');
      }
      setQuestionModalVisible(false);
    } catch {
      message.error('请完善题目信息');
    }
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    message.success('题目已删除');
  };

  // ========== AI文件导入出题 ==========
  const handleFileImport = async (file: File) => {
    setFileImportLoading(true);
    try {
      const content = await readFileAsText(file);
      if (!content.trim()) {
        message.error('文件内容为空');
        return;
      }
      const course = form.getFieldValue('course') || '';
      const aiQuestions = await extractQuestionsFromFile(content, course);
      const newQuestions: Question[] = aiQuestions.map((q, idx) => ({
        id: `file_${Date.now()}_${idx}`,
        type: q.type,
        content: q.content,
        options: q.options,
        answer: q.answer,
        referenceAnswer: q.referenceAnswer,
        score: q.score,
      }));
      setQuestions(prev => [...prev, ...newQuestions]);
      message.success(`AI识别完成！从文件中提取了 ${newQuestions.length} 道题目`);
    } catch (err: any) {
      message.error(`文件识别失败：${err.message}`);
    } finally {
      setFileImportLoading(false);
    }
    return false; // 阻止antd自动上传
  };

  // ========== AI智能出题 ==========
  const handleAIGenerate = async () => {
    try {
      const values = await aiGenForm.validateFields();
      setAiLoading(true);
      const aiQuestions = await generateQuestionsWithAI(
        values.topic,
        values.course || form.getFieldValue('course') || '通用',
        values.count || 6,
        values.difficulty || 'medium'
      );
      const newQuestions: Question[] = aiQuestions.map((q, idx) => ({
        id: `ai_${Date.now()}_${idx}`,
        type: q.type,
        content: q.content,
        options: q.options,
        answer: q.answer,
        referenceAnswer: q.referenceAnswer,
        score: q.score,
      }));
      setQuestions(prev => [...prev, ...newQuestions]);
      message.success(`AI出题完成！生成了 ${newQuestions.length} 道题目`);
      setAiGenModalVisible(false);
      aiGenForm.resetFields();
    } catch (err: any) {
      message.error(`AI出题失败：${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // ========== 发布作业 ==========
  const handlePublish = async () => {
    try {
      const values = await form.validateFields();
      if (questions.length === 0) {
        message.warning('请至少添加一道题目');
        return;
      }
      const totalScore = questions.reduce((sum, q) => sum + q.score, 0);
      const assignment = {
        id: `hw_${Date.now()}`,
        ...values,
        questions,
        totalScore,
        status: '已发布',
        publishTime: new Date().toLocaleString(),
        submitCount: 0,
      };
      setPublishedList(prev => [assignment, ...prev]);
      message.success('作业发布成功！');
      form.resetFields();
      setQuestions([]);
    } catch {
      message.error('请完善作业信息');
    }
  };

  // ========== 表格列定义 ==========
  const questionColumns = [
    {
      title: '序号', key: 'index', width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '题型', dataIndex: 'type', key: 'type', width: 100,
      render: (type: QuestionType) => {
        const map: Record<QuestionType, { color: string; text: string }> = {
          choice: { color: 'blue', text: '选择题' },
          truefalse: { color: 'green', text: '判断题' },
          essay: { color: 'orange', text: '问答题' },
        };
        return <Tag color={map[type].color}>{map[type].text}</Tag>;
      },
    },
    { title: '题目内容', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: '分值', dataIndex: 'score', key: 'score', width: 80, render: (s: number) => `${s}分` },
    {
      title: '操作', key: 'action', width: 120,
      render: (_: any, record: Question) => (
        <Space>
          <Tooltip title="编辑"><Button type="link" icon={<EditOutlined />} onClick={() => handleEditQuestion(record)} /></Tooltip>
          <Popconfirm title="确定删除？" onConfirm={() => handleDeleteQuestion(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const publishedColumns = [
    { title: '作业标题', dataIndex: 'title', key: 'title' },
    { title: '课程', dataIndex: 'course', key: 'course', width: 120 },
    { title: '题目数', dataIndex: 'questions', key: 'qCount', width: 80, render: (q: Question[]) => q.length },
    { title: '总分', dataIndex: 'totalScore', key: 'totalScore', width: 80, render: (s: number) => `${s}分` },
    { title: '截止时间', dataIndex: 'deadline', key: 'deadline', width: 160 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => <Tag color="green">{s}</Tag> },
    { title: '操作', key: 'action', width: 100, render: (_: any, record: any) => <Button type="link" icon={<EyeOutlined />} onClick={() => setViewPublished(record)}>查看</Button> },
  ];

  return (
    <div>
      <PageHeader title="创建作业" subtitle="支持手动出题、AI智能出题、文件导入识别出题" />

      {/* 作业基本信息 */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item label="作业标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
                <Input placeholder="请输入作业标题" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="所属课程" name="course" rules={[{ required: true, message: '请选择课程' }]}>
                <Select placeholder="请选择课程">
                  {COURSES.map(c => <Option key={c} value={c}>{c}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="截止时间" name="deadline" rules={[{ required: true, message: '请选择截止时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="作业说明" name="description">
            <TextArea rows={2} placeholder="请输入作业说明（选填）" />
          </Form.Item>
        </Form>
      </Card>

      {/* AI出题工具栏 */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Alert
          type="info"
          showIcon
          icon={<RobotOutlined />}
          message="AI出题助手"
          description={'支持三种出题方式：手动出题、AI智能出题、文件导入识别出题。AI出题需要先在「AI模型配置」中配置模型。'}
          style={{ marginBottom: 16 }}
        />
        <Space size="middle" wrap>
          <Button icon={<PlusOutlined />} onClick={handleAddQuestion}>手动出题</Button>
          <Button icon={<ThunderboltOutlined />} type="primary" onClick={() => setAiGenModalVisible(true)}>
            AI智能出题
          </Button>
          <Upload
            accept=".txt,.md,.html,.json,.csv"
            showUploadList={false}
            beforeUpload={handleFileImport}
          >
            <Button icon={<UploadOutlined />} loading={fileImportLoading}>
              导入文件AI识别出题
            </Button>
          </Upload>
          {questions.length > 0 && (
            <>
              <Divider type="vertical" />
              <Tag color="blue">{questions.length} 题</Tag>
              <Tag color="purple">共 {questions.reduce((s, q) => s + q.score, 0)} 分</Tag>
            </>
          )}
        </Space>
      </Card>

      {/* 题目列表 */}
      <Card
        bordered={false}
        title="题目列表"
        extra={
          <Space>
            <Button icon={<EyeOutlined />} disabled={questions.length === 0} onClick={() => setPreviewVisible(true)}>预览</Button>
            {questions.length > 0 && (
              <Popconfirm title="确定清空所有题目？" onConfirm={() => { setQuestions([]); message.success('已清空'); }}>
                <Button danger>清空</Button>
              </Popconfirm>
            )}
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Table
          dataSource={questions}
          columns={questionColumns}
          rowKey="id"
          pagination={false}
          size="middle"
          locale={{ emptyText: '暂无题目，请使用上方工具出题' }}
        />
        {questions.length > 0 && (
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={handlePublish}>
              发布作业
            </Button>
          </div>
        )}
      </Card>

      {/* 已发布作业 */}
      {publishedList.length > 0 && (
        <Card bordered={false} title="已发布作业">
          <Table dataSource={publishedList} columns={publishedColumns} rowKey="id" pagination={false} size="middle" />
        </Card>
      )}

      {/* ========== AI智能出题弹窗 ========== */}
      <Modal
        title={<Space><BulbOutlined style={{ color: '#faad14' }} />AI智能出题</Space>}
        open={aiGenModalVisible}
        onOk={handleAIGenerate}
        onCancel={() => setAiGenModalVisible(false)}
        okText="开始生成"
        cancelText="取消"
        confirmLoading={aiLoading}
        width={600}
      >
        <Spin spinning={aiLoading} tip="AI正在出题中，请稍候...">
          <Form form={aiGenForm} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item label="课程" name="course" initialValue={form.getFieldValue('course')}>
              <Select placeholder="选择课程">
                {COURSES.map(c => <Option key={c} value={c}>{c}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item
              label="知识点/主题"
              name="topic"
              rules={[{ required: true, message: '请输入知识点或主题' }]}
              extra="输入要出题的知识点，如：导数的基本概念、链表的实现、英语时态等"
            >
              <TextArea rows={2} placeholder="例：高等数学中导数的定义、求导法则、导数应用" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="题目数量" name="count" initialValue={6}>
                  <InputNumber min={1} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="难度" name="difficulty" initialValue="medium">
                  <Select>
                    <Option value="easy">简单</Option>
                    <Option value="medium">中等</Option>
                    <Option value="hard">困难</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Alert
              type="warning"
              showIcon
              message="AI出题说明"
              description="AI将自动生成选择题、判断题、问答题的组合。生成后可在题目列表中编辑修改。"
            />
          </Form>
        </Spin>
      </Modal>

      {/* ========== 手动出题弹窗 ========== */}
      <Modal
        title={editingQuestion ? '编辑题目' : '添加题目'}
        open={questionModalVisible}
        onOk={handleSaveQuestion}
        onCancel={() => setQuestionModalVisible(false)}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Form form={questionForm} layout="vertical">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item label="题目类型" name="type" rules={[{ required: true }]}>
                <Select onChange={(v: QuestionType) => setQuestionType(v)}>
                  <Option value="choice">选择题</Option>
                  <Option value="truefalse">判断题</Option>
                  <Option value="essay">问答题</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="分值" name="score" rules={[{ required: true, message: '请输入分值' }]}>
                <InputNumber min={1} max={100} style={{ width: '100%' }} addonAfter="分" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="题目内容" name="content" rules={[{ required: true, message: '请输入题目内容' }]}>
            <TextArea rows={3} placeholder="请输入题目内容" />
          </Form.Item>
          {questionType === 'choice' && (
            <>
              <Divider orientation="left" plain>选项设置</Divider>
              <Form.Item label="正确答案" name="answer" rules={[{ required: true, message: '请选择正确答案' }]}>
                <Radio.Group>
                  {['A', 'B', 'C', 'D'].map((letter, idx) => (
                    <Radio key={letter} value={letter} style={{ display: 'block', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, marginRight: 8 }}>{letter}.</span>
                      <Form.Item name={['options', idx]} noStyle rules={[{ required: true, message: `请输入选项${letter}` }]}>
                        <Input placeholder={`请输入选项 ${letter}`} style={{ width: 300 }} />
                      </Form.Item>
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            </>
          )}
          {questionType === 'truefalse' && (
            <Form.Item label="正确答案" name="answer" rules={[{ required: true, message: '请选择正确答案' }]}>
              <Radio.Group>
                <Radio value={true}>正确 ✓</Radio>
                <Radio value={false}>错误 ✗</Radio>
              </Radio.Group>
            </Form.Item>
          )}
          {questionType === 'essay' && (
            <Form.Item label="参考答案（供批改参考）" name="answer">
              <TextArea rows={4} placeholder="请输入参考答案（选填，供批改时参考）" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* ========== 预览弹窗 ========== */}
      <Modal
        title="作业预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        <h3>{form.getFieldValue('title') || '未命名作业'}</h3>
        <p style={{ color: '#999' }}>课程：{form.getFieldValue('course') || '未选择'} | 总分：{questions.reduce((s, q) => s + q.score, 0)}分</p>
        <Divider />
        {questions.map((q, idx) => (
          <Card key={q.id} size="small" style={{ marginBottom: 12 }}>
            <p>
              <strong>{idx + 1}. </strong>
              <Tag color={q.type === 'choice' ? 'blue' : q.type === 'truefalse' ? 'green' : 'orange'}>
                {q.type === 'choice' ? '选择题' : q.type === 'truefalse' ? '判断题' : '问答题'}
              </Tag>
              {q.content} <Tag>{q.score}分</Tag>
            </p>
            {q.type === 'choice' && q.options && (
              <div style={{ marginLeft: 16 }}>
                {q.options.map((opt, i) => (
                  <p key={i} style={{ margin: '4px 0', fontWeight: q.answer === String.fromCharCode(65 + i) ? 700 : 400 }}>
                    {String.fromCharCode(65 + i)}. {opt} {q.answer === String.fromCharCode(65 + i) && <span style={{ color: '#52c41a' }}>✓</span>}
                  </p>
                ))}
              </div>
            )}
            {q.type === 'truefalse' && (
              <div style={{ marginLeft: 16 }}>
                <p>正确答案：<strong style={{ color: '#52c41a' }}>{q.answer ? '正确 ✓' : '错误 ✗'}</strong></p>
              </div>
            )}
            {q.type === 'essay' && q.referenceAnswer && (
              <div style={{ marginLeft: 16, background: '#f6ffed', padding: 8, borderRadius: 4 }}>
                <p style={{ fontWeight: 500, color: '#52c41a', margin: 0 }}>参考答案：</p>
                <p style={{ margin: 0 }}>{q.referenceAnswer}</p>
              </div>
            )}
          </Card>
        ))}
      </Modal>

      {/* ========== 已发布作业详情弹窗 ========== */}
      <Modal
        title="已发布作业详情"
        open={!!viewPublished}
        onCancel={() => setViewPublished(null)}
        footer={<Button onClick={() => setViewPublished(null)}>关闭</Button>}
        width={800}
      >
        {viewPublished && (
          <>
            <h3>{viewPublished.title || '未命名作业'}</h3>
            <p style={{ color: '#999' }}>课程：{viewPublished.course || '未选择'} | 总分：{viewPublished.totalScore}分 | 截止：{viewPublished.deadline || '未设置'}</p>
            <Divider />
            {viewPublished.questions?.map((q: Question, idx: number) => (
              <Card key={q.id} size="small" style={{ marginBottom: 12 }}>
                <p>
                  <strong>{idx + 1}. </strong>
                  <Tag color={q.type === 'choice' ? 'blue' : q.type === 'truefalse' ? 'green' : 'orange'}>
                    {q.type === 'choice' ? '选择题' : q.type === 'truefalse' ? '判断题' : '问答题'}
                  </Tag>
                  {q.content} <Tag>{q.score}分</Tag>
                </p>
                {q.type === 'choice' && q.options && (
                  <div style={{ marginLeft: 16 }}>
                    {q.options.map((opt: string, i: number) => (
                      <p key={i} style={{ margin: '4px 0', fontWeight: q.answer === String.fromCharCode(65 + i) ? 700 : 400 }}>
                        {String.fromCharCode(65 + i)}. {opt} {q.answer === String.fromCharCode(65 + i) && <span style={{ color: '#52c41a' }}>✓</span>}
                      </p>
                    ))}
                  </div>
                )}
                {q.type === 'truefalse' && (
                  <div style={{ marginLeft: 16 }}>
                    <p>正确答案：<strong style={{ color: '#52c41a' }}>{q.answer ? '正确 ✓' : '错误 ✗'}</strong></p>
                  </div>
                )}
                {q.type === 'essay' && q.referenceAnswer && (
                  <div style={{ marginLeft: 16, background: '#f6ffed', padding: 8, borderRadius: 4 }}>
                    <p style={{ fontWeight: 500, color: '#52c41a', margin: 0 }}>参考答案：</p>
                    <p style={{ margin: 0 }}>{q.referenceAnswer}</p>
                  </div>
                )}
              </Card>
            ))}
          </>
        )}
      </Modal>
    </div>
  );
};

export default CreateAssignment;
