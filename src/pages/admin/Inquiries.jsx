import { useState, useEffect } from 'react';
import { Table, Tag, Typography, message, Card, Space } from 'antd';
import { MailOutlined, PhoneOutlined, HomeOutlined, EnvironmentOutlined } from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { supabase } from '../../lib/supabase';

const { Title } = Typography;

const Inquiries = () => {
    const [loading, setLoading] = useState(true);
    const [inquiries, setInquiries] = useState([]);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('landlord_inquiries')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInquiries(data || []);
        } catch (error) {
            console.error('Error fetching inquiries:', error);
            message.error('Failed to load inquiries');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text) => new Date(text).toLocaleDateString(),
            width: 120,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>,
        },
        {
            title: 'Contact Info',
            key: 'contact',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PhoneOutlined style={{ color: '#1ecf49' }} /> {record.phone}
                    </div>
                </Space>
            ),
        },
        {
            title: 'Property Details',
            key: 'property',
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <EnvironmentOutlined /> {record.location}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85em', color: '#666' }}>
                        <HomeOutlined /> {record.units} Units / {record.submeters} Submeters
                    </div>
                </Space>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'pending' ? 'orange' : 'green'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
    ];

    return (
        <MainLayout>
            <div style={{ marginBottom: 24 }}>
                <Title level={2}>Landlord Inquiries</Title>
                <Typography.Text type="secondary">
                    Leads from landlords interested in the AquaVolt platform.
                </Typography.Text>
            </div>

            <Card styles={{ body: { padding: 0 } }} >
                <Table
                    columns={columns}
                    dataSource={inquiries}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </MainLayout>
    );
};

export default Inquiries;
