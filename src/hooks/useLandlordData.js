import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useLandlordData = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [meters, setMeters] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        monthlyRevenue: 0,
        propertyCount: 0,
        tenantCount: 0,
        meterCount: 0
    });

    const fetchData = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            console.log('Fetching landlord data for user:', user.id);

            // 1. Fetch properties simple (no join first to verify access)
            const { data: props, error: propsError } = await supabase
                .from('properties')
                .select('*')
                .eq('landlord_id', user.id);

            if (propsError) {
                console.error('Error fetching properties:', propsError);
                throw propsError;
            }

            console.log('Properties found:', props?.length, props);

            if (!props || props.length === 0) {
                setProperties([]);
                setMeters([]);
                setTenants([]);
                setTransactions([]);
                setStats({
                    totalRevenue: 0,
                    monthlyRevenue: 0,
                    propertyCount: 0,
                    tenantCount: 0,
                    meterCount: 0
                });
                setLoading(false);
                return;
            }

            const propIds = props.map(p => p.id);

            // 2. Fetch Units for these properties
            const { data: units, error: unitsError } = await supabase
                .from('units')
                .select('*')
                .in('property_id', propIds);

            if (unitsError) {
                console.error('Error fetching units:', unitsError);
                // Don't throw, just continue with empty units to show properties at least
            }

            // Merge units into properties for the dashboard structure if needed, 
            // but the hook returns flattened arrays mostly.
            // We can reconstruct the nested structure if UI needs it, or just return flattened.
            // Admin dash used separate queries mostly.

            // Map units to include property name
            const allUnits = (units || []).map(u => {
                const prop = props.find(p => p.id === u.property_id);
                return { ...u, property_name: prop?.name };
            });
            const unitIds = allUnits.map(u => u.id);

            // 3. Fetch tenants (unit assignments)
            let assignments = [];
            if (unitIds.length > 0) {
                const { data: assignData, error: assignError } = await supabase
                    .from('unit_assignments')
                    .select(`
                        id,
                        unit_id,
                        tenant_id,
                        status,
                        start_date,
                        profiles:tenant_id (*)
                    `)
                    .in('unit_id', unitIds)
                    .order('created_at', { ascending: false }); // Latest first

                if (assignError) console.error('Error fetching assignments:', assignError);
                assignments = assignData || [];
            }

            // --- PROCESS DATA ---

            // A. Sync Unit Status with Assignments
            // Create a Set of Unit IDs that have an ACTIVE assignment.
            const unitIdsWithActiveAssignment = new Set();
            assignments.forEach(a => {
                if (a.status === 'active') {
                    unitIdsWithActiveAssignment.add(a.unit_id);
                }
            });

            // B. Derive Unit Status (Override DB status)
            const unitsWithDerivedStatus = allUnits.map(u => {
                const actuallyOccupied = unitIdsWithActiveAssignment.has(u.id);
                return {
                    ...u,
                    status: actuallyOccupied ? 'occupied' : 'vacant'
                };
            });

            // C. Process Tenants (Active & History)
            const uniqueTenantsMap = new Map();
            assignments.forEach(a => {
                const tId = a.tenant_id;
                if (!uniqueTenantsMap.has(tId)) {
                    const unit = unitsWithDerivedStatus.find(u => u.id === a.unit_id);
                    uniqueTenantsMap.set(tId, {
                        ...a.profiles,
                        unit_number: a.status === 'active' ? unit?.label : null,
                        property_name: a.status === 'active' ? unit?.property_name : null,
                        assignment_id: a.id,
                        unit_id: a.status === 'active' ? a.unit_id : null,
                        move_in_date: a.start_date,
                        assignment_status: a.status,
                        // Add unit details even if inactive for history? No, user wanted blank if inactive.
                    });
                }
            });
            const activeTenants = Array.from(uniqueTenantsMap.values());

            // 4. Fetch transactions (topups)
            let allTopups = [];
            if (unitIds.length > 0) {
                const { data: topups, error: topupsError } = await supabase
                    .from('topups')
                    .select('*')
                    .in('unit_id', unitIds)
                    .order('created_at', { ascending: false });

                if (topupsError) console.error('Error fetching topups:', topupsError);

                allTopups = (topups || []).map(t => {
                    const unit = unitsWithDerivedStatus.find(u => u.id === t.unit_id);
                    return {
                        ...t,
                        unit: { meter_number: unit?.meter_number }
                    };
                });
            }

            // 5. Calculate stats
            const totalRev = allTopups.reduce((acc, t) => acc + (parseFloat(t.amount_paid) || 0), 0);

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const monthlyRev = allTopups
                .filter(t => t.created_at >= startOfMonth)
                .reduce((acc, t) => acc + (parseFloat(t.amount_paid) || 0), 0);

            // 6. Attach derived units to properties
            const propertiesWithUnits = props.map(p => ({
                ...p,
                units: unitsWithDerivedStatus.filter(u => u.property_id === p.id)
            }));

            setProperties(propertiesWithUnits);
            setMeters(unitsWithDerivedStatus);
            setTenants(activeTenants);
            setTransactions(allTopups);
            setStats({
                totalRevenue: totalRev,
                monthlyRevenue: monthlyRev,
                propertyCount: props.length,
                tenantCount: activeTenants.length,
                meterCount: allUnits.length
            });

        } catch (error) {
            console.error('Error fetching landlord data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refreshData = fetchData;

    return {
        loading,
        properties,
        tenants,
        meters,
        transactions,
        stats,
        refreshData
    };
};
