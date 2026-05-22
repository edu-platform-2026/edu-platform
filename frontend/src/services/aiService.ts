// AI 聊天服务 - 调用 OpenAI 兼容 API

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIConfig {
  url: string;
  key: string;
  model: string;
}

const AI_CONFIG: AIConfig = {
  url: 'https://token-plan-cn.xiaomimimo.com/v1/chat/completions',
  key: 'tp-ch774hvzep3v61vqxhlkbbnnxsal6z7hrr6ruzdqowm0hb4e',
  model: 'mimo-v2.5-pro',
};

const SYSTEM_PROMPT: ChatMessage = {
  role: 'system',
  content:
    '你是小黑，一个教育管理平台的AI助手。你可以帮助用户解答关于课程、作业、学习进度等问题。请用友好、专业的语气回答问题。',
};

/**
 * 发送消息到 AI 并获取流式回复
 * @param messages 消息历史数组（不含 system prompt）
 * @param onChunk 收到每个文本片段时的回调
 * @returns 最终的完整回复文本
 */
export async function sendMessage(
  messages: ChatMessage[],
  onChunk?: (chunk: string) => void,
): Promise<string> {
  // 拼接 system prompt
  const fullMessages: ChatMessage[] = [SYSTEM_PROMPT, ...messages];

  const response = await fetch(AI_CONFIG.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_CONFIG.key}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      messages: fullMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI 请求失败 (${response.status}): ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法获取响应流');
  }

  const decoder = new TextDecoder('utf-8');
  let fullText = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 按行解析 SSE 数据
      const lines = buffer.split('\n');
      // 保留最后一行（可能不完整）
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onChunk?.(delta);
          }
        } catch {
          // 忽略无法解析的行
        }
      }
    }

    // 处理 buffer 中剩余的数据
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data:')) {
        const data = trimmed.slice(5).trim();
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              onChunk?.(delta);
            }
          } catch {
            // 忽略
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullText;
}

export type { ChatMessage };
