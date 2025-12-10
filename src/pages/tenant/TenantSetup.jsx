import { useState, useEffect, useRef } from 'react';
import { Typography, Button, message, Steps, Card } from 'antd';

import ScanModal from '../../components/common/ScanModal';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { QrcodeOutlined, HomeOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const TenantSetup = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [scanning, setScanning] = useState(false);
    const scannerRef = useRef(null);
    const [scannerInstance, setScannerInstance] = useState(null);

    // Pickup formatting/style from Login/Signup for consistency
    // but this is an internal protected page, so maybe keep it simple.

    const handleScan = async (decodedText) => {
        try {
            const data = JSON.parse(decodedText);
            if (data.action === 'claim_unit' && data.unit_id) {
                setScanning(false);
                message.loading('Setting up your apartment...', 0);

                const { error } = await supabase
                    .from('unit_assignments')
                    .insert({
                        unit_id: data.unit_id,
                        tenant_id: user.id,
                        status: 'active',
                        start_date: new Date().toISOString()
                    });

                message.destroy();

                if (error) {
                    console.error('Setup error:', error);
                    if (error.code === '23505') {
                        message.warning('You are already assigned to this unit.');
                    } else {
                        message.error('Failed to assign unit. Please try again.');
                    }
                } else {
                    message.success('Apartment setup complete!');
                    navigate('/tenant/dashboard');
                }
            }
        } catch (e) {
            // ignore non-json or invalid
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff', // Clean white
            padding: '20px',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
                <img src="/Logo.png" alt="Aquavolt" style={{ height: '50px', marginBottom: '30px' }} />

                <Title level={2} style={{ marginBottom: '10px' }}>Welcome Home! 🏠</Title>
                <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '40px' }}>
                    Let's connect you to your apartment meter.
                </Text>

                <Card
                    style={{
                        borderRadius: '20px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                        border: 'none',
                        overflow: 'hidden'
                    }}
                    bodyStyle={{ padding: '30px 20px' }}
                >
                    <div style={{
                        background: '#f6ffed',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <QrcodeOutlined style={{ fontSize: '36px', color: '#52c41a' }} />
                    </div>

                    <Title level={4}>Scan Apartment QR</Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
                        Locate the QR code on your meter or provided by your landlord.
                    </Text>

                    <Button
                        type="primary"
                        size="large"
                        icon={<QrcodeOutlined />}
                        onClick={() => setScanning(true)}
                        style={{
                            height: '50px',
                            width: '100%',
                            borderRadius: '12px',
                            fontSize: '16px',
                            background: '#1ecf49',
                            border: 'none'
                        }}
                    >
                        Start Scanning
                    </Button>

                    <div style={{ marginTop: '20px' }}>
                        <Button type="link" onClick={() => navigate('/tenant/dashboard')} style={{ color: '#8c8c8c' }}>
                            I'll do this later
                        </Button>
                    </div>
                </Card>

                <div style={{ marginTop: '40px' }}>
                    <Steps
                        current={1}
                        items={[
                            { title: 'Sign Up', icon: <CheckCircleOutlined /> },
                            { title: 'Link Unit', icon: <HomeOutlined /> },
                            { title: 'Dashboard', icon: <CheckCircleOutlined style={{ opacity: 0.3 }} /> },
                        ]}
                    />
                </div>
            </div>
            <ScanModal
                open={scanning}
                onClose={() => setScanning(false)}
                onScan={handleScan}
            />
        </div>
    );
};

export default TenantSetup;
