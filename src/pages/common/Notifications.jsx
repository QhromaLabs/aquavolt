import { useState, useEffect } from 'react';
import { List, Typography, Button, Empty, Skeleton, Tag, Space, Card, Badge } from 'antd';
import {
    BellOutlined,
    CheckOutlined,
    ReloadOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    WarningOutlined
} from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const Notifications = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [markingRead, setMarkingRead] = useState(null);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    const markAsRead = async (id) => {
        setMarkingRead(id);
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        } finally {
            setMarkingRead(null);
        }
    };

    const markAllRead = async () => {
        setMarkingRead('all');
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        } finally {
            setMarkingRead(null);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />;
            case 'error': return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />;
            case 'warning': return <WarningOutlined style={{ color: '#faad14', fontSize: '20px' }} />;
            default: return <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '20px' }} />;
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Button
                        icon={<BellOutlined />}
                        shape="circle"
                        size="large"
                        style={{ border: 'none', background: '#f0f2f5' }}
                    />
                    <div>
                        <Title level={3} style={{ margin: 0 }}>Notifications</Title>
                        <Text type="secondary">
                            You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                        </Text>
                    </div>
                </div>
                <Space>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchNotifications}
                        loading={loading}
                        shape="circle"
                    />
                    {unreadCount > 0 && (
                        <Button
                            type="link"
                            onClick={markAllRead}
                            loading={markingRead === 'all'}
                        >
                            Mark all read
                        </Button>
                    )}
                </Space>
            </div>

            {/* List */}
            {loading && notifications.length === 0 ? (
                <Skeleton active avatar paragraph={{ rows: 3 }} />
            ) : notifications.length > 0 ? (
                <List
                    itemLayout="horizontal"
                    dataSource={notifications}
                    renderItem={(item) => (
                        <Card
                            hoverable
                            style={{
                                marginBottom: '16px',
                                borderRadius: '16px',
                                background: item.is_read ? '#ffffff' : '#f0f9ff',
                                border: item.is_read ? '1px solid #f0f0f0' : '1px solid #1890ff40',
                                transition: 'all 0.3s ease'
                            }}
                            bodyStyle={{ padding: '16px' }}
                            onClick={() => !item.is_read && markAsRead(item.id)}
                        >
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ paddingTop: '4px' }}>
                                    {getIcon(item.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <Text strong style={{ fontSize: '16px' }}>{item.title}</Text>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {new Date(item.created_at).toLocaleString()}
                                        </Text>
                                    </div>
                                    <Paragraph
                                        style={{
                                            margin: 0,
                                            color: item.is_read ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.85)'
                                        }}
                                        ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}
                                    >
                                        {item.message}
                                    </Paragraph>
                                    {!item.is_read && (
                                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                                            <Tag color="blue" icon={<CheckOutlined />}>New</Tag>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}
                />
            ) : (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No notifications yet"
                />
            )}
        </div>
    );
};

export default Notifications;
