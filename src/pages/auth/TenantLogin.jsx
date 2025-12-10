import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text } = Typography;

const TenantLogin = () => {
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const { error } = await signIn(values.email, values.password);
            if (error) throw error;

            message.success('Welcome back!');
            // Wait for auth state to propagate (role redirect in App.jsx handles the rest)
            setTimeout(() => navigate('/'), 500);
        } catch (error) {
            message.error(error.message || 'Login failed');
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
                        Tenant Portal
                    </Title>
                    <Text type="secondary" style={{ fontSize: '16px' }}>
                        Welcome back, please sign in.
                    </Text>
                </div>

                <Form
                    name="tenant_login"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                    requiredMark={false}
                >
                    <Form.Item
                        name="email"
                        rules={[{ required: true, message: 'Please enter your email' }]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="Email address"
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
                        rules={[{ required: true, message: 'Please enter your password' }]}
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox>Remember me</Checkbox>
                        </Form.Item>
                        <a href="#" style={{ color: '#1ecf49' }}>Forgot password?</a>
                    </div>

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
                            Log In
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Text type="secondary">New to Aquavolt? </Text>
                    <Link to="/signup" style={{ color: '#1ecf49', fontWeight: 600 }}>Create an account</Link>
                </div>
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

export default TenantLogin;
