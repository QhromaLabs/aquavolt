import { useState, useEffect } from 'react';
import { Typography, Descriptions, Tag, Button, Space, Spin, Alert, Divider } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    HomeOutlined,
    ArrowLeftOutlined,
    LogoutOutlined,
    EditOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTenantData } from '../../hooks/useTenantData';
import MainLayout from '../../components/Layout/MainLayout';
import MobileCard from '../../components/mobile/MobileCard';

const { Title, Text, Paragraph } = Typography;

const TenantProfile = () => {
    const navigate = useNavigate();
    const { user, profile, signOut } = useAuth();
    const { units, loading: unitsLoading } = useTenantData();

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (!profile) {
        return (
            <MainLayout>
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <Spin size="large" />
                    <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                        Loading profile...
                    </Text>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/tenant/dashboard')}
                    style={{ marginBottom: 12, padding: 0 }}
                >
                    Back to Dashboard
                </Button>
                <Title level={2} style={{ margin: 0, fontSize: '24px' }}>
                    My Profile
                </Title>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                    Your account information and settings
                </Text>
            </div>

            {/* Profile Information */}
            <MobileCard
                title={
                    <Space>
                        <UserOutlined style={{ color: '#1ecf49' }} />
                        <span>Personal Information</span>
                    </Space>
                }
                style={{ marginBottom: 16 }}
            >
                <Descriptions column={1} size="small">
                    <Descriptions.Item label="Full Name">
                        <Text strong>{profile.full_name || 'Not set'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                        <Space>
                            <MailOutlined style={{ color: '#8c8c8c' }} />
                            <Text>{profile.email || user?.email || 'Not set'}</Text>
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                        <Space>
                            <PhoneOutlined style={{ color: '#8c8c8c' }} />
                            <Text>{profile.phone || 'Not set'}</Text>
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Role">
                        <Tag color="green">{profile.role?.toUpperCase()}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Member Since">
                        <Text type="secondary">
                            {new Date(profile.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Text>
                    </Descriptions.Item>
                </Descriptions>

                <Button
                    icon={<EditOutlined />}
                    style={{ marginTop: 16, borderRadius: '8px' }}
                    disabled
                >
                    Edit Profile (Coming Soon)
                </Button>
            </MobileCard>

            {/* Assigned Units */}
            <MobileCard
                title={
                    <Space>
                        <HomeOutlined style={{ color: '#1ecf49' }} />
                        <span>My Units ({units.length})</span>
                    </Space>
                }
                style={{ marginBottom: 16 }}
            >
                {unitsLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Spin />
                    </div>
                ) : units.length === 0 ? (
                    <Alert
                        message="No Units Assigned"
                        description="You don't have any units assigned yet. Please contact your landlord."
                        type="info"
                        showIcon
                    />
                ) : (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        {units.map((unit, index) => (
                            <div key={unit.unitId}>
                                {index > 0 && <Divider style={{ margin: '12px 0' }} />}
                                <div style={{ marginBottom: 8 }}>
                                    <Text strong style={{ fontSize: '16px', display: 'block' }}>
                                        {unit.unitLabel}
                                    </Text>
                                    <Tag
                                        color={unit.unitStatus === 'active' ? 'success' : 'default'}
                                        style={{ marginTop: 4 }}
                                    >
                                        {unit.unitStatus}
                                    </Tag>
                                </div>
                                <Descriptions column={1} size="small">
                                    <Descriptions.Item label="Property">
                                        {unit.propertyName}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Location">
                                        {unit.propertyLocation}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Region">
                                        {unit.regionCode}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Meter Number">
                                        <Text strong style={{ fontFamily: 'monospace' }}>
                                            {unit.meterNumber}
                                        </Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Assigned Since">
                                        <Text type="secondary">
                                            {new Date(unit.startDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </Text>
                                    </Descriptions.Item>
                                    {unit.endDate && (
                                        <Descriptions.Item label="Assignment Ends">
                                            <Text type="secondary">
                                                {new Date(unit.endDate).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </Text>
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            </div>
                        ))}
                    </Space>
                )}
            </MobileCard>

            {/* Support Information */}
            <MobileCard
                title="Need Help?"
                style={{ marginBottom: 16 }}
            >
                <Paragraph>
                    If you have any questions or need assistance, please contact support:
                </Paragraph>
                <Space direction="vertical" size="small">
                    <Text>
                        <MailOutlined /> Email: support@aquavolt.com
                    </Text>
                    <Text>
                        <PhoneOutlined /> Phone: +254 700 000 000
                    </Text>
                </Space>
            </MobileCard>

            {/* Logout Button */}
            <Button
                danger
                size="large"
                block
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{
                    height: '52px',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 600,
                }}
            >
                Logout
            </Button>
        </MainLayout>
    );
};

export default TenantProfile;
