import { useState, useEffect } from 'react';
// Add input import
import { Typography, Card, Button, Space, Alert, Tag, message, Spin, Divider, Input, Modal } from 'antd';

import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ThunderboltOutlined,
    ApiOutlined,
    DollarOutlined
} from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { supabase } from '../../lib/supabase';
import { futuriseDev } from '../../lib/futuriseDev';

const { Title, Text, Paragraph } = Typography;

const FuturiseSync = () => {
    const [testing, setTesting] = useState(false);
    const [connected, setConnected] = useState(false); // Default to false
    const [authResult, setAuthResult] = useState(null);
    const [vendResult, setVendResult] = useState(null);

    // Test inputs
    // Test inputs
    const [testMeter, setTestMeter] = useState('0128244428552');
    const [testPhone, setTestPhone] = useState('254712345678');

    // Captcha State
    const [captchaImage, setCaptchaImage] = useState(null);
    const [captchaId, setCaptchaId] = useState(null);
    const [captchaCode, setCaptchaCode] = useState('');

    // Restore state from local storage on mount
    useEffect(() => {
        refreshCaptcha();
        checkSystemStatus();
    }, []);

    const checkSystemStatus = async () => {
        try {
            const { data, error } = await supabase.functions.invoke('futurise-auth', {
                body: { action: 'get_status' }
            });

            if (error) throw error;

            if (data && data.active) {
                setConnected(true);
                setAuthResult({
                    success: true,
                    message: 'Active session retrieved from system',
                    expires_at: data.expires_at,
                    token: '********' // Don't show full token if just checking status
                });
            }
        } catch (err) {
            console.error('Failed to check system status:', err);
        }
    };

    const refreshCaptcha = async () => {
        setCaptchaImage(null);
        const result = await futuriseDev.getCaptcha();
        if (result.error) {
            message.error('Failed to load Captcha: ' + result.error);
        } else {
            // Fix: Ensure we don't double-prefix the base64 string
            let img = result.image;
            if (img && img.startsWith('data:image')) {
                // Remove prefix if present, assuming comma separation
                const parts = img.split(',');
                if (parts.length > 1) img = parts[1];
            }
            setCaptchaImage(img);
            setCaptchaId(result.id);
            setCaptchaCode('');
        }
    };

    const testAuthentication = async () => {
        setTesting(true);
        setAuthResult(null);

        if (!captchaCode || !captchaId) {
            message.error('Please enter the verification code');
            setTesting(false);
            return;
        }

        try {
            // [DEV] Login with Captcha
            // This happens via the local proxy to the actual Futurise API
            const data = await futuriseDev.login(captchaCode, captchaId);
            const error = data.success ? null : new Error(data.error);

            if (error) throw error;

            if (data.success) {
                // SUCCESS! 
                // Now we MUST store this token in the Supabase Backend so other edge functions can use it.
                // The edge functions cannot solve the captcha themselves.

                try {
                    const { data: storeData, error: storeError } = await supabase.functions.invoke('futurise-auth', {
                        body: {
                            action: 'store_token',
                            token: data.token,
                            expires_at: data.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Default 24h if missing
                        }
                    });

                    if (storeError) {
                        console.error('Failed to store token in backend:', storeError);
                        message.warning('Connected, but failed to save token to system: ' + storeError.message);
                    } else {
                        message.success('System Synced: Token saved for background usage');
                    }
                } catch (saveErr) {
                    console.error('Error saving token:', saveErr);
                    message.warning('Connected, but failed to save token to system');
                }

                setConnected(true);
                const result = {
                    success: true,
                    message: 'Successfully authenticated with Futurise!',
                    token: data.token?.substring(0, 20) + '...',
                    expires_at: data.expires_at,
                    fullToken: data.token // Keep full token for other ops if needed
                };
                setAuthResult(result);
                localStorage.setItem('futurise_auth', JSON.stringify(result));
                message.success('Connected to Futurise API');
            } else {
                setConnected(false);
                setAuthResult({
                    success: false,
                    message: data.error || 'Authentication failed'
                });
                localStorage.removeItem('futurise_auth');
                message.error('Failed to connect to Futurise');
                refreshCaptcha(); // Refresh on failure
            }
        } catch (error) {
            console.error('Auth test error:', error);
            setConnected(false);
            setAuthResult({
                success: false,
                message: error.message
            });
            localStorage.removeItem('futurise_auth');
            message.error('Error: ' + error.message);
            refreshCaptcha(); // Refresh on error
        } finally {
            setTesting(false);
        }
    };

    const testTokenPurchase = async () => {
        setTesting(true);
        setVendResult(null);

        try {
            // Check for cached token
            if (!authResult || !authResult.fullToken) {
                message.error('Please Authenticate First');
                setTesting(false);
                return;
            }

            // [DEV] Use local proxy client
            if (!testMeter) {
                message.error('Please enter a meter number');
                setTesting(false);
                return;
            }

            // Pass the cached token
            const result = await futuriseDev.vendToken(testMeter, 10, authResult.fullToken);

            if (result.success) {
                setVendResult({
                    success: true,
                    ...result
                });
                message.success('Token purchased successfully!');
            } else {
                throw new Error(result.message || 'Token purchase failed');
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

    const testMpesaPush = async () => {
        if (!testPhone) {
            message.error('Please enter a phone number');
            return;
        }

        const hide = message.loading('Sending STK Push...', 0);

        try {
            const result = await futuriseDev.sendStkPush(testPhone, 10);
            hide();

            if (result.success) {
                message.success('STK Push Sent! Check your phone.');
                console.log('M-Pesa Result:', result);

                Modal.info({
                    title: 'STK Push Sent',
                    content: (
                        <div>
                            <p>An M-Pesa prompt has been sent to <b>{testPhone}</b> for KES 10.</p>
                            <p>Please enter your PIN to complete the transaction.</p>
                            <Divider />
                            <Text type="secondary" code>{JSON.stringify(result.data, null, 2)}</Text>
                        </div>
                    ),
                    width: 500
                });

            } else {
                message.error('STK Push Failed: ' + result.message);
            }
        } catch (err) {
            hide();
            message.error('Error: ' + err.message);
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
                        <Input
                            value={testMeter}
                            onChange={e => setTestMeter(e.target.value)}
                            style={{ width: 200, fontFamily: 'monospace' }}
                        />
                    </div>
                    <div>
                        <Text type="secondary">Test Phone (M-Pesa):</Text>
                        <br />
                        <Input
                            value={testPhone}
                            onChange={e => setTestPhone(e.target.value)}
                            placeholder="254712345678"
                            style={{ width: 200, fontFamily: 'monospace' }}
                        />
                    </div>

                    {/* Captcha UI */}
                    <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                        <Text type="secondary">Verification Code:</Text>
                        <Space style={{ marginTop: 8 }}>
                            {captchaImage ? (
                                <img
                                    src={`data:image/png;base64,${captchaImage}`}
                                    alt="Captcha"
                                    style={{ height: '32px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                                />
                            ) : (
                                <Spin size="small" />
                            )}
                            <Button
                                type="text"
                                icon={<SyncOutlined />}
                                onClick={refreshCaptcha}
                                title="Refresh Captcha"
                            />
                            <Input
                                placeholder="Enter Code"
                                value={captchaCode}
                                onChange={e => setCaptchaCode(e.target.value)}
                                style={{ width: 120, textTransform: 'uppercase' }}
                                maxLength={4}
                            />
                        </Space>
                    </div>

                    <Space wrap>
                        <Button
                            type="primary"
                            icon={<SyncOutlined />}
                            onClick={testAuthentication}
                            loading={testing && !vendResult}
                            size="large"
                        >
                            Test Authentication
                        </Button>
                        <Button
                            icon={<DollarOutlined />}
                            onClick={testMpesaPush}
                            size="large"
                        >
                            Test M-Pesa Push
                        </Button>
                    </Space>

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
