import { useState } from 'react';
import {
    Typography,
    Table,
    Card,
    Avatar,
    Space,
    Button,
    Tag,
    Modal,
    Form,
    Input,
    Select,
    Alert,
    message,
    Tabs,
    Popconfirm
} from 'antd';
import {
    UserOutlined,
    PhoneOutlined,
    ReloadOutlined,
    PlusOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { createClient } from '@supabase/supabase-js';
import MainLayout from '../../components/Layout/MainLayout';
import { useLandlordData } from '../../hooks/useLandlordData';
import { supabase } from '../../lib/supabase';

const { Title, Text } = Typography;
const { Option } = Select;

// Env vars for creating tenant (temp client)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const LandlordTenants = () => {
    const { loading, tenants, properties, refreshData } = useLandlordData();
    const [modalVisible, setModalVisible] = useState(false);

    // Add Tenant Modal State (Restored)
    const [creating, setCreating] = useState(false);
    const [form] = Form.useForm();
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);

    // Edit Tenant Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [targetPropertyId, setTargetPropertyId] = useState(null); // NEW: For Assignment
    const [processing, setProcessing] = useState(false);
    const [editForm] = Form.useForm();
    const [reportForm] = Form.useForm();
    const [activeTab, setActiveTab] = useState('1');

    // Derive vacant units from properties data
    const getVacantUnits = (propertyId) => {
        if (!propertyId) return [];
        const prop = properties.find(p => p.id === propertyId);
        if (!prop || !prop.units) return [];
        return prop.units.filter(u => u.status === 'vacant');
    };

    const handleCreateTenant = async (values) => {
        setCreating(true);
        console.log('Attempting to create tenant:', values);
        try {
            // 0. Strict Vacancy Check
            const { data: targetUnit, error: checkError } = await supabase
                .from('units')
                .select('id, status')
                .eq('id', values.unit_id)
                .single();

            if (checkError) throw checkError;

            // Check DB for active assignment (Double Check)
            const { data: existingAssign, error: conflictError } = await supabase
                .from('unit_assignments')
                .select('id')
                .eq('unit_id', values.unit_id)
                .eq('status', 'active')
                .maybeSingle();

            if (conflictError) throw conflictError;

            if (targetUnit.status === 'occupied' || existingAssign) {
                throw new Error('This unit is already occupied (verified by server). Please select another.');
            }

            // 1. Create Auth User (using temp client to avoid session clobber)
            const tempClient = createClient(supabaseUrl, supabaseKey, {
                auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
            });

            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    data: {
                        full_name: values.full_name,
                        role: 'tenant',
                        phone_number: values.phone_number
                    }
                }
            });

            if (authError) {
                console.error('Auth Sign Up Error:', authError);
                throw new Error(`User creation failed: ${authError.message}`);
            }

            if (!authData.user) throw new Error('User creation returned no data. Email might be duplicate or rate limited.');

            const userId = authData.user.id;
            console.log('User created with ID:', userId);

            // 2. Insert/Update Profile (Best Effort)
            // If DB trigger exists, this is optional. If RLS blocks Landlord, we ignore.
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: email, // Use sanitized email
                    full_name: values.full_name,
                    phone_number: values.phone_number,
                    role: 'tenant',
                    updated_at: new Date()
                });

            if (profileError) {
                console.warn('Profile upsert check (might be RLS restricted, assuming trigger handled it):', profileError);
                // We do NOT throw here, as Landlord often can't write to other profiles directly.
            }

            // 3. Assign to Unit
            const { error: assignError } = await supabase
                .from('unit_assignments')
                .insert({
                    tenant_id: userId,
                    unit_id: values.unit_id,
                    status: 'active',
                    start_date: new Date()
                });

            if (assignError) {
                console.error('Assignment Error:', assignError);
                throw new Error(`Failed to assign unit: ${assignError.message}`);
            }

            // 4. Update Unit Status (Redundant if 'derived status' is used, but good for DB consistency)
            await supabase.from('units').update({ status: 'occupied' }).eq('id', values.unit_id);

            message.success('Tenant added and assigned successfully!');
            setModalVisible(false);
            form.resetFields();
            refreshData();

        } catch (error) {
            console.error('Error adding tenant:', error);
            message.error(error.message || 'Failed to add tenant');
        } finally {
            setCreating(false);
        }
    };

    const openEditModal = (tenant) => {
        setSelectedTenant(tenant);

        // Match existing property if active, else null
        const currentPropId = properties.find(p => p.name === tenant.property_name)?.id;
        setTargetPropertyId(currentPropId || null);

        // Pre-fill Edit Form
        editForm.setFieldsValue({
            full_name: tenant.full_name,
            email: tenant.email,
            phone_number: tenant.phone_number,
            property_id: currentPropId, // Helper for UI
            unit_id: tenant.unit_id
        });

        // Reset Report state
        setActiveTab('1');
        setEditModalVisible(true);
    };

    const handleUpdateDetails = async (values) => {
        if (!selectedTenant) return;
        setProcessing(true);
        try {
            // 1. Update Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: values.full_name,
                    email: values.email,
                    phone_number: values.phone_number,
                    updated_at: new Date()
                })
                .eq('id', selectedTenant.id);

            if (profileError) throw profileError;

            // 2. Handle Assignment / Move
            const newUnitId = values.unit_id;
            const oldUnitId = selectedTenant.unit_id;
            const assignmentId = selectedTenant.assignment_id;

            // Only proceed if a unit was selected and it's different from the current one
            if (newUnitId && newUnitId !== oldUnitId) {
                console.log('Processing Assignment Change:', { oldUnitId, newUnitId });

                if (selectedTenant.assignment_status === 'active') {
                    // CASE A: Moving an Active Tenant (Update Existing)
                    const { error: updateAssignError } = await supabase
                        .from('unit_assignments')
                        .update({
                            unit_id: newUnitId,
                            updated_at: new Date()
                        })
                        .eq('id', assignmentId); // Use specific assignment ID

                    if (updateAssignError) throw updateAssignError;

                    // Free old unit
                    if (oldUnitId) {
                        await supabase.from('units').update({ status: 'vacant' }).eq('id', oldUnitId);
                    }

                } else {
                    // CASE B: Re-assigning a Terminated/Inactive Tenant (Insert New)
                    const { error: newAssignError } = await supabase
                        .from('unit_assignments')
                        .insert({
                            tenant_id: selectedTenant.id,
                            unit_id: newUnitId,
                            status: 'active',
                            start_date: new Date()
                        }); // RLS "Tenants can claim" covers self, but Landlord needs "Landlords can insert assignments" (Fixed previously)

                    if (newAssignError) throw newAssignError;
                }

                // Mark new unit as occupied
                await supabase.from('units').update({ status: 'occupied' }).eq('id', newUnitId);
            }

            message.success('Tenant updated successfully!');
            setEditModalVisible(false);
            refreshData();
        } catch (error) {
            console.error('Error updating tenant:', error);
            message.error('Failed to update tenant: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleTerminateTenant = async () => {
        if (!selectedTenant || !selectedTenant.assignment_id) return;
        setProcessing(true);
        try {
            // 1. End Assignment
            const { error: endError } = await supabase
                .from('unit_assignments')
                .update({
                    status: 'terminated',
                    end_date: new Date(),
                    updated_at: new Date()
                })
                .eq('id', selectedTenant.assignment_id);

            if (endError) throw endError;

            // 2. Clear Unit Status if it was assigned
            if (selectedTenant.unit_id) {
                const { error: unitError } = await supabase
                    .from('units')
                    .update({ status: 'active' })
                    .eq('id', selectedTenant.unit_id);
                if (unitError) console.error('Error freeing unit:', unitError);
            }
            message.success('Tenancy terminated successfully');
            setEditModalVisible(false);
            refreshData();
        } catch (error) {
            console.error('Error terminating:', error);
            message.error('Termination failed: ' + (error.message || 'Unknown error'));
        } finally {
            setProcessing(false);
        }
    };

    const handleSubmitReport = async (values) => {
        if (!selectedTenant) return;
        setProcessing(true);
        try {
            const { error } = await supabase
                .from('issues')
                .insert({
                    unit_id: selectedTenant.unit_id,
                    description: values.description,
                    category: values.category || 'general',
                    status: 'pending',
                    created_at: new Date()
                });

            if (error) throw error;

            message.success('Report submitted successfully');
            reportForm.resetFields();
            // Optional: Close modal or just show success? User didn't specify. Keeping open is friendly.
        } catch (error) {
            console.error('Error submitting report:', error);
            message.error('Failed to submit report');
        } finally {
            setProcessing(false);
        }
    };



    const columns = [
        {
            title: 'Tenant',
            key: 'name',
            render: (_, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} src={record.avatar_url} />
                    <Space direction="vertical" size={0}>
                        <Text strong>{record.full_name}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
                        {record.assignment_status !== 'active' && <Tag color="default" style={{ fontSize: '10px' }}>Deactivated</Tag>}
                    </Space>
                </Space>
            ),
        },
        {
            title: 'Contact',
            key: 'contact',
            render: (_, record) => (
                <Space direction="vertical" size="small">
                    {record.phone_number && (
                        <Space>
                            <PhoneOutlined /> {record.phone_number}
                        </Space>
                    )}
                </Space>
            )
        },
        {
            title: 'Residence',
            key: 'residence',
            render: (_, record) => (
                <Space direction="vertical" size="small">
                    <Text strong>{record.property_name || '-'}</Text>
                    <Tag>{record.unit_number || '-'}</Tag>
                </Space>
            )
        },
        {
            title: 'Move In Date',
            dataIndex: 'move_in_date',
            key: 'move_in_date',
            render: (date) => date ? new Date(date).toLocaleDateString() : '-'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Button
                    size="small"
                    onClick={() => openEditModal(record)}
                >
                    Manage
                </Button>
            )
        }
    ];

    // Helper for modal title
    const isAssigned = selectedTenant?.assignment_status === 'active';

    return (
        <MainLayout>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={2}>My Tenants</Title>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={refreshData}>Refresh</Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalVisible(true)}
                        style={{ background: '#1ecf49', border: 'none' }}
                    >
                        Add Tenant
                    </Button>
                </Space>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={tenants}
                    rowKey="assignment_id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            {/* Create Tenant Modal */}
            <Modal
                title="Add New Tenant"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Alert
                    message="Creates a login and assigns them to a unit."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateTenant}
                >
                    <Form.Item
                        name="full_name"
                        label="Full Name"
                        rules={[{ required: true }]}
                    >
                        <Input placeholder="Jane Doe" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, type: 'email' }]}
                    >
                        <Input placeholder="tenant@example.com" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Temporary Password"
                        rules={[{ required: true }]}
                    >
                        <Input.Password placeholder="Min 6 chars" />
                    </Form.Item>

                    <Form.Item
                        name="phone_number"
                        label="Phone Number"
                    >
                        <Input placeholder="07..." />
                    </Form.Item>

                    <Form.Item label="Select Apartment">
                        <Select
                            placeholder="Choose an apartment"
                            onChange={(val) => {
                                setSelectedPropertyId(val);
                                form.setFieldsValue({ unit_id: null });
                            }}
                        >
                            {properties.map(p => (
                                <Option key={p.id} value={p.id}>{p.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="unit_id"
                        label="Select Meter"
                        rules={[{ required: true, message: 'Please select a meter' }]}
                    >
                        <Select
                            placeholder={selectedPropertyId ? "Select a vacant meter" : "Select apartment first"}
                            disabled={!selectedPropertyId}
                        >
                            {getVacantUnits(selectedPropertyId).map(u => (
                                <Option key={u.id} value={u.id}>
                                    {u.meter_number} (Unit {u.label})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <div style={{ textAlign: 'right', marginTop: 24 }}>
                        <Space>
                            <Button onClick={() => setModalVisible(false)}>Cancel</Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={creating}
                                style={{ background: '#1ecf49', border: 'none' }}
                            >
                                Create Tenant
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>

            {/* Edit / Manage Tenant Modal */}
            <Modal
                title={`Manage Tenant: ${selectedTenant?.full_name || ''}`}
                open={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                footer={null}
                destroyOnClose
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    {
                        key: '1',
                        label: 'Details & Settings',
                        children: (
                            <Form
                                form={editForm}
                                layout="vertical"
                                onFinish={handleUpdateDetails}
                                initialValues={{
                                    full_name: selectedTenant?.full_name,
                                    email: selectedTenant?.email,
                                    phone_number: selectedTenant?.phone_number
                                }}
                            >
                                <Form.Item
                                    name="full_name"
                                    label="Full Name"
                                    rules={[{ required: true }]}
                                >
                                    <Input />
                                </Form.Item>

                                <Form.Item
                                    name="email"
                                    label="Email"
                                    rules={[{ required: true, type: 'email' }]}
                                >
                                    <Input />
                                </Form.Item>

                                <Form.Item
                                    name="phone_number"
                                    label="Phone Number"
                                >
                                    <Input />
                                </Form.Item>

                                <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                                    <Text strong style={{ display: 'block', marginBottom: 12 }}>Property Assignment</Text>

                                    <Form.Item label="Select Apartment" name="property_id">
                                        <Select
                                            placeholder="Choose an apartment"
                                            onChange={(val) => {
                                                setTargetPropertyId(val);
                                                editForm.setFieldsValue({ unit_id: null }); // Reset unit when property changes
                                            }}
                                        >
                                            {properties.map(p => (
                                                <Option key={p.id} value={p.id}>{p.name}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <Form.Item
                                        name="unit_id"
                                        label="Select Meter (Vacant)"
                                        help={selectedTenant?.assignment_status === 'active' ? "Changing this will move the tenant to the new unit." : "Select a unit to activate this tenant."}
                                    >
                                        <Select
                                            placeholder={targetPropertyId ? "Select a vacant meter" : "Select apartment first"}
                                            disabled={!targetPropertyId}
                                        >
                                            {/* Always show current unit if it exists, plus vacant ones */}
                                            {/* We need to intelligently merge vacant lists with the *current* unit if it matches property */}

                                            {(() => {
                                                const vacants = getVacantUnits(targetPropertyId);
                                                // If filtered property is the tenant's current property, include their current unit
                                                const currentUnitId = selectedTenant?.unit_id;
                                                const isCurrentProperty = properties.find(p => p.id === targetPropertyId)?.name === selectedTenant?.property_name;

                                                return (
                                                    <>
                                                        {isCurrentProperty && currentUnitId && (
                                                            <Option key={currentUnitId} value={currentUnitId} disabled>
                                                                {selectedTenant?.unit_number} (Current)
                                                            </Option>
                                                        )}
                                                        {vacants.map(u => (
                                                            <Option key={u.id} value={u.id}>
                                                                {u.meter_number} (Unit {u.label})
                                                            </Option>
                                                        ))}
                                                    </>
                                                );
                                            })()}
                                        </Select>
                                    </Form.Item>
                                </div>

                                <div style={{ borderTop: '1px solid #eee', marginTop: 20, paddingTop: 20 }}>
                                    <Text type="danger" strong style={{ display: 'block', marginBottom: 8 }}>Danger Zone</Text>
                                    <Popconfirm
                                        title="Terminate Tenancy?"
                                        description="This will remove the tenant from the unit and mark the assignment as ended. Detailed history will be preserved."
                                        onConfirm={handleTerminateTenant}
                                        okText="Yes, Terminate"
                                        cancelText="Cancel"
                                        okButtonProps={{ danger: true, loading: processing }}
                                    >
                                        <Button danger block loading={processing}>
                                            Terminate Tenancy
                                        </Button>
                                    </Popconfirm>
                                </div>

                                <div style={{ marginTop: 24, textAlign: 'right' }}>
                                    <Button onClick={() => setEditModalVisible(false)} style={{ marginRight: 8 }}>
                                        Close
                                    </Button>
                                    <Button type="primary" htmlType="submit" loading={processing}>
                                        Save Changes
                                    </Button>
                                </div>
                            </Form>
                        )
                    },
                    {
                        key: '2',
                        label: 'Report Issue',
                        children: (
                            <Form
                                form={reportForm}
                                layout="vertical"
                                onFinish={handleSubmitReport}
                            >
                                <Alert
                                    message="Report a meter or unit issue"
                                    description="This report will be sent to the administration/maintenance team."
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />

                                <Form.Item
                                    name="category"
                                    label="Category"
                                    initialValue="meter_lock"
                                >
                                    <Select>
                                        <Option value="meter_lock">Meter Fault / Lock</Option>
                                        <Option value="power_cut">Power Outage</Option>
                                        <Option value="meter_tamper">Suspected Tampering</Option>
                                        <Option value="other">Other</Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="description"
                                    label="Description"
                                    rules={[{ required: true, message: 'Please describe the issue' }]}
                                >
                                    <Input.TextArea rows={4} placeholder="Describe the problem in detail..." />
                                </Form.Item>

                                <div style={{ textAlign: 'right' }}>
                                    <Button type="primary" htmlType="submit" loading={processing}>
                                        Submit Report
                                    </Button>
                                </div>
                            </Form>
                        )
                    }
                ]} />
            </Modal>
        </MainLayout>
    );
};

export default LandlordTenants;
