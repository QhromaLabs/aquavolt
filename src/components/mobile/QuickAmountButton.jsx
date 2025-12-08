import { Button } from 'antd';

/**
 * Quick amount selection button for mobile
 * Provides large touch target and clear visual feedback
 */
const QuickAmountButton = ({
    amount,
    selected = false,
    onClick,
    style = {},
    ...props
}) => {
    return (
        <Button
            type={selected ? 'primary' : 'default'}
            size="large"
            onClick={() => onClick(amount)}
            style={{
                height: '56px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: selected ? 600 : 500,
                border: selected ? 'none' : '2px solid #d9d9d9',
                background: selected
                    ? 'linear-gradient(135deg, #1ecf49 0%, #36ea98 100%)'
                    : '#fff',
                color: selected ? '#fff' : '#262626',
                boxShadow: selected
                    ? '0 4px 12px rgba(30, 207, 73, 0.25)'
                    : '0 2px 4px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                minWidth: '80px',
                flex: 1,
                ...style,
            }}
            {...props}
        >
            KES {amount}
        </Button>
    );
};

export default QuickAmountButton;
