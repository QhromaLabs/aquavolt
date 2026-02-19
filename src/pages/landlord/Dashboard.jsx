import { Typography, Row, Col, Spin } from 'antd';
import {
    DollarOutlined,
    HomeOutlined,
    TeamOutlined,
    ThunderboltOutlined,
    UserAddOutlined,
    FileTextOutlined,
    RiseOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '../../components/Layout/MainLayout';
import { useLandlordData } from '../../hooks/useLandlordData';
import { generateDemoData } from '../../utils/demoData';
import StatCard from '../../components/Dashboard/StatCard';
import RevenueTrendsChart from '../../components/Dashboard/RevenueTrendsChart';
import QuickActions from '../../components/Dashboard/QuickActions';

const { Title } = Typography;

const LandlordDashboard = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const demoMode = searchParams.get('demo') === 'true';

    // Use demo data if in demo mode, otherwise use real data
    const realData = useLandlordData();
    const demoData = demoMode ? generateDemoData() : null;
    const { loading, stats, properties, transactions, chartData, refreshData } = demoMode ? demoData : realData;

    const quickActions = [
        {
            icon: UserAddOutlined,
            label: 'Add Tenant',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            onClick: () => navigate('/landlord/tenants')
        },
        {
            icon: HomeOutlined,
            label: 'Manage Properties',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            onClick: () => navigate('/landlord/properties')
        },
        {
            icon: ThunderboltOutlined,
            label: 'View Meters',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            onClick: () => navigate('/landlord/meters')
        },
        {
            icon: DollarOutlined,
            label: 'Finance',
            gradient: 'linear-gradient(135deg, #1ecf49 0%, #36ea98 100%)',
            onClick: () => navigate('/landlord/finance')
        }
    ];

    return (
        <MainLayout>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>Landlord Dashboard</Title>
            </div>

            {loading ? (
                <div style={{ padding: 60, textAlign: 'center' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <>
                    {/* Primary Stats */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} sm={12} lg={6}>
                            <StatCard
                                title="Total Revenue"
                                value={stats.totalRevenue}
                                prefix="KES "
                                icon={DollarOutlined}
                                gradient="green"
                                trend={stats.revenueGrowth >= 0 ? 'up' : 'down'}
                                trendValue={`${Math.abs(stats.revenueGrowth)}% vs last week`}
                                onClick={() => navigate('/landlord/finance')}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <StatCard
                                title="My Properties"
                                value={stats.propertyCount}
                                icon={HomeOutlined}
                                gradient="blue"
                                onClick={() => navigate('/landlord/properties')}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <StatCard
                                title="Active Tenants"
                                value={stats.tenantCount}
                                icon={TeamOutlined}
                                gradient="purple"
                                onClick={() => navigate('/landlord/tenants')}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <StatCard
                                title="Total Meters"
                                value={stats.meterCount}
                                icon={ThunderboltOutlined}
                                gradient="pink"
                                onClick={() => navigate('/landlord/meters')}
                            />
                        </Col>
                    </Row>

                    {/* Secondary Stats */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} sm={12} lg={8}>
                            <StatCard
                                title="Monthly Revenue"
                                value={stats.monthlyRevenue}
                                prefix="KES "
                                icon={RiseOutlined}
                                gradient="orange"
                                formatter={(val) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={8}>
                            <StatCard
                                title="Today's Revenue"
                                value={stats.todayRevenue}
                                prefix="KES "
                                gradient="green"
                                formatter={(val) => val.toFixed(2)}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={8}>
                            <StatCard
                                title="Avg Revenue/Property"
                                value={stats.propertyCount > 0 ? stats.monthlyRevenue / stats.propertyCount : 0}
                                prefix="KES "
                                gradient="blue"
                                formatter={(val) => val.toFixed(2)}
                            />
                        </Col>
                    </Row>

                    {/* Chart and Actions */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} lg={16}>
                            <RevenueTrendsChart data={chartData} />
                        </Col>
                        <Col xs={24} lg={8}>
                            <QuickActions actions={quickActions} />
                        </Col>
                    </Row>

                    {/* Properties Overview and Recent Transactions */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
                            <div
                                style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Properties Overview</h3>
                                    <a href="/landlord/properties" style={{ fontSize: '14px' }}>View All</a>
                                </div>
                                {properties.slice(0, 5).map(p => (
                                    <div
                                        key={p.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '12px 0',
                                            borderBottom: '1px solid #f0f0f0',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => navigate('/landlord/properties')}
                                    >
                                        <span style={{ fontWeight: 500 }}>{p.name}</span>
                                        <span style={{ color: '#888' }}>{p.units?.length || 0} units</span>
                                    </div>
                                ))}
                                {properties.length === 0 && (
                                    <div style={{ color: '#999', padding: '20px 0', textAlign: 'center' }}>
                                        No properties found
                                    </div>
                                )}
                            </div>
                        </Col>
                        <Col xs={24} lg={12}>
                            <div
                                style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Recent Transactions</h3>
                                    <a href="/landlord/finance" style={{ fontSize: '14px' }}>View All</a>
                                </div>
                                {transactions.slice(0, 5).map(t => (
                                    <div
                                        key={t.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '12px 0',
                                            borderBottom: '1px solid #f0f0f0'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{t.unit?.meter_number}</div>
                                            <div style={{ color: '#888', fontSize: '12px' }}>
                                                {new Date(t.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                        <div style={{ color: '#1ecf49', fontWeight: 'bold' }}>
                                            + KES {t.amount_paid}
                                        </div>
                                    </div>
                                ))}
                                {transactions.length === 0 && (
                                    <div style={{ color: '#999', padding: '20px 0', textAlign: 'center' }}>
                                        No recent transactions
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>
                </>
            )}
        </MainLayout>
    );
};

export default LandlordDashboard;
