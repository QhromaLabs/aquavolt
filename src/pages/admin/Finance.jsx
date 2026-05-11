import { useState, useEffect } from 'react';
import {
    Typography,
    Card,
    Row,
    Col,
    Statistic,
    Table,
    Tag,
    Space,
    DatePicker,
    Button
} from 'antd';
import {
    DollarOutlined,
    RiseOutlined,
    FallOutlined,
    CalendarOutlined,
    TeamOutlined,
    HomeOutlined
} from '@ant-design/icons';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import MainLayout from '../../components/Layout/MainLayout';
import { supabase } from '../../lib/supabase';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AdminFinance = () => {
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [channelData, setChannelData] = useState([]);
    const [landlordData, setLandlordData] = useState([]);

    // Stats
    const [stats, setStats] = useState({
        totalRevenue: 0,
        todayRevenue: 0,
        avgTransaction: 0,
        totalTransactions: 0,
        netIncome: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all successful topups with property/landlord info
            const { data: topups, error: topupsError } = await supabase
                .from('topups')
                .select(`
                    id,
                    amount_paid,
                    amount_vended,
                    created_at,
                    payment_channel,
                    unit:unit_id ( 
                        label, 
                        property:property_id ( 
                            name, 
                            landlord:landlord_id ( id, full_name ) 
                        ) 
                    )
                `)
                .order('created_at', { ascending: true });

            if (topupsError) throw topupsError;

            // 2. Fetch all units to get current_balance
            const { data: units, error: unitsError } = await supabase
                .from('units')
                .select(`
                    id,
                    current_balance,
                    property:property_id ( 
                        landlord:landlord_id ( id, full_name ) 
                    )
                `);

            if (unitsError) throw unitsError;

            // 3. Fetch all withdrawal requests
            const { data: withdrawals, error: withdrawalsError } = await supabase
                .from('withdrawal_requests')
                .select('*');

            if (withdrawalsError) throw withdrawalsError;

            processData(topups || [], units || [], withdrawals || []);
        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const processData = (topups, units, withdrawals) => {
        // 1. Calculate Stats
        const total = topups.reduce((acc, curr) => acc + (curr.amount_paid || 0), 0);
        const today = new Date().toISOString().split('T')[0];
        const todayTotal = topups
            .filter(d => d.created_at.startsWith(today))
            .reduce((acc, curr) => acc + (curr.amount_paid || 0), 0);

        setStats({
            totalRevenue: total,
            todayRevenue: todayTotal,
            avgTransaction: topups.length ? total / topups.length : 0,
            totalTransactions: topups.length,
            netIncome: total * 0.05
        });

        // 2. Prepare Chart Data (Group by Date)
        const grouped = topups.reduce((acc, curr) => {
            const date = new Date(curr.created_at).toLocaleDateString();
            if (!acc[date]) acc[date] = 0;
            acc[date] += curr.amount_paid;
            return acc;
        }, {});

        const chartData = Object.keys(grouped).map(date => ({
            date,
            revenue: grouped[date]
        }));
        setRevenueData(chartData);

        // 3. Channel Data
        const channels = topups.reduce((acc, curr) => {
            const ch = curr.payment_channel || 'Unknown';
            if (!acc[ch]) acc[ch] = 0;
            acc[ch]++;
            return acc;
        }, {});

        const pieData = Object.keys(channels).map(ch => ({
            name: ch,
            value: channels[ch]
        }));
        setChannelData(pieData);

        // 4. Landlord Data Aggregation
        const landlords = {};
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        // Aggregate revenue from topups
        topups.forEach(t => {
            const landlord = t.unit?.property?.landlord;
            if (!landlord) return;
            
            if (!landlords[landlord.id]) {
                landlords[landlord.id] = {
                    id: landlord.id,
                    name: landlord.full_name,
                    totalRevenue: 0,
                    monthlyRevenue: 0,
                    currentBalance: 0, // This was apartment balance, but user wants account balance
                    accountBalance: 0, 
                    unitCount: 0,
                    topupCount: 0
                };
            }
            landlords[landlord.id].totalRevenue += t.amount_paid || 0;
            if (t.created_at >= startOfMonth) {
                landlords[landlord.id].monthlyRevenue += t.amount_paid || 0;
            }
            landlords[landlord.id].topupCount += 1;
        });

        // Aggregate balance from units
        units.forEach(u => {
            const landlord = u.property?.landlord;
            if (!landlord) return;
            
            if (!landlords[landlord.id]) {
                landlords[landlord.id] = {
                    id: landlord.id,
                    name: landlord.full_name,
                    totalRevenue: 0,
                    currentBalance: 0, // This was apartment balance, but user wants account balance
                    accountBalance: 0, 
                    unitCount: 0,
                    topupCount: 0
                };
            }
            landlords[landlord.id].unitCount += 1;
        });

        // Aggregate withdrawals
        withdrawals.forEach(w => {
            if (!landlords[w.landlord_id]) return;
            if (w.status === 'approved' || w.status === 'completed') {
                landlords[w.landlord_id].totalRevenue -= 0; // Just to ensure it exists
                if (!landlords[w.landlord_id].totalWithdrawals) landlords[w.landlord_id].totalWithdrawals = 0;
                landlords[w.landlord_id].totalWithdrawals += parseFloat(w.amount || 0);
            }
        });

        // Finalize account balance: Revenue - Withdrawals
        Object.values(landlords).forEach(l => {
            l.accountBalance = l.totalRevenue - (l.totalWithdrawals || 0);
        });

        setLandlordData(Object.values(landlords));

        // 5. Recent Transactions Table (Reverse order)
        setTransactions([...topups].reverse().slice(0, 50));
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const columns = [
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'date',
            render: (d) => new Date(d).toLocaleString()
        },
        {
            title: 'Amount',
            dataIndex: 'amount_paid',
            key: 'amount',
            render: (a) => <Text strong style={{ color: '#1ecf49' }}>KES {a.toFixed(2)}</Text>
        },
        {
            title: 'Channel',
            dataIndex: 'payment_channel',
            key: 'channel',
            render: (c) => <Tag color={c === 'mpesa' ? 'green' : 'blue'}>{c?.toUpperCase()}</Tag>
        },
        {
            title: 'Unit',
            key: 'unit',
            render: (_, r) => r.unit ? `${r.unit.label} (${r.unit.property?.name})` : '-'
        }
    ];

    const landlordColumns = [
        {
            title: 'Landlord',
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <Space>
                    <TeamOutlined style={{ color: '#1890ff' }} />
                    <Text strong>{text}</Text>
                </Space>
            )
        },
        {
            title: 'Units',
            dataIndex: 'unitCount',
            key: 'units',
            render: (count) => <Tag icon={<HomeOutlined />}>{count} Units</Tag>
        },
        {
            title: 'Monthly Revenue',
            dataIndex: 'monthlyRevenue',
            key: 'monthly_revenue',
            render: (val) => <Text>KES {(val || 0).toFixed(2)}</Text>,
            sorter: (a, b) => (a.monthlyRevenue || 0) - (b.monthlyRevenue || 0)
        },
        {
            title: 'Total Revenue',
            dataIndex: 'totalRevenue',
            key: 'total_revenue',
            render: (val) => <Text strong>KES {(val || 0).toFixed(2)}</Text>,
            sorter: (a, b) => (a.totalRevenue || 0) - (b.totalRevenue || 0)
        },
        {
            title: 'Current Revenue',
            dataIndex: 'accountBalance',
            key: 'balance',
            render: (val) => (
                <Text strong style={{ color: (val || 0) > 0 ? '#1ecf49' : '#ff4d4f' }}>
                    KES {(val || 0).toFixed(2)}
                </Text>
            ),
            sorter: (a, b) => (a.accountBalance || 0) - (b.accountBalance || 0)
        },
        {
            title: 'Activity',
            dataIndex: 'topupCount',
            key: 'activity',
            render: (count) => <Text type="secondary">{count} topups</Text>
        }
    ];

    return (
        <MainLayout>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}><DollarOutlined /> Finance Dashboard</Title>
                <Text type="secondary">Revenue overview and transaction analytics</Text>
            </div>

            {/* Stats Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={5}>
                    <Card variant="borderless" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                        <Statistic
                            title="Total Revenue"
                            value={stats.totalRevenue}
                            precision={2}
                            prefix="KES "
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={5}>
                    <Card variant="borderless" style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}>
                        <Statistic
                            title="Net Income (5%)"
                            value={stats.netIncome}
                            precision={2}
                            prefix="KES "
                            valueStyle={{ color: '#0050b3' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={5}>
                    <Card>
                        <Statistic
                            title="Today's Revenue"
                            value={stats.todayRevenue}
                            precision={2}
                            prefix="KES "
                            valueStyle={{ color: '#1890ff' }}
                            suffix={stats.todayRevenue > 0 ? <RiseOutlined style={{ color: 'green' }} /> : null}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={4}>
                    <Card>
                        <Statistic
                            title="Avg. Transaction"
                            value={stats.avgTransaction}
                            precision={2}
                            prefix="KES "
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={5}>
                    <Card>
                        <Statistic
                            title="Total Transactions"
                            value={stats.totalTransactions}
                            prefix={<CalendarOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Charts */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={16}>
                    <Card title="Revenue Trend (Last 30 Days)">
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#1ecf49" strokeWidth={2} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Revenue Sources">
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={channelData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label
                                    >
                                        {channelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Landlord Financials */}
            <Card title="Landlord Financials" style={{ marginBottom: 24 }}>
                <Table
                    columns={landlordColumns}
                    dataSource={landlordData}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 5 }}
                />
            </Card>

            {/* Recent Table */}
            <Card title="Recent Transactions">
                <Table
                    columns={columns}
                    dataSource={transactions}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 5 }}
                    size="small"
                />
            </Card>
        </MainLayout>
    );
};

export default AdminFinance;
