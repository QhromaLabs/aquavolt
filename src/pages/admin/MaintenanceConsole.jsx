import { useState, useEffect } from 'react';
import {
    Typography,
    Card,
    Button,
    Space,
    Alert,
    Input,
    Select,
    InputNumber,
    Table,
    Tag,
    message,
    Divider,
    Spin,
    Modal
} from 'antd';
import {
    ToolOutlined,
    ThunderboltOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    HistoryOutlined,
    CopyOutlined
} from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { supabase } from '../../lib/supabase';
import { futuriseDev } from '../../lib/futuriseDev';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// STS Token SubClasses based on API documentation
const TOKEN_TYPES = [
    { value: 0, label: 'Maximum Power Limit', requiresValue: true, unit: 'W', description: 'Set maximum power consumption limit' },
    { value: 1, label: 'Clear Credit', requiresValue: false, description: 'Clear all credit from the meter' },
    { value: 2, label: 'Tariff Rate', requiresValue: true, description: 'Set electricity tariff rate' },
    { value: 3, label: '1st Section Decoder Key', requiresValue: true, description: 'Set first section decoder key' },
    { value: 4, label: '2nd Section Decoder Key', requiresValue: true, description: 'Set second section decoder key' },
    { value: 5, label: 'Clear Tamper Condition', requiresValue: false, description: 'Clear tamper detection flags' },
    { value: 6, label: 'Max Phase Power Unbalance', requiresValue: true, description: 'Set maximum phase power unbalance' },
    { value: 7, label: 'Water Meter Factor', requiresValue: true, description: 'Set water meter conversion factor' },
    { value: 8, label: '3rd Section Decoder Key', requiresValue: true, description: 'Set third section decoder key' },
    { value: 9, label: '4th Section Decoder Key', requiresValue: true, description: 'Set fourth section decoder key' },
    { value: 10, label: 'Extended Token Set', requiresValue: true, description: 'Extended token configuration' },
    { value: 11, label: 'Reserved for Proprietary Use', requiresValue: true, description: 'Reserved for special use' }
];

const MaintenanceConsole = () => {
    const [loading, setLoading] = useState(false);
    const [meterNumber, setMeterNumber] = useState('');
    const [tokenType, setTokenType] = useState(1); // Default to Clear Credit
    const [tokenValue, setTokenValue] = useState(0);
    const [generatedToken, setGeneratedToken] = useState(null);
    const [tokenHistory, setTokenHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        loadCurrentUser();
        loadTokenHistory();
    }, []);

    const loadCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setCurrentUser(profile);
        }
    };

    const loadTokenHistory = async () => {
        setLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('maintenance_tokens')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setTokenHistory(data || []);
        } catch (error) {
            console.error('Failed to load token history:', error);
            message.error('Failed to load token history');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleGenerateToken = async () => {
        if (!meterNumber) {
            message.error('Please enter a meter number');
            return;
        }

        const selectedType = TOKEN_TYPES.find(t => t.value === tokenType);
        if (selectedType?.requiresValue && !tokenValue) {
            message.warning(`Please enter a value for ${selectedType.label}`);
            return;
        }

        setLoading(true);
        setGeneratedToken(null);

        try {
            const result = await futuriseDev.generateMaintenanceToken(
                meterNumber,
                tokenType,
                tokenValue
            );

            if (!result.success) {
                throw new Error(result.message || 'Token generation failed');
            }

            setGeneratedToken(result);
            message.success('Maintenance token generated successfully!');

            // Save to database
            try {
                const { error: dbError } = await supabase
                    .from('maintenance_tokens')
                    .insert({
                        meter_number: result.meterNumber,
                        sub_class: result.subClass,
                        value: result.value,
                        explain: result.explain,
                        token: result.token,
                        issued_by: currentUser?.id
                    });

                if (dbError) {
                    console.error('Failed to save token to database:', dbError);
                    message.warning('Token generated but failed to save to database');
                } else {
                    loadTokenHistory(); // Refresh history
                }
            } catch (dbErr) {
                console.error('Database error:', dbErr);
            }

        } catch (error) {
            console.error('Token generation error:', error);
            message.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        message.success('Token copied to clipboard!');
    };

    const selectedTokenType = TOKEN_TYPES.find(t => t.value === tokenType);

    const columns = [
        {
            title: 'Time',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (time) => new Date(time).toLocaleString(),
            width: 180
        },
        {
            title: 'Meter Number',
            dataIndex: 'meter_number',
            key: 'meter_number',
            render: (num) => <Text code>{num}</Text>
        },
        {
            title: 'Token Type',
            dataIndex: 'sub_class',
            key: 'sub_class',
            render: (subClass) => {
                const type = TOKEN_TYPES.find(t => t.value === subClass);
                return <Tag color="blue">{type?.label || `SubClass ${subClass}`}</Tag>;
            }
        },
        {
            title: 'Value',
            dataIndex: 'value',
            key: 'value',
            render: (val) => val || '0'
        },
        {
            title: 'Token',
            dataIndex: 'token',
            key: 'token',
            render: (token) => (
                <Space>
                    <Text code style={{ fontSize: '12px' }}>{token?.substring(0, 15)}...</Text>
                    <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(token)}
                    />
                </Space>
            )
        }
    ];

    return (
        <MainLayout>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>
                    <ToolOutlined /> Maintenance Token Console
                </Title>
                <Text type="secondary">
                    Generate STS maintenance tokens for meter configuration and management
                </Text>
            </div>

            <Alert
                message="Admin Only Feature"
                description="This console allows you to generate special STS tokens for meter maintenance operations such as clearing credit, setting power limits, and configuring meter parameters."
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
            />

            {/* Token Generation Card */}
            <Card
                title={<><ThunderboltOutlined /> Generate Maintenance Token</>}
                style={{ marginBottom: 24 }}
            >
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div>
                        <Text strong>Meter Number</Text>
                        <Input
                            placeholder="Enter meter number (e.g., 0128244428552)"
                            value={meterNumber}
                            onChange={(e) => setMeterNumber(e.target.value)}
                            size="large"
                            style={{ marginTop: 8, fontFamily: 'monospace' }}
                            maxLength={13}
                        />
                    </div>

                    <div>
                        <Text strong>Token Type</Text>
                        <Select
                            value={tokenType}
                            onChange={setTokenType}
                            size="large"
                            style={{ width: '100%', marginTop: 8 }}
                            optionLabelProp="label"
                        >
                            {TOKEN_TYPES.map(type => (
                                <Option
                                    key={type.value}
                                    value={type.value}
                                    label={type.label}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: 2 }}>
                                            {type.label}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                                            {type.description}
                                        </div>
                                    </div>
                                </Option>
                            ))}
                        </Select>
                    </div>

                    {selectedTokenType?.requiresValue && (
                        <div>
                            <Text strong>
                                Value {selectedTokenType.unit && `(${selectedTokenType.unit})`}
                            </Text>
                            <InputNumber
                                value={tokenValue}
                                onChange={setTokenValue}
                                size="large"
                                style={{ width: '100%', marginTop: 8 }}
                                min={0}
                                placeholder={`Enter value in ${selectedTokenType.unit || 'units'}`}
                            />
                        </div>
                    )}

                    <Button
                        type="primary"
                        size="large"
                        icon={<ThunderboltOutlined />}
                        onClick={handleGenerateToken}
                        loading={loading}
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            height: '48px',
                            fontSize: '16px'
                        }}
                        block
                    >
                        Generate Token
                    </Button>

                    {generatedToken && (
                        <Alert
                            message="Token Generated Successfully!"
                            description={
                                <div>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <div style={{
                                        background: '#f0f2f5',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        marginBottom: 12
                                    }}>
                                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                            <div>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>Token:</Text>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Text
                                                        strong
                                                        style={{
                                                            fontSize: '20px',
                                                            fontFamily: 'monospace',
                                                            color: '#667eea',
                                                            wordBreak: 'break-all'
                                                        }}
                                                    >
                                                        {generatedToken.token}
                                                    </Text>
                                                    <Button
                                                        type="primary"
                                                        icon={<CopyOutlined />}
                                                        onClick={() => copyToClipboard(generatedToken.token)}
                                                    >
                                                        Copy
                                                    </Button>
                                                </div>
                                            </div>
                                        </Space>
                                    </div>
                                    <Space direction="vertical" size="small">
                                        <div>
                                            <Text type="secondary">Meter: </Text>
                                            <Text code>{generatedToken.meterNumber}</Text>
                                        </div>
                                        <div>
                                            <Text type="secondary">Type: </Text>
                                            <Text strong>{generatedToken.explain}</Text>
                                        </div>
                                        <div>
                                            <Text type="secondary">Value: </Text>
                                            <Text>{generatedToken.value}</Text>
                                        </div>
                                        <div>
                                            <Text type="secondary">Transaction ID: </Text>
                                            <Text code style={{ fontSize: '11px' }}>{generatedToken.transactionId}</Text>
                                        </div>
                                        <div>
                                            <Text type="secondary">Time: </Text>
                                            <Text>{generatedToken.clearTime}</Text>
                                        </div>
                                    </Space>
                                </div>
                            }
                            type="success"
                            showIcon
                            icon={<CheckCircleOutlined />}
                        />
                    )}
                </Space>
            </Card>

            {/* Token History Card */}
            <Card
                title={<><HistoryOutlined /> Token History</>}
                extra={
                    <Button
                        icon={<HistoryOutlined />}
                        onClick={loadTokenHistory}
                        loading={loadingHistory}
                    >
                        Refresh
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    dataSource={tokenHistory}
                    rowKey="id"
                    loading={loadingHistory}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} tokens`
                    }}
                    scroll={{ x: 800 }}
                />
            </Card>
        </MainLayout>
    );
};

export default MaintenanceConsole;
