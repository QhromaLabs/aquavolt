import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, Table, Tag, Spin, message } from 'antd';
import { HomeOutlined, TeamOutlined, RiseOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const { Title } = Typography;

const AgentDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState([]);
    const [stats, setStats] = useState({
        totalProperties: 0,
        totalUnits: 0,
        occupiedUnits: 0
    });

    useEffect(() => {
        if (user) {
            fetchAgentData();
        }
    }, [user]);

    const fetchAgentData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Properties assigned to this agent
            const { data: props, error: propsError } = await supabase
                .from('properties')
                .select(`
                    *,
                    units:units(count),
                    active_units:units(count)
                `)
                .eq('agent_id', user.id);
            // Note: Filtering active_units requires a complex query or post-filtering 
            // because Supabase count on filtered foreign tables is tricky in one go.
            // Let's do simple fetch first.

            if (propsError) throw propsError;

            // Fetch actual unit details for stats calculation
            const propIds = props.map(p => p.id);
            let units = [];

            if (propIds.length > 0) {
                const { data: uData, error: uError } = await supabase
                    .from('units')
                    .select('id, status, property_id')
                    .in('property_id', propIds);

                if (uError) throw uError;
                units = uData || [];
            }

            // Calculate Stats
            const totalProps = props.length;
            const totalUnits = units.length;
            const occupied = units.filter(u => u.status === 'occupied').length;

            setProperties(props.map(p => ({
                ...p,
                unit_count: units.filter(u => u.property_id === p.id).length,
                occupancy: units.filter(u => u.property_id === p.id && u.status === 'occupied').length
            })));

            setStats({
                totalProperties: totalProps,
                totalUnits: totalUnits,
                occupiedUnits: occupied
            });

        } catch (error) {
            console.error('Error fetching agent data:', error);
            message.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Property Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
        },
        {
            title: 'Units Managed',
            dataIndex: 'unit_count',
            key: 'unit_count',
        },
        {
            title: 'Occupancy',
            key: 'occupancy',
            render: (_, record) => (
                <span>{record.occupancy} / {record.unit_count}</span>
            )
        },
        {
            title: 'Status',
            key: 'status',
            render: () => <Tag color="green">Active</Tag>
        }
    ];

    return (
        <MainLayout>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>Agent Dashboard</Title>
                <Typography.Text type="secondary">Welcome back, {user?.email}</Typography.Text>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 50 }}>
                    <Spin size="large" />
                </div>
            ) : (
                <>
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} sm={8}>
                            <Card>
                                <Statistic
                                    title="Managed Properties"
                                    value={stats.totalProperties}
                                    prefix={<HomeOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card>
                                <Statistic
                                    title="Total Units"
                                    value={stats.totalUnits}
                                    prefix={<TeamOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card>
                                <Statistic
                                    title="Occupancy Rate"
                                    value={stats.totalUnits ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) : 0}
                                    suffix="%"
                                    prefix={<RiseOutlined />}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Card title="My Properties">
                        <Table
                            dataSource={properties}
                            columns={columns}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                        />
                    </Card>
                </>
            )}
        </MainLayout>
    );
};

export default AgentDashboard;
