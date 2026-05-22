/**
 * AI模型服务
 * 支持自定义模型配置、文件识别出题、AI出题、AI批改问答题
 */

/* ======================================================
   配置管理
   ====================================================== */
export interface AIConfig {
  apiUrl: string;
  apiKey: string;
  modelName: string;
}

const STORAGE_KEY = 'edu-ai-config';
const DEFAULT_CONFIG: AIConfig = {
  apiUrl: '/ai-api',
  apiKey: 'tp-ch774hvzep3v61vqxhlkbbnnxsal6z7hrr6ruzdqowm0hb4e',
  modelName: 'mimo-v2.5-pro',
};

export function getAIConfig(): AIConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AIConfig;
      // 自动修正：如果 apiUrl 是外部地址，替换为本地代理地址
      if (parsed.apiUrl && parsed.apiUrl.startsWith('https://')) {
        parsed.apiUrl = '/ai-api';
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {}
  return DEFAULT_CONFIG;
}

export function saveAIConfig(config: AIConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export async function testAIConnection(config?: AIConfig): Promise<boolean> {
  const cfg = config || getAIConfig();
  try {
    const resp = await fetch(`${cfg.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.modelName,
        messages: [{ role: 'user', content: '你好，请回复"连接成功"' }],
        max_tokens: 50,
      }),
    });
    if (!resp.ok) return false;
    const data = await resp.json();
    return !!data.choices?.[0]?.message?.content;
  } catch {
    return false;
  }
}

/* ======================================================
   核心AI调用
   ====================================================== */
async function callAI(messages: { role: string; content: string }[], maxTokens = 4096): Promise<string> {
  const cfg = getAIConfig();
  const resp = await fetch(`${cfg.apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.modelName,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI调用失败: ${resp.status} ${errText}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

/* ======================================================
   题目类型定义
   ====================================================== */
export interface AIQuestion {
  id?: string;
  type: 'choice' | 'truefalse' | 'essay';
  content: string;
  options?: string[];
  answer?: string | boolean;
  referenceAnswer?: string;
  score: number;
}

export interface AIGradingResult {
  score: number;
  maxScore: number;
  comment: string;
  keyPoints: string[];
  strengths: string[];
  improvements: string[];
}

/* ======================================================
   功能1：文件内容识别出题
   ====================================================== */
export async function extractQuestionsFromFile(fileContent: string, course: string = ''): Promise<AIQuestion[]> {
  const prompt = `你是一个专业的教育出题助手。请根据以下教学内容，自动提取/生成题目。

要求：
1. 提取选择题（4个选项，1个正确答案）、判断题、问答题
2. 每种题型至少生成2道，总共不少于6道题
3. 选择题分值10分，判断题10分，问答题20分
4. 问答题需要提供参考答案
5. 题目难度适中，覆盖内容要点

${course ? `课程：${course}` : ''}

教学内容：
${fileContent.substring(0, 6000)}

请严格按以下JSON格式返回（不要包含其他文字）：
[
  {
    "type": "choice",
    "content": "题目内容",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": "A",
    "score": 10
  },
  {
    "type": "truefalse",
    "content": "题目内容",
    "answer": true,
    "score": 10
  },
  {
    "type": "essay",
    "content": "题目内容",
    "referenceAnswer": "参考答案",
    "score": 20
  }
]`;

  const result = await callAI([{ role: 'user', content: prompt }]);
  return parseQuestionsFromAI(result);
}

/* ======================================================
   功能2：AI智能出题
   ====================================================== */
export async function generateQuestionsWithAI(
  topic: string,
  course: string,
  questionCount: number = 6,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<AIQuestion[]> {
  const difficultyMap = { easy: '简单', medium: '中等', hard: '困难' };
  const prompt = `你是一个专业的教育出题助手。请根据以下要求生成题目。

课程：${course}
主题/知识点：${topic}
题目数量：${questionCount}道
难度：${difficultyMap[difficulty]}

要求：
1. 生成选择题（4个选项，1个正确答案）、判断题、问答题的组合
2. 选择题分值10分，判断题10分，问答题20分
3. 问答题需要提供参考答案
4. 题目表述清晰准确

请严格按以下JSON格式返回（不要包含其他文字）：
[
  {
    "type": "choice",
    "content": "题目内容",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": "A",
    "score": 10
  },
  {
    "type": "truefalse",
    "content": "题目内容",
    "answer": true,
    "score": 10
  },
  {
    "type": "essay",
    "content": "题目内容",
    "referenceAnswer": "参考答案",
    "score": 20
  }
]`;

  const result = await callAI([{ role: 'user', content: prompt }]);
  return parseQuestionsFromAI(result);
}

/* ======================================================
   功能3：AI批改问答题
   ====================================================== */
export async function aiGradeEssay(
  question: string,
  referenceAnswer: string,
  studentAnswer: string,
  maxScore: number
): Promise<AIGradingResult> {
  const prompt = `你是一个专业的教育批改助手。请根据以下信息对学生的问答题答案进行评分和点评。

题目：${question}
参考答案：${referenceAnswer}
学生答案：${studentAnswer}
满分：${maxScore}分

请从以下维度评估：
1. 答案的正确性（核心知识点是否正确）
2. 完整性（是否覆盖关键要点）
3. 逻辑性（表述是否清晰有条理）
4. 准确性（术语使用是否准确）

请严格按以下JSON格式返回（不要包含其他文字）：
{
  "score": 评分（0-${maxScore}的整数），
  "maxScore": ${maxScore},
  "comment": "总体评语（50字以内）",
  "keyPoints": ["关键要点1是否答到", "关键要点2是否答到"],
  "strengths": ["优点1", "优点2"],
  "improvements": ["改进建议1", "改进建议2"]
}`;

  const result = await callAI([{ role: 'user', content: prompt }]);
  return parseGradingResult(result, maxScore);
}

/* ======================================================
   解析函数
   ====================================================== */
function parseQuestionsFromAI(text: string): AIQuestion[] {
  try {
    // 尝试提取JSON部分
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      return questions.map((q: any, idx: number) => ({
        id: `ai_${Date.now()}_${idx}`,
        type: q.type || 'essay',
        content: q.content || '',
        options: q.options || undefined,
        answer: q.answer !== undefined ? q.answer : undefined,
        referenceAnswer: q.referenceAnswer || q.answer || '',
        score: q.score || 10,
      }));
    }
  } catch (e) {
    console.error('AI返回内容解析失败:', e);
  }
  // 降级：返回一道问答题
  return [{
    id: `ai_${Date.now()}_0`,
    type: 'essay',
    content: '请根据所学内容回答以下问题。',
    referenceAnswer: '（AI解析失败，请手动编辑）',
    score: 20,
  }];
}

function parseGradingResult(text: string, maxScore: number): AIGradingResult {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(Math.max(0, result.score || 0), maxScore),
        maxScore,
        comment: result.comment || 'AI评分完成',
        keyPoints: result.keyPoints || [],
        strengths: result.strengths || [],
        improvements: result.improvements || [],
      };
    }
  } catch (e) {
    console.error('AI批改结果解析失败:', e);
  }
  return {
    score: Math.round(maxScore * 0.6),
    maxScore,
    comment: 'AI批改解析异常，请人工复核',
    keyPoints: [],
    strengths: [],
    improvements: [],
  };
}

/* ======================================================
   文件内容提取（文本文件直接读取）
   ====================================================== */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file, 'UTF-8');
  });
}
