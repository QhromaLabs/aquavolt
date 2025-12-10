import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Statistic, Table, Tag, Spin, message, Button } from 'antd';
import { WarningOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const CaretakerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pending: 0,
        inProgress: 0,
        resolved: 0
    });
    const [recentIssues, setRecentIssues] = useState([]);

    useEffect(() => {
        if (user) {
            fetchCaretakerData();
        }
    }, [user]);

    const fetchCaretakerData = async () => {
        try {
            setLoading(true);

            // Fetch issues assigned to this caretaker
            const { data: issues, error } = await supabase
                .from('issues')
                .select(`
                    id,
                    description,
                    category,
                    status,
                    created_at,
                    unit:units(meter_number)
                `)
                .eq('caretaker_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const allIssues = issues || [];

            setStats({
                pending: allIssues.filter(i => i.status === 'pending').length,
                inProgress: allIssues.filter(i => i.status === 'in_progress').length,
                resolved: allIssues.filter(i => i.status === 'resolved').length
            });

            setRecentIssues(allIssues.slice(0, 5)); // Show top 5

        } catch (error) {
            console.error('Error fetching caretaker data:', error);
            message.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (text) => <Tag>{text?.replace('_', ' ').toUpperCase()}</Tag>
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Meter / Unit',
            key: 'unit',
            render: (_, record) => record.unit?.meter_number || 'N/A'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'default';
                if (status === 'pending') color = 'red';
                if (status === 'in_progress') color = 'orange';
                if (status === 'resolved') color = 'green';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            }
        }
    ];

    return (
        <MainLayout>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2}>Caretaker Dashboard</Title>
                    <Typography.Text type="secondary">Overview of assigned tasks</Typography.Text>
                </div>
                <Button type="primary" onClick={() => navigate('/caretaker/issues')}>
                    View All Issues
                </Button>
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
                                    title="Pending Issues"
                                    value={stats.pending}
                                    prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                                    valueStyle={{ color: '#ff4d4f' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card>
                                <Statistic
                                    title="In Progress"
                                    value={stats.inProgress}
                                    prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                                    valueStyle={{ color: '#faad14' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card>
                                <Statistic
                                    title="Resolved"
                                    value={stats.resolved}
                                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Card title="Recent Issues">
                        <Table
                            dataSource={recentIssues}
                            columns={columns}
                            rowKey="id"
                            pagination={false}
                        />
                    </Card>
                </>
            )}
        </MainLayout>
    );
};

export default CaretakerDashboard;
