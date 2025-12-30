import { useState, useEffect } from 'react';
import {
    Typography,
    Tabs,
    Card,
    Form,
    Input,
    InputNumber,
    Button,
    message,
    Avatar,
    Descriptions,
    Divider,
    Space,
    Tag,
    Alert,
    Table,
    Select,
    Badge,
    Tooltip,
    Modal
} from 'antd';
import {
    UserOutlined,
    LockOutlined,
    SaveOutlined,
    PhoneOutlined,
    MailOutlined,
    SafetyCertificateOutlined,
    ToolOutlined,
    SettingOutlined,
    ApiOutlined,
    MessageOutlined,
    KeyOutlined,
    ThunderboltOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    MinusCircleOutlined
} from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const Settings = () => {
    const { user, profile, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);

    // Profile Form
    const [profileForm] = Form.useForm();

    // Password Form
    const [passwordForm] = Form.useForm();

    // System Settings Form
    const [systemForm] = Form.useForm();
    const tariffKshPerKwh = Form.useWatch('tariff_ksh_per_kwh', systemForm);
    const [settingsLoading, setSettingsLoading] = useState(false);

    // Automations Form
    const [automationsForm] = Form.useForm();
    const [automationsLoading, setAutomationsLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [hasCredentials, setHasCredentials] = useState(false);

    // SMS Logs State
    const [smsLogs, setSmsLogs] = useState([]);
    const [smsLogsLoading, setSmsLogsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [configureModalVisible, setConfigureModalVisible] = useState(false);

    useEffect(() => {
        fetchSystemSettings();
        fetchCredentials();
        fetchSmsLogs();
    }, []);

    const fetchSystemSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('admin_settings')
                .select('*')
                .in('key', ['service_fee_percent', 'support_phone_whatsapp', 'tariff_ksh_per_kwh']);

            if (data) {
                const settings = {};
                data.forEach(item => {
                    settings[item.key] = item.value;
                });
                systemForm.setFieldsValue({
                    service_fee_percent: settings.service_fee_percent,
                    support_phone_whatsapp: settings.support_phone_whatsapp,
                    tariff_ksh_per_kwh: settings.tariff_ksh_per_kwh
                });
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    };

    const fetchCredentials = async () => {
        try {
            const { data, error } = await supabase
                .from('api_credentials')
                .select('credentials')
                .eq('service_name', 'africastalking')
                .single();

            if (data && data.credentials) {
                automationsForm.setFieldsValue(data.credentials);
                setHasCredentials(true);
            }
        } catch (err) {
            console.error('Error fetching automation credentials:', err);
        }
    };

    const handleUpdateSystemSettings = async (values) => {
        setSettingsLoading(true);
        try {
            const updates = [
                { key: 'service_fee_percent', value: values.service_fee_percent.toString() },
                { key: 'support_phone_whatsapp', value: values.support_phone_whatsapp?.toString() || '' },
                { key: 'tariff_ksh_per_kwh', value: values.tariff_ksh_per_kwh?.toString() || '' }
            ];

            const { error } = await supabase
                .from('admin_settings')
                .upsert(updates.map(u => ({ ...u, updated_at: new Date() })), { onConflict: 'key' });

            if (error) throw error;
            message.success('System settings updated');
        } catch (error) {
            console.error('Error updating settings:', error);
            message.error('Failed to update settings');
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleSaveAutomations = async (values) => {
        setAutomationsLoading(true);
        try {
            // Structure the data clearly
            const credentialsPayload = {
                username: values.username,
                api_key: values.api_key,
                sender_id: values.sender_id || '', // Optional
                sms_template: values.sms_template || 'Token: {token}. Units: {units} KWh. Amount: KES {amount}. Meter: {meter}.' // Default
            };

            const { error } = await supabase
                .from('api_credentials')
                .upsert({
                    service_name: 'africastalking',
                    credentials: credentialsPayload,
                    updated_at: new Date()
                }, { onConflict: 'service_name' });

            if (error) throw error;

            message.success('Automation settings saved successfully');
            setHasCredentials(true);
        } catch (error) {
            console.error('Error saving settings:', error);
            message.error('Failed to save settings');
        } finally {
            setAutomationsLoading(false);
        }
    };

    useEffect(() => {
        if (profile) {
            profileForm.setFieldsValue({
                full_name: profile.full_name,
                phone_number: profile.phone_number,
                email: profile.email
            });
        }
    }, [profile, profileForm]);

    const handleUpdateProfile = async (values) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: values.full_name,
                    phone_number: values.phone_number,
                    updated_at: new Date()
                })
                .eq('id', user.id);

            if (error) throw error;

            message.success('Profile updated successfully');
            if (refreshProfile) refreshProfile(); // Refresh context if available
        } catch (error) {
            console.error('Error updating profile:', error);
            message.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (values) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: values.new_password
            });

            if (error) throw error;

            message.success('Password updated successfully');
            passwordForm.resetFields();
        } catch (error) {
            console.error('Error updating password:', error);
            message.error('Failed to update password: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchSmsLogs = async () => {
        setSmsLogsLoading(true);
        try {
            let query = supabase
                .from('sms_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setSmsLogs(data || []);
        } catch (error) {
            console.error('Error fetching SMS logs:', error);
            message.error('Failed to load SMS logs');
        } finally {
            setSmsLogsLoading(false);
        }
    };

    const items = [
        {
            key: '1',
            label: (
                <span>
                    <UserOutlined />
                    Profile Settings
                </span>
            ),
            children: (
                <div style={{ maxWidth: 800 }}>
                    <Card title="Personal Information" bordered={false}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 24 }}>
                            <div style={{ textAlign: 'center' }}>
                                <Avatar
                                    size={100}
                                    style={{ backgroundColor: '#1ecf49', marginBottom: 16 }}
                                    icon={<UserOutlined />}
                                >
                                    {profile?.full_name?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                <div>
                                    <Tag color="blue">{profile?.role?.toUpperCase()}</Tag>
                                </div>
                            </div>

                            <div style={{ flex: 1 }}>
                                <Descriptions column={1} bordered size="small">
                                    <Descriptions.Item label={<><MailOutlined /> Email</>}>
                                        {profile?.email}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="User ID">
                                        <Text type="secondary" copyable>{user?.id}</Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Member Since">
                                        {new Date(profile?.created_at).toLocaleDateString()}
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>
                        </div>

                        <Divider />

                        <Form
                            form={profileForm}
                            layout="vertical"
                            onFinish={handleUpdateProfile}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <Form.Item
                                    name="full_name"
                                    label="Full Name"
                                    rules={[{ required: true, message: 'Please enter your full name' }]}
                                >
                                    <Input prefix={<UserOutlined />} placeholder="Full Name" />
                                </Form.Item>

                                <Form.Item
                                    name="phone_number"
                                    label="Phone Number"
                                    rules={[{ required: true, message: 'Please enter your phone number' }]}
                                >
                                    <Input prefix={<PhoneOutlined />} placeholder="Phone Number" />
                                </Form.Item>
                            </div>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SaveOutlined />}
                                    loading={loading}
                                    style={{ background: '#1ecf49' }}
                                >
                                    Save Changes
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </div>
            ),
        },
        {
            key: '2',
            label: (
                <span>
                    <SafetyCertificateOutlined />
                    Security
                </span>
            ),
            children: (
                <div style={{ maxWidth: 600 }}>
                    <Card title="Change Password" bordered={false}>
                        <Form
                            form={passwordForm}
                            layout="vertical"
                            onFinish={handleChangePassword}
                        >
                            <Form.Item
                                name="new_password"
                                label="New Password"
                                rules={[
                                    { required: true, message: 'Please enter a new password' },
                                    { min: 6, message: 'Password must be at least 6 characters' }
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
                            </Form.Item>

                            <Form.Item
                                name="confirm_password"
                                label="Confirm Password"
                                dependencies={['new_password']}
                                rules={[
                                    { required: true, message: 'Please confirm your password' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('new_password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('The two passwords that you entered do not match!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    style={{ background: '#1ecf49' }}
                                >
                                    Update Password
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </div>
            ),
        },
        // Automations tab moved to modal in SMS Logs tab
        /*
        {
            key: '3',
            label: (
                <span>
                    <ThunderboltOutlined />
                    Automations
                </span>
            ),
            children: (
                <div style={{ maxWidth: 800 }}>
                    <Card
                        title={<span><MessageOutlined /> Africa's Talking (SMS Gateway)</span>}
                        extra={<a href="https://africastalking.com/" target="_blank" rel="noreferrer">Visit Website</a>}
                        bordered={false}
                    >
                        <Alert
                            message="SMS Automation"
                            description="Configure your Africa's Talking credentials here to enable automated SMS notifications when tokens are generated."
                            type="info"
                            showIcon
                            style={{ marginBottom: 24 }}
                        />

                        <Form
                            form={automationsForm}
                            layout="vertical"
                            onFinish={handleSaveAutomations}
                            initialValues={{
                                sms_template: 'Token Generated! Token: {token}. Units: {units} KWh. Amount: KES {amount}. Meter: {meter}. Thank you.'
                            }}
                        >
                            <Title level={5}>API Credentials</Title>
                            <Form.Item
                                name="username"
                                label="Username"
                                rules={[{ required: true, message: 'Please enter your Africa\'s Talking username' }]}
                                extra="For sandbox, use 'sandbox'"
                            >
                                <Input prefix={<ApiOutlined />} placeholder="e.g. sandbox or your_app_username" />
                            </Form.Item>

                            <Form.Item
                                name="api_key"
                                label="API Key"
                                rules={[{ required: true, message: 'Please enter your API Key' }]}
                            >
                                <Input.Password prefix={<KeyOutlined />} placeholder="Enter your API Key" />
                            </Form.Item>

                            <Form.Item
                                name="sender_id"
                                label="Sender ID (Optional)"
                                extra="Leave blank to use the default sender ID (e.g., AFRICTALK or shortcode)"
                            >
                                <Input placeholder="e.g. AQUAVOLT" />
                            </Form.Item>

                            <Divider />

                            <Title level={5}>Message Template</Title>
                            <Paragraph type="secondary" style={{ fontSize: '13px' }}>
                                Available variables: <Text code>{'{token}'}</Text>, <Text code>{'{units}'}</Text>, <Text code>{'{amount}'}</Text>, <Text code>{'{meter}'}</Text>, <Text code>{'{name}'}</Text>
                            </Paragraph>

                            <Form.Item
                                name="sms_template"
                                label="SMS Content"
                                rules={[{ required: true, message: 'Please define the SMS template' }]}
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Enter the message content..."
                                    showCount
                                   maxLength={160}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Space style={{ width: '100%' }}>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        icon={<SaveOutlined />}
                                        loading={automationsLoading}
                                        style={{ background: '#1ecf49', minWidth: 120 }}
                                    >
                                        Save Configuration
                                    </Button>
                                    <Button
                                        type="default"
                                        icon={<ApiOutlined />}
                                        loading={verifying}
                                        onClick={async () => {
                                            try {
                                                const values = await automationsForm.validateFields(['username', 'api_key']);
                                                setVerifying(true);

                                                // Call Supabase Edge Function to verify
                                                const { data: { session } } = await supabase.auth.getSession();
                                                const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-at-credentials`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
                                                    },
                                                    body: JSON.stringify({
                                                        username: values.username,
                                                        apiKey: values.api_key
                                                    })
                                                });

                                                const result = await res.json();

                                                if (result.success) {
                                                    message.success(`Verified! Balance: ${result.balance}`);
                                                } else {
                                                    message.error(`Verification Failed: ${result.message}`);
                                                }
                                            } catch (err) {
                                                console.error('Verification error:', err);
                                                message.error(err.message || 'Verification failed. Please check your console.');
                                            } finally {
                                                setVerifying(false);
                                            }
                                        }}
                                    >
                                        Verify Credentials
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Card>
                </div>
            ),
        },
        */
        {
            key: 'sms-logs',
            label: (
                <span>
                    <MessageOutlined />
                    SMS Logs
                </span>
            ),
            children: (
                <Card
                    title="SMS Delivery Logs"
                    bordered={false}
                    extra={
                        <Space>
                            <Button
                                type="primary"
                                icon={<SettingOutlined />}
                                onClick={() => setConfigureModalVisible(true)}
                            >
                                Configure
                            </Button>
                            <Select
                                value={statusFilter}
                                onChange={(value) => {
                                    setStatusFilter(value);
                                    setTimeout(fetchSmsLogs, 100);
                                }}
                                style={{ width: 120 }}
                            >
                                <Select.Option value="all">All Status</Select.Option>
                                <Select.Option value="success">Success</Select.Option>
                                <Select.Option value="failed">Failed</Select.Option>
                                <Select.Option value="skipped">Skipped</Select.Option>
                            </Select>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={fetchSmsLogs}
                                loading={smsLogsLoading}
                            >
                                Refresh
                            </Button>
                        </Space>
                    }
                >
                    <Table
                        dataSource={smsLogs}
                        loading={smsLogsLoading}
                        rowKey="id"
                        pagination={{ pageSize: 20 }}
                        columns={[
                            {
                                title: 'Time',
                                dataIndex: 'created_at',
                                key: 'created_at',
                                render: (date) => new Date(date).toLocaleString(),
                                width: 180,
                            },
                            {
                                title: 'Phone',
                                dataIndex: 'phone_number',
                                key: 'phone_number',
                                render: (phone) => {
                                    if (!phone || phone === 'unknown') return 'Unknown';
                                    // Mask middle digits: +254***345678
                                    return phone.length > 8
                                        ? `${phone.slice(0, 7)}***${phone.slice(-6)}`
                                        : phone;
                                },
                                width: 150,
                            },
                            {
                                title: 'Status',
                                dataIndex: 'status',
                                key: 'status',
                                render: (status) => {
                                    const config = {
                                        success: { color: 'success', icon: <CheckCircleOutlined />, text: 'Sent' },
                                        failed: { color: 'error', icon: <CloseCircleOutlined />, text: 'Failed' },
                                        skipped: { color: 'default', icon: <MinusCircleOutlined />, text: 'Skipped' },
                                    };
                                    const { color, icon, text } = config[status] || config.skipped;
                                    return (
                                        <Badge status={color} text={
                                            <Space>
                                                {icon}
                                                {text}
                                            </Space>
                                        } />
                                    );
                                },
                                width: 120,
                            },
                            {
                                title: 'Message Preview',
                                dataIndex: 'message',
                                key: 'message',
                                ellipsis: true,
                                render: (msg) => (
                                    <Tooltip title={msg}>
                                        <Text>{msg?.substring(0, 50)}{msg?.length > 50 ? '...' : ''}</Text>
                                    </Tooltip>
                                ),
                            },
                            {
                                title: 'Error',
                                dataIndex: 'error_message',
                                key: 'error_message',
                                render: (error) => error ? (
                                    <Tooltip title={error}>
                                        <Text type="danger" ellipsis style={{ maxWidth: 200, display: 'block' }}>
                                            {error.substring(0, 40)}{error.length > 40 ? '...' : ''}
                                        </Text>
                                    </Tooltip>
                                ) : '-',
                            },
                        ]}
                        expandable={{
                            expandedRowRender: (record) => (
                                <div style={{ paddingLeft: 24 }}>
                                    <Descriptions size="small" column={1} bordered>
                                        <Descriptions.Item label="Full Message">
                                            {record.message}
                                        </Descriptions.Item>
                                        {record.error_message && (
                                            <Descriptions.Item label="Full Error">
                                                <Text type="danger">{record.error_message}</Text>
                                            </Descriptions.Item>
                                        )}
                                        {record.response_data && (
                                            <Descriptions.Item label="AT Response">
                                                <pre style={{
                                                    background: '#f5f5f5',
                                                    padding: 8,
                                                    borderRadius: 4,
                                                    maxHeight: 200,
                                                    overflow: 'auto',
                                                    fontSize: 12
                                                }}>
                                                    {JSON.stringify(record.response_data, null, 2)}
                                                </pre>
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>
                                </div>
                            ),
                        }}
                    />
                </Card>
            )
        },
        {
            key: '4',
            label: (
                <span>
                    <SettingOutlined />
                    System Settings
                </span>
            ),
            children: (
                <div style={{ maxWidth: 600 }}>
                    <Card title="System Configuration" bordered={false}>
                        <Form
                            form={systemForm}
                            layout="vertical"
                            onFinish={handleUpdateSystemSettings}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                                <Form.Item
                                    name="service_fee_percent"
                                    label="Token Service Fee (%)"
                                    extra="Percentage deducted from client payments."
                                    rules={[{ required: true, message: 'Please set the service fee' }]}
                                >
                                    <InputNumber
                                        min={0}
                                        max={100}
                                        precision={1}
                                        step={0.1}
                                        addonAfter="%"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="tariff_ksh_per_kwh"
                                    label="Tariff (KES per kWh)"
                                    extra={`Cost per kWh. Tenants will see estimated units. ${tariffKshPerKwh ? `≈ ${(1 / tariffKshPerKwh).toFixed(4)} kWh per KES` : ''}`}
                                    rules={[{ required: true, message: 'Please set the tariff rate' }]}
                                >
                                    <InputNumber
                                        min={0.0001}
                                        precision={4}
                                        step={0.0001}
                                        addonBefore="KES"
                                        addonAfter="/ kWh"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="support_phone_whatsapp"
                                    label="Support WhatsApp Number"
                                    extra="International format without +, e.g., 254700000000"
                                >
                                    <Input prefix={<PhoneOutlined />} placeholder="e.g. 2547..." />
                                </Form.Item>
                            </div>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SaveOutlined />}
                                    loading={settingsLoading}
                                >
                                    Save System Config
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </div>
            )
        }
    ];

    return (
        <MainLayout>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>Settings Place</Title>
                <Text type="secondary">Manage your profile, security, and integration preferences.</Text>
            </div>


            <Tabs defaultActiveKey="1" items={items} />

            {/* Automations Configuration Modal */}
            <Modal
                title="Configure SMS Automations"
                open={configureModalVisible}
                onCancel={() => setConfigureModalVisible(false)}
                footer={null}
                width={700}
            >
                <Card title="Africa's Talking API Credentials" bordered={false}>
                    {hasCredentials && (
                        <Alert
                            message="Credentials Configured"
                            description="Africa's Talking SMS notifications are active."
                            type="success"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    <Form
                        form={automationsForm}
                        layout="vertical"
                        onFinish={handleSaveAutomations}
                    >
                        <Form.Item
                            name="username"
                            label="Username"
                            extra="Your Africa's Talking app username (e.g., Aquavoltsms200)"
                            rules={[{ required: true, message: 'Username is required' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="e.g., Aquavoltsms200" />
                        </Form.Item>

                        <Form.Item
                            name="api_key"
                            label="API Key"
                            extra="Starts with atsk_"
                            rules={[{ required: true, message: 'API Key is required' }]}
                        >
                            <Input.Password prefix={<KeyOutlined />} placeholder="atsk_..." />
                        </Form.Item>

                        <Form.Item
                            name="sender_id"
                            label="Sender ID (Optional)"
                            extra="Custom sender ID (e.g., AQUAVOLT)"
                        >
                            <Input prefix={<MessageOutlined />} placeholder="e.g., AQUAVOLT" />
                        </Form.Item>

                        <Divider />

                        <Form.Item
                            name="sms_template"
                            label="SMS Template"
                            extra={
                                <div>
                                    Available placeholders: <Tag>{'{token}'}</Tag> <Tag>{'{units}'}</Tag> <Tag>{'{amount}'}</Tag> <Tag>{'{meter}'}</Tag> <Tag>{'{name}'}</Tag>
                                </div>
                            }
                        >
                            <TextArea
                                rows={4}
                                placeholder="Token Generated! Token: {token}. Units: {units} KWh. Amount: KES {amount}. Meter: {meter}. Thank you."
                                maxLength={160}
                                showCount
                            />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SaveOutlined />}
                                    loading={automationsLoading}
                                >
                                    Save Configuration
                                </Button>
                                <Button
                                    icon={<ApiOutlined />}
                                    loading={verifying}
                                    onClick={async () => {
                                        const values = await automationsForm.validateFields(['username', 'api_key']);
                                        if (!values.username || !values.api_key) {
                                            message.warning('Please fill in Username and API Key first');
                                            return;
                                        }

                                        try {
                                            setVerifying(true);

                                            const { data: { session } } = await supabase.auth.getSession();
                                            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-at-credentials`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
                                                },
                                                body: JSON.stringify({
                                                    username: values.username,
                                                    apiKey: values.api_key
                                                })
                                            });

                                            const result = await res.json();

                                            if (result.success) {
                                                message.success(`Verified! Balance: ${result.balance}`);
                                            } else {
                                                message.error(`Verification Failed: ${result.message}`);
                                            }
                                        } catch (err) {
                                            console.error('Verification error:', err);
                                            message.error(err.message || 'Verification failed. Please check your console.');
                                        } finally {
                                            setVerifying(false);
                                        }
                                    }}
                                >
                                    Verify Credentials
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            </Modal>
        </MainLayout>
    );
};

export default Settings;
