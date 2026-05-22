import React, { useState, useEffect } from 'react';
import {
  Card, Radio, Button, Tag, Divider, message, Result, Progress, Space, Alert, Modal, Spin, Empty,
} from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
  TrophyOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { assignmentService } from '../../services/assignmentService';
import { Assignment } from '../../types/assignment';

/* ======================================================
   题目类型定义
   ====================================================== */
type QuestionType = 'choice' | 'truefalse' | 'essay';

interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[];
  answer?: string | boolean;
  score: number;
}

interface ExamAssignment {
  id: string;
  title: string;
  description?: string;
  questions?: Question[];
  totalScore?: number;
  status?: number;
  [key: string]: any;
}

/* ======================================================
   组件
   ====================================================== */
const Exam: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('id') || '';

  const [assignment, setAssignment] = useState<ExamAssignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ totalScore: number; objectiveScore: number; essayPending: boolean } | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(7200); // 2小时
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await assignmentService.getAssignment(assignmentId) as any;
        const data = res?.data;
        if (data) {
          setAssignment(data);
          // questions 可能是 JSON 字符串或数组
          let q: Question[] = [];
          if (Array.isArray(data.questions)) {
            q = data.questions;
          } else if (typeof data.questions === 'string') {
            try {
              q = JSON.parse(data.questions);
            } catch {
              q = [];
            }
          }
          setQuestions(q);
        }
      } catch (err) {
        message.error('加载作业数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [assignmentId]);

  // 倒计时
  useEffect(() => {
    if (submitted || !assignment) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, assignment]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!assignment) return;

    setSubmitting(true);
    try {
      // 构建提交内容
      const submitContent = JSON.stringify(answers);
      await assignmentService.submitAssignment(assignment.id, { content: submitContent });

      // 自动评分（选择题和判断题，前端预估）
      let objectiveScore = 0;
      let essayCount = 0;
      questions.forEach(q => {
        const userAnswer = answers[q.id];
        if (q.type === 'choice' || q.type === 'truefalse') {
          if (userAnswer !== undefined && userAnswer === q.answer) {
            objectiveScore += q.score;
          }
        } else if (q.type === 'essay') {
          essayCount++;
        }
      });

      setResult({
        totalScore: objectiveScore,
        objectiveScore,
        essayPending: essayCount > 0,
      });
      setSubmitted(true);
      setConfirmVisible(false);
      message.success('作业提交成功');
    } catch (err) {
      message.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '').length;
  const totalQuestions = questions.length;

  // 加载中
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  // 没有找到作业
  if (!assignment || questions.length === 0) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Empty description="未找到该作业或作业无题目" />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/student/assignments')}>
            返回作业列表
          </Button>
        </div>
      </div>
    );
  }

  // 提交后显示结果
  if (submitted && result) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Card bordered={false}>
          <Result
            icon={<TrophyOutlined style={{ color: '#faad14' }} />}
            title="作业提交成功"
            subTitle={`${assignment.title} - ${assignment.courseName || ''}`}
          />
          <Divider />
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Progress
              type="circle"
              percent={result.essayPending ? Math.round(result.objectiveScore / (assignment.totalScore || 100) * 100) : Math.round(result.totalScore / (assignment.totalScore || 100) * 100)}
              format={() => (
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{result.objectiveScore}</div>
                  <div style={{ fontSize: 14, color: '#999' }}>/ {assignment.totalScore || 100}分</div>
                </div>
              )}
              size={160}
              strokeColor={result.objectiveScore >= 60 ? '#52c41a' : '#ff4d4f'}
            />
          </div>
          <Alert
            type="info"
            showIcon
            message="客观题（选择题、判断题）已自动评分"
            description={
              result.essayPending
                ? `主观题（问答题）需要老师人工批改，请耐心等待。当前客观题得分：${result.objectiveScore}分`
                : `所有题目已评分完毕，最终得分：${result.totalScore}分`
            }
            style={{ marginBottom: 16 }}
          />
          <div style={{ textAlign: 'center' }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/student/assignments')}>
              返回作业列表
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* 作业信息头部 */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>{assignment.title}</h2>
            <p style={{ color: '#999', margin: '8px 0 0' }}>
              {assignment.courseName || ''} | 共 {totalQuestions} 题 | 总分 {assignment.totalScore || 100}分
            </p>
            {assignment.description && <p style={{ color: '#666', margin: '8px 0 0' }}>{assignment.description}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: timeLeft < 600 ? '#ff4d4f' : '#1677ff' }}>
              <ClockCircleOutlined /> {formatTime(timeLeft)}
            </div>
            <div style={{ color: '#999', marginTop: 4 }}>
              已答 {answeredCount}/{totalQuestions} 题
            </div>
          </div>
        </div>
      </Card>

      {/* 答题进度 */}
      <Card bordered={false} style={{ marginBottom: 16 }} bodyStyle={{ padding: '12px 24px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {questions.map((q, idx) => {
            const answered = answers[q.id] !== undefined && answers[q.id] !== '';
            return (
              <Tag
                key={q.id}
                color={answered ? 'blue' : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => document.getElementById(q.id)?.scrollIntoView({ behavior: 'smooth' })}
              >
                {idx + 1}
              </Tag>
            );
          })}
        </div>
      </Card>

      {/* 题目列表 */}
      {questions.map((q, idx) => (
        <Card
          key={q.id}
          id={q.id}
          bordered={false}
          style={{ marginBottom: 16 }}
          title={
            <Space>
              <span>第 {idx + 1} 题</span>
              <Tag color={q.type === 'choice' ? 'blue' : q.type === 'truefalse' ? 'green' : 'orange'}>
                {q.type === 'choice' ? '选择题' : q.type === 'truefalse' ? '判断题' : '问答题'}
              </Tag>
              <Tag>{q.score}分</Tag>
            </Space>
          }
        >
          <p style={{ fontSize: 16, marginBottom: 16 }}>{q.content}</p>

          {/* 选择题 */}
          {q.type === 'choice' && q.options && (
            <Radio.Group
              value={answers[q.id]}
              onChange={e => handleAnswerChange(q.id, e.target.value)}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {q.options.map((opt, i) => (
                  <Radio key={i} value={String.fromCharCode(65 + i)} style={{ display: 'block', padding: '8px 16px', background: '#fafafa', borderRadius: 8, width: '100%' }}>
                    <span style={{ fontWeight: 600, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>{opt}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          )}

          {/* 判断题 */}
          {q.type === 'truefalse' && (
            <Radio.Group
              value={answers[q.id]}
              onChange={e => handleAnswerChange(q.id, e.target.value)}
            >
              <Space>
                <Radio.Button value={true} style={{ width: 120, textAlign: 'center' }}>正确</Radio.Button>
                <Radio.Button value={false} style={{ width: 120, textAlign: 'center' }}>错误</Radio.Button>
              </Space>
            </Radio.Group>
          )}

          {/* 问答题 */}
          {q.type === 'essay' && (
            <div>
              <textarea
                value={answers[q.id] || ''}
                onChange={e => handleAnswerChange(q.id, e.target.value)}
                placeholder="请输入你的答案..."
                rows={6}
                style={{
                  width: '100%', padding: 12, border: '1px solid #d9d9d9', borderRadius: 8,
                  fontSize: 14, resize: 'vertical', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = '#1677ff'}
                onBlur={e => e.target.style.borderColor = '#d9d9d9'}
              />
              <div style={{ color: '#999', marginTop: 4, fontSize: 12 }}>
                字数：{(answers[q.id] || '').length} 字 | 此题需老师人工批改
              </div>
            </div>
          )}
        </Card>
      ))}

      {/* 提交按钮 */}
      <Card bordered={false} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {answeredCount < totalQuestions && (
              <span style={{ color: '#faad14' }}>
                <ExclamationCircleOutlined /> 还有 {totalQuestions - answeredCount} 题未作答
              </span>
            )}
            {answeredCount === totalQuestions && (
              <span style={{ color: '#52c41a' }}>
                <CheckCircleOutlined /> 所有题目已作答完毕
              </span>
            )}
          </div>
          <Button type="primary" size="large" onClick={() => setConfirmVisible(true)} loading={submitting}>
            提交作业
          </Button>
        </div>
      </Card>

      {/* 提交确认 */}
      <Modal
        title="确认提交"
        open={confirmVisible}
        onOk={handleSubmit}
        onCancel={() => setConfirmVisible(false)}
        okText="确认提交"
        cancelText="返回修改"
        confirmLoading={submitting}
      >
        <div style={{ textAlign: 'center', padding: 16 }}>
          <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />
          <h3 style={{ marginTop: 16 }}>确定要提交作业吗？</h3>
          <p style={{ color: '#999' }}>
            已答 {answeredCount}/{totalQuestions} 题
            {answeredCount < totalQuestions && `，还有 ${totalQuestions - answeredCount} 题未作答`}
          </p>
          <p style={{ color: '#999' }}>提交后将无法修改答案</p>
        </div>
      </Modal>
    </div>
  );
};

export default Exam;
