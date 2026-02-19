import { Card, Table, Tag, Button, Space } from 'antd';
import { CopyOutlined, EyeOutlined } from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';

const RecentTransactions = ({ data, loading = false, onViewAll }) => {
    const columns = [
        {
            title: 'Time',
            dataIndex: 'created_at',
            key: 'time',
            width: 120,
            render: (time) => (
                <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    {formatDistanceToNow(new Date(time), { addSuffix: true })}
                </span>
            )
        },
        {
            title: 'Tenant',
            dataIndex: 'tenant_name',
            key: 'tenant',
            render: (name) => <span style={{ fontWeight: 500 }}>{name || 'Unknown'}</span>
        },
        {
            title: 'Meter',
            dataIndex: 'meter_number',
            key: 'meter',
            render: (meter) => <code style={{ fontSize: '12px' }}>{meter}</code>
        },
        {
            title: 'Amount',
            dataIndex: 'amount_paid',
            key: 'amount',
            render: (amount) => (
                <span style={{ fontWeight: 600, color: '#1ecf49' }}>
                    KES {amount?.toLocaleString()}
                </span>
            )
        },
        {
            title: 'Token',
            dataIndex: 'token',
            key: 'token',
            render: (token) => token ? (
                <Space size="small">
                    <code style={{ fontSize: '11px' }}>{token.substring(0, 10)}...</code>
                    <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => {
                            navigator.clipboard.writeText(token);
                        }}
                    />
                </Space>
            ) : '-'
        },
        {
            title: 'Status',
            dataIndex: 'futurise_status',
            key: 'status',
            render: (status) => {
                const color = status === 'success' ? 'success' :
                    status === 'pending' ? 'processing' : 'error';
                return <Tag color={color}>{status || 'completed'}</Tag>;
            }
        }
    ];

    return (
        <Card
            title="Recent Transactions"
            loading={loading}
            extra={
                <Button type="link" onClick={onViewAll}>
                    View All
                </Button>
            }
            style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 600 }}
            />
        </Card>
    );
};

export default RecentTransactions;
