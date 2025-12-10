import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
    Typography,
    Table,
    Tag,
    Space,
    Button,
    Modal,
    Form,
    Input,
    Select,
    message,
    Card,
    Alert,
    Divider
} from 'antd';
import {
    UserOutlined,
    EditOutlined,
    SearchOutlined,
    ReloadOutlined,
    PlusOutlined
} from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { supabase } from '../../lib/supabase';
import UserDetailModal from '../../components/Modals/UserDetailModal';

// Temp client for creation (prevents admin logout)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const { Title, Text } = Typography;
const { Option } = Select;

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Edit State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm] = Form.useForm();

    // Create State
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [createForm] = Form.useForm();
    const [creating, setCreating] = useState(false);

    // Assignment Data
    const [properties, setProperties] = useState([]);
    const [units, setUnits] = useState([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);

    const [searchText, setSearchText] = useState('');

    // Detail Modal
    const [detailUser, setDetailUser] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch profiles
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);

            // Fetch Properties (for Landlord assignment & Unit filtering)
            const { data: propsData } = await supabase.from('properties').select('id, name, landlord_id');
            setProperties(propsData || []);

            // Fetch Units (for Tenant assignment)
            // Fetch ALL units so we can also show occupied ones if needed, or just filter in UI
            const { data: unitsData } = await supabase.from('units').select('id, label, property_id, status');
            setUnits(unitsData || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            message.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (user) => {
        // Create a copy to avoid mutating the original record
        const userToEdit = { ...user };
        
        // Basic Fields
        const initialValues = {
            full_name: userToEdit.full_name,
            phone_number: userToEdit.phone_number,
            role: userToEdit.role
        };

        if (userToEdit.role === 'tenant') {
            // Fetch active assignment
            const { data } = await supabase
                .from('unit_assignments')
                .select('unit_id, units(property_id)')
                .eq('tenant_id', userToEdit.id)
                .eq('status', 'active')
                .maybeSingle();
            
            if (data) {
                initialValues.unit_id = data.unit_id;
                initialValues.property_id = data.units?.property_id;
                setSelectedPropertyId(data.units?.property_id);
                // Store current unit to track changes
                userToEdit.current_unit_id = data.unit_id;
            } else {
                setSelectedPropertyId(null);
                userToEdit.current_unit_id = null;
            }
        } else if (userToEdit.role === 'landlord') {
            // Fetch owned properties
            const { data } = await supabase
                .from('properties')
                .select('id')
                .eq('landlord_id', userToEdit.id);
            
            if (data) {
                initialValues.property_ids = data.map(p => p.id);
            }
        }

        // Now set state with the fully populated object
        setEditingUser(userToEdit);
        editForm.setFieldsValue(initialValues);
        setEditModalVisible(true);
    };

    const handleCreate = async (values) => {
        setCreating(true);
        try {
            // 1. Create Auth User
            const tempClient = createClient(supabaseUrl, supabaseKey, {
                auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
            });

            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    data: {
                        full_name: values.full_name,
                        role: values.role
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('User creation failed');

            const userId = authData.user.id;

            // 2. Insert Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: values.email,
                    full_name: values.full_name,
                    phone_number: values.phone_number,
                    role: values.role,
                    updated_at: new Date()
                });

            if (profileError) console.warn('Profile upsert failed:', profileError);

            // 3. Handle Assignments
            if (values.role === 'tenant' && values.unit_id) {
                // Assign to Unit
                const { error: assignError } = await supabase
                    .from('unit_assignments')
                    .insert({
                        tenant_id: userId,
                        unit_id: values.unit_id,
                        status: 'active',
                        start_date: new Date()
                    });
                
                if (assignError) message.error('User created but unit assignment failed.');
                
                // Update unit status to occupied
                await supabase.from('units').update({ status: 'occupied' }).eq('id', values.unit_id);
            }

            if (values.role === 'landlord' && values.property_ids?.length > 0) {
                // Assign Properties to this Landlord
                const { error: propError } = await supabase
                    .from('properties')
                    .update({ landlord_id: userId })
                    .in('id', values.property_ids);

                if (propError) message.error('User created but property assignment failed.');
            }

            message.success('User created successfully!');
            setCreateModalVisible(false);
            createForm.resetFields();
            fetchUsers();
            // Reset local assignment state
            setSelectedPropertyId(null);

        } catch (error) {
            console.error('Error creating user:', error);
            message.error('Failed to create user: ' + error.message);
        } finally {
            setCreating(false);
        }
    };

    const handleUpdate = async (values) => {
        try {
            // 1. Update Profile
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: values.full_name,
                    phone_number: values.phone_number,
                    role: values.role,
                    updated_at: new Date()
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            // 2. Handle Tenant Assignment Change
            if (values.role === 'tenant' && values.unit_id) {
                // If unit changed (or new assignment)
                if (editingUser.current_unit_id !== values.unit_id) {
                    // Vacate old unit if exists
                    if (editingUser.current_unit_id) {
                        await supabase.from('unit_assignments')
                            .update({ status: 'moved_out', end_date: new Date() })
                            .eq('unit_id', editingUser.current_unit_id)
                            .eq('tenant_id', editingUser.id)
                            .eq('status', 'active');

                        await supabase.from('units').update({ status: 'vacant' }).eq('id', editingUser.current_unit_id);
                    }

                    // Assign new unit
                    await supabase.from('unit_assignments').insert({
                        tenant_id: editingUser.id,
                        unit_id: values.unit_id,
                        status: 'active',
                        start_date: new Date()
                    });

                    await supabase.from('units').update({ status: 'occupied' }).eq('id', values.unit_id);
                }
            }

            // 3. Handle Landlord Property Changes
            if (values.role === 'landlord') {
                // Fetch current holdings to diff
                const { data: currentProps } = await supabase.from('properties').select('id').eq('landlord_id', editingUser.id);
                const currentIds = currentProps?.map(p => p.id) || [];
                const newIds = values.property_ids || [];

                const toAdd = newIds.filter(id => !currentIds.includes(id));
                const toRemove = currentIds.filter(id => !newIds.includes(id));

                if (toAdd.length > 0) {
                    await supabase.from('properties').update({ landlord_id: editingUser.id }).in('id', toAdd);
                }
                if (toRemove.length > 0) {
                    await supabase.from('properties').update({ landlord_id: null }).in('id', toRemove);
                }
            }

            message.success('User updated successfully');
            setEditModalVisible(false);
            fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            message.error('Failed to update user');
        }
    };

    const handleView = (user) => {
        setDetailUser(user);
        setDetailModalVisible(true);
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'red';
            case 'landlord': return 'gold';
            case 'agent': return 'purple';
            case 'caretaker': return 'cyan';
            case 'tenant': return 'green';
            default: return 'default';
        }
    };

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.phone_number?.includes(searchText)
    );

    const columns = [
        {
            title: 'User',
            key: 'user',
            render: (_, record) => (
                <Space>
                    <UserOutlined />
                    <div>
                        <Text strong>{record.full_name || 'Unnamed User'}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color={getRoleColor(role)}>
                    {role?.toUpperCase()}
                </Tag>
            ),
            filters: [
                { text: 'Admin', value: 'admin' },
                { text: 'Landlord', value: 'landlord' },
                { text: 'Agent', value: 'agent' },
                { text: 'Tenant', value: 'tenant' },
            ],
            onFilter: (value, record) => record.role === value,
        },
        {
            title: 'Phone',
            dataIndex: 'phone_number',
            key: 'phone',
            render: (phone) => phone || <Text type="secondary">-</Text>,
        },
        {
            title: 'Joined',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        onClick={() => handleView(record)}
                    >
                        View
                    </Button>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <MainLayout>
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Title level={2}>User Management</Title>
                        <Text type="secondary">Manage system users and roles</Text>
                    </div>
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchUsers}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                createForm.resetFields();
                                setCreateModalVisible(true);
                            }}
                            style={{ background: '#1ecf49' }}
                        >
                            Add New User
                        </Button>
                    </Space>
                </div>
                <div style={{ marginTop: 16 }}>
                    <Input
                        prefix={<SearchOutlined />}
                        placeholder="Search users..."
                        style={{ maxWidth: 300 }}
                        onChange={e => setSearchText(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={filteredUsers}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <UserDetailModal
                user={detailUser}
                visible={detailModalVisible}
                onClose={() => setDetailModalVisible(false)}
            />

            {/* Edit User Modal */}
            <Modal
                title="Edit User"
                open={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                footer={null}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={handleUpdate}
                >
                    <Form.Item
                        name="full_name"
                        label="Full Name"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="phone_number"
                        label="Phone Number"
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true }]}
                    >
                        <Select onChange={(val) => {
                            if (val !== 'tenant') {
                                setSelectedPropertyId(null);
                            }
                        }}>
                            <Option value="admin">Admin</Option>
                            <Option value="landlord">Landlord</Option>
                            <Option value="agent">Agent</Option>
                            <Option value="caretaker">Caretaker</Option>
                            <Option value="tenant">Tenant</Option>
                        </Select>
                    </Form.Item>

                    {/* Assignment Fields for Edit */}
                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, current) => prev.role !== current.role}
                    >
                        {({ getFieldValue }) => {
                            const role = getFieldValue('role');
                            if (role === 'tenant') {
                                return (
                                    <>
                                        <Divider style={{margin: '12px 0'}} orientation="left">Assignment</Divider>
                                        <Form.Item name="property_id" label="Property" style={{ marginBottom: 8 }}>
                                            <Select
                                                placeholder="Select Property"
                                                onChange={setSelectedPropertyId}
                                                allowClear
                                            >
                                                {properties.map(p => (
                                                    <Option key={p.id} value={p.id}>{p.name}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                        <Form.Item name="unit_id" label="Unit">
                                            <Select placeholder="Select unit" disabled={!selectedPropertyId}>
                                                {units
                                                    .filter(u => u.property_id === selectedPropertyId)
                                                    .map(u => (
                                                        <Option key={u.id} value={u.id}>
                                                            {u.label} {u.status === 'occupied' && u.id !== editingUser?.current_unit_id ? '(Occupied)' : '(Vacant)'}
                                                        </Option>
                                                    ))
                                                }
                                            </Select>
                                        </Form.Item>
                                    </>
                                );
                            }
                             if (role === 'landlord') {
                                return (
                                    <Form.Item
                                        name="property_ids"
                                        label="Managed Properties"
                                    >
                                        <Select mode="multiple" placeholder="Select properties">
                                            {properties.map(p => (
                                                <Option key={p.id} value={p.id}>
                                                    {p.name} {p.landlord_id && p.landlord_id !== editingUser?.id ? '(Has Owner)' : ''}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                );
                            }
                            return null;
                        }}
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setEditModalVisible(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" style={{ background: '#1ecf49' }}>
                                Save Changes
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Create User Modal */}
            <Modal
                title="Add New User"
                open={createModalVisible}
                onCancel={() => setCreateModalVisible(false)}
                footer={null}
            >
                <Alert
                    message="Creates a new login and profile."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    closable
                />
                <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={handleCreate}
                    initialValues={{ role: 'tenant' }}
                >
                    <Form.Item
                        name="full_name"
                        label="Full Name"
                        rules={[{ required: true, message: 'Name is required' }]}
                    >
                        <Input placeholder="John Doe" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[
                            { required: true, message: 'Email is required' },
                            { type: 'email', message: 'Enter a valid email' }
                        ]}
                    >
                        <Input placeholder="user@aquavolt.com" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Temporary Password"
                        rules={[{ required: true, message: 'Password is required' }]}
                    >
                        <Input.Password placeholder="Min 6 characters" />
                    </Form.Item>

                    <Form.Item
                        name="phone_number"
                        label="Phone Number"
                    >
                        <Input placeholder="2547..." />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true, message: 'Select a role' }]}
                    >
                        <Select onChange={() => setSelectedPropertyId(null)}>
                            <Option value="admin">Admin</Option>
                            <Option value="landlord">Landlord</Option>
                            <Option value="agent">Agent</Option>
                            <Option value="caretaker">Caretaker</Option>
                            <Option value="tenant">Tenant</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, current) => prev.role !== current.role}
                    >
                        {({ getFieldValue }) => {
                            const role = getFieldValue('role');
                            if (role === 'tenant') {
                                return (
                                    <>
                                        <Divider style={{margin: '12px 0'}} orientation="left">Assignment</Divider>
                                        <Form.Item label="Property" style={{ marginBottom: 8 }}>
                                            <Select
                                                placeholder="Select Property first"
                                                onChange={setSelectedPropertyId}
                                                allowClear
                                            >
                                                {properties.map(p => (
                                                    <Option key={p.id} value={p.id}>{p.name}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                        <Form.Item name="unit_id" label="Unit">
                                            <Select placeholder="Select a vacant unit" disabled={!selectedPropertyId}>
                                                {units
                                                    .filter(u => u.property_id === selectedPropertyId && u.status === 'vacant')
                                                    .map(u => (
                                                        <Option key={u.id} value={u.id}>{u.label}</Option>
                                                    ))
                                                }
                                            </Select>
                                        </Form.Item>
                                    </>
                                );
                            }
                            if (role === 'landlord') {
                                return (
                                    <Form.Item
                                        name="property_ids"
                                        label="Assign Properties (Optional)"
                                        help="Select properties to transfer to this landlord."
                                    >
                                        <Select mode="multiple" placeholder="Select properties">
                                            {properties.map(p => (
                                                <Option key={p.id} value={p.id}>
                                                    {p.name} {p.landlord_id ? '(Has Owner)' : '(No Owner)'}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                );
                            }
                            return null;
                        }}
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setCreateModalVisible(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={creating} style={{ background: '#1ecf49' }}>
                                Create User
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </MainLayout>
    );
};

export default UserManagement;
