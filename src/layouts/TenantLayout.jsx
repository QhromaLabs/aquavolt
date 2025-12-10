import React, { useState, useEffect } from 'react';
import { Layout, Grid } from 'antd';
import MainLayout from '../components/Layout/MainLayout'; // Reuse MainLayout for desktop sidebar logic if possible, or we might need to extract sidebar.
// Actually MainLayout has the shell baked in. 
// For this task, we want to replace MainLayout for tenants.
// So on Desktop we want Sidebar + Header + Content.
// On Mobile we want Header + Content + BottomNav.

// Let's create a simplified structure. IF we are on desktop, we can wrap children in MainLayout.
// IF we are on mobile, we render children with BottomNav.

import BottomNav from '../components/BottomNav';

const { useBreakpoint } = Grid;

const TenantLayout = ({ children }) => {
    const screens = useBreakpoint();
    // antd Grid screens: xs, sm, md, lg, xl, xxl
    // We'll consider 'md' and up as desktop/tablet that can use sidebar.
    // 'xs' and 'sm' as mobile. 
    // Wait, MainLayout is responsive already? 
    // MainLayout collapses sidebar on small screens but doesn't remove it.
    // The requirement is "Remove the sidebar during mobile view and use a bottom bar".

    // We need to know if we are mobile.
    // Initial render screens might be empty, so handle default.
    const isMobile = (screens.xs || screens.sm) && !screens.md;

    // However, hooks run on client. 
    // Let's assume desktop first or handle hydration if this was SSR, but it's SPA.

    // If screens is empty (first render), it might flicker. 
    // But let's rely on MainLayout for Desktop and a custom Mobile Layout.

    if (isMobile) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#f5f7fa',
                paddingBottom: '80px', // Space for BottomNav
            }}>
                {children}
                <BottomNav />
            </div>
        );
    }

    // Desktop: Use the existing MainLayout which has Sidebar and Header
    return (
        <MainLayout>
            {children}
        </MainLayout>
    );
};

export default TenantLayout;
