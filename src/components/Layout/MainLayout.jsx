import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Button } from 'antd';
import {
    DashboardOutlined,
    HomeOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    BulbOutlined,
    DollarOutlined,
    TeamOutlined,
    ToolOutlined,
    FileTextOutlined,
    ThunderboltOutlined,
    ApiOutlined,
    RiseOutlined,
    GlobalOutlined,
    BankOutlined,
    AndroidOutlined
} from '@ant-design/icons';


import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut, profile } = useAuth();
    const { role, isAdmin, isLandlord, isCaretaker, isTenant, isAgent } = useRole();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const userMenu = {
        items: [
            {
                key: 'profile',
                icon: <UserOutlined />,
                label: 'Profile',
            },
            {
                key: 'settings',
                icon: <SettingOutlined />,
                label: 'Settings',
            },
            {
                type: 'divider',
            },
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Logout',
                onClick: handleLogout,
            },
        ],
    };

    // Menu items based on role
    const getMenuItems = () => {
        if (isAdmin) {
            return [
                { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
                { key: '/admin/properties', icon: <HomeOutlined />, label: 'Properties' },
                { key: '/admin/units', icon: <BulbOutlined />, label: 'Units & Meters' },
                { key: '/admin/users', icon: <TeamOutlined />, label: 'User Management' },
                { key: '/admin/topups', icon: <FileTextOutlined />, label: 'Top-Ups Log' },
                { key: '/admin/maintenance', icon: <ToolOutlined />, label: 'Maintenance Console' },
                { key: '/admin/commissions', icon: <DollarOutlined />, label: 'Commission Engine' },
                { key: '/admin/finance', icon: <RiseOutlined />, label: 'Finance' },
                { key: '/admin/withdrawals', icon: <BankOutlined />, label: 'Withdrawals' },
                { key: '/admin/futurise-sync', icon: <ApiOutlined />, label: 'Futurise Sync' },
                { key: '/admin/app-update', icon: <AndroidOutlined />, label: 'App Update' },

                { key: '/admin/settings', icon: <SettingOutlined />, label: 'Settings' },
            ];
        }

        if (isLandlord) {
            return [
                { key: '/landlord/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
                { key: '/landlord/properties', icon: <HomeOutlined />, label: 'My Properties' },
                { key: '/landlord/meters', icon: <BulbOutlined />, label: 'My Meters' },
                { key: '/landlord/tenants', icon: <TeamOutlined />, label: 'My Tenants' },
                { key: '/landlord/finance', icon: <DollarOutlined />, label: 'Finance' },
            ];
        }

        if (isCaretaker) {
            return [
                { key: '/caretaker/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
                { key: '/caretaker/submit-fault', icon: <ToolOutlined />, label: 'Submit Fault' },
                { key: '/caretaker/issues', icon: <FileTextOutlined />, label: 'Issues' },
            ];
        }

        if (isTenant) {
            return [
                { key: '/tenant/dashboard', icon: <DashboardOutlined />, label: 'Home' },
                { key: '/tenant/buy-token', icon: <ThunderboltOutlined />, label: 'Buy Token' },
                { key: '/tenant/history', icon: <FileTextOutlined />, label: 'History' },
            ];
        }

        if (isAgent) {
            return [
                { key: '/agent/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
            ];
        }

        return [];
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                theme="dark"
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                }}
            >
                <div style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                }}>
                    {!collapsed ? (
                        <img src="/logowhite.png" alt="Aquavolt" style={{ height: 40 }} />
                    ) : (
                        <BulbOutlined style={{ fontSize: 24, color: '#1ecf49' }} />
                    )}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={getMenuItems()}
                    onClick={({ key }) => navigate(key)}
                />
            </Sider>
            <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
                <Header style={{
                    padding: '0 24px',
                    background: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 1px 4px rgba(0,21,41,.08)',
                }}>
                    <Text strong style={{ fontSize: 18 }}>
                        {profile?.full_name || 'User'}
                    </Text>
                    <Dropdown menu={userMenu} placement="bottomRight">
                        <Button type="text" style={{ height: 'auto', padding: 8 }}>
                            <Avatar style={{ backgroundColor: '#1ecf49' }}>
                                {profile?.full_name?.charAt(0) || 'U'}
                            </Avatar>
                        </Button>
                    </Dropdown>
                </Header>
                <Content style={{
                    margin: '24px 16px',
                    padding: 24,
                    minHeight: 280,
                    background: '#fff',
                    borderRadius: 8,
                }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
