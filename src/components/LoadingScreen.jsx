import React from 'react';

const LoadingScreen = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0F172A',
            zIndex: 9999
        }}>
            <div style={{
                textAlign: 'center'
            }}>
                {/* AquaVolt Logo */}
                <div style={{
                    width: '60px',
                    height: '60px',
                    margin: '0 auto 20px',
                    borderRadius: '50%',
                    border: '3px solid #1ECF49',
                    borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite'
                }} />

                <div style={{
                    color: '#1ECF49',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '8px'
                }}>
                    AquaVolt
                </div>

                <div style={{
                    color: '#64748b',
                    fontSize: '14px'
                }}>
                    Loading...
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
