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
    CalendarOutlined
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

    // Stats
    const [stats, setStats] = useState({
        totalRevenue: 0,
        todayRevenue: 0,
        avgTransaction: 0,
        totalTransactions: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all successful topups
            const { data, error } = await supabase
                .from('topups')
                .select(`
                    id,
                    amount_paid,
                    created_at,
                    payment_channel,
                    unit:unit_id ( label, properties(name) )
                `)
                .order('created_at', { ascending: true }); // Order for chart

            if (error) throw error;
            processData(data || []);
        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const processData = (data) => {
        // 1. Calculate Stats
        const total = data.reduce((acc, curr) => acc + (curr.amount_paid || 0), 0);
        const today = new Date().toISOString().split('T')[0];
        const todayTotal = data
            .filter(d => d.created_at.startsWith(today))
            .reduce((acc, curr) => acc + (curr.amount_paid || 0), 0);

        setStats({
            totalRevenue: total,
            todayRevenue: todayTotal,
            avgTransaction: data.length ? total / data.length : 0,
            totalTransactions: data.length
        });

        // 2. Prepare Chart Data (Group by Date)
        const grouped = data.reduce((acc, curr) => {
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
        const channels = data.reduce((acc, curr) => {
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

        // 4. Recent Transactions Table (Reverse order)
        setTransactions([...data].reverse().slice(0, 50));
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
            render: (_, r) => r.unit ? `${r.unit.label} (${r.unit.properties?.name})` : '-'
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
                <Col xs={24} sm={6}>
                    <Card bordered={false} style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                        <Statistic
                            title="Total Revenue"
                            value={stats.totalRevenue}
                            precision={2}
                            prefix="KES"
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic
                            title="Today's Revenue"
                            value={stats.todayRevenue}
                            precision={2}
                            prefix="KES"
                            valueStyle={{ color: '#1890ff' }}
                            suffix={stats.todayRevenue > 0 ? <RiseOutlined style={{ color: 'green' }} /> : null}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card>
                        <Statistic
                            title="Avg. Transaction"
                            value={stats.avgTransaction}
                            precision={2}
                            prefix="KES"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
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
