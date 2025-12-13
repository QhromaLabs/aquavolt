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
    Tag
} from 'antd';
import {
    UserOutlined,
    LockOutlined,
    SaveOutlined,
    PhoneOutlined,
    MailOutlined,
    SafetyCertificateOutlined,
    ToolOutlined,
    SettingOutlined
} from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const { Title, Text } = Typography;

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

    useEffect(() => {
        fetchSystemSettings();
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
        {
            key: '3',
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
                <Title level={2}>Account Settings</Title>
                <Text type="secondary">Manage your profile details and security preferences.</Text>
            </div>

            <Tabs defaultActiveKey="1" items={items} />
        </MainLayout>
    );
};


export default Settings;
