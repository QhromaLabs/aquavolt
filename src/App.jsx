import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { RLSGuard } from './components/RLSGuard';
import LoadingScreen from './components/LoadingScreen';

// Critical public pages - load immediately (no lazy)
import Login from './pages/auth/Login';
import TenantLogin from './pages/auth/TenantLogin';
import SignUp from './pages/auth/SignUp';
import Unauthorized from './pages/auth/Unauthorized';
import LandingPage1 from './pages/public/LandingPage1';

// Admin pages - lazy load
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const PropertiesManagement = lazy(() => import('./pages/admin/PropertiesManagement'));
const UnitsMatrix = lazy(() => import('./pages/admin/UnitsMatrix'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const TopupsLog = lazy(() => import('./pages/admin/TopupsLog'));
const MaintenanceConsole = lazy(() => import('./pages/admin/MaintenanceConsole'));
const CommissionEngine = lazy(() => import('./pages/admin/CommissionEngine'));
const AdminFinance = lazy(() => import('./pages/admin/Finance'));
const WithdrawalRequests = lazy(() => import('./pages/admin/WithdrawalRequests'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const FuturiseSync = lazy(() => import('./pages/admin/FuturiseSync'));
const AppUpdate = lazy(() => import('./pages/admin/AppUpdate'));

// Landlord pages - lazy load
const LandlordDashboard = lazy(() => import('./pages/landlord/Dashboard'));
const LandlordProperties = lazy(() => import('./pages/landlord/Properties'));
const LandlordMeters = lazy(() => import('./pages/landlord/Meters'));
const LandlordTenants = lazy(() => import('./pages/landlord/Tenants'));
const LandlordFinance = lazy(() => import('./pages/landlord/Finance'));

// Caretaker pages - lazy load
const CaretakerDashboard = lazy(() => import('./pages/caretaker/Dashboard'));
const SubmitFault = lazy(() => import('./pages/caretaker/SubmitFault'));
const CaretakerIssues = lazy(() => import('./pages/caretaker/Issues'));

// Tenant pages - lazy load
const TenantDashboard = lazy(() => import('./pages/tenant/Dashboard'));
const BuyToken = lazy(() => import('./pages/tenant/BuyToken'));
const TenantHistory = lazy(() => import('./pages/tenant/History'));
const TenantProfile = lazy(() => import('./pages/tenant/Profile'));
const TenantSetup = lazy(() => import('./pages/tenant/TenantSetup'));
const Notifications = lazy(() => import('./pages/common/Notifications'));

// Agent pages - lazy load
const AgentDashboard = lazy(() => import('./pages/agent/Dashboard'));

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/portal" element={<TenantLogin />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/landing-page-1" element={<LandingPage1 />} />

                        {/* Tenant Setup Route (potentially public or with minimal guard) */}
                        <Route path="/tenant/setup" element={
                            <RLSGuard>
                                <TenantSetup />
                            </RLSGuard>
                        } />

                        <Route path="/unauthorized" element={<Unauthorized />} />

                        {/* Admin routes */}
                        <Route
                            path="/admin/*"
                            element={
                                <RLSGuard allowedRoles="admin">
                                    <Routes>
                                        <Route path="dashboard" element={<AdminDashboard />} />
                                        <Route path="properties" element={<PropertiesManagement />} />
                                        <Route path="units" element={<UnitsMatrix />} />
                                        <Route path="users" element={<UserManagement />} />
                                        <Route path="topups" element={<TopupsLog />} />
                                        <Route path="maintenance" element={<MaintenanceConsole />} />
                                        <Route path="commissions" element={<CommissionEngine />} />
                                        <Route path="finance" element={<AdminFinance />} />
                                        <Route path="withdrawals" element={<WithdrawalRequests />} />
                                        <Route path="futurise-sync" element={<FuturiseSync />} />
                                        <Route path="app-update" element={<AppUpdate />} />

                                        <Route path="settings" element={<Settings />} />
                                        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                                    </Routes>
                                </RLSGuard>
                            }
                        />

                        {/* Landlord routes */}
                        <Route
                            path="/landlord/*"
                            element={
                                <RLSGuard allowedRoles="landlord">
                                    <Routes>
                                        <Route path="dashboard" element={<LandlordDashboard />} />
                                        <Route path="properties" element={<LandlordProperties />} />
                                        <Route path="meters" element={<LandlordMeters />} />
                                        <Route path="tenants" element={<LandlordTenants />} />
                                        <Route path="finance" element={<LandlordFinance />} />
                                        <Route path="*" element={<Navigate to="/landlord/dashboard" replace />} />
                                    </Routes>
                                </RLSGuard>
                            }
                        />

                        {/* Caretaker routes */}
                        <Route
                            path="/caretaker/*"
                            element={
                                <RLSGuard allowedRoles="caretaker">
                                    <Routes>
                                        <Route path="dashboard" element={<CaretakerDashboard />} />
                                        <Route path="submit-fault" element={<SubmitFault />} />
                                        <Route path="issues" element={<CaretakerIssues />} />
                                        <Route path="*" element={<Navigate to="/caretaker/dashboard" replace />} />
                                    </Routes>
                                </RLSGuard>
                            }
                        />

                        {/* Tenant routes */}
                        <Route
                            path="/tenant/*"
                            element={
                                <RLSGuard allowedRoles="tenant">
                                    <Routes>
                                        <Route path="dashboard" element={<TenantDashboard />} />
                                        <Route path="buy-token" element={<BuyToken />} />
                                        <Route path="history" element={<TenantHistory />} />
                                        <Route path="profile" element={<TenantProfile />} />
                                        <Route path="notifications" element={<Notifications />} />
                                        <Route path="*" element={<Navigate to="/tenant/dashboard" replace />} />
                                    </Routes>
                                </RLSGuard>
                            }
                        />

                        {/* Agent routes */}
                        <Route
                            path="/agent/*"
                            element={
                                <RLSGuard allowedRoles="agent">
                                    <Routes>
                                        <Route path="dashboard" element={<AgentDashboard />} />
                                        <Route path="*" element={<Navigate to="/agent/dashboard" replace />} />
                                    </Routes>
                                </RLSGuard>
                            }
                        />

                        {/* Default home route - Landing Page */}
                        <Route path="/" element={<LandingPage1 />} />
                        <Route path="/dashboard" element={<RoleBasedRedirect />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </AuthProvider>
        </BrowserRouter>
    );
}

// Component to handle role-based redirect
const RoleBasedRedirect = () => {
    const { user, profile, loading } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        console.log('RoleBasedRedirect useEffect:', { loading, user: user?.id, profile: profile?.role });

        if (!loading) {
            if (!user) {
                console.log('No user, navigating to login');
                navigate('/login', { replace: true });
            } else if (profile) {
                console.log('User and profile exist, navigating to role dashboard:', profile.role);
                // Redirect based on role from database profile
                switch (profile.role) {
                    case 'admin':
                        navigate('/admin/dashboard', { replace: true });
                        break;
                    case 'landlord':
                        navigate('/landlord/dashboard', { replace: true });
                        break;
                    case 'caretaker':
                        navigate('/caretaker/dashboard', { replace: true });
                        break;
                    case 'tenant':
                        navigate('/tenant/dashboard', { replace: true });
                        break;
                    case 'agent':
                        navigate('/agent/dashboard', { replace: true });
                        break;
                    default:
                        navigate('/unauthorized', { replace: true });
                        break;
                }
            } else {
                console.log('User exists but profile is null - waiting for profile to load');
            }
        } else {
            console.log('Still loading auth state');
        }
    }, [loading, user, profile, navigate]);

    // Show loading while determining where to redirect
    return <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        color: '#1ecf49'
    }}>Loading your dashboard...</div>;
};

export default App;
