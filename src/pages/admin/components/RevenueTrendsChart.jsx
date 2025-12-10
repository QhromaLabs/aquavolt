import { Card, Empty } from 'antd';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const RevenueTrendsChart = ({ data, loading = false, timeRange = '30D' }) => {
    if (!data || data.length === 0) {
        return (
            <Card title="Revenue Trends" style={{ borderRadius: '12px' }}>
                <Empty description="No data available" />
            </Card>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'white',
                    padding: '12px',
                    border: '1px solid #e8e8e8',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                    <p style={{ margin: 0, fontWeight: 600, marginBottom: '8px' }}>
                        {format(new Date(label), 'MMM dd, yyyy')}
                    </p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ margin: '4px 0', color: entry.color, fontSize: '13px' }}>
                            <span style={{ fontWeight: 600 }}>{entry.name}:</span>{' '}
                            {entry.name === 'Revenue' ? `KES ${entry.value.toLocaleString()}` : entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <Card
            title="Revenue Trends"
            loading={loading}
            style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            bodyStyle={{ padding: '24px' }}
        >
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1ecf49" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#1ecf49" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                        stroke="#8c8c8c"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        yAxisId="left"
                        stroke="#1ecf49"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#4facfe"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#1ecf49"
                        strokeWidth={3}
                        dot={{ fill: '#1ecf49', r: 4 }}
                        activeDot={{ r: 6 }}
                        fill="url(#colorRevenue)"
                    />
                    <Bar
                        yAxisId="right"
                        dataKey="token_count"
                        name="Tokens Sold"
                        fill="#4facfe"
                        radius={[8, 8, 0, 0]}
                        opacity={0.7}
                    />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
};

export default RevenueTrendsChart;
