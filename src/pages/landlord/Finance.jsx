import { Typography, Table, Card, Tag, Row, Col, Statistic, Button, Space } from 'antd';
import { DollarOutlined, ReloadOutlined, HomeOutlined, ThunderboltOutlined, RiseOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { useLandlordData } from '../../hooks/useLandlordData';

const { Title, Text } = Typography;

const LandlordFinance = () => {
    const { loading, transactions, meters, stats, refreshData } = useLandlordData();

    const columns = [
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'date',
            render: (date) => new Date(date).toLocaleString(),
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
        },
        {
            title: 'Amount',
            dataIndex: 'amount_paid',
            key: 'amount',
            render: (amount) => `KES ${amount}`,
            sorter: (a, b) => a.amount_paid - b.amount_paid,
        },
        {
            title: 'Meter',
            key: 'meter',
            render: (_, record) => record.unit?.meter_number
        },
        {
            title: 'M-Pesa Code',
            dataIndex: 'mpesa_receipt_number',
            key: 'mpesa_code',
            render: (text) => <Tag>{text || 'N/A'}</Tag>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'completed' ? 'green' : 'red'}>
                    {status ? status.toUpperCase() : 'UNKNOWN'}
                </Tag>
            )
        }
    ];
    
    const apartmentColumns = [
        {
            title: 'Apartment',
            dataIndex: 'label',
            key: 'apartment',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Property',
            dataIndex: 'property_name',
            key: 'property',
        },
        {
            title: 'Current Balance',
            dataIndex: 'current_balance',
            key: 'balance',
            render: (balance) => (
                <Text style={{ color: (balance || 0) > 0 ? '#1ecf49' : '#ff4d4f' }}>
                    KES {(parseFloat(balance || 0)).toFixed(2)}
                </Text>
            ),
            sorter: (a, b) => (a.current_balance || 0) - (b.current_balance || 0),
        },
        {
            title: 'Revenue Generated',
            dataIndex: 'totalRevenue',
            key: 'revenue',
            render: (revenue) => <Text strong>KES {(parseFloat(revenue || 0)).toFixed(2)}</Text>,
            sorter: (a, b) => (a.totalRevenue || 0) - (b.totalRevenue || 0),
        },
        {
            title: 'Balance Overall',
            dataIndex: 'totalUnits',
            key: 'overall_balance',
            render: (units) => <Text>{(parseFloat(units || 0)).toFixed(2)} Units</Text>,
            sorter: (a, b) => (a.totalUnits || 0) - (b.totalUnits || 0),
        },
        {
            title: 'Total Topups',
            dataIndex: 'topupCount',
            key: 'topups',
            render: (count) => <Tag color="blue">{count} Transactions</Tag>,
            sorter: (a, b) => (a.topupCount || 0) - (b.topupCount || 0),
        }
    ];

    return (
        <MainLayout>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={2}>Financial Report</Title>
                <Button icon={<ReloadOutlined />} onClick={refreshData}>Refresh</Button>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Revenue"
                            value={stats.totalRevenue}
                            precision={2}
                            prefix="KES"
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Withdrawn"
                            value={stats.totalWithdrawn}
                            precision={2}
                            prefix="KES"
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Available Balance"
                            value={stats.accountBalance}
                            precision={2}
                            prefix="KES"
                            valueStyle={{ color: '#1ecf49' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="This Month"
                            value={stats.monthlyRevenue}
                            precision={2}
                            prefix="KES"
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Apartment Financials" style={{ marginBottom: 24 }}>
                <Table
                    columns={apartmentColumns}
                    dataSource={meters}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 5 }}
                />
            </Card>

            <Card title="Transaction History">
                <Table
                    columns={columns}
                    dataSource={transactions}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </MainLayout>
    );
};

export default LandlordFinance;
