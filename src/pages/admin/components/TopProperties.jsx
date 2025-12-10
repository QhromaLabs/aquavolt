import { Card, Table, Progress } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const TopProperties = ({ data, loading = false }) => {
    const navigate = useNavigate();

    const columns = [
        {
            title: 'Property',
            dataIndex: 'name',
            key: 'name',
            render: (name) => <span style={{ fontWeight: 600 }}>{name}</span>
        },
        {
            title: 'Units',
            dataIndex: 'unit_count',
            key: 'units',
            width: 80,
            align: 'center'
        },
        {
            title: 'Active Tenants',
            dataIndex: 'active_tenants',
            key: 'tenants',
            width: 120,
            align: 'center'
        },
        {
            title: 'Monthly Revenue',
            dataIndex: 'monthly_revenue',
            key: 'revenue',
            width: 200,
            render: (revenue, record) => {
                const maxRevenue = Math.max(...(data || []).map(p => p.monthly_revenue || 0));
                const percent = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;

                return (
                    <div>
                        <div style={{ marginBottom: '4px', fontWeight: 600, color: '#1ecf49' }}>
                            KES {(revenue || 0).toLocaleString()}
                        </div>
                        <Progress
                            percent={percent}
                            showInfo={false}
                            strokeColor="#1ecf49"
                            size="small"
                        />
                    </div>
                );
            }
        }
    ];

    return (
        <Card
            title="Top Properties"
            loading={loading}
            style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                pagination={false}
                size="small"
                onRow={(record) => ({
                    onClick: () => navigate(`/admin/properties`),
                    style: { cursor: 'pointer' }
                })}
            />
        </Card>
    );
};

export default TopProperties;
