import { useState, useEffect } from 'react';
import {
    Typography,
    Card,
    Form,
    Input,
    Button,
    message,
    Alert,
    Divider,
    Space
} from 'antd';
import {
    SaveOutlined,
    ApiOutlined,
    MessageOutlined,
    KeyOutlined
} from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { supabase } from '../../lib/supabase';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const Automations = () => {
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [form] = Form.useForm();
    const [hasCredentials, setHasCredentials] = useState(false);

    useEffect(() => {
        fetchCredentials();
    }, []);

    const fetchCredentials = async () => {
        try {
            const { data, error } = await supabase
                .from('api_credentials')
                .select('credentials')
                .eq('service_name', 'africastalking')
                .single();

            if (data && data.credentials) {
                form.setFieldsValue(data.credentials);
                setHasCredentials(true);
            }
        } catch (err) {
            console.error('Error fetching automation credentials:', err);
        }
    };

    const handleSave = async (values) => {
        setLoading(true);
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
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}><ApiOutlined /> Automations & Integrations</Title>
                <Text type="secondary">Manage external integrations and automated messaging.</Text>
            </div>

            <div style={{ maxWidth: 800 }}>
                <Card
                    title={<span><MessageOutlined /> Africa's Talking (SMS Gateway)</span>}
                    extra={<a href="https://africastalking.com/" target="_blank" rel="noreferrer">Visit Website</a>}
                >
                    <Alert
                        message="SMS Automation"
                        description="Configure your Africa's Talking credentials here to enable automated SMS notifications when tokens are generated."
                        type="info"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSave}
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
                                    loading={loading}
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
                                            const values = await form.validateFields(['username', 'api_key']);
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
        </MainLayout>
    );
};

export default Automations;
