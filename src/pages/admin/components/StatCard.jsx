import { Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import CountUp from 'react-countup';

const StatCard = ({
    title,
    value,
    prefix,
    suffix,
    icon: Icon,
    trend,
    trendValue,
    gradient,
    onClick,
    loading = false,
    formatter
}) => {
    const gradients = {
        green: 'linear-gradient(135deg, #1ecf49 0%, #36ea98 100%)',
        blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        pink: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        orange: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    };

    const trendColor = trend === 'up' ? '#52c41a' : trend === 'down' ? '#ff4d4f' : '#8c8c8c';
    const TrendIcon = trend === 'up' ? ArrowUpOutlined : trend === 'down' ? ArrowDownOutlined : null;

    return (
        <Card
            hoverable={!!onClick}
            onClick={onClick}
            loading={loading}
            style={{
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
            bodyStyle={{ padding: '20px' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: '14px',
                        color: '#8c8c8c',
                        marginBottom: '8px',
                        fontWeight: 500
                    }}>
                        {title}
                    </div>
                    <Statistic
                        value={value}
                        prefix={prefix}
                        suffix={suffix}
                        valueStyle={{
                            fontSize: '28px',
                            fontWeight: 700,
                            background: gradients[gradient] || gradients.blue,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}
                        formatter={(val) => {
                            if (formatter) return formatter(val);
                            return <CountUp end={val} duration={1.5} separator="," />;
                        }}
                    />
                    {trendValue && (
                        <div style={{
                            marginTop: '8px',
                            fontSize: '12px',
                            color: trendColor,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            {TrendIcon && <TrendIcon />}
                            <span>{trendValue}</span>
                        </div>
                    )}
                </div>
                {Icon && (
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: gradients[gradient] || gradients.blue,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        color: 'white'
                    }}>
                        <Icon />
                    </div>
                )}
            </div>
        </Card>
    );
};

export default StatCard;
