import React, { useRef } from 'react';
import { Button, Typography, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';

const { Text } = Typography;

interface InvitePosterProps {
  code: string;
  role: string;
  userName: string;
}

const roleLabels: Record<string, string> = {
  STUDENT: '学生',
  PARENT: '家长',
  TEACHER: '教师',
};

const InvitePoster: React.FC<InvitePosterProps> = ({ code, role, userName }) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const registerUrl = `${window.location.origin}/register?code=${code}`;

  const handleDownload = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      if (posterRef.current) {
        const canvas = await html2canvas(posterRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
        });
        const link = document.createElement('a');
        link.download = `invite-poster-${code}.png`;
        link.href = canvas.toDataURL();
        link.click();
        message.success('海报已保存');
      }
    } catch {
      message.error('下载失败，请截图保存');
    }
  };

  return (
    <div>
      <div
        ref={posterRef}
        style={{
          width: 360,
          padding: 24,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>小黑教育</div>
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 20 }}>专注中小学课外辅导</div>

        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: 20,
            margin: '0 auto',
            maxWidth: 280,
          }}
        >
          <div style={{ color: '#333', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            邀请你加入{roleLabels[role] || role}团队
          </div>
          <div style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
            邀请人：{userName}
          </div>
          <QRCodeSVG value={registerUrl} size={180} level="M" />
          <div style={{ color: '#999', fontSize: 12, marginTop: 12 }}>
            扫码注册，加入小黑教育
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 8,
            display: 'inline-block',
          }}
        >
          <span style={{ fontSize: 12, opacity: 0.8 }}>邀请码：</span>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 3 }}>{code}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
          下载海报
        </Button>
      </div>
    </div>
  );
};

export default InvitePoster;
