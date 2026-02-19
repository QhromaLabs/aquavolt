import { Typography, Row, Col } from 'antd';
import {
    DollarOutlined,
    HomeOutlined,
    TeamOutlined,
    ThunderboltOutlined,
    UserAddOutlined,
    FileTextOutlined,
    RiseOutlined
} from '@ant-design/icons';
import { generateDemoData } from '../../utils/demoData';
import StatCard from '../../components/Dashboard/StatCard';
import RevenueTrendsChart from '../../components/Dashboard/RevenueTrendsChart';
import QuickActions from '../../components/Dashboard/QuickActions';

const { Title } = Typography;

const DemoLandlordDashboard = () => {
    // Always use demo data (no authentication required)
    const { stats, properties, transactions, chartData } = generateDemoData();

    const quickActions = [
        {
            icon: UserAddOutlined,
            label: 'Add Tenant',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            onClick: () => { }
        },
        {
            icon: HomeOutlined,
            label: 'Manage Properties',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            onClick: () => { }
        },
        {
            icon: ThunderboltOutlined,
            label: 'View Meters',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            onClick: () => { }
        },
        {
            icon: FileTextOutlined,
            label: 'Finance',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            onClick: () => { }
        }
    ];

    const avgRevenuePerProperty = stats.propertyCount > 0
        ? stats.monthlyRevenue / stats.propertyCount
        : 0;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px'
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <Title level={2} style={{ color: 'white', marginBottom: '24px' }}>
                    Landlord Dashboard - Demo
                </Title>

                {/* Primary Stats Row */}
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Total Revenue"
                            value={stats.totalRevenue}
                            prefix="KES "
                            icon={DollarOutlined}
                            gradient="green"
                            trend={stats.revenueGrowth >= 0 ? 'up' : 'down'}
                            trendValue={`${Math.abs(stats.revenueGrowth)}% from last week`}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="My Properties"
                            value={stats.propertyCount}
                            icon={HomeOutlined}
                            gradient="blue"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Active Tenants"
                            value={stats.tenantCount}
                            icon={TeamOutlined}
                            gradient="purple"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Total Meters"
                            value={stats.meterCount}
                            icon={ThunderboltOutlined}
                            gradient="orange"
                        />
                    </Col>
                </Row>

                {/* Secondary Stats Row */}
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={8}>
                        <StatCard
                            title="Monthly Revenue"
                            value={stats.monthlyRevenue}
                            prefix="KES "
                            icon={DollarOutlined}
                            gradient="pink"
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <StatCard
                            title="Today's Revenue"
                            value={stats.todayRevenue}
                            prefix="KES "
                            icon={RiseOutlined}
                            gradient="green"
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <StatCard
                            title="Avg Revenue / Property"
                            value={avgRevenuePerProperty}
                            prefix="KES "
                            icon={HomeOutlined}
                            gradient="blue"
                        />
                    </Col>
                </Row>

                {/* Charts and Actions Row */}
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} lg={16}>
                        <RevenueTrendsChart data={chartData} />
                    </Col>
                    <Col xs={24} lg={8}>
                        <QuickActions actions={quickActions} />
                    </Col>
                </Row>

                {/* Properties and Transactions Row */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        }}>
                            <Title level={4} style={{ marginBottom: '16px' }}>Properties Overview</Title>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {properties.slice(0, 4).map(property => (
                                    <div key={property.id} style={{
                                        padding: '12px',
                                        background: '#f5f5f5',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{property.name}</div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>
                                                {property.units.length} units
                                            </div>
                                        </div>
                                        <HomeOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} lg={12}>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        }}>
                            <Title level={4} style={{ marginBottom: '16px' }}>Recent Transactions</Title>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {transactions.slice(0, 5).map(transaction => (
                                    <div key={transaction.id} style={{
                                        padding: '12px',
                                        background: '#f5f5f5',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                                {transaction.unit?.meter_number || 'N/A'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>
                                                {new Date(transaction.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 600, color: '#1ecf49' }}>
                                            KES {transaction.amount_paid.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default DemoLandlordDashboard;
