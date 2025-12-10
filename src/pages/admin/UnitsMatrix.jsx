import { useState, useEffect } from 'react';
import {
    Typography,
    Button,
    Table,
    Space,
    Modal,
    Form,
    Input,
    Select,
    message,
    Card,
    Tag,
    Popconfirm,
    InputNumber
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    BulbOutlined,
    SyncOutlined,
    ApiOutlined,
    ThunderboltOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import { futuriseDev } from '../../lib/futuriseDev';
import MainLayout from '../../components/Layout/MainLayout';
import { supabase } from '../../lib/supabase';

const { Title, Text } = Typography;

const UnitsMatrix = () => {
    const [units, setUnits] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [form] = Form.useForm();

    // Validation State
    const [validating, setValidating] = useState(false);
    const [validationStatus, setValidationStatus] = useState(null); // null, 'success', 'error'
    const [meterDetails, setMeterDetails] = useState(null);

    useEffect(() => {
        fetchUnits();
        fetchProperties();
    }, []);

    const fetchUnits = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('units')
                .select(`
                    *,
                    properties (
                        name,
                        location
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUnits(data || []);
        } catch (error) {
            console.error('Error fetching units:', error);
            message.error('Failed to load units');
        } finally {
            setLoading(false);
        }
    };

    const fetchProperties = async () => {
        try {
            const { data, error } = await supabase
                .from('properties')
                .select('id, name, location')
                .order('name');

            if (error) throw error;
            setProperties(data || []);
        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const handleCreate = () => {
        form.resetFields();
        setEditingUnit(null);
        setValidationStatus(null);
        setMeterDetails(null);
        setModalVisible(true);
    };

    const handleEdit = (unit) => {
        setEditingUnit(unit);
        form.setFieldsValue({
            ...unit,
            current_balance: parseFloat(unit.current_balance || 0),
        });
        setValidationStatus(null); // Reset on open
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            const { error } = await supabase
                .from('units')
                .delete()
                .eq('id', id);

            if (error) throw error;
            message.success('Unit deleted successfully');
            fetchUnits();
        } catch (error) {
            console.error('Error deleting unit:', error);
            message.error('Failed to delete unit');
        }
    };

    const handleSubmit = async (values) => {
        // Enforce validation? For now just optional but recommended
        if (validationStatus === 'error') {
            message.warning('Please fix the invalid meter number before saving.');
            return;
        }

        try {
            if (editingUnit) {
                const { error } = await supabase
                    .from('units')
                    .update(values)
                    .eq('id', editingUnit.id);

                if (error) throw error;
                message.success('Unit updated successfully');
            } else {
                const { error } = await supabase
                    .from('units')
                    .insert([{
                        ...values,
                        current_balance: values.current_balance || 0,
                    }]);

                if (error) throw error;
                message.success('Unit created successfully');
            }

            setModalVisible(false);
            form.resetFields();
            fetchUnits();
        } catch (error) {
            console.error('Error saving unit:', error);
            message.error('Failed to save unit: ' + error.message);
        }
    };

    const columns = [
        {
            title: 'Unit Label',
            dataIndex: 'label',
            key: 'label',
            render: (text) => (
                <Space>
                    <BulbOutlined style={{ color: '#1ecf49' }} />
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Property',
            key: 'property',
            render: (_, record) => (
                record.properties ? (
                    <div>
                        <Text>{record.properties.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {record.properties.location}
                        </Text>
                    </div>
                ) : (
                    <Tag color="default">No Property</Tag>
                )
            ),
        },
        {
            title: 'Meter Number',
            dataIndex: 'meter_number',
            key: 'meter_number',
            render: (text) => text ? (
                <Text code style={{ fontFamily: 'monospace' }}>{text}</Text>
            ) : (
                <Tag color="warning">Not Set</Tag>
            ),
        },
        {
            title: 'Balance',
            dataIndex: 'current_balance',
            key: 'current_balance',
            render: (balance) => (
                <Space>
                    <ThunderboltOutlined style={{ color: balance > 0 ? '#1ecf49' : '#ff4d4f' }} />
                    <Text strong style={{ color: balance > 0 ? '#1ecf49' : '#ff4d4f' }}>
                        KES {parseFloat(balance || 0).toFixed(2)}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Futurise Meter',
            key: 'futurise',
            render: (_, record) => (
                record.futurise_meter_id || record.futurise_tariff_name ? (
                    <Space direction="vertical" size="small">
                        {record.futurise_tariff_name && (
                            <Tag color="green" icon={<ApiOutlined />}>
                                {record.futurise_tariff_name}
                            </Tag>
                        )}
                        {record.futurise_tariff_price && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                {record.futurise_tariff_price} KES/unit
                            </Text>
                        )}
                    </Space>
                ) : (
                    <Tag color="default">Not Mapped</Tag>
                )
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete Unit"
                        description="Are you sure you want to delete this unit?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                        >
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <MainLayout>
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Title level={2}>
                            <BulbOutlined /> Units & Meters Matrix
                        </Title>
                        <Text type="secondary">
                            Manage units and link them to Futurise meters
                        </Text>
                    </div>
                    <Space>
                        <Button
                            icon={<SyncOutlined />}
                            onClick={fetchUnits}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreate}
                            style={{
                                background: 'linear-gradient(135deg, #1ecf49 0%, #36ea98 100%)',
                                border: 'none',
                            }}
                        >
                            Add Unit
                        </Button>
                    </Space>
                </div>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={units}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} units`,
                    }}
                />
            </Card>

            <Modal
                title={editingUnit ? 'Edit Unit' : 'Add New Unit'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="property_id"
                        label="Property"
                        rules={[{ required: true, message: 'Please select a property' }]}
                    >
                        <Select
                            placeholder="Select property"
                            options={properties.map(p => ({
                                value: p.id,
                                label: `${p.name} - ${p.location}`,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        name="label"
                        label="Unit Label"
                        rules={[{ required: true, message: 'Please enter unit label' }]}
                        tooltip="e.g., A1, B2, Unit 101"
                    >
                        <Input placeholder="e.g., A1" />
                    </Form.Item>

                    <Form.Item
                        name="meter_number"
                        label="Meter Number"
                        rules={[{ required: true, message: 'Please enter meter number' }]}
                        tooltip="The physical meter number (must match Futurise)"
                    >
                        <Input
                            placeholder="e.g., 0128244428552"
                            style={{ fontFamily: 'monospace' }}
                            onChange={() => setValidationStatus(null)} // Reset status on edit
                        />
                    </Form.Item>

                    <div style={{ marginBottom: 24, marginTop: -12 }}>
                        <Button
                            type="dashed"
                            onClick={async () => {
                                const meterNo = form.getFieldValue('meter_number');
                                if (!meterNo) {
                                    message.error('Enter a meter number first');
                                    return;
                                }
                                setValidating(true);
                                const res = await futuriseDev.checkMeter(meterNo);
                                setValidating(false);

                                if (res.success && res.exists) {
                                    setValidationStatus('success');
                                    setMeterDetails(res.details);
                                    message.success('Meter Validated! Connected to ' + (res.details?.meterNo || 'device'));
                                    // Auto-fill tariff if available?
                                } else {
                                    setValidationStatus('error');
                                    setMeterDetails(null);
                                    message.error('Meter Validation Failed: ' + res.message);
                                }
                            }}
                            loading={validating}
                            icon={validationStatus === 'success' ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : (validationStatus === 'error' ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> : <ApiOutlined />)}
                            style={{
                                width: '100%',
                                borderColor: validationStatus === 'success' ? '#52c41a' : (validationStatus === 'error' ? '#ff4d4f' : undefined),
                                color: validationStatus === 'success' ? '#52c41a' : (validationStatus === 'error' ? '#ff4d4f' : undefined)
                            }}
                        >
                            {validationStatus === 'success' ? 'Meter Verified' : (validationStatus === 'error' ? 'Invalid Meter - Check Number' : 'Validate with Futurise')}
                        </Button>
                        {meterDetails && (
                            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4, textAlign: 'center' }}>
                                Found: {meterDetails.meterNo} (State: {meterDetails.state})
                            </Text>
                        )}
                    </div>

                    <Form.Item
                        name="current_balance"
                        label="Current Balance (KES)"
                        initialValue={0}
                    >
                        <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="0.00"
                        />
                    </Form.Item>

                    <Form.Item
                        name="futurise_tariff_name"
                        label="Futurise Tariff"
                        tooltip="Tariff name from Futurise (e.g., 'headoffice')"
                    >
                        <Select
                            placeholder="Select tariff"
                            allowClear
                            options={[
                                { value: 'headoffice', label: 'headoffice' },
                                // More tariffs can be loaded from Futurise API
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        name="futurise_tariff_price"
                        label="Tariff Price (KES/unit)"
                        tooltip="Price per unit from Futurise"
                    >
                        <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="e.g., 28.00"
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={() => {
                                setModalVisible(false);
                                form.resetFields();
                            }}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                style={{
                                    background: 'linear-gradient(135deg, #1ecf49 0%, #36ea98 100%)',
                                    border: 'none',
                                }}
                            >
                                {editingUnit ? 'Update' : 'Create'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </MainLayout>
    );
};

export default UnitsMatrix;
