import React from 'react';
import { Breadcrumb, Space, Typography } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface BreadcrumbItem {
  title: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  extra?: React.ReactNode;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs = [],
  extra,
  children,
}) => {
  const navigate = useNavigate();

  const breadcrumbItems = [
    {
      title: (
        <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <HomeOutlined />
        </span>
      ),
    },
    ...breadcrumbs.map((item) => ({
      title: item.path ? (
        <span
          onClick={() => navigate(item.path!)}
          style={{ cursor: 'pointer' }}
        >
          {item.title}
        </span>
      ) : (
        item.title
      ),
    })),
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 16 }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: children ? 16 : 0,
        }}
      >
        <div>
          <Title level={4} style={{ marginBottom: subtitle ? 4 : 0 }}>
            {title}
          </Title>
          {subtitle && (
            <Typography.Text type="secondary">{subtitle}</Typography.Text>
          )}
        </div>
        {extra && <Space>{extra}</Space>}
      </div>
      {children}
    </div>
  );
};

export default PageHeader;