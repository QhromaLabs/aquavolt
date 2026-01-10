import { Modal, Descriptions, Table, Tag, Typography, Button, Space, Card, Divider, Popconfirm, message } from 'antd';
import { HomeOutlined, ThunderboltOutlined, UserOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const { Title, Text } = Typography;

const UserDetailModal = ({ user, visible, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState(null);

    useEffect(() => {
        if (user && visible) {
            fetchDetails();
        } else {
            setDetails(null);
        }
    }, [user, visible]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            if (user.role === 'tenant') {
                // 1. Fetch Tenant's assignments directly
                const { data: assignments, error: assignError } = await supabase
                    .from('unit_assignments')
                    .select(`
                        id,
                        unit_id,
                        units (
                            id, label, meter_number,
                            property_id,
                            properties (name, landlord_id, location)
                        )
                    `)
                    .eq('tenant_id', user.id)
                    .eq('status', 'active');

                if (assignError) throw assignError;

                // Enrich with landlord names
                const unitsWithDetails = [];
                if (assignments) {
                    for (const a of assignments) {
                        if (!a.units) continue;
                        let landlordName = '-';
                        if (a.units.properties?.landlord_id) {
                            const { data: ld } = await supabase.from('profiles').select('full_name').eq('id', a.units.properties.landlord_id).single();
                            if (ld) landlordName = ld.full_name;
                        }
                        unitsWithDetails.push({
                            ...a.units,
                            property: a.units.properties,
                            landlordName,
                            assignmentId: a.id
                        });
                    }
                }

                const { data: topupsData, error: topError } = await supabase
                    .from('topups')
                    .select('*')
                    .eq('tenant_id', user.id)
                    .order('created_at', { ascending: false });

                if (topError) throw topError;

                setDetails({ type: 'tenant', units: unitsWithDetails, topups: topupsData || [] });

            } else if (user.role === 'landlord') {
                // 1. Fetch Properties
                const { data: propsData, error: propsError } = await supabase
                    .from('properties')
                    .select('id, name, location')
                    .eq('landlord_id', user.id);

                if (propsError) throw propsError;

                // 2. Fetch Units for these properties
                let allUnits = [];
                if (propsData && propsData.length > 0) {
                    const propIds = propsData.map(p => p.id);
                    const { data: unitsData } = await supabase
                        .from('units')
                        .select('id, label, meter_number, property_id, status')
                        .in('property_id', propIds);
                    allUnits = unitsData || [];
                }

                // Attach unit counts to properties
                const propsWithCounts = propsData.map(p => {
                    const pUnits = allUnits.filter(u => u.property_id === p.id);
                    return {
                        ...p,
                        unitsCount: pUnits.length,
                        occupiedCount: pUnits.filter(u => u.status === 'occupied').length
                    };
                });

                // 3. Fetch Topups for these units
                let relatedTopups = [];
                if (allUnits.length > 0) {
                    const unitIds = allUnits.map(u => u.id);
                    const { data: topupsData } = await supabase
                        .from('topups')
                        .select('id, amount_paid, created_at, unit_id, token')
                        .in('unit_id', unitIds)
                        .order('created_at', { ascending: false })
                        .limit(50);

                    // Enrich topups with unit label
                    relatedTopups = (topupsData || []).map(t => ({
                        ...t,
                        unitLabel: allUnits.find(u => u.id === t.unit_id)?.label
                    }));
                }

                setDetails({
                    type: 'landlord',
                    properties: propsWithCounts,
                    topups: relatedTopups
                });
            }
        } catch (err) {
            console.error('Error fetching user details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveUnit = async (assignmentId, unitId) => {
        try {
            // 1. Terminate Assignment
            const { error: assignError } = await supabase
                .from('unit_assignments')
                .update({ status: 'terminated', end_date: new Date() })
                .eq('id', assignmentId);

            if (assignError) throw assignError;

            // 2. Free up the unit
            const { error: unitError } = await supabase
                .from('units')
                .update({ status: 'vacant' })
                .eq('id', unitId);

            if (unitError) throw unitError;

            message.success('Unit removed successfully');
            fetchDetails(); // Refresh list
        } catch (error) {
            console.error('Error removing unit:', error);
            message.error('Failed to remove unit');
        }
    };

    const formatToken = (token) => {
        if (!token) return '-';
        const clean = token.toString().replace(/\D/g, '');
        return clean.match(/.{1,4}/g)?.join('-') || token;
    };

    if (!user) return null;

    return (
        <Modal
            title={<Space><UserOutlined /> {user.full_name} <Tag>{user.role.toUpperCase()}</Tag></Space>}
            open={visible}
            onCancel={onClose}
            width={800}
            footer={[<Button key="close" onClick={onClose}>Close</Button>]}
        >
            <Descriptions title="Personal Info" bordered size="small">
                <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                <Descriptions.Item label="Phone">{user.phone_number || '-'}</Descriptions.Item>
                <Descriptions.Item label="Joined">{new Date(user.created_at).toLocaleDateString()}</Descriptions.Item>
            </Descriptions>

            <Divider />

            {details?.type === 'tenant' && (
                <>
                    <Title level={5}>Assigned Units</Title>
                    <Table
                        dataSource={details.units}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        columns={[
                            { title: 'Property', render: (_, r) => r.property?.name },
                            { title: 'Landlord', render: (_, r) => r.landlordName },
                            { title: 'Unit', dataIndex: 'label' },
                            { title: 'Meter', dataIndex: 'meter_number' },
                            {
                                title: 'Action',
                                key: 'action',
                                render: (_, r) => (
                                    <Popconfirm
                                        title="Disconnect Unit"
                                        description="Are you sure you want to disconnect this unit?"
                                        onConfirm={() => handleRemoveUnit(r.assignmentId, r.id)}
                                        okText="Yes"
                                        cancelText="No"
                                    >
                                        <Button danger size="small">Remove</Button>
                                    </Popconfirm>
                                )
                            }
                        ]}
                    />

                    <Divider />
                    <Title level={5}>Token History</Title>
                    <Table
                        dataSource={details.topups}
                        rowKey="id"
                        size="small"
                        pagination={{ pageSize: 5 }}
                        columns={[
                            { title: 'Date', dataIndex: 'created_at', render: d => new Date(d).toLocaleDateString() },
                            { title: 'Amount', dataIndex: 'amount_paid', render: a => `KES ${a}` },
                            { title: 'Token', dataIndex: 'token', render: t => <Text code copyable>{formatToken(t)}</Text> },
                        ]}
                    />
                </>
            )}

            {details?.type === 'landlord' && (
                <>
                    <Title level={5}>Properties & Units</Title>
                    <Table
                        dataSource={details.properties}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        columns={[
                            { title: 'Name', dataIndex: 'name' },
                            { title: 'Location', dataIndex: 'location' },
                            { title: 'Total Units', dataIndex: 'unitsCount' },
                            { title: 'Occupied', dataIndex: 'occupiedCount' }
                        ]}
                    />

                    <Divider />
                    <Title level={5}>Recent Revenue (Top-ups)</Title>
                    <Table
                        dataSource={details.topups}
                        rowKey="id"
                        size="small"
                        pagination={{ pageSize: 5 }}
                        columns={[
                            { title: 'Date', dataIndex: 'created_at', render: d => new Date(d).toLocaleDateString() },
                            { title: 'Unit', dataIndex: 'unitLabel' },
                            { title: 'Amount', dataIndex: 'amount_paid', render: a => `KES ${a}` },
                            { title: 'Token', dataIndex: 'token', render: t => <Text code copyable>{formatToken(t)}</Text> },
                        ]}
                    />
                </>
            )}
        </Modal>
    );
};

export default UserDetailModal;
