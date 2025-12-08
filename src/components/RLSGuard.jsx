import { Navigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { useAuth } from '../hooks/useAuth';
import { Spin } from 'antd';

export const RLSGuard = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const { hasRole } = useRole();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !hasRole(allowedRoles)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};
