import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * Custom hook to fetch tenant-specific data
 * Fetches assigned units, property info, and recent top-ups
 */
export const useTenantData = () => {
    const { user } = useAuth();
    const [units, setUnits] = useState([]);
    const [topups, setTopups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTenantData = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Fetch tenant's assigned units with property information
            const { data: assignmentsData, error: assignmentsError } = await supabase
                .from('unit_assignments')
                .select(`
                    id,
                    start_date,
                    end_date,
                    status,
                    unit_id,
                    units (
                        id,
                        label,
                        meter_number,
                        status,
                        property_id,
                        properties (
                            id,
                            name,
                            location,
                            region_code
                        )
                    )
                `)
                .eq('tenant_id', user.id)
                .eq('status', 'active')
                .order('start_date', { ascending: false });

            if (assignmentsError) throw assignmentsError;

            // Transform the data for easier use
            const unitsData = assignmentsData?.map(assignment => ({
                assignmentId: assignment.id,
                startDate: assignment.start_date,
                endDate: assignment.end_date,
                assignmentStatus: assignment.status,
                unitId: assignment.units.id,
                unitLabel: assignment.units.label,
                meterNumber: assignment.units.meter_number,
                unitStatus: assignment.units.status,
                propertyId: assignment.units.properties.id,
                propertyName: assignment.units.properties.name,
                propertyLocation: assignment.units.properties.location,
                regionCode: assignment.units.properties.region_code,
            })) || [];

            setUnits(unitsData);

            // Fetch recent top-ups for the tenant
            const { data: topupsData, error: topupsError } = await supabase
                .from('topups')
                .select(`
                    id,
                    amount_paid,
                    amount_vended,
                    fee_amount,
                    payment_channel,
                    token,
                    futurise_status,
                    futurise_message,
                    created_at,
                    unit_id,
                    units (
                        label,
                        meter_number
                    )
                `)
                .eq('tenant_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (topupsError) throw topupsError;

            setTopups(topupsData || []);

        } catch (err) {
            console.error('Error fetching tenant data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenantData();
    }, [user]);

    // Refetch data function
    const refetch = () => {
        fetchTenantData();
    };

    return {
        units,
        topups,
        loading,
        error,
        refetch,
        hasUnits: units.length > 0,
        hasTopups: topups.length > 0,
    };
};
