import { useState, useEffect } from 'react';
import {
    Table,
    Card,
    Typography,
    Tag,
    Button,
    Space,
    message,
    Modal,
    Row,
    Col,
    Statistic,
    Popconfirm,
    Descriptions,
    Divider
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    BankOutlined,
    UserOutlined,
    PhoneOutlined
} from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text } = Typography;

const WithdrawalRequests = () => {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({
        pendingCount: 0,
        pendingAmount: 0,
        approvedAmount: 0
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [processing, setProcessing] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('withdrawal_requests')
                .select(`
                    *,
                    profile:profiles!landlord_id(full_name, email, phone, role)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Add demo data for testing
            const demoRequest = {
                id: 'demo-req-123',
                created_at: new Date().toISOString(),
                amount: 15600.00,
                status: 'pending',
                mpesa_number: '0712345678',
                profile: {
                    full_name: 'John Doe (Demo)',
                    email: 'demo@example.com',
                    phone: '0712345678',
                    role: 'landlord'
                }
            };

            // Combine real data with demo data
            const allRequests = [demoRequest, ...data];

            setRequests(allRequests);
            calculateStats(allRequests);
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
            message.error('Failed to load withdrawal requests');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const pending = data.filter(r => r.status === 'pending');
        const approved = data.filter(r => ['approved', 'completed'].includes(r.status));

        setStats({
            pendingCount: pending.length,
            pendingAmount: pending.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
            approvedAmount: approved.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
        });
    };

    const handleAction = async (id, action) => {
        try {
            setProcessing(true);

            // Handle demo request locally
            if (id.toString().startsWith('demo-')) {
                const updatedRequests = requests.map(r =>
                    r.id === id ? { ...r, status: action, reviewed_at: new Date().toISOString() } : r
                );
                setRequests(updatedRequests);
                calculateStats(updatedRequests);
                message.success(`Demo request marked as ${action}`);
                if (isModalOpen) closeModal();
                return;
            }

            // Real update
            // Optimistic update
            const updatedRequests = requests.map(r =>
                r.id === id ? { ...r, status: action, reviewed_at: new Date().toISOString() } : r
            );
            setRequests(updatedRequests);
            calculateStats(updatedRequests);

            const { error } = await supabase
                .from('withdrawal_requests')
                .update({
                    status: action,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            message.success(`Request marked as ${action}`);
            if (isModalOpen) closeModal();

        } catch (error) {
            console.error(`Error processing request:`, error);
            message.error(`Failed to process request`);
            fetchRequests(); // Revert on error
        } finally {
            setProcessing(false);
        }
    };

    const openApprovalModal = (record) => {
        setSelectedRequest(record);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRequest(null);
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString(),
        },
        {
            title: 'User',
            key: 'user',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.profile?.full_name || 'Unknown'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.profile?.role?.toUpperCase()}</Text>
                </Space>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => (
                <Text strong style={{ color: '#52c41a' }}>
                    KES {parseFloat(amount).toLocaleString()}
                </Text>
            ),
        },
        {
            title: 'M-Pesa Number',
            dataIndex: 'mpesa_number',
            key: 'mpesa_number',
            render: (val, record) => val || record.profile?.phone || '-',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'gold';
                let icon = <ClockCircleOutlined />;
                let label = status;

                if (status === 'completed' || status === 'approved') {
                    color = 'green';
                    icon = <CheckCircleOutlined />;
                    label = 'Paid';
                } else if (status === 'rejected') {
                    color = 'red';
                    icon = <CloseCircleOutlined />;
                }

                return (
                    <Tag color={color} icon={icon} style={{ textTransform: 'capitalize' }}>
                        {label}
                    </Tag>
                );
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    {record.status === 'pending' && (
                        <>
                            <Button
                                type="primary"
                                size="small"
                                icon={<CheckCircleOutlined />}
                                onClick={() => openApprovalModal(record)}
                            >
                                Approve
                            </Button>

                            <Popconfirm
                                title="Reject Withdrawal?"
                                description="Are you sure you want to reject this request?"
                                onConfirm={() => handleAction(record.id, 'rejected')}
                                okText="Reject"
                                okType="danger"
                                cancelText="Cancel"
                            >
                                <Button danger size="small" icon={<CloseCircleOutlined />}>
                                    Reject
                                </Button>
                            </Popconfirm>
                        </>
                    )}
                    {record.status !== 'pending' && <Text type="secondary">-</Text>}
                </Space>
            ),
        },
    ];

    return (
        <MainLayout>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>Withdrawal Requests</Title>
                <Text type="secondary">Manage payout requests from landlords and agents</Text>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false}>
                        <Statistic
                            title="Pending Requests"
                            value={stats.pendingCount}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false}>
                        <Statistic
                            title="Pending Amount"
                            value={stats.pendingAmount}
                            precision={2}
                            prefix="KES"
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false}>
                        <Statistic
                            title="Total Paid Out"
                            value={stats.approvedAmount}
                            precision={2}
                            prefix="KES"
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card bordered={false} className="shadow-sm">
                <Table
                    columns={columns}
                    dataSource={requests}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={[
                    <Space key="title">
                        <BankOutlined style={{ color: '#52c41a' }} />
                        <span>Approve Payment</span>
                    </Space>
                ]}
                open={isModalOpen}
                onCancel={closeModal}
                footer={[
                    <Button key="cancel" onClick={closeModal}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        style={{ backgroundColor: '#52c41a' }}
                        loading={processing}
                        onClick={() => handleAction(selectedRequest?.id, 'completed')}
                    >
                        Mark as Paid
                    </Button>
                ]}
            >
                {selectedRequest && (
                    <div style={{ marginTop: 24 }}>
                        <Descriptions layout="vertical" bordered column={1}>
                            <Descriptions.Item label="Beneficiary">
                                <Space>
                                    <UserOutlined />
                                    <Text strong>{selectedRequest.profile?.full_name}</Text>
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="M-Pesa Number">
                                <Space>
                                    <PhoneOutlined />
                                    <Text copyable strong style={{ fontSize: 18 }}>
                                        {selectedRequest.mpesa_number || selectedRequest.profile?.phone || 'N/A'}
                                    </Text>
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Amount to Transfer">
                                <Space>
                                    <DollarOutlined />
                                    <Text strong style={{ fontSize: 24, color: '#52c41a' }}>
                                        KES {parseFloat(selectedRequest.amount).toLocaleString()}
                                    </Text>
                                </Space>
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider />

                        <div style={{ backgroundColor: '#f6ffed', padding: 12, borderRadius: 8, border: '1px solid #b7eb8f' }}>
                            <Text type="secondary">
                                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                Please ensure you send the exact amount to the M-Pesa number above before marking as paid.
                            </Text>
                        </div>
                    </div>
                )}
            </Modal>
        </MainLayout>
    );
};
export default WithdrawalRequests;
