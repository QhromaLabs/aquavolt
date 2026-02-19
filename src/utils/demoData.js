// Demo data generator for Landlord Dashboard
// This generates 6 months of realistic data for screenshots

export const generateDemoData = () => {
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    // Generate properties
    const properties = [
        {
            id: 'prop1',
            name: 'Riverside Apartments',
            units: Array.from({ length: 12 }, (_, i) => ({
                id: `unit-rv-${i}`,
                label: `A${i + 1}`,
                meter_number: `RV${10000 + i}`,
                property_id: 'prop1',
                status: i < 10 ? 'occupied' : 'vacant',
                property_name: 'Riverside Apartments'
            }))
        },
        {
            id: 'prop2',
            name: 'Green Valley Estate',
            units: Array.from({ length: 8 }, (_, i) => ({
                id: `unit-gv-${i}`,
                label: `B${i + 1}`,
                meter_number: `GV${20000 + i}`,
                property_id: 'prop2',
                status: i < 7 ? 'occupied' : 'vacant',
                property_name: 'Green Valley Estate'
            }))
        },
        {
            id: 'prop3',
            name: 'Sunset Towers',
            units: Array.from({ length: 16 }, (_, i) => ({
                id: `unit-st-${i}`,
                label: `C${i + 1}`,
                meter_number: `ST${30000 + i}`,
                property_id: 'prop3',
                status: i < 14 ? 'occupied' : 'vacant',
                property_name: 'Sunset Towers'
            }))
        },
        {
            id: 'prop4',
            name: 'Meadow Heights',
            units: Array.from({ length: 6 }, (_, i) => ({
                id: `unit-mh-${i}`,
                label: `D${i + 1}`,
                meter_number: `MH${40000 + i}`,
                property_id: 'prop4',
                status: i < 5 ? 'occupied' : 'vacant',
                property_name: 'Meadow Heights'
            }))
        }
    ];

    // Get all units
    const allUnits = properties.flatMap(p => p.units);
    const occupiedUnits = allUnits.filter(u => u.status === 'occupied');

    // Generate transactions (6 months of data, 2-4 topups per unit per month)
    const transactions = [];
    for (let month = 0; month < 6; month++) {
        const monthDate = new Date(now);
        monthDate.setMonth(now.getMonth() - month);

        occupiedUnits.forEach(unit => {
            const topupsThisMonth = Math.floor(Math.random() * 3) + 2; // 2-4 topups

            for (let i = 0; i < topupsThisMonth; i++) {
                const dayOfMonth = Math.floor(Math.random() * 28) + 1;
                const transactionDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), dayOfMonth);
                const amount = Math.floor(Math.random() * 1500) + 500; // 500-2000 KES

                transactions.push({
                    id: `tx-${month}-${unit.id}-${i}`,
                    unit_id: unit.id,
                    tenant_id: `tenant-${unit.id}`,
                    amount_paid: amount,
                    token: `${Math.floor(Math.random() * 10000000000000000)}`,
                    futurise_status: 'success',
                    created_at: transactionDate.toISOString(),
                    unit: { meter_number: unit.meter_number }
                });
            }
        });
    }

    // Sort transactions by date (newest first)
    transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Calculate stats
    const totalRevenue = transactions.reduce((acc, t) => acc + t.amount_paid, 0);
    const today = now.toISOString().split('T')[0];
    const todayRevenue = transactions
        .filter(t => t.created_at.startsWith(today))
        .reduce((acc, t) => acc + t.amount_paid, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthlyRevenue = transactions
        .filter(t => t.created_at >= startOfMonth)
        .reduce((acc, t) => acc + t.amount_paid, 0);

    // Calculate revenue growth
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const last14Days = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const recentRevenue = transactions
        .filter(t => t.created_at >= last7Days)
        .reduce((acc, t) => acc + t.amount_paid, 0);
    const previousRevenue = transactions
        .filter(t => t.created_at >= last14Days && t.created_at < last7Days)
        .reduce((acc, t) => acc + t.amount_paid, 0);
    const revenueGrowth = previousRevenue > 0
        ? parseFloat(((recentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1))
        : 15.3;

    // Generate chart data (last 30 days)
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayTransactions = transactions.filter(t => t.created_at.startsWith(dateStr));
        const dayRevenue = dayTransactions.reduce((acc, t) => acc + t.amount_paid, 0);

        chartData.push({
            date: dateStr,
            revenue: dayRevenue,
            token_count: dayTransactions.length
        });
    }

    return {
        loading: false,
        properties,
        tenants: occupiedUnits.map((u, i) => ({
            id: `tenant-${u.id}`,
            full_name: `Tenant ${i + 1}`,
            unit_number: u.label,
            property_name: u.property_name
        })),
        meters: allUnits,
        transactions,
        chartData,
        stats: {
            totalRevenue,
            monthlyRevenue,
            todayRevenue,
            propertyCount: properties.length,
            tenantCount: occupiedUnits.length,
            meterCount: allUnits.length,
            revenueGrowth
        },
        refreshData: () => { }
    };
};
