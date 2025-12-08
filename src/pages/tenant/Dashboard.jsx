import { Typography, Row, Col, Statistic, Button, Empty, Spin, Alert, Space, Tag } from 'antd';
import {
    ThunderboltOutlined,
    DollarOutlined,
    ShoppingOutlined,
    HistoryOutlined,
    HomeOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTenantData } from '../../hooks/useTenantData';
import MainLayout from '../../components/Layout/MainLayout';
import MobileCard from '../../components/mobile/MobileCard';

const { Title, Text, Paragraph } = Typography;

const TenantDashboard = () => {
    const navigate = useNavigate();
    const { units, topups, loading, error, hasUnits, hasTopups, refetch } = useTenantData();

    // Calculate total spent
    const totalSpent = topups.reduce((sum, topup) => sum + parseFloat(topup.amount_paid || 0), 0);

    if (loading) {
        return (
            <MainLayout>
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
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
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
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0, fontSize: '24px' }}>
                    Welcome Back! ⚡
                </Title>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                    Manage your electricity units
                </Text>
            </div>

            {/* Quick Actions - Mobile Optimized */}
            <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={8}>
                    <Button
                        type="primary"
                        size="large"
                        block
                        icon={<ShoppingOutlined />}
                        onClick={() => navigate('/tenant/buy-token')}
                        style={{
                            height: '56px',
                            borderRadius: '10px',
                            fontSize: '15px',
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #1ecf49 0%, #36ea98 100%)',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(30, 207, 73, 0.3)',
                        }}
                    >
                        Buy Token
                    </Button>
                </Col>
                <Col xs={12} sm={8}>
                    <Button
                        size="large"
                        block
                        icon={<HistoryOutlined />}
                        onClick={() => navigate('/tenant/history')}
                        style={{
                            height: '56px',
                            borderRadius: '10px',
                            fontSize: '15px',
                            fontWeight: 500,
                        }}
                    >
                        History
                    </Button>
                </Col>
                <Col xs={24} sm={8}>
                    <Button
                        size="large"
                        block
                        icon={<UserOutlined />}
                        onClick={() => navigate('/tenant/profile')}
                        style={{
                            height: '56px',
                            borderRadius: '10px',
                            fontSize: '15px',
                            fontWeight: 500,
                        }}
                    >
                        My Profile
                    </Button>
                </Col>
            </Row>

            {/* Statistics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={12}>
                    <MobileCard bodyStyle={{ padding: '20px' }}>
                        <Statistic
                            title={<span style={{ fontSize: '13px', fontWeight: 500 }}>Active Units</span>}
                            value={units.length}
                            suffix="units"
                            valueStyle={{ color: '#1ecf49', fontSize: '28px', fontWeight: 700 }}
                            prefix={<HomeOutlined />}
                        />
                    </MobileCard>
                </Col>
                <Col xs={12} sm={12}>
                    <MobileCard bodyStyle={{ padding: '20px' }}>
                        <Statistic
                            title={<span style={{ fontSize: '13px', fontWeight: 500 }}>Total Spent</span>}
                            value={totalSpent.toFixed(2)}
                            prefix="KES"
                            valueStyle={{ color: '#36ea98', fontSize: '28px', fontWeight: 700 }}
                            suffix={<DollarOutlined />}
                        />
                    </MobileCard>
                </Col>
            </Row>

            {/* Assigned Units */}
            <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ marginBottom: 16, fontSize: '18px' }}>
                    My Units
                </Title>
                {!hasUnits ? (
                    <MobileCard>
                        <Empty
                            description="No units assigned"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    </MobileCard>
                ) : (
                    <Row gutter={[12, 12]}>
                        {units.map((unit) => (
                            <Col xs={24} sm={12} key={unit.unitId}>
                                <MobileCard
                                    hoverable
                                    onClick={() => navigate('/tenant/buy-token', { state: { selectedUnit: unit.unitId } })}
                                >
                                    <div style={{ marginBottom: 12 }}>
                                        <Space>
                                            <HomeOutlined style={{ fontSize: '20px', color: '#1ecf49' }} />
                                            <Text strong style={{ fontSize: '16px' }}>
                                                {unit.unitLabel}
                                            </Text>
                                        </Space>
                                        <Tag
                                            color={unit.unitStatus === 'active' ? 'success' : 'default'}
                                            style={{ marginLeft: 8 }}
                                        >
                                            {unit.unitStatus}
                                        </Tag>
                                    </div>
                                    <div style={{ marginBottom: 8 }}>
                                        <Text type="secondary" style={{ fontSize: '13px', display: 'block' }}>
                                            Property: {unit.propertyName}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: '13px', display: 'block' }}>
                                            Location: {unit.propertyLocation}
                                        </Text>
                                    </div>
                                    <div style={{
                                        padding: '10px',
                                        background: '#f5f5f5',
                                        borderRadius: '6px',
                                        marginTop: 12
                                    }}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            Meter Number
                                        </Text>
                                        <div>
                                            <Text strong style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                                                {unit.meterNumber}
                                            </Text>
                                        </div>
                                    </div>
                                </MobileCard>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            {/* Recent Top-ups */}
            <div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16
                }}>
                    <Title level={4} style={{ margin: 0, fontSize: '18px' }}>
                        Recent Purchases
                    </Title>
                    {hasTopups && (
                        <Button
                            type="link"
                            onClick={() => navigate('/tenant/history')}
                            style={{ padding: 0 }}
                        >
                            View All
                        </Button>
                    )}
                </div>
                {!hasTopups ? (
                    <MobileCard>
                        <Empty
                            description="No purchases yet"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                            <Button
                                type="primary"
                                onClick={() => navigate('/tenant/buy-token')}
                                style={{
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #1ecf49 0%, #36ea98 100%)',
                                    border: 'none'
                                }}
                            >
                                Buy Your First Token
                            </Button>
                        </Empty>
                    </MobileCard>
                ) : (
                    <Row gutter={[12, 12]}>
                        {topups.slice(0, 3).map((topup) => (
                            <Col xs={24} key={topup.id}>
                                <MobileCard bodyStyle={{ padding: '16px' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: 12
                                    }}>
                                        <div>
                                            <Text strong style={{ fontSize: '16px', color: '#1ecf49' }}>
                                                KES {parseFloat(topup.amount_paid).toFixed(2)}
                                            </Text>
                                            <Text type="secondary" style={{ display: 'block', fontSize: '13px' }}>
                                                {topup.units?.label || 'Unit'}
                                            </Text>
                                        </div>
                                        <Tag color="success">
                                            {topup.futurise_status || 'Completed'}
                                        </Tag>
                                    </div>
                                    <div style={{ marginBottom: 8 }}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {new Date(topup.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    </div>
                                    {topup.token && (
                                        <div style={{
                                            background: '#f9f9f9',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            border: '1px dashed #d9d9d9'
                                        }}>
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: '11px', display: 'block', marginBottom: 4 }}
                                            >
                                                Token
                                            </Text>
                                            <Text
                                                strong
                                                style={{
                                                    fontSize: '13px',
                                                    fontFamily: 'monospace',
                                                    wordBreak: 'break-all'
                                                }}
                                            >
                                                {topup.token}
                                            </Text>
                                        </div>
                                    )}
                                </MobileCard>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>
        </MainLayout>
    );
};

export default TenantDashboard;

