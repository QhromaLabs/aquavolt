import { Card, Button, Space } from 'antd';
import {
    UserAddOutlined,
    HomeOutlined,
    ThunderboltOutlined,
    DollarOutlined,
    SyncOutlined,
    ToolOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
    const navigate = useNavigate();

    const actions = [
        {
            icon: UserAddOutlined,
            label: 'Add User',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            onClick: () => navigate('/admin/users')
        },
        {
            icon: HomeOutlined,
            label: 'Add Property',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            onClick: () => navigate('/admin/properties')
        },
        {
            icon: ToolOutlined,
            label: 'Maintenance Token',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            onClick: () => navigate('/admin/maintenance')
        },
        {
            icon: DollarOutlined,
            label: 'Finance Report',
            gradient: 'linear-gradient(135deg, #1ecf49 0%, #36ea98 100%)',
            onClick: () => navigate('/admin/finance')
        },
        {
            icon: SyncOutlined,
            label: 'Sync Futurise',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            onClick: () => navigate('/admin/futurise')
        },
        {
            icon: ThunderboltOutlined,
            label: 'View Topups',
            gradient: 'linear-gradient(135deg, #ffa751 0%, #ffe259 100%)',
            onClick: () => navigate('/admin/topups')
        }
    ];

    return (
        <Card
            title="Quick Actions"
            style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px'
            }}>
                {actions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <Button
                            key={index}
                            onClick={action.onClick}
                            style={{
                                height: '80px',
                                background: action.gradient,
                                border: 'none',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '13px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.12)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                            }}
                        >
                            <Icon style={{ fontSize: '24px' }} />
                            <span>{action.label}</span>
                        </Button>
                    );
                })}
            </div>
        </Card>
    );
};

export default QuickActions;
