import { useState, useEffect } from 'react';
import {
    Typography,
    Card,
    Row,
    Col,
    Statistic,
    Table,
    Tabs,
    Button,
    Tag,
    Space,
    Form,
    InputNumber,
    Select,
    message,
    List,
    Divider
} from 'antd';
import {
    DollarOutlined,
    SettingOutlined,
    HistoryOutlined,
    UserOutlined,
    GlobalOutlined,
    SaveOutlined,
    SyncOutlined
} from '@ant-design/icons';
import MainLayout from '../../components/Layout/MainLayout';
import { supabase } from '../../lib/supabase';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const CommissionEngine = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);

    // Data
    const [stats, setStats] = useState({ total_paid: 0, total_pending: 0 });
    const [commissions, setCommissions] = useState([]);
    const [settings, setSettings] = useState([]);
    const [agents, setAgents] = useState([]);

    // Forms
    const [globalForm] = Form.useForm();
    const [agentForm] = Form.useForm();

    useEffect(() => {
        fetchData();
        fetchAgents();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            console.log('Fetching Commission Data...');
            // 1. Fetch Commissions (without embedded joins to avoid schema cache issues)
            const { data: commsData, error: commsError } = await supabase
                .from('commissions')
                .select('*')
                .order('created_at', { ascending: false });

            if (commsError) throw commsError;
            
            // Fetch recipient details separately
            const recipientIds = [...new Set(commsData?.map(c => c.recipient_id) || [])];
            const { data: recipientsData } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', recipientIds);
            
            // Create a map for quick lookup
            const recipientsMap = {};
            recipientsData?.forEach(r => {
                recipientsMap[r.id] = r;
            });
            
            // Merge the data
            const enrichedCommissions = commsData?.map(c => ({
                ...c,
                recipient: recipientsMap[c.recipient_id] || null
            })) || [];
            
            setCommissions(enrichedCommissions);

            // Calculate Stats
            const totalPaid = enrichedCommissions
                .filter(c => c.status === 'PAID')
                .reduce((acc, curr) => acc + (curr.amount || 0), 0);

            const totalPending = enrichedCommissions
                .filter(c => c.status === 'PENDING')
                .reduce((acc, curr) => acc + (curr.amount || 0), 0);

            setStats({ total_paid: totalPaid, total_pending: totalPending });

            // 2. Fetch Settings
            const { data: settingsData, error: settingsError } = await supabase
                .from('commission_settings')
                .select('*');

            if (settingsError) throw settingsError;
            console.log('Commission Settings Fetched:', settingsData);
            setSettings(settingsData || []);

            // Set Global Form
            const globalSetting = settingsData?.find(s => s.entity_type === 'GLOBAL');
            if (globalSetting) {
                console.log('Found Global Setting:', globalSetting);
                globalForm.setFieldsValue({ percentage: globalSetting.percentage });
            } else {
                globalForm.setFieldsValue({ percentage: 0 });
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Failed to load commission data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAgents = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('role', 'agent');

        if (error) console.error('Error fetching agents:', error);
        console.log('Agents Fetched:', data);
        setAgents(data || []);
    };

    const handleSaveGlobal = async (values) => {
        try {
            // Updated to use standardized entity_id='GLOBAL' and upsert
            const { error } = await supabase
                .from('commission_settings')
                .upsert({
                    entity_type: 'GLOBAL',
                    entity_id: 'GLOBAL', 
                    percentage: values.percentage
                }, { onConflict: 'entity_type, entity_id' });

            if (error) throw error;
            
            message.success('Global commission updated');
            fetchData();
        } catch (err) {
            console.error(err);
            message.error('Failed to save settings: ' + err.message);
        }
    };

    const handleSaveAgent = async (values) => {
        try {
            // Upsert based on unique constraint (entity_type, entity_id)
            const { error } = await supabase
                .from('commission_settings')
                .upsert({
                    entity_type: 'AGENT',
                    entity_id: values.agent_id,
                    percentage: values.percentage,
                }, { onConflict: 'entity_type, entity_id' });

            if (error) throw error;

            message.success('Agent commission updated');
            agentForm.resetFields();
            fetchData();
        } catch (err) {
            console.error(err);
            message.error('Failed to save settings: ' + err.message);
        }
    };

    const columns = [
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (d) => new Date(d).toLocaleString()
        },
        {
            title: 'Agent',
            key: 'agent',
            render: (_, r) => r.recipient?.full_name || 'Unknown'
        },
        {
            title: 'Rate',
            dataIndex: 'percentage_applied',
            key: 'percentage',
            render: (p) => `${p}%`
        },
        {
            title: 'Commission',
            dataIndex: 'amount',
            key: 'amount',
            render: (a) => <Text strong style={{ color: '#1ecf49' }}>KES {a?.toFixed(2)}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s) => (
                <Tag color={s === 'PAID' ? 'green' : (s === 'PENDING' ? 'gold' : 'red')}>
                    {s}
                </Tag>
            )
        }
    ];

    return (
        <MainLayout>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2}>
                        <DollarOutlined /> Commission Engine
                    </Title>
                    <Text type="secondary">Manage agent commissions and payouts</Text>
                </div>
                <Button 
                    icon={<SyncOutlined />} 
                    onClick={() => { fetchData(); fetchAgents(); }}
                    loading={loading}
                >
                    Refresh Data
                </Button>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={12}>
                    <Card bordered={false} style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                        <Statistic
                            title="Total Paid Out"
                            value={stats.total_paid}
                            precision={2}
                            prefix="KES"
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card bordered={false} style={{ background: '#fffbe6', border: '1px solid #ffe58f' }}>
                        <Statistic
                            title="Total Pending"
                            value={stats.total_pending}
                            precision={2}
                            prefix="KES"
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card className="settings-card">
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    <TabPane tab={<span><HistoryOutlined /> Commission Log</span>} key="overview">
                        <Table
                            columns={columns}
                            dataSource={commissions}
                            rowKey="id"
                            loading={loading}
                        />
                    </TabPane>

                    <TabPane tab={<span><SettingOutlined /> Rules & Settings</span>} key="settings">
                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Card title={<><GlobalOutlined /> Global Settings</>} type="inner">
                                    <Form
                                        form={globalForm}
                                        layout="vertical"
                                        onFinish={handleSaveGlobal}
                                    >
                                        <Form.Item
                                            name="percentage"
                                            label="Default Commission Percentage"
                                            rules={[{ required: true, message: 'Required' }]}
                                            extra="Applied to all agents unless overridden."
                                        >
                                            <InputNumber
                                                min={0}
                                                max={100}
                                                addonAfter="%"
                                                style={{ width: '100%' }}
                                            />
                                        </Form.Item>
                                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                                            Save Global Rule
                                        </Button>
                                    </Form>
                                </Card>
                            </Col>
                            <Col xs={24} md={12}>
                                <Card title={<><UserOutlined /> Agent Specific Overrides</>} type="inner">
                                    <Form
                                        form={agentForm}
                                        layout="vertical"
                                        onFinish={handleSaveAgent}
                                    >
                                        <Form.Item
                                            name="agent_id"
                                            label="Select Agent"
                                            rules={[{ required: true }]}
                                        >
                                            <Select placeholder="Choose Agent">
                                                {agents.map(a => (
                                                    <Select.Option key={a.id} value={a.id}>{a.full_name}</Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                        <Form.Item
                                            name="percentage"
                                            label="Commission Percentage"
                                            rules={[{ required: true }]}
                                        >
                                            <InputNumber
                                                min={0}
                                                max={100}
                                                addonAfter="%"
                                                style={{ width: '100%' }}
                                            />
                                        </Form.Item>
                                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                                            Set Agent Rule
                                        </Button>
                                    </Form>

                                    <Divider />
                                    <Text strong>Active Overrides</Text>
                                    <List
                                        size="small"
                                        dataSource={settings.filter(s => s.entity_type === 'AGENT')}
                                        renderItem={item => {
                                            const agent = agents.find(a => a.id === item.entity_id);
                                            return (
                                                <List.Item>
                                                    <Text>{agent?.full_name || 'Unknown Agent'}</Text>
                                                    <Tag color="purple" style={{ marginLeft: 8 }}>{item.percentage}%</Tag>
                                                </List.Item>
                                            );
                                        }}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </TabPane>
                </Tabs>
            </Card>
        </MainLayout>
    );
};

export default CommissionEngine;
