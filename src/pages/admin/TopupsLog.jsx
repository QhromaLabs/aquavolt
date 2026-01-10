import { useState, useEffect } from 'react';
import {
    Typography,
    Card,
    Table,
    Tag,
    Button,
    Space,
    Modal,
    Form,
    Input,
    Select,
    InputNumber,
    message,
    Alert,
    Popconfirm
} from 'antd';
import {
    HistoryOutlined,
    PlusOutlined,
    SearchOutlined,
    ReloadOutlined,
    SendOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { supabase } from '../../lib/supabase';
import { futuriseDev } from '../../lib/futuriseDev';

const { Title, Text } = Typography;

const TopupsLog = () => {
    const [topups, setTopups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [processing, setProcessing] = useState(false);
    const [resending, setResending] = useState({});

    // Bulk Action State
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [deleting, setDeleting] = useState(false);

    // Manual Topup Data
    const [units, setUnits] = useState([]);
    const [tenants, setTenants] = useState([]);

    // Admin Settings for calculation
    const [serviceFeePercent, setServiceFeePercent] = useState(5.0);
    const [tariffRate, setTariffRate] = useState(null);
    const [manualAmount, setManualAmount] = useState(null);

    useEffect(() => {
        fetchTopups();
        fetchUnitsAndTenants();
        fetchAdminSettings();
    }, []);

    const fetchTopups = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('topups')
                .select(`
                    *,
                    units ( label, meter_number, properties(name) ),
                    profiles:tenant_id ( full_name, email )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTopups(data || []);
            setSelectedRowKeys([]); // Reset selection on refresh
        } catch (error) {
            console.error('Error fetching topups:', error);
            message.error('Failed to load topups');
        } finally {
            setLoading(false);
        }
    };

    const fetchUnitsAndTenants = async () => {
        try {
            // Load units with tenant info from unit_assignments
            const { data: u, error: unitsError } = await supabase
                .from('units')
                .select(`
                    id, 
                    label, 
                    meter_number, 
                    property_id, 
                    properties(name),
                    unit_assignments!inner(tenant_id, status)
                `)
                .eq('unit_assignments.status', 'active');

            if (unitsError) {
                console.error('Error fetching units:', unitsError);
                message.error('Failed to load units: ' + unitsError.message);
            } else {
                // Transform the data to flatten tenant_id
                const unitsWithTenant = (u || []).map(unit => ({
                    ...unit,
                    tenant_id: unit.unit_assignments?.[0]?.tenant_id || null
                }));
                console.log('Units loaded:', unitsWithTenant);
                setUnits(unitsWithTenant);
            }

            // Load tenants
            const { data: t, error: tenantsError } = await supabase
                .from('profiles')
                .select('id, full_name, role')
                .eq('role', 'tenant');

            if (tenantsError) {
                console.error('Error fetching tenants:', tenantsError);
                message.error('Failed to load tenants: ' + tenantsError.message);
            } else {
                console.log('Tenants loaded:', t);
                setTenants(t || []);
            }
        } catch (error) {
            console.error('Error in fetchUnitsAndTenants:', error);
            message.error('Failed to load data: ' + error.message);
        }
    };

    const fetchAdminSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('admin_settings')
                .select('key, value')
                .in('key', ['service_fee_percent', 'tariff_ksh_per_kwh']);

            if (error) throw error;

            if (data) {
                data.forEach(item => {
                    if (item.key === 'service_fee_percent') {
                        setServiceFeePercent(parseFloat(item.value) || 5.0);
                    } else if (item.key === 'tariff_ksh_per_kwh') {
                        setTariffRate(parseFloat(item.value) || null);
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching admin settings:', error);
        }
    };

    // Calculation helpers (same logic as Flutter app)
    const getNetAmount = (amount) => {
        if (!amount) return 0;
        return amount * (1 - serviceFeePercent / 100);
    };

    const getEstimatedUnits = (amount) => {
        if (!tariffRate || tariffRate <= 0 || !amount) return 0;
        const netAmount = getNetAmount(amount);
        return netAmount / tariffRate;
    };

    const handleManualTopup = async (values) => {
        setProcessing(true);
        try {
            // 1. Get Unit Details
            const unit = units.find(u => u.id === values.unit_id);
            if (!unit || !unit.meter_number) throw new Error('Invalid unit or missing meter number');

            // 2. Call Futurise (using Dev proxy or production logic)
            // Note: For Manual Topup, we might skip payment but we still vend the token

            // Calculate Units to vend based on tariff
            // User feedback: "vended actual 100 instead of amount calculated in watt"
            // This implies we should send the CALCULATED UNITS to the API 'money' field
            let amountToVend = values.amount;
            if (tariffRate && tariffRate > 0) {
                amountToVend = getEstimatedUnits(values.amount);
                console.log(`[ManualVending] Converting KES ${values.amount} -> ${amountToVend.toFixed(2)} Units (Rate: ${tariffRate})`);
            }

            const vendRes = await futuriseDev.vendToken(unit.meter_number, amountToVend);

            if (!vendRes.success) throw new Error(vendRes.message);

            // 3. Record in Database
            const { data: { user } } = await supabase.auth.getUser(); // Current admin

            const record = {
                unit_id: values.unit_id,
                tenant_id: values.tenant_id, // Assigned to tenant
                amount_paid: values.amount,
                amount_vended: vendRes.units || amountToVend, // Use calculated units
                fee_amount: values.amount - getNetAmount(values.amount), // Approximate fee logic if any
                payment_channel: 'manual_admin',
                token: vendRes.token,
                futurise_status: 'success',
                futurise_message: 'Manual Admin Topup',
                futurise_transaction_id: vendRes.transactionId,
                futurise_request_id: 'MANUAL-' + Date.now()
            };

            const { error: dbError } = await supabase.from('topups').insert([record]);
            if (dbError) throw dbError;

            message.success('Manual Top-up Successful! Token generated.');
            setModalVisible(false);
            form.resetFields();
            fetchTopups();

            // Show token
            Modal.success({
                title: 'Token Generated',
                content: (
                    <div>
                        <Text strong style={{ fontSize: '24px', color: '#1ecf49', display: 'block', textAlign: 'center', margin: '20px 0' }}>
                            {vendRes.token}
                        </Text>
                        <Text type="secondary">Amount: KES {values.amount}</Text><br />
                        <Text type="secondary">Meter: {unit.meter_number}</Text>
                    </div>
                )
            });

        } catch (error) {
            console.error('Manual topup error:', error);
            message.error('Top-up Failed: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleResendSMS = async (topup) => {
        setResending(prev => ({ ...prev, [topup.id]: true }));
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-sms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ topup_id: topup.id })
            });

            const result = await res.json();

            if (result.success) {
                message.success('SMS sent successfully!');
            } else {
                message.error(`Failed to send SMS: ${result.message}`);
            }
        } catch (error) {
            console.error('Resend SMS error:', error);
            message.error('Failed to send SMS: ' + error.message);
        } finally {
            setResending(prev => ({ ...prev, [topup.id]: false }));
        }
    };

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const handleBulkDelete = async () => {
        if (selectedRowKeys.length === 0) return;

        setDeleting(true);
        try {
            // 1. Delete related commissions first (FK Constraint Fix 1)
            const { error: commError } = await supabase
                .from('commissions')
                .delete()
                .in('source_topup_id', selectedRowKeys);

            if (commError) {
                console.error('Error cleaning up commissions:', commError);
                throw new Error(`Failed to clean up related commissions: ${commError.message}`);
            }

            // 2. Delete related mpesa_payments (FK Constraint Fix 2)
            const { error: mpesaError } = await supabase
                .from('mpesa_payments')
                .delete()
                .in('topup_id', selectedRowKeys);

            if (mpesaError) {
                console.error('Error cleaning up mpesa_payments:', mpesaError);
                throw new Error(`Failed to clean up related mpesa records: ${mpesaError.message}`);
            }

            // 3. Delete related sms_logs (FK Constraint Fix 3)
            const { error: smsError } = await supabase
                .from('sms_logs')
                .delete()
                .in('topup_id', selectedRowKeys);

            if (smsError) {
                console.error('Error cleaning up sms_logs:', smsError);
                throw new Error(`Failed to clean up related sms logs: ${smsError.message}`);
            }

            // 4. Delete the topups
            const { error } = await supabase
                .from('topups')
                .delete()
                .in('id', selectedRowKeys);

            if (error) throw error;

            message.success(`Successfully deleted ${selectedRowKeys.length} records and related data`);
            setSelectedRowKeys([]);
            fetchTopups();
        } catch (error) {
            console.error('Bulk delete error:', error);
            message.error('Failed to delete records: ' + error.message);
        } finally {
            setDeleting(false);
        }
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'date',
            render: (d) => new Date(d).toLocaleString(),
        },
        {
            title: 'Tenant',
            key: 'tenant',
            render: (_, r) => r.profiles?.full_name || 'Unknown'
        },
        {
            title: 'Unit',
            key: 'unit',
            render: (_, r) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{r.units?.label}</Text>
                    <Text type="secondary" style={{ fontSize: '10px' }}>{r.units?.meter_number}</Text>
                </Space>
            )
        },
        {
            title: 'Amount',
            dataIndex: 'amount_paid',
            key: 'amount',
            render: (a) => <Text strong>KES {a}</Text>
        },
        {
            title: 'Token',
            dataIndex: 'token',
            key: 'token',
            render: (t) => t ? <Text code copyable>{t}</Text> : <Tag color="red">Failed</Tag>
        },
        {
            title: 'Channel',
            dataIndex: 'payment_channel',
            key: 'channel',
            render: (c) => <Tag>{c}</Tag>
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => record.token ? (
                <Button
                    type="link"
                    icon={<SendOutlined />}
                    size="small"
                    loading={resending[record.id]}
                    onClick={() => handleResendSMS(record)}
                >
                    Resend SMS
                </Button>
            ) : null
        }
    ];

    return (
        <MainLayout>
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Title level={2}>
                            <HistoryOutlined /> Top-Ups Log
                        </Title>
                        <Text type="secondary">View all transaction history</Text>
                    </div>
                    <Space>
                        {selectedRowKeys.length > 0 && (
                            <Popconfirm
                                title="Delete Selected Records?"
                                description={`Are you sure you want to delete ${selectedRowKeys.length} records? This cannot be undone.`}
                                onConfirm={handleBulkDelete}
                                okText="Yes, Delete"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true, loading: deleting }}
                            >
                                <Button danger icon={<DeleteOutlined />} loading={deleting}>
                                    Delete ({selectedRowKeys.length})
                                </Button>
                            </Popconfirm>
                        )}
                        <Button icon={<ReloadOutlined />} onClick={fetchTopups} loading={loading}>
                            Refresh
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setModalVisible(true)}
                            style={{ background: '#1ecf49', borderColor: '#1ecf49' }}
                        >
                            Manual Top-Up
                        </Button>
                    </Space>
                </div>
            </div>

            <Card>
                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={topups}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        defaultPageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '100', '1000']
                    }}
                />
            </Card>

            <Modal
                title="Manual Top-Up (Admin)"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Alert
                    message="Manual top-ups generate real tokens from Futurise but bypass M-Pesa payment."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                />

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleManualTopup}
                >
                    <Form.Item
                        name="unit_id"
                        label={`Select Unit/Meter (${units.length} available)`}
                        rules={[{ required: true }]}
                    >
                        <Select
                            showSearch
                            optionFilterProp="children"
                            placeholder={units.length === 0 ? "No units found - check console for errors" : "Select a unit/meter"}
                            onChange={(unitId) => {
                                // Auto-select tenant when unit is selected
                                console.log('Unit selected:', unitId);
                                const selectedUnit = units.find(u => u.id === unitId);
                                console.log('Selected unit object:', selectedUnit);
                                if (selectedUnit?.tenant_id) {
                                    console.log('Auto-selecting tenant:', selectedUnit.tenant_id);
                                    form.setFieldsValue({ tenant_id: selectedUnit.tenant_id });
                                }
                            }}
                        >
                            {units.length === 0 ? (
                                <Select.Option disabled value="">No units available</Select.Option>
                            ) : (
                                units.map(u => (
                                    <Select.Option key={u.id} value={u.id}>
                                        {u.properties?.name} - {u.label} ({u.meter_number})
                                    </Select.Option>
                                ))
                            )}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="tenant_id"
                        label="Select Tenant"
                        rules={[{ required: true }]}
                    >
                        <Select showSearch optionFilterProp="children">
                            {tenants.map(t => (
                                <Select.Option key={t.id} value={t.id}>{t.full_name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="amount"
                        label="Amount (KES)"
                        rules={[{ required: true }]}
                    >
                        <InputNumber
                            min={1}
                            style={{ width: '100%' }}
                            addonBefore="KES"
                            onChange={(value) => setManualAmount(value)}
                        />
                    </Form.Item>

                    {/* Estimated kWh Display */}
                    {
                        manualAmount && manualAmount > 0 && (
                            <div style={{
                                padding: '16px',
                                background: '#fff',
                                borderRadius: '8px',
                                border: '1px solid #f0f0f0',
                                marginBottom: '16px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <Text type="secondary">Amount</Text>
                                    <Text strong>KES {manualAmount.toFixed(2)}</Text>
                                </div>
                                <div style={{ borderTop: '1px solid #f0f0f0', margin: '8px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <Text strong style={{ fontSize: '15px' }}>Est. Units (kWh)</Text>
                                    </div>
                                    <Text strong style={{ fontSize: '20px', color: '#1ecf49' }}>
                                        {getEstimatedUnits(manualAmount).toFixed(2)} kWh
                                    </Text>
                                </div>
                            </div>
                        )
                    }

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={processing} style={{ background: '#1ecf49' }}>
                                Generate Token
                            </Button>
                        </Space>
                    </Form.Item>
                </Form >
            </Modal >
        </MainLayout >
    );
};

export default TopupsLog;
