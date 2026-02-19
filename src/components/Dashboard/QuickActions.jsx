import { Card, Button } from 'antd';

const QuickActions = ({ actions = [] }) => {
    if (!actions || actions.length === 0) {
        return null;
    }

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
