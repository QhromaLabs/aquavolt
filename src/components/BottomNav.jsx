import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, ThunderboltOutlined, HistoryOutlined, UserOutlined } from '@ant-design/icons';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        {
            key: '/tenant/dashboard',
            icon: <HomeOutlined />,
            label: 'Home'
        },
        {
            key: '/tenant/buy-token',
            icon: <ThunderboltOutlined />,
            label: 'Buy'
        },
        {
            key: '/tenant/history',
            icon: <HistoryOutlined />,
            label: 'History'
        },
        {
            key: '/tenant/profile',
            icon: <UserOutlined />,
            label: 'Profile'
        }
    ];

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.04)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '12px 16px 20px', // Extra bottom padding for iOS home indicator
            zIndex: 999,
            height: '80px',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            borderTop: '1px solid rgba(255,255,255,0.3)'
        }}>
            {navItems.map((item) => {
                const isActive = location.pathname === item.key;
                return (
                    <div
                        key={item.key}
                        onClick={() => navigate(item.key)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            color: isActive ? '#1ecf49' : '#9ca3af',
                            position: 'relative',
                            flex: 1,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: isActive ? 'translateY(-2px)' : 'none'
                        }}
                    >
                        {isActive && (
                            <div style={{
                                position: 'absolute',
                                top: -12,
                                width: '24px',
                                height: '3px',
                                background: '#1ecf49',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(30, 207, 73, 0.4)'
                            }} />
                        )}
                        <div style={{
                            fontSize: '24px',
                            marginBottom: '4px',
                            padding: '6px',
                            transition: 'all 0.3s ease',
                            filter: isActive ? 'drop-shadow(0 4px 6px rgba(30, 207, 73, 0.2))' : 'none'
                        }}>
                            {item.icon}
                        </div>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: isActive ? 600 : 500,
                            letterSpacing: '0.3px',
                            opacity: isActive ? 1 : 0.8
                        }}>
                            {item.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default BottomNav;
