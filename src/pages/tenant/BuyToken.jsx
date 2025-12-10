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
    Divider,
    Tag
} from 'antd';
import {
    ShoppingOutlined,
    ThunderboltOutlined,
    CopyOutlined,
    CheckCircleOutlined,
    ArrowLeftOutlined,
    PhoneOutlined
} from '@ant-design/icons';
import { useTenantData } from '../../hooks/useTenantData';
import { supabase } from '../../lib/supabase';

import TenantLayout from '../../layouts/TenantLayout';
import MobileCard from '../../components/mobile/MobileCard';
import QuickAmountButton from '../../components/mobile/QuickAmountButton';
import { futuriseDev } from '../../lib/futuriseDev';

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

    // M-Pesa & Dev Integration
    // Phone state, defaulting to test number if available or empty
    const [phoneNumber, setPhoneNumber] = useState('254712345678');
    const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, pushing, waiting, vended, error
    const [serviceFeePercent, setServiceFeePercent] = useState(5); // Default 5%

    const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

    useEffect(() => {
        const fetchServiceFee = async () => {
            const { data } = await supabase
                .from('admin_settings')
                .select('value')
                .eq('key', 'service_fee_percent')
                .single();
            if (data?.value) {
                setServiceFeePercent(parseFloat(data.value));
            }
        };
        fetchServiceFee();
    }, []);

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
        setPaymentStatus('pushing');
        try {
            const selectedUnitData = units.find(u => u.unitId === values.unit_id);
            if (!selectedUnitData) throw new Error('Unit not found');
            if (!selectedUnitData.meterNumber) throw new Error('Meter number missing');

            const phone = values.phoneNumber?.toString() || phoneNumber;

            // [REAL FLOW] Use Local Proxy (Futurise API)
            // 1. STK Push (Safaricom Sandbox)
            message.loading({ content: 'Sending M-Pesa STK Push...', key: 'mpesa' });
            const stkRes = await futuriseDev.sendStkPush(phone, values.amount);

            if (!stkRes.success) {
                message.error({ content: 'STK Push Failed: ' + stkRes.message, key: 'mpesa' });
                setPaymentStatus('error');
                throw new Error(stkRes.message);
            }

            message.success({ content: 'STK Push Sent! Enter PIN.', key: 'mpesa', duration: 4 });
            setPaymentStatus('waiting');

            // Simulate Payment Wait (5 seconds)
            await new Promise(resolve => setTimeout(resolve, 5000));

            // 2. Vend Token (Futurise API via Proxy)
            message.loading({ content: 'Verifying Payment & Vending Token...', key: 'vend' });

            const fee = values.amount * (serviceFeePercent / 100);
            const netAmount = values.amount - fee;

            // Auto-auth handles token if needed
            const vendRes = await futuriseDev.vendToken(selectedUnitData.meterNumber, netAmount, null);

            if (!vendRes.success) {
                message.error({ content: 'Vending Failed: ' + vendRes.message, key: 'vend' });
                setPaymentStatus('error');
                throw new Error(vendRes.message);
            }

            message.success({ content: 'Token Generated!', key: 'vend' });
            setPaymentStatus('vended');

            // Map response
            const responseData = {
                success: true,
                amount: values.amount,
                netAmount: netAmount,
                units: parseFloat(vendRes.units || 0),
                token: vendRes.token,
                transactionId: vendRes.transactionId,
                requestId: 'LOC-DEV-' + Date.now().toString().slice(-6),
                meterNumber: vendRes.meterNumber,
                clearTime: vendRes.clearTime
            };

            // Save to database
            const { data: topupData, error: topupError } = await supabase
                .from('topups')
                .insert([{
                    unit_id: values.unit_id,
                    tenant_id: (await supabase.auth.getUser()).data.user.id,
                    amount_paid: responseData.amount,
                    amount_vended: responseData.units,
                    fee_amount: responseData.amount - responseData.netAmount,
                    payment_channel: 'mpesa',
                    token: responseData.token,
                    futurise_status: 'success',
                    futurise_message: 'Token generated successfully',
                    futurise_transaction_id: responseData.transactionId,
                    futurise_flow_no: responseData.transactionId,
                    futurise_request_id: responseData.requestId
                }])
                .select()
                .single();

            if (topupError) throw topupError;

            setTokenResult({
                token: responseData.token,
                amount_paid: responseData.amount,
                amount_vended: responseData.units,
                fee_amount: 0,
                meter_number: selectedUnitData.meterNumber,
                unit: selectedUnitData,
                clearTime: responseData.clearTime,
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
            setPaymentStatus('idle');
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
        <TenantLayout>
            <div style={{ padding: '20px' }}>
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={2} style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
                        Buy Tokens
                    </Title>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                        Purchase units instantly via M-Pesa
                    </Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handlePurchase}
                    requiredMark={false}
                >
                    {/* Unit Selection Card */}
                    <MobileCard style={{ marginBottom: 16 }}>
                        <Text strong style={{ fontSize: '14px', marginBottom: 8, display: 'block' }}>Select Unit</Text>
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
                                style={{ width: '100%', height: '56px' }}
                                dropdownStyle={{ borderRadius: '16px', padding: '8px' }}
                                optionLabelProp="label"
                            >
                                {units.map((unit) => (
                                    <Select.Option
                                        key={unit.unitId}
                                        value={unit.unitId}
                                        label={
                                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', lineHeight: '1.2' }}>
                                                <span style={{ fontWeight: 600, fontSize: '15px', color: '#1f1f1f' }}>{unit.unitLabel}</span>
                                                <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{unit.propertyName}</span>
                                            </div>
                                        }
                                    >
                                        <div style={{ padding: '8px 4px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                <Text strong style={{ fontSize: '16px', color: '#1f1f1f' }}>{unit.unitLabel}</Text>
                                                <Tag color="cyan" style={{ margin: 0, borderRadius: '4px', border: 'none', background: '#e6f7ff', color: '#096dd9' }}>
                                                    {unit.meterNumber}
                                                </Tag>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#8c8c8c' }}>
                                                <ShoppingOutlined style={{ marginRight: 6 }} />
                                                {unit.propertyName}
                                            </div>
                                        </div>
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </MobileCard>

                    {/* Amount Selection */}
                    <MobileCard style={{ marginBottom: 16 }}>
                        <Text strong style={{ fontSize: '14px', marginBottom: 12, display: 'block' }}>Amount (KES)</Text>

                        <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
                            {quickAmounts.map((amount) => (
                                <Col span={8} key={amount}>
                                    <div
                                        onClick={() => handleQuickAmount(amount)}
                                        style={{
                                            border: selectedAmount === amount ? '2px solid #1ecf49' : '1px solid #f0f0f0',
                                            background: selectedAmount === amount ? '#f6ffed' : 'white',
                                            color: selectedAmount === amount ? '#1ecf49' : '#595959',
                                            borderRadius: '12px',
                                            padding: '12px 0',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '15px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {amount}
                                    </div>
                                </Col>
                            ))}
                        </Row>

                        <Form.Item
                            name="amount"
                            rules={[
                                { required: true, message: 'Please enter an amount' },
                                { type: 'number', min: 50, message: 'Minimum KES 50' }
                            ]}
                            style={{ marginBottom: 0 }}
                        >
                            <InputNumber
                                size="large"
                                placeholder="Enter custom amount"
                                prefix={<span style={{ color: '#d9d9d9', marginRight: 4 }}>KES</span>}
                                style={{
                                    width: '100%',
                                    borderRadius: '12px',
                                    padding: '4px 0'
                                }}
                                onChange={handleCustomAmountChange}
                                min={50}
                                type="number"
                            />
                        </Form.Item>
                    </MobileCard>

                    {/* Calculation Summary */}
                    {getAmount() > 0 && (
                        <div style={{ padding: '0 8px 16px' }}>
                            <div style={{
                                background: '#f9f9f9',
                                borderRadius: '16px',
                                padding: '20px',
                                border: '1px solid #f0f0f0'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text type="secondary">Amount</Text>
                                    <Text strong>KES {getAmount().toFixed(2)}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <Text type="secondary">Service Fee ({serviceFeePercent}%)</Text>
                                    <Text type="danger" style={{ color: '#ff4d4f' }}>
                                        - KES {(getAmount() * (serviceFeePercent / 100)).toFixed(2)}
                                    </Text>
                                </div>
                                <Divider style={{ margin: '8px 0', borderColor: '#e8e8e8' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong style={{ fontSize: '15px' }}>Total Units</Text>
                                    <div style={{ textAlign: 'right' }}>
                                        <Text strong style={{ fontSize: '20px', color: '#1ecf49', display: 'block' }}>
                                            KES {(getAmount() * (1 - serviceFeePercent / 100)).toFixed(2)}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* M-Pesa Phone */}
                    <MobileCard style={{ marginBottom: 160 }}> {/* Extra padding for sticky button */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{
                                background: '#e6f9eb',
                                padding: '8px',
                                borderRadius: '50%',
                                marginRight: 12,
                                color: '#1ecf49'
                            }}>
                                <ThunderboltOutlined />
                            </div>
                            <div>
                                <Text strong style={{ display: 'block' }}>M-Pesa Payment</Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>Enter phone number to pay</Text>
                            </div>
                        </div>

                        <Form.Item
                            name="phoneNumber"
                            initialValue={phoneNumber}
                            rules={[
                                { required: true, message: 'Please enter phone' },
                                { pattern: /^254\d{9}$/, message: 'Must start with 254...' }
                            ]}
                            style={{ marginBottom: 0 }}
                        >
                            <InputNumber
                                size="large"
                                placeholder="2547..."
                                style={{ width: '100%', borderRadius: '10px' }}
                                onChange={(val) => setPhoneNumber(val?.toString())}
                                controls={false}
                                prefix={<PhoneOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />}
                            />
                        </Form.Item>
                    </MobileCard>

                    {/* Sticky Purchase Button */}
                    <div style={{
                        position: 'fixed',
                        bottom: 70, // Flush with BottomNav (70px height)
                        left: 0,
                        right: 0,
                        padding: '16px',
                        background: 'linear-gradient(to top, rgba(255,255,255,0.95) 75%, rgba(255,255,255,0))',
                        backdropFilter: 'blur(5px)',
                        zIndex: 100,
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        <div style={{ width: '100%', maxWidth: '600px' }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                block
                                loading={purchasing}
                                disabled={!selectedUnit || getAmount() < 50}
                                style={{
                                    height: '56px',
                                    borderRadius: '16px',
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    background: '#1ecf49',
                                    border: 'none',
                                    boxShadow: '0 8px 24px rgba(30, 207, 73, 0.35)',
                                }}
                            >
                                {purchasing ? 'Processing...' : `Pay KES ${getAmount().toFixed(0)}`}
                            </Button>
                        </div>
                    </div>
                </Form>

                {/* Success Modal */}
                <Modal
                    open={showSuccessModal}
                    footer={null}
                    closable={false}
                    centered
                    bodyStyle={{ padding: '32px 24px', textAlign: 'center' }}
                    width={340}
                    style={{ top: 20 }}
                >
                    <div style={{ marginBottom: 24 }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            background: '#e6f9eb',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            color: '#1ecf49',
                            fontSize: '32px'
                        }}>
                            <CheckCircleOutlined />
                        </div>
                        <Title level={3} style={{ margin: '0 0 8px' }}>Success!</Title>
                        <Text type="secondary">Token generated successfully</Text>
                    </div>

                    {tokenResult && (
                        <div style={{
                            background: '#f8f9fa',
                            padding: '20px',
                            borderRadius: '16px',
                            marginBottom: 24,
                            border: '1px dashed #d9d9d9'
                        }}>
                            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Your Token
                            </Text>
                            <Text strong style={{ fontSize: '24px', fontFamily: 'monospace', color: '#1ecf49', letterSpacing: '2px', display: 'block', marginBottom: 12 }}>
                                {tokenResult.token}
                            </Text>
                            <Button
                                icon={<CopyOutlined />}
                                size="small"
                                onClick={copyToken}
                                style={{ borderRadius: '20px' }}
                            >
                                Copy
                            </Button>
                        </div>
                    )}

                    <Button
                        type="primary"
                        block
                        size="large"
                        onClick={() => {
                            setShowSuccessModal(false);
                            navigate('/tenant/dashboard');
                        }}
                        style={{ background: '#1ecf49', height: '48px', borderRadius: '12px' }}
                    >
                        Done
                    </Button>
                </Modal>
            </div>
        </TenantLayout >
    );
};

export default BuyToken;
