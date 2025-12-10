import { useState, useEffect } from 'react';
import { Typography, Row, Col, Spin, message } from 'antd';
import {
    DollarOutlined,
    ThunderboltOutlined,
    TeamOutlined,
    ApiOutlined,
    HomeOutlined,
    RiseOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/Layout/MainLayout';
import { supabase } from '../../lib/supabase';
import StatCard from './components/StatCard';
import RevenueTrendsChart from './components/RevenueTrendsChart';
import RecentTransactions from './components/RecentTransactions';
import TopProperties from './components/TopProperties';
import QuickActions from './components/QuickActions';

const { Title } = Typography;

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        todayRevenue: 0,
        totalTokens: 0,
        todayTokens: 0,
        totalUsers: 0,
        totalProperties: 0,
        avgTokenValue: 0,
        revenueGrowth: 0
    });
    const [chartData, setChartData] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [topProperties, setTopProperties] = useState([]);

    useEffect(() => {
        fetchDashboardData();

        // Set up real-time subscription for new topups
        const subscription = supabase
            .channel('topups-realtime')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'topups' },
                (payload) => {
                    console.log('New topup received:', payload);
                    fetchDashboardData(); // Refresh data
                    message.success('New transaction received!');
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch all topups with related data
            const { data: topups, error: topupsError } = await supabase
                .from('topups')
                .select(`
                    *,
                    unit:units(meter_number),
                    tenant:profiles!topups_tenant_id_fkey(full_name)
                `)
                .order('created_at', { ascending: false });

            if (topupsError) throw topupsError;

            // Calculate stats
            const totalRevenue = (topups || []).reduce((acc, t) => acc + (parseFloat(t.amount_paid) || 0), 0);
            const today = new Date().toISOString().split('T')[0];
            const todayTopups = (topups || []).filter(t => t.created_at.startsWith(today));
            const todayRevenue = todayTopups.reduce((acc, t) => acc + (parseFloat(t.amount_paid) || 0), 0);
            const avgTokenValue = topups.length > 0 ? totalRevenue / topups.length : 0;

            // Calculate revenue growth (compare last 7 days vs previous 7 days)
            const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const last14Days = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
            const recentRevenue = (topups || [])
                .filter(t => t.created_at >= last7Days)
                .reduce((acc, t) => acc + (parseFloat(t.amount_paid) || 0), 0);
            const previousRevenue = (topups || [])
                .filter(t => t.created_at >= last14Days && t.created_at < last7Days)
                .reduce((acc, t) => acc + (parseFloat(t.amount_paid) || 0), 0);
            const revenueGrowth = previousRevenue > 0
                ? ((recentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
                : 0;

            // Fetch user count
            const { count: userCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // Fetch properties count
            const { count: propCount } = await supabase
                .from('properties')
                .select('*', { count: 'exact', head: true });

            setStats({
                totalRevenue,
                todayRevenue,
                totalTokens: topups.length,
                todayTokens: todayTopups.length,
                totalUsers: userCount || 0,
                totalProperties: propCount || 0,
                avgTokenValue,
                revenueGrowth: parseFloat(revenueGrowth)
            });

            // Prepare chart data (last 30 days)
            const last30Days = [];
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                const dayTopups = (topups || []).filter(t => t.created_at.startsWith(dateStr));
                const dayRevenue = dayTopups.reduce((acc, t) => acc + (parseFloat(t.amount_paid) || 0), 0);

                last30Days.push({
                    date: dateStr,
                    revenue: dayRevenue,
                    token_count: dayTopups.length
                });
            }
            setChartData(last30Days);

            // Recent transactions (last 10)
            const recentTxns = (topups || []).slice(0, 10).map(t => ({
                ...t,
                tenant_name: t.tenant?.full_name || 'Unknown',
                meter_number: t.unit?.meter_number || 'N/A'
            }));
            setRecentTransactions(recentTxns);

            // Fetch top properties
            const { data: properties, error: propError } = await supabase
                .from('properties')
                .select(`
                    id,
                    name,
                    units:units(count),
                    unit_assignments:units(unit_assignments(count))
                `);

            if (!propError && properties) {
                // Calculate revenue per property
                const propertiesWithRevenue = await Promise.all(
                    properties.map(async (prop) => {
                        const { data: propUnits } = await supabase
                            .from('units')
                            .select('id')
                            .eq('property_id', prop.id);

                        const unitIds = (propUnits || []).map(u => u.id);

                        const { data: propTopups } = await supabase
                            .from('topups')
                            .select('amount_paid, created_at')
                            .in('unit_id', unitIds)
                            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

                        const monthlyRevenue = (propTopups || []).reduce((acc, t) => acc + (parseFloat(t.amount_paid) || 0), 0);

                        return {
                            id: prop.id,
                            name: prop.name,
                            unit_count: prop.units?.[0]?.count || 0,
                            active_tenants: prop.unit_assignments?.[0]?.count || 0,
                            monthly_revenue: monthlyRevenue
                        };
                    })
                );

                const sortedProperties = propertiesWithRevenue
                    .sort((a, b) => b.monthly_revenue - a.monthly_revenue)
                    .slice(0, 5);

                setTopProperties(sortedProperties);
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            message.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>Admin Dashboard</Title>
            </div>

            {loading ? (
                <div style={{ padding: 60, textAlign: 'center' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
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
                                onClick={() => navigate('/admin/finance')}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <StatCard
                                title="Tokens Sold"
                                value={stats.totalTokens}
                                icon={ThunderboltOutlined}
                                gradient="blue"
                                trendValue={`${stats.todayTokens} today`}
                                onClick={() => navigate('/admin/topups')}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <StatCard
                                title="Active Users"
                                value={stats.totalUsers}
                                icon={TeamOutlined}
                                gradient="purple"
                                onClick={() => navigate('/admin/users')}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <StatCard
                                title="Properties"
                                value={stats.totalProperties}
                                icon={HomeOutlined}
                                gradient="pink"
                                onClick={() => navigate('/admin/properties')}
                            />
                        </Col>
                    </Row>

                    {/* Secondary Stats */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} sm={12} lg={6}>
                            <StatCard
                                title="Today's Revenue"
                                value={stats.todayRevenue}
                                prefix="KES "
                                icon={RiseOutlined}
                                gradient="orange"
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <StatCard
                                title="Avg Token Value"
                                value={stats.avgTokenValue}
                                prefix="KES "
                                gradient="blue"
                                formatter={(val) => val.toFixed(2)}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <StatCard
                                title="Tokens Today"
                                value={stats.todayTokens}
                                icon={ThunderboltOutlined}
                                gradient="green"
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <StatCard
                                title="System Status"
                                value="Online"
                                icon={ApiOutlined}
                                gradient="purple"
                                formatter={(val) => val}
                            />
                        </Col>
                    </Row>

                    {/* Charts and Tables */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} lg={16}>
                            <RevenueTrendsChart data={chartData} />
                        </Col>
                        <Col xs={24} lg={8}>
                            <QuickActions />
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={14}>
                            <RecentTransactions
                                data={recentTransactions}
                                onViewAll={() => navigate('/admin/topups')}
                            />
                        </Col>
                        <Col xs={24} lg={10}>
                            <TopProperties data={topProperties} />
                        </Col>
                    </Row>
                </>
            )}
        </MainLayout>
    );
};

export default AdminDashboard;
