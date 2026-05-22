import React from 'react';
import { Button, Row, Col, Typography, Card, Space, Divider } from 'antd';
import {
  BookOutlined, TeamOutlined, TrophyOutlined, SafetyCertificateOutlined,
  PhoneOutlined, MailOutlined, EnvironmentOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getRoleHomePath } from '../../utils/permission';

const { Title, Paragraph, Text } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const features = [
    {
      icon: <BookOutlined style={{ fontSize: 48, color: '#1677ff' }} />,
      title: '丰富课程',
      description: '涵盖数学、英语、物理、化学等多学科优质课程，满足不同学习需求。',
    },
    {
      icon: <TeamOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      title: '优秀师资',
      description: '拥有经验丰富的教师团队，提供专业的教学指导和个性化辅导。',
    },
    {
      icon: <TrophyOutlined style={{ fontSize: 48, color: '#faad14' }} />,
      title: '卓越成果',
      description: '学员成绩显著提升，多名学员考入理想学校，教学成果有目共睹。',
    },
    {
      icon: <SafetyCertificateOutlined style={{ fontSize: 48, color: '#722ed1' }} />,
      title: '安全保障',
      description: '完善的教学管理体系，实时掌握学习进度，让家长放心、学生安心。',
    },
  ];

  const stats = [
    { value: '1000+', label: '在读学员' },
    { value: '50+', label: '优秀教师' },
    { value: '30+', label: '精品课程' },
    { value: '98%', label: '满意度' },
  ];

  return (
    <div>
      {/* Hero区域 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '80px 48px',
          textAlign: 'center',
          color: '#fff',
        }}
      >
        <Title style={{ color: '#fff', marginBottom: 16, fontSize: 42 }}>
          小黑教育培训中心
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, marginBottom: 32 }}>
          专注中小学课外辅导，助力每一位学生成就更好的自己
        </Paragraph>
        <Space size="large">
          {isAuthenticated && user ? (
            <Button
              type="primary"
              size="large"
              style={{ height: 48, padding: '0 32px', fontSize: 16 }}
              onClick={() => navigate(getRoleHomePath(user.role))}
            >
              进入工作台
            </Button>
          ) : (
            <>
              <Button
                type="primary"
                size="large"
                ghost
                style={{ height: 48, padding: '0 32px', fontSize: 16 }}
                onClick={() => navigate('/login')}
              >
                立即登录
              </Button>
              <Button
                type="primary"
                size="large"
                style={{ height: 48, padding: '0 32px', fontSize: 16 }}
                onClick={() => navigate('/register')}
              >
                免费注册
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* 数据统计 */}
      <div style={{ padding: '48px', background: '#fff' }}>
        <Row gutter={[32, 32]} justify="center">
          {stats.map((stat, index) => (
            <Col xs={12} sm={6} key={index}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#1677ff' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 16, color: '#666', marginTop: 8 }}>
                  {stat.label}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* 课程特色 */}
      <div style={{ padding: '64px 48px', background: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Title level={2}>我们的优势</Title>
          <Paragraph style={{ fontSize: 16, color: '#666' }}>
            专业的教学团队，科学的教学方法，让学习更高效
          </Paragraph>
        </div>
        <Row gutter={[24, 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card
                bordered={false}
                style={{ textAlign: 'center', height: '100%', borderRadius: 12 }}
                bodyStyle={{ padding: '32px 24px' }}
                hoverable
              >
                <div style={{ marginBottom: 16 }}>{feature.icon}</div>
                <Title level={4}>{feature.title}</Title>
                <Paragraph type="secondary">{feature.description}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 联系方式 */}
      <div style={{ padding: '64px 48px', background: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Title level={2}>联系我们</Title>
          <Paragraph style={{ fontSize: 16, color: '#666' }}>
            欢迎随时咨询，我们将竭诚为您服务
          </Paragraph>
        </div>
        <Row gutter={[32, 32]} justify="center">
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ textAlign: 'center' }}>
              <PhoneOutlined style={{ fontSize: 32, color: '#1677ff', marginBottom: 16 }} />
              <div>
                <Text strong>电话咨询</Text>
              </div>
              <div>
                <Text type="secondary">19807272440</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ textAlign: 'center' }}>
              <MailOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 16 }} />
              <div>
                <Text strong>邮箱</Text>
              </div>
              <div>
                <Text type="secondary">3410551089@qq.com</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ textAlign: 'center' }}>
              <EnvironmentOutlined style={{ fontSize: 32, color: '#faad14', marginBottom: 16 }} />
              <div>
                <Text strong>地址</Text>
              </div>
              <div>
                <Text type="secondary">四川省巴中市粉壁镇发展街</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ textAlign: 'center' }}>
              <ClockCircleOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 16 }} />
              <div>
                <Text strong>工作时间</Text>
              </div>
              <div>
                <Text type="secondary">周一至周五 9:00-18:00</Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default HomePage;
