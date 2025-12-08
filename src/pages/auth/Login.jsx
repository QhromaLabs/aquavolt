import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text } = Typography;

const Login = () => {
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const { data, error } = await signIn(values.email, values.password);

            if (error) throw error;

            message.success('Welcome back! Redirecting...', 2);

            // Wait a moment for the profile to be fetched by useAuth
            setTimeout(() => {
                // Redirect to root - the RLSGuard will handle role-based routing
                navigate('/');
            }, 500);
        } catch (error) {
            message.error(error.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #0a1f1a 0%, #1ecf49 100%)',
            padding: '16px',
        }}>
            <Card
                style={{
                    width: '100%',
                    maxWidth: 440,
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                    borderRadius: '16px',
                    border: 'none',
                }}
                bodyStyle={{
                    padding: '32px 24px',
                }}
            >
                <div style={{
                    textAlign: 'center',
                    marginBottom: 40,
                    animation: 'fadeIn 0.5s ease-in'
                }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '12px',
                        background: 'linear-gradient(135deg, #1ecf49 0%, #36ea98 100%)',
                        borderRadius: '16px',
                        marginBottom: 16,
                        boxShadow: '0 4px 12px rgba(30, 207, 73, 0.3)'
                    }}>
                        <img
                            src="/logowhite.png"
                            alt="Aquavolt Logo"
                            style={{ height: 50, display: 'block' }}
                        />
                    </div>
                    <Title level={2} style={{
                        margin: '0 0 8px 0',
                        color: '#1ecf49',
                        fontWeight: 700,
                        fontSize: '28px'
                    }}>
                        Welcome Back
                    </Title>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                        Sign in to manage your electricity
                    </Text>
                </div>

                <Form
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                    requiredMark={false}
                >
                    <Form.Item
                        name="email"
                        label={<span style={{ fontWeight: 500 }}>Email Address</span>}
                        rules={[
                            { required: true, message: 'Please input your email!' },
                            { type: 'email', message: 'Please enter a valid email!' },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: '#8c8c8c' }} />}
                            placeholder="Enter your email"
                            style={{
                                height: '48px',
                                borderRadius: '8px',
                                fontSize: '15px'
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label={<span style={{ fontWeight: 500 }}>Password</span>}
                        rules={[{ required: true, message: 'Please input your password!' }]}
                        style={{ marginBottom: '12px' }}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#8c8c8c' }} />}
                            placeholder="Enter your password"
                            style={{
                                height: '48px',
                                borderRadius: '8px',
                                fontSize: '15px'
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="remember"
                        valuePropName="checked"
                        style={{ marginBottom: '24px' }}
                    >
                        <Checkbox style={{ fontSize: '14px' }}>Remember me</Checkbox>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: '0' }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            icon={!loading && <LoginOutlined />}
                            style={{
                                height: '52px',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #1ecf49 0%, #36ea98 100%)',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(30, 207, 73, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Sign In
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{
                    textAlign: 'center',
                    marginTop: 24,
                    paddingTop: 24,
                    borderTop: '1px solid #f0f0f0'
                }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        © 2024 Aquavolt. All rights reserved.
                    </Text>
                </div>
            </Card>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @media (max-width: 480px) {
                    .ant-card {
                        border-radius: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Login;
