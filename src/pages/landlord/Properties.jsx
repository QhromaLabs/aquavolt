import { useState } from 'react';
import {
    Typography,
    Table,
    Card,
    Tag,
    Space,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    message,
    Popconfirm
} from 'antd';
import {
    HomeOutlined,
    EnvironmentOutlined,
    ReloadOutlined,
    AppstoreOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ThunderboltOutlined,
    ApiOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { useLandlordData } from '../../hooks/useLandlordData';
import { supabase } from '../../lib/supabase';
import { futuriseDev } from '../../lib/futuriseDev';

const { Title, Text } = Typography;

const LandlordProperties = () => {
    const { loading, properties, refreshData } = useLandlordData();

    // Unit Management State
    const [unitsModalVisible, setUnitsModalVisible] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [selectedPropertyUnits, setSelectedPropertyUnits] = useState([]);

    // Add/Edit Unit State
    const [unitFormVisible, setUnitFormVisible] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [unitForm] = Form.useForm();
    const [validating, setValidating] = useState(false);
    const [validationStatus, setValidationStatus] = useState(null);
    const [meterDetails, setMeterDetails] = useState(null);

    // --- Actions ---

    const handleManageUnits = (property) => {
        setSelectedProperty(property);
        // property.units is already populated by useLandlordData hook!
        // But let's act on a copy or rely on hook data? 
        // The hook might be stale if we update units. 
        // We should probably rely on the hook, but for immediate feedback we might need to locally update or re-fetch.
        // Since useLandlordData creates nested structure, let's use that.
        setSelectedPropertyUnits(property.units || []);
        setUnitsModalVisible(true);
    };

    const handleRefreshUnits = async () => {
        // We'll trigger a full refresh which updates 'properties'
        // Then we need to update selectedPropertyUnits
        if (selectedProperty) {
            await refreshData();
            // We need to re-find the property from the NEW properties list
            // However, 'refreshData' doesn't return the new data immediately to this scope easily without useEffect.
            // A simpler way: just fetch units for this property manually.
            const { data } = await supabase.from('units').select('*').eq('property_id', selectedProperty.id);
            setSelectedPropertyUnits(data || []);
        }
    };

    const handleAddUnit = () => {
        setEditingUnit(null);
        unitForm.resetFields();
        setValidationStatus(null);
        setMeterDetails(null);
        setUnitFormVisible(true);
    };

    const handleEditUnit = (unit) => {
        setEditingUnit(unit);
        unitForm.setFieldsValue({
            ...unit,
            current_balance: parseFloat(unit.current_balance || 0),
        });
        setValidationStatus(null);
        setUnitFormVisible(true);
    };

    const handleDeleteUnit = async (id) => {
        try {
            const { error } = await supabase.from('units').delete().eq('id', id);
            if (error) throw error;
            message.success('Unit deleted');
            handleRefreshUnits();
        } catch (error) {
            message.error('Failed to delete unit');
            console.error(error);
        }
    };

    const handleSaveUnit = async (values) => {
        try {
            const payload = {
                ...values,
                property_id: selectedProperty.id, // Ensure attached to current property
                current_balance: values.current_balance || 0
            };

            if (editingUnit) {
                const { error } = await supabase
                    .from('units')
                    .update(payload)
                    .eq('id', editingUnit.id);
                if (error) throw error;
                message.success('Unit updated');
            } else {
                const { error } = await supabase
                    .from('units')
                    .insert([payload]);
                if (error) throw error;
                message.success('Unit added');
            }

            setUnitFormVisible(false);
            handleRefreshUnits(); // Update the list
        } catch (error) {
            console.error('Save error:', error);
            message.error('Failed to save unit: ' + error.message);
        }
    };

    // --- Table Columns ---

    const propertyColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <Space>
                    <HomeOutlined style={{ color: '#1ecf49' }} />
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
            render: (text) => (
                <Space>
                    <EnvironmentOutlined />
                    <Text>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Total Units',
            key: 'units',
            render: (_, record) => (
                <Tag color="blue">{record.units?.length || 0} Units</Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="primary"
                    ghost
                    size="small"
                    icon={<AppstoreOutlined />}
                    onClick={() => handleManageUnits(record)}
                >
                    Manage Units
                </Button>
            )
        }
    ];

    const unitColumns = [
        {
            title: 'Label',
            dataIndex: 'label',
            key: 'label',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Meter No.',
            dataIndex: 'meter_number',
            key: 'meter',
            render: t => <Text code>{t}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: s => <Tag color={s === 'occupied' ? 'red' : 'green'}>{s?.toUpperCase()}</Tag>
        },
        {
            title: 'Balance',
            dataIndex: 'current_balance',
            render: b => <Text type={b > 0 ? 'success' : 'danger'}>{parseFloat(b || 0).toFixed(2)}</Text>
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditUnit(record)}
                    />
                    <Popconfirm
                        title="Delete unit?"
                        onConfirm={() => handleDeleteUnit(record.id)}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <MainLayout>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={2}>My Properties</Title>
                <Button icon={<ReloadOutlined />} onClick={refreshData}>Refresh</Button>
            </div>

            <Card>
                <Table
                    columns={propertyColumns}
                    dataSource={properties}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            {/* Manage Units Modal */}
            <Modal
                title={`Units for ${selectedProperty?.name || 'Property'}`}
                open={unitsModalVisible}
                onCancel={() => setUnitsModalVisible(false)}
                footer={null}
                width={800}
            >
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddUnit}
                        style={{ background: '#1ecf49', border: 'none' }}
                    >
                        Add Unit
                    </Button>
                </div>
                <Table
                    columns={unitColumns}
                    dataSource={selectedPropertyUnits}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                />
            </Modal>

            {/* Add/Edit Unit Modal - Stacked on top */}
            <Modal
                title={editingUnit ? 'Edit Unit' : 'Add New Unit'}
                open={unitFormVisible}
                onCancel={() => setUnitFormVisible(false)}
                footer={null}
                zIndex={1001} // Higher than first modal
            >
                <Form
                    form={unitForm}
                    layout="vertical"
                    onFinish={handleSaveUnit}
                >
                    <Form.Item
                        name="label"
                        label="Unit Label"
                        rules={[{ required: true, message: 'Required (e.g. A1)' }]}
                    >
                        <Input placeholder="A1" />
                    </Form.Item>

                    <Form.Item
                        name="meter_number"
                        label="Meter Number"
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <Input placeholder="012..." onChange={() => setValidationStatus(null)} />
                    </Form.Item>

                    {/* Meter Validation Block */}
                    <div style={{ marginBottom: 24, marginTop: -12 }}>
                        <Button
                            type="dashed"
                            onClick={async () => {
                                const meterNo = unitForm.getFieldValue('meter_number');
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
                                    message.success('Connected to ' + (res.details?.meterNo || 'device'));
                                } else {
                                    setValidationStatus('error');
                                    setMeterDetails(null);
                                    message.error('Validation Failed: ' + res.message);
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
                            {validationStatus === 'success' ? 'Verified' : 'Validate with Futurise'}
                        </Button>
                    </div>

                    <Form.Item
                        name="current_balance"
                        label="Internal Balance (KES)"
                        initialValue={0}
                    >
                        <InputNumber style={{ width: '100%' }} precision={2} />
                    </Form.Item>

                    <Form.Item
                        name="futurise_tariff_name"
                        label="Futurise Tariff"
                    >
                        <Select
                            placeholder="Select tariff"
                            allowClear
                            options={[
                                { value: 'headoffice', label: 'headoffice' },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        name="futurise_tariff_price"
                        label="Tariff Price"
                    >
                        <InputNumber style={{ width: '100%' }} precision={2} />
                    </Form.Item>

                    <div style={{ textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setUnitFormVisible(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" style={{ background: '#1ecf49' }}>
                                Save
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
        </MainLayout>
    );
};

export default LandlordProperties;
