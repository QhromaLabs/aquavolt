import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Form,
    Select,
    InputNumber,
    Button,
    Typography,
    Space,
    Row,
    Col,
    message,
    Alert,
    Modal,
    Divider
} from 'antd';
import {
    ShoppingOutlined,
    ThunderboltOutlined,
    CopyOutlined,
    CheckCircleOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import { useTenantData } from '../../hooks/useTenantData';
import { supabase } from '../../lib/supabase';
import MainLayout from '../../components/Layout/MainLayout';
import MobileCard from '../../components/mobile/MobileCard';
import QuickAmountButton from '../../components/mobile/QuickAmountButton';

const { Title, Text, Paragraph } = Typography;

const BuyToken = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { units, loading: unitsLoading } = useTenantData();
    const [form] = Form.useForm();

    const [selectedUnit, setSelectedUnit] = useState(null);
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [customAmount, setCustomAmount] = useState(null);
    const [purchasing, setPurchasing] = useState(false);
    const [tokenResult, setTokenResult] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

    // Handle pre-selected unit from navigation state
    useEffect(() => {
        if (location.state?.selectedUnit) {
            setSelectedUnit(location.state.selectedUnit);
            form.setFieldsValue({ unit_id: location.state.selectedUnit });
        } else if (units.length === 1) {
            // Auto-select if only one unit
            setSelectedUnit(units[0].unitId);
            form.setFieldsValue({ unit_id: units[0].unitId });
        }
    }, [location.state, units, form]);

    const handleQuickAmount = (amount) => {
        setSelectedAmount(amount);
        setCustomAmount(null);
        form.setFieldsValue({ amount });
    };

    const handleCustomAmountChange = (value) => {
        setCustomAmount(value);
        setSelectedAmount(null);
        form.setFieldsValue({ amount: value });
    };

    const handlePurchase = async (values) => {
        setPurchasing(true);
        try {
            const selectedUnitData = units.find(u => u.unitId === values.unit_id);

            if (!selectedUnitData) {
                throw new Error('Unit not found');
            }

            if (!selectedUnitData.meterNumber) {
                throw new Error('This unit does not have a meter number assigned');
            }

            // Call Futurise edge function to purchase token
            const { data, error } = await supabase.functions.invoke('futurise-vend-token', {
                body: {
                    meterNumber: selectedUnitData.meterNumber,
                    amount: values.amount,
                    phoneNumber: '254712345678' // TODO: Get from user profile
                }
            });

            if (error) throw error;

            if (!data.success) {
                throw new Error(data.error || 'Token purchase failed');
            }

            // Save to database
            const { data: topupData, error: topupError } = await supabase
                .from('topups')
                .insert([{
                    unit_id: values.unit_id,
                    tenant_id: (await supabase.auth.getUser()).data.user.id,
                    amount_paid: data.amount,
                    amount_vended: data.units,
                    fee_amount: data.amount - data.units,
                    payment_channel: 'mpesa',
                    token: data.token,
                    futurise_status: 'success',
                    futurise_message: 'Token generated successfully',
                    futurise_transaction_id: data.transactionId,
                    futurise_flow_no: data.transactionId,
                    futurise_request_id: data.requestId
                }])
                .select()
                .single();

            if (topupError) throw topupError;

            setTokenResult({
                token: data.token,
                amount_paid: data.amount,
                amount_vended: data.units,
                fee_amount: data.amount - data.units,
                meter_number: data.meterNumber,
                unit: selectedUnitData,
                clearTime: data.clearTime,
            });
            setShowSuccessModal(true);
            form.resetFields();
            setSelectedAmount(null);
            setCustomAmount(null);

        } catch (error) {
            console.error('Purchase error:', error);
            message.error(error.message || 'Failed to purchase token. Please try again.');
        } finally {
            setPurchasing(false);
        }
    };

    const copyToken = () => {
        if (tokenResult?.token) {
            navigator.clipboard.writeText(tokenResult.token);
            message.success('Token copied to clipboard!');
        }
    };

    const getAmount = () => selectedAmount || customAmount || 0;

    return (
        <MainLayout>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/tenant/dashboard')}
                    style={{ marginBottom: 12, padding: 0 }}
                >
                    Back to Dashboard
                </Button>
                <Title level={2} style={{ margin: 0, fontSize: '24px' }}>
                    Buy Electricity Token
                </Title>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                    Purchase prepaid electricity units
                </Text>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handlePurchase}
                requiredMark={false}
            >
                {/* Unit Selection */}
                <MobileCard
                    title={<span style={{ fontSize: '16px', fontWeight: 600 }}>Select Unit</span>}
                    style={{ marginBottom: 16 }}
                >
                    <Form.Item
                        name="unit_id"
                        rules={[{ required: true, message: 'Please select a unit' }]}
                        style={{ marginBottom: 0 }}
                    >
                        <Select
                            size="large"
                            placeholder="Choose your unit"
                            loading={unitsLoading}
                            onChange={setSelectedUnit}
                            style={{ width: '100%' }}
                        >
                            {units.map((unit) => (
                                <Select.Option key={unit.unitId} value={unit.unitId}>
                                    <div>
                                        <Text strong>{unit.unitLabel}</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {unit.propertyName} - {unit.meterNumber}
                                        </Text>
                                    </div>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </MobileCard>

                {/* Quick Amount Selection */}
                <MobileCard
                    title={<span style={{ fontSize: '16px', fontWeight: 600 }}>Quick Amounts</span>}
                    style={{ marginBottom: 16 }}
                >
                    <Row gutter={[8, 8]}>
                        {quickAmounts.map((amount) => (
                            <Col xs={8} key={amount}>
                                <QuickAmountButton
                                    amount={amount}
                                    selected={selectedAmount === amount}
                                    onClick={handleQuickAmount}
                                />
                            </Col>
                        ))}
                    </Row>
                </MobileCard>

                {/* Custom Amount */}
                <MobileCard
                    title={<span style={{ fontSize: '16px', fontWeight: 600 }}>Or Enter Custom Amount</span>}
                    style={{ marginBottom: 16 }}
                >
                    <Form.Item
                        name="amount"
                        rules={[
                            { required: true, message: 'Please enter an amount' },
                            { type: 'number', min: 50, message: 'Minimum amount is KES 50' }
                        ]}
                        style={{ marginBottom: 0 }}
                    >
                        <InputNumber
                            size="large"
                            placeholder="Enter amount"
                            prefix="KES"
                            style={{
                                width: '100%',
                                fontSize: '16px'
                            }}
                            onChange={handleCustomAmountChange}
                            min={50}
                            max={50000}
                        />
                    </Form.Item>
                </MobileCard>

                {/* Summary */}
                {getAmount() > 0 && (
                    <MobileCard style={{ marginBottom: 16, background: '#f9f9f9' }}>
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Amount to Pay</Text>
                                <Text strong style={{ fontSize: '16px' }}>
                                    KES {getAmount().toFixed(2)}
                                </Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Service Fee (5%)</Text>
                                <Text>KES {(getAmount() * 0.05).toFixed(2)}</Text>
                            </div>
                            <Divider style={{ margin: '8px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text strong>Units to Receive</Text>
                                <Text strong style={{ fontSize: '18px', color: '#1ecf49' }}>
                                    <ThunderboltOutlined /> KES {(getAmount() * 0.95).toFixed(2)}
                                </Text>
                            </div>
                        </Space>
                    </MobileCard>
                )}

                {/* Payment Info */}
                <Alert
                    message="M-Pesa Payment"
                    description="You will receive an M-Pesa prompt on your phone to complete the payment."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: '8px' }}
                />

                {/* Submit Button */}
                <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        block
                        loading={purchasing}
                        disabled={!selectedUnit || getAmount() < 50}
                        icon={<ShoppingOutlined />}
                        style={{
                            height: '56px',
                            borderRadius: '10px',
                            fontSize: '16px',
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #1ecf49 0%, #36ea98 100%)',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(30, 207, 73, 0.3)',
                        }}
                    >
                        {purchasing ? 'Processing...' : `Pay KES ${getAmount().toFixed(2)}`}
                    </Button>
                </Form.Item>
            </Form>

            {/* Success Modal */}
            <Modal
                open={showSuccessModal}
                onCancel={() => {
                    setShowSuccessModal(false);
                    navigate('/tenant/dashboard');
                }}
                footer={[
                    <Button
                        key="copy"
                        icon={<CopyOutlined />}
                        onClick={copyToken}
                        style={{ borderRadius: '8px' }}
                    >
                        Copy Token
                    </Button>,
                    <Button
                        key="done"
                        type="primary"
                        onClick={() => {
                            setShowSuccessModal(false);
                            navigate('/tenant/dashboard');
                        }}
                        style={{
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #1ecf49 0%, #36ea98 100%)',
                            border: 'none'
                        }}
                    >
                        Done
                    </Button>
                ]}
                width={400}
                centered
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <CheckCircleOutlined
                        style={{
                            fontSize: '64px',
                            color: '#1ecf49',
                            marginBottom: 16
                        }}
                    />
                    <Title level={3} style={{ marginBottom: 8 }}>
                        Purchase Successful!
                    </Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                        Your token has been generated
                    </Text>

                    {tokenResult && (
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            <div style={{
                                background: '#f9f9f9',
                                padding: '16px',
                                borderRadius: '8px',
                                border: '2px dashed #1ecf49'
                            }}>
                                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
                                    Your Token
                                </Text>
                                <Text
                                    strong
                                    style={{
                                        fontSize: '18px',
                                        fontFamily: 'monospace',
                                        wordBreak: 'break-all',
                                        display: 'block',
                                        color: '#1ecf49'
                                    }}
                                >
                                    {tokenResult.token}
                                </Text>
                            </div>

                            <div style={{ textAlign: 'left' }}>
                                <Paragraph style={{ marginBottom: 4 }}>
                                    <Text type="secondary">Unit: </Text>
                                    <Text strong>{tokenResult.unit?.unitLabel}</Text>
                                </Paragraph>
                                <Paragraph style={{ marginBottom: 4 }}>
                                    <Text type="secondary">Meter: </Text>
                                    <Text strong>{tokenResult.meter_number}</Text>
                                </Paragraph>
                                <Paragraph style={{ marginBottom: 4 }}>
                                    <Text type="secondary">Amount: </Text>
                                    <Text strong>KES {tokenResult.amount_vended?.toFixed(2)}</Text>
                                </Paragraph>
                            </div>

                            <Alert
                                message="How to Use"
                                description="Enter this token on your meter keypad to load the units."
                                type="info"
                                showIcon
                            />
                        </Space>
                    )}
                </div>
            </Modal>
        </MainLayout >
    );
};

export default BuyToken;
