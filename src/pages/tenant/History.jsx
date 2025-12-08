import { useState, useEffect } from 'react';
import { Typography, List, Tag, Empty, Spin, Alert, Input, Select, Button, Space, message } from 'antd';
import {
    SearchOutlined,
    CopyOutlined,
    ArrowLeftOutlined,
    CheckCircleOutlined,
    ThunderboltOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import MainLayout from '../../components/Layout/MainLayout';
import MobileCard from '../../components/mobile/MobileCard';

const { Title, Text } = Typography;
const { Search } = Input;

const TenantHistory = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [topups, setTopups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchTopups();
    }, [user]);

    const fetchTopups = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('topups')
                .select(`
                    id,
                    amount_paid,
                    amount_vended,
                    fee_amount,
                    payment_channel,
                    token,
                    futurise_status,
                    created_at,
                    units (
                        label,
                        meter_number
                    )
               `)
                .eq('tenant_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setTopups(data || []);
        } catch (err) {
            console.error('Error fetching history:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToken = (token) => {
        navigator.clipboard.writeText(token);
        message.success('Token copied to clipboard!');
    };

    const filteredTopups = topups.filter(topup => {
        const matchesSearch = searchTerm === '' ||
            topup.token?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            topup.units?.meter_number?.includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || topup.futurise_status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <MainLayout>
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <Spin size="large" />
                    <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                        Loading history...
                    </Text>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <Button
                    type="text"
                    icon={<Arrow LeftOutlined />}
                    onClick={() => navigate('/tenant/dashboard')}
                    style={{ marginBottom: 12, padding: 0 }}
                >
                    Back to Dashboard
                </Button>
                <Title level={2} style={{ margin: 0, fontSize: '24px' }}>
                    Purchase History
                </Title>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                    All your electricity token purchases
                </Text>
            </div>

            {/* Filters */}
            <MobileCard style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Search
                        placeholder="Search by token or meter number"
                        prefix={<SearchOutlined />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        allowClear
                        size="large"
                        style={{ borderRadius: '8px' }}
                    />
                    <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        size="large"
                        style={{ width: '100%' }}
                    >
                        <Select.Option value="all">All Transactions</Select.Option>
                        <Select.Option value="success">Successful</Select.Option>
                        <Select.Option value="pending">Pending</Select.Option>
                        <Select.Option value="failed">Failed</Select.Option>
                    </Select>
                </Space>
            </MobileCard>

            {/* Transaction List */}
            {error && (
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            {filteredTopups.length === 0 ? (
                <MobileCard>
                    <Empty
                        description={searchTerm || statusFilter !== 'all' ? 'No transactions found' : 'No purchase history'}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        {searchTerm || statusFilter !== 'all' ? (
                            <Button onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                                Clear Filters
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                onClick={() => navigate('/tenant/buy-token')}
                                style={{
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #1ecf49 0%, #36ea98 100%)',
                                    border: 'none'
                                }}
                            >
                                Buy Your First Token
                            </Button>
                        )}
                    </Empty>
                </MobileCard>
            ) : (
                <List
                    dataSource={filteredTopups}
                    renderItem={(topup) => (
                        <MobileCard
                            key={topup.id}
                            style={{ marginBottom: 12 }}
                            bodyStyle={{ padding: '16px' }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: 12
                            }}>
                                <div>
                                    <Text strong style={{ fontSize: '18px', color: '#1ecf49', display: 'block' }}>
                                        KES {parseFloat(topup.amount_paid).toFixed(2)}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {new Date(topup.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                </div>
                                <Tag color={topup.futurise_status === 'success' ? 'success' : 'default'}>
                                    {topup.futurise_status || 'Completed'}
                                </Tag>
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Unit: </Text>
                                        <Text style={{ fontSize: '13px' }}>{topup.units?.label || 'N/A'}</Text>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Meter: </Text>
                                        <Text style={{ fontSizesize: '13px', fontFamily: 'monospace' }}>
                                            {topup.units?.meter_number || 'N/A'}
                                        </Text>
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Units: </Text>
                                        <Text style={{ fontSize: '13px' }}>
                                            <ThunderboltOutlined style={{ color: '#1ecf49' }} />
                                            {' '}KES {parseFloat(topup.amount_vended).toFixed(2)}
                                        </Text>
                                    </div>
                                </Space>
                            </div>

                            {topup.token && (
                                <div style={{
                                    background: '#f9f9f9',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px dashed #d9d9d9',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ flex: 1, marginRight: 8 }}>
                                        <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                                            Token
                                        </Text>
                                        <Text
                                            strong
                                            style={{
                                                fontSize: '12px',
                                                fontFamily: 'monospace',
                                                wordBreak: 'break-all'
                                            }}
                                        >
                                            {topup.token}
                                        </Text>
                                    </div>
                                    <Button
                                        type="text"
                                        icon={<CopyOutlined />}
                                        onClick={() => copyToken(topup.token)}
                                        style={{ flexShrink: 0 }}
                                    />
                                </div>
                            )}
                        </MobileCard>
                    )}
                />
            )}

            {/* Summary */}
            {filteredTopups.length > 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '20px 0',
                    borderTop: '1px solid #f0f0f0',
                    marginTop: 16
                }}>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                        <CheckCircleOutlined style={{ color: '#1ecf49', marginRight: 4 }} />
                        Showing {filteredTopups.length} of {topups.length} transactions
                    </Text>
                </div>
            )}
        </MainLayout>
    );
};

export default TenantHistory;
