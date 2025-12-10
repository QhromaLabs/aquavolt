import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { supabase } from '../../lib/supabase';

const { Title, Text } = Typography;

const SignUp = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            // TRIM inputs
            const email = values.email?.trim();
            const password = values.password?.trim();
            const fullName = values.full_name?.trim();
            const phone = values.phone_number?.trim();

            // 1. Sign Up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'tenant', // Default role for public signups
                        phone_number: phone
                    }
                }
            });

            if (authError) throw authError;

            if (authData?.user) {
                // 2. Create Profile
                // Let's assume the trigger exists or we rely on the metadata. 
                // However, for safety, let's try to insert if we can.
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: authData.user.id,
                        email: email,
                        full_name: fullName,
                        phone_number: phone,
                        role: 'tenant',
                        updated_at: new Date()
                    });

                if (profileError) {
                    console.warn('Profile creation warning (might be handled by trigger):', profileError);
                }

                message.success('Account created successfully! Please sign in.');
                navigate('/portal');
            }

        } catch (error) {
            console.error('Signup error:', error);
            message.error(error.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#ffffff', // Pure white background
            padding: '16px',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <img
                        src="/Logo.png"
                        alt="Aquavolt"
                        style={{ height: '60px', marginBottom: '20px' }}
                    />
                    <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#333' }}>
                        Create Account
                    </Title>
                    <Text type="secondary" style={{ fontSize: '16px' }}>
                        Sign up to manage your electricity
                    </Text>
                </div>

                <Form
                    form={form}
                    name="signup"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                    requiredMark={false}
                >
                    <Form.Item
                        name="full_name"
                        rules={[{ required: true, message: 'Please input your name!' }]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Full Name"
                            style={{
                                height: '50px',
                                borderRadius: '12px',
                                background: '#f8f9fa',
                                border: '1px solid #e9ecef'
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please input your email!' },
                            { type: 'email', message: 'Invalid email address' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Email Address"
                            style={{
                                height: '50px',
                                borderRadius: '12px',
                                background: '#f8f9fa',
                                border: '1px solid #e9ecef'
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="phone_number"
                        rules={[{ required: true, message: 'Please input your phone number!' }]}
                    >
                        <Input
                            prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Phone Number"
                            style={{
                                height: '50px',
                                borderRadius: '12px',
                                background: '#f8f9fa',
                                border: '1px solid #e9ecef'
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your password!' }, { min: 6, message: 'Min 6 characters' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Password"
                            style={{
                                height: '50px',
                                borderRadius: '12px',
                                background: '#f8f9fa',
                                border: '1px solid #e9ecef'
                            }}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            style={{
                                height: '52px',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: 600,
                                background: '#1ecf49',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(30, 207, 73, 0.2)'
                            }}
                        >
                            Create Account
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <Text type="secondary">Already have an account? </Text>
                        <Link to="/portal" style={{ color: '#1ecf49', fontWeight: 600 }}>Sign In</Link>
                    </div>
                </Form>
            </div>

            <div style={{
                position: 'fixed',
                bottom: '20px',
                textAlign: 'center',
                width: '100%',
                color: '#8c8c8c',
                fontSize: '12px'
            }}>
                &copy; 2025 Aquavolt. Secure Tenant Portal.
            </div>
        </div>
    );
};

export default SignUp;
