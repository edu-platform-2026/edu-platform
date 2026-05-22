import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FloatButton,
  Card,
  Input,
  Button,
  Avatar,
  List,
  Typography,
  message as antdMessage,
} from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  CloseOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { sendMessage, ChatMessage } from '../services/aiService';

const { Text } = Typography;

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const ChatBot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 打开聊天窗口时聚焦输入框
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || loading) return;

    // 添加用户消息
    const userMsg: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    // 添加 AI 占位消息
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: DisplayMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInputValue('');
    setLoading(true);

    try {
      // 构造消息历史
      const history: ChatMessage[] = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      await sendMessage(history, (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, content: m.content + chunk } : m,
          ),
        );
      });

      // 如果最终 AI 回复为空，显示提示
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId && !m.content
            ? { ...m, content: '抱歉，我暂时无法回答这个问题。' }
            : m,
        ),
      );
    } catch (error: any) {
      console.error('AI 请求失败:', error);
      antdMessage.error('AI 服务暂时不可用，请稍后再试');
      // 移除空的 AI 消息
      setMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <>
      {/* 浮动按钮 */}
      {!open && (
        <FloatButton
          icon={<RobotOutlined />}
          type="primary"
          onClick={() => setOpen(true)}
          style={{
            right: 24,
            bottom: 24,
            width: 56,
            height: 56,
          }}
          tooltip="小黑 AI 助手"
        />
      )}

      {/* 聊天窗口 */}
      {open && (
        <div
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            width: 380,
            height: 500,
            zIndex: 1000,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar
                  icon={<RobotOutlined />}
                  style={{ backgroundColor: '#1677ff' }}
                  size={32}
                />
                <span style={{ fontSize: 16, fontWeight: 600 }}>
                  小黑 - AI 助手
                </span>
              </div>
            }
            extra={
              <div style={{ display: 'flex', gap: 4 }}>
                <Button
                  type="text"
                  size="small"
                  onClick={handleClear}
                  style={{ fontSize: 12, color: '#999' }}
                >
                  清空
                </Button>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => setOpen(false)}
                />
              </div>
            }
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 12,
            }}
            styles={{
              body: {
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
              },
              header: {
                borderBottom: '1px solid #f0f0f0',
                padding: '12px 16px',
                minHeight: 'auto',
              },
            }}
          >
            {/* 消息列表 */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                background: '#f5f5f5',
              }}
            >
              {messages.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 0',
                    color: '#999',
                  }}
                >
                  <RobotOutlined
                    style={{ fontSize: 40, marginBottom: 12, color: '#bbb' }}
                  />
                  <div>
                    <Text type="secondary">你好！我是小黑，有什么可以帮你的？</Text>
                  </div>
                </div>
              )}
              <List
                dataSource={messages}
                split={false}
                renderItem={(msg) => (
                  <List.Item
                    style={{
                      border: 'none',
                      padding: '4px 0',
                      background: 'transparent',
                      display: 'flex',
                      justifyContent:
                        msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        maxWidth: '85%',
                        flexDirection:
                          msg.role === 'user' ? 'row-reverse' : 'row',
                      }}
                    >
                      {msg.role === 'assistant' && (
                        <Avatar
                          icon={<RobotOutlined />}
                          style={{ backgroundColor: '#1677ff', flexShrink: 0 }}
                          size={32}
                        />
                      )}
                      {msg.role === 'user' && (
                        <Avatar
                          icon={<UserOutlined />}
                          style={{ backgroundColor: '#87d068', flexShrink: 0 }}
                          size={32}
                        />
                      )}
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: 12,
                          backgroundColor:
                            msg.role === 'user' ? '#1677ff' : '#fff',
                          color: msg.role === 'user' ? '#fff' : '#333',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.6,
                          fontSize: 14,
                        }}
                      >
                        {msg.content || (loading && msg.role === 'assistant' ? '思考中...' : '')}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #f0f0f0',
                display: 'flex',
                gap: 8,
                background: '#fff',
              }}
            >
              <Input.TextArea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你的问题..."
                autoSize={{ minRows: 1, maxRows: 3 }}
                disabled={loading}
                style={{ borderRadius: 8, resize: 'none' }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={loading}
                disabled={!inputValue.trim()}
                style={{ borderRadius: 8, flexShrink: 0, height: 'auto' }}
              />
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default ChatBot;
