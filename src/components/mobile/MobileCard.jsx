import { Card } from 'antd';

/**
 * Mobile-optimized card component with touch-friendly interactions
 */
const MobileCard = ({
    children,
    title,
    extra,
    onClick,
    hoverable = false,
    style = {},
    bodyStyle = {},
    ...props
}) => {
    return (
        <Card
            title={title}
            extra={extra}
            hoverable={hoverable || !!onClick}
            onClick={onClick}
            style={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                border: '1px solid #f0f0f0',
                transition: 'all 0.3s ease',
                ...style,
            }}
            bodyStyle={{
                padding: '16px',
                ...bodyStyle,
            }}
            {...props}
        >
            {children}
        </Card>
    );
};

export default MobileCard;
