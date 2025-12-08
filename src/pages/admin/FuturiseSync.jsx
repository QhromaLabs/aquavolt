import { useState } from 'react';
import { Typography, Card, Button, Space, Alert, Tag, message, Spin, Divider } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ThunderboltOutlined,
    ApiOutlined
} from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { supabase } from '../../lib/supabase';

const { Title, Text, Paragraph } = Typography;

const FuturiseSync = () => {
    const [testing, setTesting] = useState(false);
    const [connected, setConnected] = useState(null);
    const [authResult, setAuthResult] = useState(null);
    const [vendResult, setVendResult] = useState(null);

    const testAuthentication = async () => {
        setTesting(true);
        setAuthResult(null);

        try {
            const { data, error } = await supabase.functions.invoke('futurise-auth');

            if (error) throw error;

            if (data.success) {
                setConnected(true);
                setAuthResult({
                    success: true,
                    message: 'Successfully authenticated with Futurise!',
                    token: data.token?.substring(0, 20) + '...',
                    expires_at: data.expires_at
                });
                message.success('Connected to Futurise API');
            } else {
                setConnected(false);
                setAuthResult({
                    success: false,
                    message: data.error || 'Authentication failed'
                });
                message.error('Failed to connect to Futurise');
            }
        } catch (error) {
            console.error('Auth test error:', error);
            setConnected(false);
            setAuthResult({
                success: false,
                message: error.message
            });
            message.error('Error: ' + error.message);
        } finally {
            setTesting(false);
        }
    };

    const testTokenPurchase = async () => {
        setTesting(true);
        setVendResult(null);

        try {
            const { data, error } = await supabase.functions.invoke('futurise-vend-token', {
                body: {
                    meterNumber: '0128244428552',
                    amount: 10, // Test with KES 10
                    phoneNumber: '254712345678'
                }
            });

            if (error) throw error;

            if (data.success) {
                setVendResult({
                    success: true,
                    ...data
                });
                message.success('Token purchased successfully!');
            } else {
                setVendResult({
                    success: false,
                    message: data.error || 'Token purchase failed'
                });
                message.error('Token purchase failed');
            }
        } catch (error) {
            console.error('Vend test error:', error);
            setVendResult({
                success: false,
                message: error.message
            });
            message.error('Error: ' + error.message);
        } finally {
            setTesting(false);
        }
    };

    return (
        <MainLayout>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>
                    <ApiOutlined /> Futurise Integration
                </Title>
                <Text type="secondary">
                    Test and manage Futurise API connection
                </Text>
            </div>

            {/* Connection Status */}
            <Card
                title="Connection Status"
                style={{ marginBottom: 24 }}
                extra={
                    <Tag color={connected === true ? 'success' : connected === false ? 'error' : 'default'}>
                        {connected === true ? 'Connected' : connected === false ? 'Disconnected' : 'Unknown'}
                    </Tag>
                }
            >
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div>
                        <Text type="secondary">Base URL:</Text>
                        <br />
                        <Text code>https://47.90.150.122:4680</Text>
                    </div>
                    <div>
                        <Text type="secondary">Username:</Text>
                        <br />
                        <Text code>aquavolt</Text>
                    </div>
                    <div>
                        <Text type="secondary">Test Meter:</Text>
                        <br />
                        <Text code>0128244428552</Text>
                    </div>

                    <Button
                        type="primary"
                        icon={<SyncOutlined />}
                        onClick={testAuthentication}
                        loading={testing}
                        size="large"
                    >
                        Test Authentication
                    </Button>

                    {authResult && (
                        <Alert
                            message={authResult.success ? 'Authentication Successful' : 'Authentication Failed'}
                            description={
                                <div>
                                    <Paragraph style={{ marginBottom: 8 }}>
                                        {authResult.message}
                                    </Paragraph>
                                    {authResult.success && (
                                        <>
                                            <Text type="secondary">Token: </Text>
                                            <Text code>{authResult.token}</Text>
                                            <br />
                                            <Text type="secondary">Expires: </Text>
                                            <Text>{new Date(authResult.expires_at).toLocaleString()}</Text>
                                        </>
                                    )}
                                </div>
                            }
                            type={authResult.success ? 'success' : 'error'}
                            showIcon
                            icon={authResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                        />
                    )}
                </Space>
            </Card>

            {/* Token Vending Test */}
            {connected && (
                <Card
                    title="Token Vending Test"
                    style={{ marginBottom: 24 }}
                >
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Alert
                            message="Test Token Purchase"
                            description="This will purchase a KES 10 token for meter 0128244428552 as a test."
                            type="info"
                            showIcon
                        />

                        <Button
                            type="primary"
                            icon={<ThunderboltOutlined />}
                            onClick={testTokenPurchase}
                            loading={testing}
                            size="large"
                            style={{
                                background: 'linear-gradient(135deg, #1ecf49 0%, #36ea98 100%)',
                                border: 'none',
                            }}
                        >
                            Purchase Test Token (KES 10)
                        </Button>

                        {vendResult && (
                            <Alert
                                message={vendResult.success ? 'Token Purchased Successfully!' : 'Purchase Failed'}
                                description={
                                    vendResult.success ? (
                                        <div>
                                            <Divider style={{ margin: '12px 0' }} />
                                            <div style={{
                                                background: '#f9f9f9',
                                                padding: '16px',
                                                borderRadius: '8px',
                                                marginBottom: 12
                                            }}>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>Token:</Text>
                                                <br />
                                                <Text
                                                    strong
                                                    style={{
                                                        fontSize: '18px',
                                                        fontFamily: 'monospace',
                                                        color: '#1ecf49',
                                                        wordBreak: 'break-all'
                                                    }}
                                                >
                                                    {vendResult.token}
                                                </Text>
                                            </div>
                                            <Space direction="vertical" size="small">
                                                <div>
                                                    <Text type="secondary">Meter: </Text>
                                                    <Text code>{vendResult.meterNumber}</Text>
                                                </div>
                                                <div>
                                                    <Text type="secondary">Amount: </Text>
                                                    <Text strong>KES {vendResult.amount}</Text>
                                                </div>
                                                <div>
                                                    <Text type="secondary">Units: </Text>
                                                    <Text strong>{vendResult.units}</Text>
                                                </div>
                                                <div>
                                                    <Text type="secondary">Transaction ID: </Text>
                                                    <Text code style={{ fontSize: '11px' }}>{vendResult.transactionId}</Text>
                                                </div>
                                                <div>
                                                    <Text type="secondary">Time: </Text>
                                                    <Text>{vendResult.clearTime}</Text>
                                                </div>
                                            </Space>
                                        </div>
                                    ) : (
                                        <Text>{vendResult.message}</Text>
                                    )
                                }
                                type={vendResult.success ? 'success' : 'error'}
                                showIcon
                                icon={vendResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                            />
                        )}
                    </Space>
                </Card>
            )}

            {/* Instructions */}
            <Card title="Next Steps">
                <Space direction="vertical" size="middle">
                    <div>
                        <Text strong>1. Test Authentication</Text>
                        <Paragraph type="secondary">
                            Click "Test Authentication" to verify connection to Futurise API
                        </Paragraph>
                    </div>
                    <div>
                        <Text strong>2. Test Token Purchase</Text>
                        <Paragraph type="secondary">
                            Once connected, test purchasing a small token (KES 10) for your meter
                        </Paragraph>
                    </div>
                    <div>
                        <Text strong>3. Integrate with Tenant UI</Text>
                        <Paragraph type="secondary">
                            After successful testing, the token purchase will be available in the Tenant dashboard
                        </Paragraph>
                    </div>
                </Space>
            </Card>
        </MainLayout>
    );
};

export default FuturiseSync;
