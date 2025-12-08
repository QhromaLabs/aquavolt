import { useAuth } from './useAuth';

export const useRole = () => {
    const { profile } = useAuth();

    const role = profile?.role || null;

    const isAdmin = role === 'admin';
    const isLandlord = role === 'landlord';
    const isCaretaker = role === 'caretaker';
    const isTenant = role === 'tenant';
    const isAgent = role === 'agent';

    const hasRole = (requiredRole) => {
        if (Array.isArray(requiredRole)) {
            return requiredRole.includes(role);
        }
        return role === requiredRole;
    };

    return {
        role,
        isAdmin,
        isLandlord,
        isCaretaker,
        isTenant,
        isAgent,
        hasRole,
    };
};
