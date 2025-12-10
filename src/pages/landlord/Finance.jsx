import { Typography, Table, Card, Tag, Row, Col, Statistic, Button } from 'antd';
import { DollarOutlined, ReloadOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { useLandlordData } from '../../hooks/useLandlordData';

const { Title } = Typography;

const LandlordFinance = () => {
    const { loading, transactions, stats, refreshData } = useLandlordData();

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

    return (
        <MainLayout>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={2}>Financial Report</Title>
                <Button icon={<ReloadOutlined />} onClick={refreshData}>Refresh</Button>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12}>
                    <Card>
                        <Statistic
                            title="Total Revenue"
                            value={stats.totalRevenue}
                            precision={2}
                            prefix="KES"
                            valueStyle={{ color: '#1ecf49' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12}>
                    <Card>
                        <Statistic
                            title="This Month"
                            value={stats.monthlyRevenue}
                            precision={2}
                            prefix="KES"
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
            </Row>

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
