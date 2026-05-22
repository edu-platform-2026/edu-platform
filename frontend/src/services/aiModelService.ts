/**
 * AI Model Service
 * Supports custom model config, file-based question extraction, AI question generation, AI grading
 */

/* ======================================================
   Configuration Management
   ====================================================== */

export interface AIConfig {
  apiUrl: string;
  apiKey: string;
  modelName: string;
}

const STORAGE_KEY = 'edu-ai-config';
const DEFAULT_CONFIG: AIConfig = {
  apiUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
  apiKey: 'tp-ch774hvzep3v61vqxhlkbbnnxsal6z7hrr6ruzdqowm0hb4e',
  modelName: 'mimo-v2.5-pro',
};

export function getAIConfig(): AIConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AIConfig;
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
        messages: [{ role: 'user', content: 'Hello, reply "Connection successful"' }],
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
   Core AI Call
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
    throw new Error(`AI call failed: ${resp.status} ${errText}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

/* ======================================================
   Question Type Definitions
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
   Feature 1: File Content Question Extraction
   ====================================================== */

export async function extractQuestionsFromFile(fileContent: string, course: string = ''): Promise<AIQuestion[]> {
  const prompt = `You are a professional education question generator. Based on the following teaching content, automatically extract/generate questions.
Requirements:
1. Extract multiple choice (4 options, 1 correct answer), true/false, and essay questions
2. At least 2 of each type, minimum 6 questions total
3. Choice questions: 10 points, true/false: 10 points, essay: 20 points
4. Essay questions need reference answers
5. Questions should be moderately difficult and cover key content points
${course ? `Course: ${course}` : ''}
Teaching content:
${fileContent.substring(0, 6000)}
Return strictly in the following JSON format (no other text):
[
  {
    "type": "choice",
    "content": "Question content",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "A",
    "score": 10
  },
  {
    "type": "truefalse",
    "content": "Question content",
    "answer": true,
    "score": 10
  },
  {
    "type": "essay",
    "content": "Question content",
    "referenceAnswer": "Reference answer",
    "score": 20
  }
]`;
  const result = await callAI([{ role: 'user', content: prompt }]);
  return parseQuestionsFromAI(result);
}

/* ======================================================
   Feature 2: AI Smart Question Generation
   ====================================================== */

export async function generateQuestionsWithAI(
  topic: string,
  course: string,
  questionCount: number = 6,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<AIQuestion[]> {
  const difficultyMap = { easy: 'simple', medium: 'moderate', hard: 'difficult' };
  const prompt = `You are a professional education question generator. Generate questions based on the following requirements.
Course: ${course}
Topic/Knowledge point: ${topic}
Number of questions: ${questionCount}
Difficulty: ${difficultyMap[difficulty]}
Requirements:
1. Generate a mix of multiple choice (4 options, 1 correct answer), true/false, and essay questions
2. Choice questions: 10 points, true/false: 10 points, essay: 20 points
3. Essay questions need reference answers
4. Questions should be clear and accurate
Return strictly in the following JSON format (no other text):
[
  {
    "type": "choice",
    "content": "Question content",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "A",
    "score": 10
  },
  {
    "type": "truefalse",
    "content": "Question content",
    "answer": true,
    "score": 10
  },
  {
    "type": "essay",
    "content": "Question content",
    "referenceAnswer": "Reference answer",
    "score": 20
  }
]`;
  const result = await callAI([{ role: 'user', content: prompt }]);
  return parseQuestionsFromAI(result);
}

/* ======================================================
   Feature 3: AI Essay Grading
   ====================================================== */

export async function aiGradeEssay(
  question: string,
  referenceAnswer: string,
  studentAnswer: string,
  maxScore: number
): Promise<AIGradingResult> {
  const prompt = `You are a professional education grading assistant. Please evaluate and score the student's essay answer based on the following information.
Question: ${question}
Reference answer: ${referenceAnswer}
Student answer: ${studentAnswer}
Maximum score: ${maxScore} points
Please evaluate from the following dimensions:
1. Correctness (core knowledge points)
2. Completeness (coverage of key points)
3. Logic (clear and organized expression)
4. Accuracy (terminology usage)
Return strictly in the following JSON format (no other text):
{
  "score": score (integer 0-${maxScore}),
  "maxScore": ${maxScore},
  "comment": "Overall comment (within 50 words)",
  "keyPoints": ["Key point 1 covered or not", "Key point 2 covered or not"],
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement suggestion 1", "Improvement suggestion 2"]
}`;
  const result = await callAI([{ role: 'user', content: prompt }]);
  return parseGradingResult(result, maxScore);
}

/* ======================================================
   Parsing Functions
   ====================================================== */

function parseQuestionsFromAI(text: string): AIQuestion[] {
  try {
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
    console.error('AI response parsing failed:', e);
  }
  return [{
    id: `ai_${Date.now()}_0`,
    type: 'essay',
    content: 'Please answer the following question based on what you have learned.',
    referenceAnswer: '(AI parsing failed, please edit manually)',
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
        comment: result.comment || 'AI grading complete',
        keyPoints: result.keyPoints || [],
        strengths: result.strengths || [],
        improvements: result.improvements || [],
      };
    }
  } catch (e) {
    console.error('AI grading result parsing failed:', e);
  }
  return {
    score: Math.round(maxScore * 0.6),
    maxScore,
    comment: 'AI grading parsing error, please review manually',
    keyPoints: [],
    strengths: [],
    improvements: [],
  };
}

/* ======================================================
   File Content Extraction
   ====================================================== */

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsText(file, 'UTF-8');
  });
}
