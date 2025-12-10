import React, { useState, useEffect } from 'react';
import { Typography, Table, Tag, Button, Space, message, Select, Popconfirm } from 'antd';
import { CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const { Title } = Typography;
const { Option } = Select;

const CaretakerIssues = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [issues, setIssues] = useState([]);
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        if (user) {
            fetchIssues();
        }
    }, [user]);

    const fetchIssues = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
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
            setIssues(data || []);
        } catch (error) {
            console.error('Error fetching issues:', error);
            message.error('Failed to load issues');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (issueId, newStatus) => {
        try {
            setUpdating(issueId);
            const { error } = await supabase
                .from('issues')
                .update({
                    status: newStatus,
                    updated_at: new Date()
                })
                .eq('id', issueId);

            if (error) throw error;

            message.success(`Status updated to ${newStatus}`);
            fetchIssues(); // Refresh list
        } catch (error) {
            console.error('Error updating status:', error);
            message.error('Failed to update status');
        } finally {
            setUpdating(null);
        }
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleDateString(),
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at)
        },
        {
            title: 'Meter / Unit',
            key: 'unit',
            render: (_, record) => record.unit?.meter_number || 'N/A'
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (text) => <Tag>{text?.replace('_', ' ').toUpperCase()}</Tag>,
            filters: [
                { text: 'Meter Fault', value: 'meter_fault' },
                { text: 'Power Outage', value: 'power_outage' },
                { text: 'Tampering', value: 'tampering' },
                { text: 'Other', value: 'other' }
            ],
            onFilter: (value, record) => record.category === value
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: '30%',
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
            },
            filters: [
                { text: 'Pending', value: 'pending' },
                { text: 'In Progress', value: 'in_progress' },
                { text: 'Resolved', value: 'resolved' }
            ],
            onFilter: (value, record) => record.status === value
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    {record.status === 'pending' && (
                        <Button
                            type="primary"
                            size="small"
                            onClick={() => handleStatusUpdate(record.id, 'in_progress')}
                            loading={updating === record.id}
                        >
                            Start Work
                        </Button>
                    )}
                    {record.status === 'in_progress' && (
                        <Popconfirm
                            title="Mark as Resolved?"
                            onConfirm={() => handleStatusUpdate(record.id, 'resolved')}
                        >
                            <Button
                                type="primary"
                                ghost
                                size="small"
                                icon={<CheckCircleOutlined />}
                                loading={updating === record.id}
                                style={{ borderColor: 'green', color: 'green' }}
                            >
                                Resolve
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    return (
        <MainLayout>
            <Title level={2}>My Assigned Issues</Title>
            <Table
                dataSource={issues}
                columns={columns}
                rowKey="id"
                loading={loading}
            />
        </MainLayout>
    );
};

export default CaretakerIssues;
