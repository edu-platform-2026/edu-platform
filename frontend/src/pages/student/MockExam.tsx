import React, { useState, useEffect } from 'react';
import {
  Card, Button, Tag, Radio, Space, message, Result, Progress, Modal, Table, Row, Col, Statistic, Alert, Input, Divider, Descriptions, Spin, Empty,
} from 'antd';
import {
  TrophyOutlined, ClockCircleOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { assignmentService } from '../../services/assignmentService';
import { Assignment, AssignmentStatus } from '../../types/assignment';
import { useAuthStore } from '../../stores/authStore';

const { TextArea } = Input;

/* ======================================================
   题目类型定义
   ====================================================== */
interface ExamQuestion {
  id: string;
  type: 'choice' | 'truefalse' | 'essay';
  content: string;
  options?: string[];
  answer: string | boolean;
  score: number;
}

interface ExamAssignment extends Assignment {
  questions?: ExamQuestion[];
}

/* ======================================================
   组件
   ====================================================== */
const MockExam: React.FC = () => {
  const { user } = useAuthStore();
  const [examList, setExamList] = useState<ExamAssignment[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamAssignment | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(7200);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const res = await assignmentService.getAssignments() as any;
        const data = res?.data;
        const items: Assignment[] = Array.isArray(data) ? data : data?.items || [];
        // 过滤已发布的作业作为模拟考试
        const published = items.filter((a: Assignment) => a.status === AssignmentStatus.PUBLISHED);
        setExamList(published as ExamAssignment[]);
      } catch (err) {
        message.error('加载考试数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  useEffect(() => {
    if (!examStarted || examFinished) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleFinish(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted, examFinished]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const selectExam = (exam: ExamAssignment) => {
    setSelectedExam(exam);
    // 解析题目
    let q: ExamQuestion[] = [];
    if (Array.isArray(exam.questions)) {
      q = exam.questions;
    } else if (typeof (exam as any).questions === 'string') {
      try { q = JSON.parse((exam as any).questions); } catch { q = []; }
    }
    setQuestions(q);
    setExamStarted(false);
    setExamFinished(false);
    setAnswers({});
    setTimeLeft(7200);
  };

  const handleFinish = async () => {
    if (!selectedExam) return;

    // 前端预估评分（选择题和判断题）
    let totalScore = 0;
    questions.forEach(q => {
      if (q.type !== 'essay' && answers[q.id] === q.answer) totalScore += q.score;
    });
    setScore(totalScore);

    // 提交到后端
    setSubmitting(true);
    try {
      await assignmentService.submitAssignment(selectedExam.id, { content: JSON.stringify(answers) });
      setExamFinished(true);
      message.success(`考试结束！客观题得分：${totalScore}分`);
    } catch (err) {
      message.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '').length;

  // 加载中
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  // 没有选择考试，显示列表
  if (!selectedExam) {
    return (
      <div>
        <PageHeader title="模拟考试" subtitle="选择一个考试开始作答" />
        {examList.length > 0 ? (
          <Row gutter={[16, 16]}>
            {examList.map(exam => (
              <Col xs={24} sm={12} md={8} key={exam.id}>
                <Card
                  hoverable
                  bordered={false}
                  onClick={() => selectExam(exam)}
                >
                  <h3 style={{ margin: 0 }}>{exam.title}</h3>
                  <p style={{ color: '#999', margin: '8px 0' }}>{exam.courseName || '未知课程'}</p>
                  <p style={{ color: '#666', margin: 0 }}>总分：{exam.totalScore || 100}分</p>
                  <Tag color="blue" style={{ marginTop: 8 }}>点击开始</Tag>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Card bordered={false}>
            <Empty description="暂无可参加的考试" />
          </Card>
        )}
      </div>
    );
  }

  // 考试信息确认页
  if (!examStarted) {
    const totalScoreVal = questions.reduce((s, q) => s + q.score, 0);
    return (
      <div>
        <PageHeader title="模拟考试" subtitle="正式考试模式，限时作答，自动评分" />
        <Card bordered={false} style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center' }}>{selectedExam.title}</h2>
          <Divider />
          <Descriptions column={2}>
            <Descriptions.Item label="考试时长">120分钟</Descriptions.Item>
            <Descriptions.Item label="总分">{totalScoreVal || selectedExam.totalScore || 100}分</Descriptions.Item>
            <Descriptions.Item label="题目数量">{questions.length}题</Descriptions.Item>
            <Descriptions.Item label="课程">{selectedExam.courseName || '-'}</Descriptions.Item>
          </Descriptions>
          <Alert type="warning" showIcon message="考试须知" description="1. 考试开始后计时，超时自动提交；2. 选择题和判断题自动评分；3. 问答题需老师人工批改后计入总分。" style={{ margin: '24px 0' }} />
          {questions.length === 0 ? (
            <Empty description="该作业暂无题目" />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" size="large" onClick={() => setExamStarted(true)}>开始考试</Button>
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button onClick={() => setSelectedExam(null)}>返回列表</Button>
          </div>
        </Card>
      </div>
    );
  }

  // 考试结果
  if (examFinished) {
    const objTotal = questions.filter(q => q.type !== 'essay').reduce((s, q) => s + q.score, 0);
    return (
      <div>
        <PageHeader title="考试结果" />
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}>
            <Card bordered={false} bodyStyle={{ padding: 16 }}>
              <Statistic title="客观题得分" value={score} suffix={`/ ${objTotal}`} valueStyle={{ color: score >= objTotal * 0.6 ? '#52c41a' : '#ff4d4f' }} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card bordered={false} bodyStyle={{ padding: 16 }}>
              <Statistic title="正确率" value={objTotal > 0 ? Math.round(score / objTotal * 100) : 0} suffix="%" prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card bordered={false} bodyStyle={{ padding: 16 }}>
              <Statistic title="用时" value={formatTime(7200 - timeLeft)} prefix={<ClockCircleOutlined />} />
            </Card>
          </Col>
        </Row>
        <Card bordered={false} style={{ marginBottom: 16 }}>
          <h3>答题详情</h3>
          {questions.map((q, idx) => {
            const isCorrect = q.type !== 'essay' && answers[q.id] === q.answer;
            return (
              <div key={q.id} style={{ padding: 12, marginBottom: 8, background: q.type === 'essay' ? '#fffbe6' : isCorrect ? '#f6ffed' : '#fff2f0', borderRadius: 8, border: `1px solid ${q.type === 'essay' ? '#ffe58f' : isCorrect ? '#b7eb8f' : '#ffccc7'}` }}>
                <Tag color={q.type === 'choice' ? 'blue' : q.type === 'truefalse' ? 'green' : 'orange'}>{q.type === 'choice' ? '选择' : q.type === 'truefalse' ? '判断' : '问答'}</Tag>
                <span>{idx + 1}. {q.content}</span>
                {q.type !== 'essay' && (
                  <Tag color={isCorrect ? 'green' : 'red'} style={{ marginLeft: 8 }}>{isCorrect ? '正确' : '错误'} ({q.score}分)</Tag>
                )}
                {q.type === 'essay' && <Tag color="orange">待批改 ({q.score}分)</Tag>}
              </div>
            );
          })}
        </Card>
        <Card bordered={false}>
          <div style={{ textAlign: 'center' }}>
            <Button type="primary" onClick={() => { setSelectedExam(null); setExamStarted(false); setExamFinished(false); setAnswers({}); setTimeLeft(7200); }}>返回考试列表</Button>
          </div>
        </Card>
      </div>
    );
  }

  // 答题中
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{selectedExam.title}</h3>
          <Space>
            <Tag color="blue">已答 {answeredCount}/{questions.length}</Tag>
            <span style={{ fontSize: 24, fontWeight: 700, color: timeLeft < 600 ? '#ff4d4f' : '#1677ff' }}>
              <ClockCircleOutlined /> {formatTime(timeLeft)}
            </span>
          </Space>
        </div>
      </Card>

      {questions.map((q, idx) => (
        <Card key={q.id} id={`q-${q.id}`} bordered={false} style={{ marginBottom: 16 }}
          title={<Space><span>第{idx + 1}题</span><Tag color={q.type === 'choice' ? 'blue' : q.type === 'truefalse' ? 'green' : 'orange'}>{q.type === 'choice' ? '选择' : q.type === 'truefalse' ? '判断' : '问答'}</Tag><Tag>{q.score}分</Tag></Space>}
        >
          <p style={{ fontSize: 16, marginBottom: 16 }}>{q.content}</p>
          {q.type === 'choice' && q.options && (
            <Radio.Group value={answers[q.id]} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {q.options.map((opt, i) => (
                  <Radio key={i} value={String.fromCharCode(65 + i)} style={{ display: 'block', padding: '8px 16px', background: '#fafafa', borderRadius: 8, width: '100%' }}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          )}
          {q.type === 'truefalse' && (
            <Radio.Group value={answers[q.id]} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}>
              <Radio.Button value={true}>正确</Radio.Button>
              <Radio.Button value={false}>错误</Radio.Button>
            </Radio.Group>
          )}
          {q.type === 'essay' && (
            <TextArea rows={5} value={answers[q.id] || ''} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder="请输入你的答案..." />
          )}
        </Card>
      ))}

      <Card bordered={false} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{answeredCount < questions.length ? `还有 ${questions.length - answeredCount} 题未作答` : '所有题目已作答'}</span>
          <Button type="primary" size="large" onClick={handleFinish} loading={submitting}>提交试卷</Button>
        </div>
      </Card>
    </div>
  );
};

export default MockExam;
