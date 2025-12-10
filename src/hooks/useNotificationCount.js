import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useNotificationCount = () => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        const fetchCount = async () => {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (!error) {
                setUnreadCount(count || 0);
            }
        };

        fetchCount();

        // Optional: Subscribe to changes (Realtime)
        const subscription = supabase
            .channel('public:notifications')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, () => {
                fetchCount();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);

    return { unreadCount };
};
