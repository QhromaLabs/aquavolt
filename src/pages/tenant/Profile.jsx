import { useState, useEffect } from 'react';
import { Typography, Descriptions, Tag, Button, Space, Spin, Alert, Divider, Modal, Form, Input, message } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    HomeOutlined,
    LogoutOutlined,
    EditOutlined
} from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTenantData } from '../../hooks/useTenantData';
import TenantLayout from '../../layouts/TenantLayout';
import MobileCard from '../../components/mobile/MobileCard';

const { Title, Text, Paragraph } = Typography;

const TenantProfile = () => {
    const navigate = useNavigate();
    const { user, profile, signOut } = useAuth();
    const { units, loading: unitsLoading } = useTenantData();
    const [supportPhone, setSupportPhone] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('admin_settings').select('value').eq('key', 'support_phone_whatsapp').single();
            if (data?.value) setSupportPhone(data.value);
        };
        fetchSettings();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleUpdateProfile = async (values) => {
        setUpdateLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: values.fullName,
                    phone: values.phone
                })
                .eq('id', user.id);

            if (error) throw error;

            message.success('Profile updated successfully');
            setIsModalVisible(false);
            // Optional: force reload to reflect changes if useAuth doesn't auto-update
            window.location.reload();
        } catch (error) {
            console.error('Error updating profile:', error);
            message.error('Failed to update profile');
        } finally {
            setUpdateLoading(false);
        }
    };

    const openEditModal = () => {
        form.setFieldsValue({
            fullName: profile.full_name,
            phone: profile.phone
        });
        setIsModalVisible(true);
    };

    if (!profile) {
        return (
            <TenantLayout>
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <Spin size="large" />
                    <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                        Loading profile...
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
                        My Profile
                    </Title>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                        Your account information and settings
                    </Text>
                </div>

                {/* Profile Information */}
                <MobileCard
                    title={
                        <Space>
                            <UserOutlined style={{ color: '#1ecf49' }} />
                            <span>Personal Information</span>
                        </Space>
                    }
                    style={{ marginBottom: 16 }}
                >
                    <Descriptions column={1} size="small">
                        <Descriptions.Item label="Full Name">
                            <Text strong>{profile.full_name || 'Not set'}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                            <Space>
                                <MailOutlined style={{ color: '#8c8c8c' }} />
                                <Text>{profile.email || user?.email || 'Not set'}</Text>
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Phone">
                            <Space>
                                <PhoneOutlined style={{ color: '#8c8c8c' }} />
                                <Text>{profile.phone || 'Not set'}</Text>
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Role">
                            <Tag color="green">{profile.role?.toUpperCase()}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Member Since">
                            <Text type="secondary">
                                {new Date(profile.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Text>
                        </Descriptions.Item>
                    </Descriptions>

                    <Button
                        icon={<EditOutlined />}
                        style={{ marginTop: 16, borderRadius: '8px' }}
                        onClick={openEditModal}
                    >
                        Edit Profile
                    </Button>
                </MobileCard>

                {/* Assigned Units */}
                <MobileCard
                    title={
                        <Space>
                            <HomeOutlined style={{ color: '#1ecf49' }} />
                            <span>My Units ({units.length})</span>
                        </Space>
                    }
                    style={{ marginBottom: 16 }}
                >
                    {unitsLoading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <Spin />
                        </div>
                    ) : units.length === 0 ? (
                        <Alert
                            message="No Units Assigned"
                            description="You don't have any units assigned yet. Please contact your landlord."
                            type="info"
                            showIcon
                        />
                    ) : (
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            {units.map((unit, index) => (
                                <div key={unit.unitId}>
                                    {index > 0 && <Divider style={{ margin: '12px 0' }} />}
                                    <div style={{ marginBottom: 8 }}>
                                        <Text strong style={{ fontSize: '16px', display: 'block' }}>
                                            {unit.unitLabel}
                                        </Text>
                                        <Tag
                                            color={unit.unitStatus === 'active' ? 'success' : 'default'}
                                            style={{ marginTop: 4 }}
                                        >
                                            {unit.unitStatus}
                                        </Tag>
                                    </div>
                                    <Descriptions column={1} size="small">
                                        <Descriptions.Item label="Property">
                                            {unit.propertyName}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Location">
                                            {unit.propertyLocation}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Region">
                                            {unit.regionCode}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Meter Number">
                                            <Text strong style={{ fontFamily: 'monospace' }}>
                                                {unit.meterNumber}
                                            </Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Assigned Since">
                                            <Text type="secondary">
                                                {new Date(unit.startDate).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </Text>
                                        </Descriptions.Item>
                                        {unit.endDate && (
                                            <Descriptions.Item label="Assignment Ends">
                                                <Text type="secondary">
                                                    {new Date(unit.endDate).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </Text>
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>
                                </div>
                            ))}
                        </Space>
                    )}
                </MobileCard>

                {/* Support Information */}
                <MobileCard
                    title="Need Help?"
                    style={{ marginBottom: 16 }}
                >
                    <Paragraph>
                        If you have any questions or need assistance, please contact support:
                    </Paragraph>
                    <Space direction="vertical" size="small">
                        <Text>
                            <MailOutlined /> Email: support@aquavolt.com
                        </Text>
                        <Text>
                            <PhoneOutlined /> Phone: {supportPhone ? `+${supportPhone}` : 'Not configured'}
                        </Text>
                    </Space>
                </MobileCard>

                {/* Logout Button */}
                <Button
                    danger
                    size="large"
                    block
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                    style={{
                        height: '52px',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: 600,
                    }}
                >
                    Logout
                </Button>

                {/* Edit Profile Modal */}
                <Modal
                    title="Edit Profile"
                    open={isModalVisible}
                    onCancel={() => setIsModalVisible(false)}
                    footer={null}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleUpdateProfile}
                    >
                        <Form.Item
                            name="fullName"
                            label="Full Name"
                            rules={[{ required: true, message: 'Please enter your full name' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Enter your full name" />
                        </Form.Item>

                        <Form.Item
                            name="phone"
                            label="Phone Number"
                            rules={[{ required: true, message: 'Please enter your phone number' }]}
                        >
                            <Input prefix={<PhoneOutlined />} placeholder="Enter your phone number" />
                        </Form.Item>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                            <Button onClick={() => setIsModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" loading={updateLoading} style={{ background: '#1ecf49' }}>
                                Save Changes
                            </Button>
                        </div>
                    </Form>
                </Modal>
            </div>
        </TenantLayout>
    );
};

export default TenantProfile;
