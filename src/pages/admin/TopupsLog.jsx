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
    Alert
} from 'antd';
import {
    HistoryOutlined,
    PlusOutlined,
    SearchOutlined,
    ReloadOutlined
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

    // Manual Topup Data
    const [units, setUnits] = useState([]);
    const [tenants, setTenants] = useState([]);

    useEffect(() => {
        fetchTopups();
        fetchUnitsAndTenants();
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
        } catch (error) {
            console.error('Error fetching topups:', error);
            message.error('Failed to load topups');
        } finally {
            setLoading(false);
        }
    };

    const fetchUnitsAndTenants = async () => {
        // Load units
        const { data: u } = await supabase.from('units').select('id, label, meter_number, property_id, properties(name)');
        setUnits(u || []);
        // Load tenants
        const { data: t } = await supabase.from('profiles').select('id, full_name, role').eq('role', 'tenant');
        setTenants(t || []);
    };

    const handleManualTopup = async (values) => {
        setProcessing(true);
        try {
            // 1. Get Unit Details
            const unit = units.find(u => u.id === values.unit_id);
            if (!unit || !unit.meter_number) throw new Error('Invalid unit or missing meter number');

            // 2. Call Futurise (using Dev proxy or production logic)
            // Note: For Manual Topup, we might skip payment but we still vend the token
            const vendRes = await futuriseDev.vendToken(unit.meter_number, values.amount);

            if (!vendRes.success) throw new Error(vendRes.message);

            // 3. Record in Database
            const { data: { user } } = await supabase.auth.getUser(); // Current admin

            const record = {
                unit_id: values.unit_id,
                tenant_id: values.tenant_id, // Assigned to tenant
                amount_paid: values.amount,
                amount_vended: vendRes.units || values.amount, // Approximate if missing
                fee_amount: 0,
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
                    columns={columns}
                    dataSource={topups}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
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
                        name="unit_id"
                        label="Select Unit/Meter"
                        rules={[{ required: true }]}
                    >
                        <Select showSearch optionFilterProp="children">
                            {units.map(u => (
                                <Select.Option key={u.id} value={u.id}>
                                    {u.properties?.name} - {u.label} ({u.meter_number})
                                </Select.Option>
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
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={processing} style={{ background: '#1ecf49' }}>
                                Generate Token
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </MainLayout>
    );
};

export default TopupsLog;
