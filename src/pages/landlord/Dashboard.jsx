import { Typography, Row, Col, Card, Statistic } from 'antd';
import { DollarOutlined, HomeOutlined, TeamOutlined, ThunderboltOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { useLandlordData } from '../../hooks/useLandlordData';

const { Title } = Typography;

const LandlordDashboard = () => {
    const { loading, stats, properties, transactions, refreshData } = useLandlordData();

    return (
        <MainLayout>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={2}>Landlord Dashboard</Title>
            </div>

            {loading ? (
                <div style={{ padding: 40, textAlign: 'center' }}>Loading dashboard data...</div>
            ) : (
                <>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="My Properties"
                                    value={stats.propertyCount}
                                    prefix={<HomeOutlined />}
                                    valueStyle={{ color: '#1ecf49' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Active Tenants"
                                    value={stats.tenantCount}
                                    prefix={<TeamOutlined />}
                                    valueStyle={{ color: '#36ea98' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Total Meters"
                                    value={stats.meterCount}
                                    prefix={<ThunderboltOutlined />}
                                    valueStyle={{ color: '#1890ff' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Monthly Revenue"
                                    value={stats.monthlyRevenue}
                                    precision={2}
                                    prefix="KES"
                                    suffix={<DollarOutlined />}
                                    valueStyle={{ color: '#cf1322' }} // Or green if you prefer
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                        <Col xs={24} lg={16}>
                            <Card title="Recent Transactions" extra={<a href="/landlord/finance">View All</a>}>
                                {transactions.slice(0, 5).map(t => (
                                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{t.unit?.meter_number}</div>
                                            <div style={{ color: '#888', fontSize: '12px' }}>{new Date(t.created_at).toLocaleString()}</div>
                                        </div>
                                        <div style={{ color: '#1ecf49', fontWeight: 'bold' }}>
                                            + KES {t.amount_paid}
                                        </div>
                                    </div>
                                ))}
                                {transactions.length === 0 && <div style={{ color: '#999', padding: '20px 0', textAlign: 'center' }}>No recent transactions</div>}
                            </Card>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Card title="Properties Overview">
                                {properties.slice(0, 5).map(p => (
                                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                                        <span>{p.name}</span>
                                        <span style={{ color: '#888' }}>{p.units?.length || 0} units</span>
                                    </div>
                                ))}
                                {properties.length === 0 && <div style={{ color: '#999', padding: '20px 0', textAlign: 'center' }}>No properties found</div>}
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </MainLayout>
    );
};

export default LandlordDashboard;
