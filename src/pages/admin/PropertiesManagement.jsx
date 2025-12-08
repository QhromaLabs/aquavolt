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
    Popconfirm
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    HomeOutlined,
    SyncOutlined,
    ApiOutlined
} from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { supabase } from '../../lib/supabase';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PropertiesManagement = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProperty, setEditingProperty] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProperties(data || []);
        } catch (error) {
            console.error('Error fetching properties:', error);
            message.error('Failed to load properties');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        form.resetFields();
        setEditingProperty(null);
        setModalVisible(true);
    };

    const handleEdit = (property) => {
        setEditingProperty(property);
        form.setFieldsValue(property);
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            const { error } = await supabase
                .from('properties')
                .delete()
                .eq('id', id);

            if (error) throw error;
            message.success('Property deleted successfully');
            fetchProperties();
        } catch (error) {
            console.error('Error deleting property:', error);
            message.error('Failed to delete property');
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingProperty) {
                // Update existing property
                const { error } = await supabase
                    .from('properties')
                    .update(values)
                    .eq('id', editingProperty.id);

                if (error) throw error;
                message.success('Property updated successfully');
            } else {
                // Create new property
                const { error } = await supabase
                    .from('properties')
                    .insert([values]);

                if (error) throw error;
                message.success('Property created successfully');
            }

            setModalVisible(false);
            form.resetFields();
            fetchProperties();
        } catch (error) {
            console.error('Error saving property:', error);
            message.error('Failed to save property: ' + error.message);
        }
    };

    const columns = [
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
        },
        {
            title: 'Futurise Region',
            key: 'futurise',
            render: (_, record) => (
                record.futurise_region_name ? (
                    <Space direction="vertical" size="small">
                        <Tag color="green" icon={<ApiOutlined />}>
                            {record.futurise_region_name}
                        </Tag>
                        {record.futurise_region_label && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Label: {record.futurise_region_label}
                            </Text>
                        )}
                    </Space>
                ) : (
                    <Tag color="default">Not Mapped</Tag>
                )
            ),
        },
        {
            title: 'Last Sync',
            dataIndex: 'last_futurise_sync',
            key: 'last_futurise_sync',
            render: (date) => date ? new Date(date).toLocaleString() : 'Never',
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
                        title="Delete Property"
                        description="Are you sure you want to delete this property?"
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
                            <HomeOutlined /> Properties Management
                        </Title>
                        <Text type="secondary">
                            Manage properties and map them to Futurise regions
                        </Text>
                    </div>
                    <Space>
                        <Button
                            icon={<SyncOutlined />}
                            onClick={fetchProperties}
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
                            Add Property
                        </Button>
                    </Space>
                </div>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={properties}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} properties`,
                    }}
                />
            </Card>

            <Modal
                title={editingProperty ? 'Edit Property' : 'Add New Property'}
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
                        name="name"
                        label="Property Name"
                        rules={[{ required: true, message: 'Please enter property name' }]}
                    >
                        <Input placeholder="e.g., Riverside Apartments" />
                    </Form.Item>

                    <Form.Item
                        name="location"
                        label="Location"
                        rules={[{ required: true, message: 'Please enter location' }]}
                    >
                        <Input placeholder="e.g., Westlands, Nairobi" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <TextArea
                            rows={3}
                            placeholder="Optional description about the property"
                        />
                    </Form.Item>

                    <Form.Item
                        name="futurise_region_name"
                        label="Futurise Region"
                        tooltip="Map this property to a Futurise region (1:1 mapping)"
                    >
                        <Select
                            placeholder="Select Futurise region"
                            allowClear
                            options={[
                                { value: 'head office', label: 'head office' },
                                // More regions can be loaded from Futurise API
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        name="futurise_region_label"
                        label="Futurise Region Label"
                        tooltip="Region label/ID from Futurise"
                    >
                        <Input placeholder="e.g., 1" />
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
                                {editingProperty ? 'Update' : 'Create'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </MainLayout>
    );
};

export default PropertiesManagement;
