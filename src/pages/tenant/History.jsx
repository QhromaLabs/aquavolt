import { useState, useEffect } from 'react';
import { Typography, List, Tag, Empty, Spin, Alert, Input, Select, Button, Space, message } from 'antd';
import {
    SearchOutlined,
    CopyOutlined,
    CheckCircleOutlined,
    ThunderboltOutlined,
    SyncOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    StopOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import TenantLayout from '../../layouts/TenantLayout';
import MobileCard from '../../components/mobile/MobileCard';
import TokenReceiptModal from '../../components/common/TokenReceiptModal';

const { Title, Text } = Typography;
const { Search } = Input;

const TenantHistory = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedTopup, setSelectedTopup] = useState(null);
    const [retrying, setRetrying] = useState({});

    useEffect(() => {
        fetchTransactions();
    }, [user]);

    // Refetch transactions when page comes into focus (e.g., after buying a token)
    useEffect(() => {
        const handleFocus = () => {
            fetchTransactions();
        };

        window.addEventListener('focus', handleFocus);
        // Also refetch when component mounts or becomes visible
        handleFocus();

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [user]);

    const fetchTransactions = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Fetch M-Pesa payments
            const { data: mpesaData, error: mpesaError } = await supabase
                .from('mpesa_payments')
                .select(`
                    id,
                    checkout_request_id,
                    phone_number,
                    amount,
                    status,
                    mpesa_receipt_number,
                    token_vended,
                    topup_id,
                    created_at,
                    unit_id,
                    units (
                        label,
                        meter_number
                    )
                `)
                .eq('tenant_id', user.id)
                .order('created_at', { ascending: false });

            if (mpesaError) throw mpesaError;

            // Fetch topups
            const { data: topupsData, error: topupsError } = await supabase
                .from('topups')
                .select(`
                    id,
                    amount_paid,
                    amount_vended,
                    units_kwh,
                    fee_amount,
                    payment_channel,
                    token,
                    futurise_status,
                    created_at,
                    mpesa_receipt_number,
                    units (
                        label,
                        meter_number,
                        properties (
                            name
                        )
                    )
                `)
                .eq('tenant_id', user.id)
                .order('created_at', { ascending: false });

            if (topupsError) throw topupsError;

            // Merge M-Pesa payments with topups
            const mergedData = [];

            // Add M-Pesa payments
            (mpesaData || []).forEach(payment => {
                const linkedTopup = (topupsData || []).find(t => t.id === payment.topup_id);
                mergedData.push({
                    id: payment.id,
                    type: 'mpesa_payment',
                    payment_id: payment.id,
                    checkout_request_id: payment.checkout_request_id,
                    amount: payment.amount,
                    payment_status: payment.status,
                    token_vended: payment.token_vended,
                    mpesa_receipt_number: payment.mpesa_receipt_number,
                    token: linkedTopup?.token,
                    units: payment.units,
                    created_at: payment.created_at,
                    topup: linkedTopup,
                    unit_id: payment.unit_id
                });
            });

            // Add topups without M-Pesa payment records (legacy or other payment methods)
            (topupsData || []).forEach(topup => {
                const alreadyAdded = mergedData.some(m => m.topup?.id === topup.id);
                if (!alreadyAdded) {
                    mergedData.push({
                        id: topup.id,
                        type: 'topup',
                        amount: topup.amount_paid,
                        payment_status: topup.futurise_status,
                        token: topup.token,
                        units: topup.units,
                        created_at: topup.created_at,
                        topup: topup
                    });
                }
            });

            // Sort by created_at
            mergedData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            setTransactions(mergedData);
        } catch (err) {
            console.error('Error fetching history:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRetryVending = async (transaction) => {
        setRetrying({ ...retrying, [transaction.id]: true });
        try {
            // Get unit meter number
            const { data: unit } = await supabase
                .from('units')
                .select('meter_number')
                .eq('id', transaction.unit_id)
                .single();

            if (!unit || !unit.meter_number) {
                throw new Error('Meter number not found');
            }

            // Calculate net amount (assuming 5% service fee)
            const serviceFee = transaction.amount * 0.05;
            const netAmount = transaction.amount - serviceFee;

            // Call vending function
            message.loading({ content: 'Retrying token vending...', key: 'retry_vend', duration: 0 });

            const { data, error } = await supabase.functions.invoke('futurise-vend-token', {
                body: {
                    action: 'vend',
                    meterNumber: unit.meter_number,
                    amount: netAmount
                }
            });

            if (error) throw error;

            if (data.success && data.token) {
                // Create topup record
                const { data: topup, error: topupError } = await supabase
                    .from('topups')
                    .insert({
                        unit_id: transaction.unit_id,
                        tenant_id: user.id,
                        amount_paid: transaction.amount,
                        amount_vended: netAmount,
                        units_kwh: parseFloat(data.units || 0), // Store actual kWh units
                        fee_amount: serviceFee,
                        payment_channel: 'mpesa',
                        token: data.token,
                        futurise_status: 'success',
                        futurise_message: 'Token generated via retry',
                        futurise_transaction_id: data.transactionId,
                        mpesa_receipt_number: transaction.mpesa_receipt_number
                    })
                    .select()
                    .single();

                if (topupError) throw topupError;

                // Update M-Pesa payment record
                await supabase
                    .from('mpesa_payments')
                    .update({
                        token_vended: true,
                        topup_id: topup.id
                    })
                    .eq('id', transaction.payment_id);

                message.success({ content: 'Token vended successfully!', key: 'retry_vend' });
                fetchTransactions(); // Refresh list
            } else {
                throw new Error(data.message || data.error || 'Vending failed');
            }
        } catch (err) {
            console.error('Retry vending error:', err);
            message.error({ content: `Retry failed: ${err.message}`, key: 'retry_vend' });
        } finally {
            setRetrying({ ...retrying, [transaction.id]: false });
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success': return <CheckCircleOutlined />;
            case 'pending': return <ClockCircleOutlined spin />;
            case 'failed': return <CloseCircleOutlined />;
            case 'cancelled': return <StopOutlined />;
            default: return <CheckCircleOutlined />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'success';
            case 'pending': return 'processing';
            case 'failed': return 'error';
            case 'cancelled': return 'default';
            default: return 'default';
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = searchTerm === '' ||
            tx.token?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.units?.meter_number?.includes(searchTerm) ||
            tx.mpesa_receipt_number?.includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || tx.payment_status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <TenantLayout>
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <Spin size="large" />
                    <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                        Loading history...
                    </Text>
                </div>
            </TenantLayout>
        );
    }

    return (
        <TenantLayout>
            <div style={{ padding: '20px' }}>
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={2} style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
                        Purchase History
                    </Title>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                        All your electricity token purchases and M-Pesa payments
                    </Text>
                </div>

                {/* Filters */}
                <MobileCard style={{ marginBottom: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Search
                            placeholder="Search by token, meter, or receipt number"
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
                            <Select.Option value="cancelled">Cancelled</Select.Option>
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

                {filteredTransactions.length === 0 ? (
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
                        dataSource={filteredTransactions}
                        renderItem={(tx) => (
                            <MobileCard
                                key={tx.id}
                                style={{ marginBottom: 12, cursor: 'pointer', transition: 'transform 0.1s' }}
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
                                            KES {parseFloat(tx.amount).toFixed(2)}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {new Date(tx.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    </div>
                                    <Tag
                                        icon={getStatusIcon(tx.payment_status)}
                                        color={getStatusColor(tx.payment_status)}
                                    >
                                        {tx.payment_status || 'Completed'}
                                    </Tag>
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                        {tx.units && (
                                            <>
                                                <div>
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>Unit: </Text>
                                                    <Text style={{ fontSize: '13px' }}>{tx.units.label || 'N/A'}</Text>
                                                </div>
                                                <div>
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>Meter: </Text>
                                                    <Text style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                                                        {tx.units.meter_number || 'N/A'}
                                                    </Text>
                                                </div>
                                            </>
                                        )}
                                        {tx.mpesa_receipt_number && (
                                            <div>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>M-Pesa Receipt: </Text>
                                                <Text style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                                                    {tx.mpesa_receipt_number}
                                                </Text>
                                            </div>
                                        )}
                                        {tx.topup && (
                                            <div>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>Units Vended: </Text>
                                                <Text style={{ fontSize: '13px' }}>
                                                    <ThunderboltOutlined style={{ color: '#1ecf49' }} />
                                                    {' '}{tx.topup.units_kwh ? `${parseFloat(tx.topup.units_kwh || 0).toFixed(2)} kWh` : `KES ${parseFloat(tx.topup.amount_vended || 0).toFixed(2)}`}
                                                </Text>
                                            </div>
                                        )}
                                    </Space>
                                </div>

                                {/* Token Display */}
                                {tx.token && (
                                    <div style={{
                                        background: '#f9f9f9',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px dashed #d9d9d9',
                                        marginBottom: 8
                                    }}>
                                        <div>
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
                                                onClick={() => setSelectedTopup(tx.topup)}
                                            >
                                                {tx.token}
                                            </Text>
                                        </div>
                                    </div>
                                )}

                                {/* Vending Status & Retry Button */}
                                {tx.type === 'mpesa_payment' && tx.payment_status === 'success' && !tx.token_vended && (
                                    <Alert
                                        message="Token Not Vended"
                                        description="Payment was successful but token vending failed. Click retry to attempt vending again."
                                        type="warning"
                                        showIcon
                                        style={{ marginTop: 12 }}
                                        action={
                                            <Button
                                                size="small"
                                                type="primary"
                                                icon={<ReloadOutlined />}
                                                loading={retrying[tx.id]}
                                                onClick={() => handleRetryVending(tx)}
                                            >
                                                Retry
                                            </Button>
                                        }
                                    />
                                )}
                            </MobileCard>
                        )}
                    />
                )}

                {/* Summary */}
                {filteredTransactions.length > 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '20px 0',
                        borderTop: '1px solid #f0f0f0',
                        marginTop: 16
                    }}>
                        <Text type="secondary" style={{ fontSize: '13px' }}>
                            <CheckCircleOutlined style={{ color: '#1ecf49', marginRight: 4 }} />
                            Showing {filteredTransactions.length} of {transactions.length} transactions
                        </Text>
                    </div>
                )}

            </div>
            <TokenReceiptModal
                visible={!!selectedTopup}
                onClose={() => setSelectedTopup(null)}
                topup={selectedTopup}
                tenantName={user?.user_metadata?.full_name || 'Valued Customer'}
            />
        </TenantLayout>
    );
};

export default TenantHistory;
