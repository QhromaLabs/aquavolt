import { useState, useEffect, useRef } from 'react';
import { Typography, Row, Col, Statistic, Button, Empty, Spin, Alert, Space, Tag, Avatar, Badge, message, Modal } from 'antd';

import {
    ThunderboltOutlined,
    HistoryOutlined,
    UserOutlined,
    BellOutlined,
    CopyOutlined,
    MessageOutlined,
    CustomerServiceOutlined,
    CheckCircleOutlined,
    QrcodeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTenantData } from '../../hooks/useTenantData';
import { useAuth } from '../../hooks/useAuth';
import { useNotificationCount } from '../../hooks/useNotificationCount';
import TenantLayout from '../../layouts/TenantLayout';
import MobileCard from '../../components/mobile/MobileCard';
import { supabase } from '../../lib/supabase';
import TokenReceiptModal from '../../components/common/TokenReceiptModal';
import ScanModal from '../../components/common/ScanModal';

const { Title, Text } = Typography;

const TenantDashboard = () => {
    const navigate = useNavigate();
    const { units, topups, loading, error, hasUnits, hasTopups, refetch } = useTenantData();
    const { profile } = useAuth(); // Get user profile for name
    const { unreadCount } = useNotificationCount();

    const [selectedTopup, setSelectedTopup] = useState(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const handleScan = async (decodedText) => {
        try {
            const data = JSON.parse(decodedText);
            if (data.action === 'claim_unit' && data.unit_id) {
                message.loading('Linking unit...', 0);

                const { error } = await supabase
                    .from('unit_assignments')
                    .insert({
                        unit_id: data.unit_id,
                        tenant_id: profile?.id,
                        status: 'active',
                        start_date: new Date().toISOString()
                    });

                message.destroy();

                if (error) {
                    console.error('Linking error:', error);
                    if (error.code === '23505') {
                        message.warning('You are already assigned to this unit.');
                    } else {
                        message.error('Failed to link unit.');
                    }
                } else {
                    message.success('Unit linked successfully!');
                    refetch();
                }
            } else {
                message.error('Invalid QR Code');
            }
        } catch (e) {
            console.error(e);
            message.error('Error processing QR code');
        }
    };

    // Helper to get first name
    const firstName = profile?.full_name?.split(' ')[0] || 'User';

    // Get primary unit (first one) or null
    const primaryUnit = units && units.length > 0 ? units[0] : null;

    const [supportPhone, setSupportPhone] = useState('');

    // Helper to format token
    const formatToken = (token) => {
        if (!token) return '';
        // Remove existing dashes if any, then group by 4
        const cleanToken = token.replace(/-/g, '');
        return cleanToken.match(/.{1,4}/g)?.join('-') || token;
    };

    const handleCopyToken = (token) => {
        if (!token) return;
        const cleanToken = token.replace(/-/g, '');
        navigator.clipboard.writeText(cleanToken);
        message.success('Token copied to clipboard!');
    };

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase
                .from('admin_settings')
                .select('value')
                .eq('key', 'support_phone_whatsapp')
                .single();
            if (data?.value) {
                setSupportPhone(data.value);
            }
        };
        fetchSettings();
    }, []);

    if (loading) {
        return (
            <TenantLayout>
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    minHeight: '50vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Space direction="vertical" size="large">
                        <Spin size="large" />
                        <Text type="secondary">Loading your dashboard...</Text>
                    </Space>
                </div>
            </TenantLayout>
        );
    }

    if (error) {
        return (
            <TenantLayout>
                <div style={{ padding: '20px' }}>
                    <Alert
                        message="Error Loading Data"
                        description={error}
                        type="error"
                        showIcon
                        action={
                            <Button size="small" onClick={refetch}>
                                Retry
                            </Button>
                        }
                    />
                </div>
            </TenantLayout>
        );
    }

    return (
        <TenantLayout>
            <div style={{ padding: '20px' }}>
                {/* Header: Greeting + Notification */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24
                }}>
                    <div>
                        <Text type="secondary" style={{ fontSize: '14px' }}>Hello,</Text>
                        <Title level={2} style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
                            {firstName} 👋
                        </Title>
                    </div>
                    <Space>
                        <Button
                            icon={<QrcodeOutlined />}
                            shape="circle"
                            size="large"
                            onClick={() => setIsScannerOpen(true)}
                            style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                        />
                        <Badge count={unreadCount} size="small" offset={[-5, 5]}>
                            <Button
                                shape="circle"
                                icon={<BellOutlined />}
                                size="large"
                                onClick={() => navigate('/tenant/notifications')}
                                style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                            />
                        </Badge>
                    </Space>
                </div>

                {/* Main Card: Green Gradient */}
                <div style={{
                    background: 'linear-gradient(135deg, #1ecf49 0%, #0eb53e 100%)',
                    borderRadius: '20px',
                    padding: '24px',
                    color: 'white',
                    marginBottom: 24,
                    boxShadow: '0 10px 20px rgba(30, 207, 73, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Decorative circles */}
                    <div style={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)'
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: -30,
                        left: -10,
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)'
                    }} />

                    {primaryUnit ? (
                        <>
                            <div style={{ marginBottom: 16 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
                                    Meter Number
                                </Text>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Title level={3} style={{ color: 'white', margin: 0, fontFamily: 'monospace', letterSpacing: '1px' }}>
                                        {primaryUnit.meterNumber}
                                    </Title>
                                    <CopyOutlined
                                        onClick={() => handleCopyToken(primaryUnit.meterNumber)}
                                        style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 24 }}>
                                <div>
                                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', display: 'block' }}>
                                        Apartment
                                    </Text>
                                    <Text strong style={{ color: 'white', fontSize: '15px' }}>
                                        {primaryUnit.propertyName}
                                    </Text>
                                </div>
                                <div>
                                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', display: 'block' }}>
                                        Unit
                                    </Text>
                                    <Text strong style={{ color: 'white', fontSize: '15px' }}>
                                        {primaryUnit.unitLabel}
                                    </Text>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <Text style={{ color: 'white' }}>No unit assigned yet.</Text>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <Text strong style={{ fontSize: '16px', marginBottom: 12, display: 'block' }}>Quick Actions</Text>
                <Row gutter={[12, 12]} style={{ marginBottom: 30 }}>
                    <Col span={12}>
                        <div
                            onClick={() => navigate('/tenant/buy-token')}
                            style={{
                                background: 'white',
                                padding: '16px 8px',
                                borderRadius: '16px',
                                textAlign: 'center',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                background: '#e6f9eb',
                                color: '#1ecf49',
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 8px',
                                fontSize: '20px'
                            }}>
                                <ThunderboltOutlined />
                            </div>
                            <Text style={{ fontSize: '12px', fontWeight: 500 }}>Buy Token</Text>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div
                            onClick={() => navigate('/tenant/history')}
                            style={{
                                background: 'white',
                                padding: '16px 8px',
                                borderRadius: '16px',
                                textAlign: 'center',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                background: '#fff7e6',
                                color: '#fa8c16',
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 8px',
                                fontSize: '20px'
                            }}>
                                <HistoryOutlined />
                            </div>
                            <Text style={{ fontSize: '12px', fontWeight: 500 }}>History</Text>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div
                            onClick={() => navigate('/tenant/profile')}
                            style={{
                                background: 'white',
                                padding: '16px 8px',
                                borderRadius: '16px',
                                textAlign: 'center',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                background: '#e6f7ff',
                                color: '#1890ff',
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 8px',
                                fontSize: '20px'
                            }}>
                                <UserOutlined />
                            </div>
                            <Text style={{ fontSize: '12px', fontWeight: 500 }}>Profile</Text>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div
                            onClick={() => {
                                if (supportPhone) {
                                    window.open(`https://wa.me/${supportPhone}`, '_blank');
                                } else {
                                    // Fallback if not configured
                                    alert('Support number not configured yet.');
                                }
                            }}
                            style={{
                                background: 'white',
                                padding: '16px 8px',
                                borderRadius: '16px',
                                textAlign: 'center',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                cursor: 'pointer',
                                opacity: supportPhone ? 1 : 0.6
                            }}
                        >
                            <div style={{
                                background: '#f0f5ff',
                                color: '#25D366', // WhatsApp green
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 8px',
                                fontSize: '20px'
                            }}>
                                <CustomerServiceOutlined />
                            </div>
                            <Text style={{ fontSize: '12px', fontWeight: 500 }}>Contact Support</Text>
                        </div>
                    </Col>
                </Row>

                {/* Recent Purchases */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text strong style={{ fontSize: '16px' }}>Recent Tokens</Text>
                    <Button type="link" onClick={() => navigate('/tenant/history')} style={{ padding: 0 }}>View All</Button>
                </div>

                {!hasTopups ? (
                    <Empty description="No tokens yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {topups.slice(0, 3).map((topup) => (
                            <div
                                key={topup.id}
                                onClick={() => setSelectedTopup(topup)}
                                style={{
                                    background: 'white',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    transition: 'transform 0.1s',
                                }}
                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        background: '#f6ffed',
                                        padding: '10px',
                                        borderRadius: '10px',
                                        color: '#52c41a'
                                    }}>
                                        <ThunderboltOutlined />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <Text strong style={{ fontSize: '14px', lineHeight: '1.2' }}>
                                            {topup.units?.label}
                                        </Text>
                                        {topup.token && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                                <Text code style={{
                                                    margin: 0,
                                                    fontSize: '15px',
                                                    color: '#1ecf49',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    padding: 0,
                                                    fontWeight: 600,
                                                    fontFamily: 'monospace'
                                                }}>
                                                    {formatToken(topup.token.slice(0, 16))}...
                                                </Text>
                                            </div>
                                        )}
                                        <Text type="secondary" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                                            {new Date(topup.created_at).toLocaleDateString()}
                                        </Text>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <Text strong style={{ display: 'block', color: '#1ecf49' }}>
                                        KES {parseFloat(topup.amount_paid).toFixed(0)}
                                    </Text>
                                    <Tag color={topup.futurise_status === 'success' ? 'success' : 'warning'} style={{ margin: 0, fontSize: '10px' }}>
                                        {topup.futurise_status || 'Pending'}
                                    </Tag>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ScanModal
                open={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScan}
            />

            <TokenReceiptModal
                visible={!!selectedTopup}
                onClose={() => setSelectedTopup(null)}
                topup={selectedTopup}
                tenantName={profile?.full_name}
            />
        </TenantLayout >
    );
};

export default TenantDashboard;
