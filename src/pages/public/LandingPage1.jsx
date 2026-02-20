import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    Building2,
    Smartphone,
    Zap,
    ShieldCheck,
    BarChart3,
    Users,
    ArrowRight,
    CheckCircle2,
    Download,
    Menu,
    X,
    Phone,
    Mail,
    Globe,
    MessageSquare,
    PhoneCall,
    ShoppingCart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Lazy load heavy sections
const FeaturesSection = lazy(() => import('../../components/landing/FeaturesSection'));
import MarketplaceSection from '../../components/landing/MarketplaceSection';
const DownloadSection = lazy(() => import('../../components/landing/DownloadSection'));
import PublicHeader from '../../components/landing/PublicHeader';
import PublicFooter from '../../components/landing/PublicFooter';

// Section Placeholder (Loading state)
const SectionPlaceholder = () => (
    <div className="py-24 animate-pulse bg-slate-900/10" />
);

const LightningEffect = () => {
    const [bolts, setBolts] = useState([]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                const id = Math.random();
                const newBolt = {
                    id,
                    left: Math.random() * 100 + '%',
                    top: Math.random() * 50 + '%',
                    scale: 0.5 + Math.random(),
                    rotate: Math.random() * 360
                };
                setBolts(prev => [...prev.slice(-3), newBolt]);
                setTimeout(() => {
                    setBolts(prev => prev.filter(b => b.id !== id));
                }, 150);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <AnimatePresence>
                {bolts.map(bolt => (
                    <motion.div
                        key={bolt.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        exit={{ opacity: 0 }}
                        className="absolute"
                        style={{
                            left: bolt.left,
                            top: bolt.top,
                            transform: `rotate(${bolt.rotate}deg) scale(${bolt.scale})`
                        }}
                    >
                        <Zap className="text-blue-400 w-12 h-12 blur-[2px]" fill="currentColor" />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

const LandingPage1 = () => {
    const navigate = useNavigate();
    const { scrollY } = useScroll();
    const headerOpacity = useTransform(scrollY, [0, 100], [0, 1]);
    const headerY = useTransform(scrollY, [0, 100], [-100, 0]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [contactInfo, setContactInfo] = useState({ phone: '', email: 'support@aquavolt.com' });
    const [appUrls, setAppUrls] = useState({ tenant: '#', landlord: '#' });
    const [showDemoModal, setShowDemoModal] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [phoneData, tenantData, landlordData] = await Promise.all([
                    supabase.from('admin_settings').select('value').eq('key', 'support_phone_whatsapp').single(),
                    supabase.from('admin_settings').select('value').eq('key', 'tenant_app_download_link').single(),
                    supabase.from('admin_settings').select('value').eq('key', 'landlord_app_download_link').single()
                ]);

                if (phoneData.data) {
                    setContactInfo(prev => ({ ...prev, phone: phoneData.data.value }));
                }

                // Convert Google Drive view links to direct download links
                const convertToDirectDownloadLink = (driveLink) => {
                    if (!driveLink) return '#';
                    const fileIdMatch = driveLink.match(/\/d\/([^/]+)/);
                    if (fileIdMatch && fileIdMatch[1]) {
                        return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
                    }
                    return driveLink;
                };

                setAppUrls({
                    tenant: convertToDirectDownloadLink(tenantData.data?.value),
                    landlord: convertToDirectDownloadLink(landlordData.data?.value)
                });

            } catch (err) {
                console.error('Error fetching settings:', err);
            }
        };
        fetchSettings();
    }, []);


    // Modern 2026 Color Palette
    const colors = {
        primary: '#0F172A', // Deep Slate
        secondary: '#3B82F6', // Vibrant Blue
        accent: '#1ECF49', // Aquavolt Green
        text: '#F8FAFC',
        textMuted: '#94A3B8',
        cardBg: 'rgba(30, 41, 59, 0.7)',
        glass: 'rgba(15, 23, 42, 0.6)'
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 60 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const menuVariants = {
        closed: {
            x: "100%",
            transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
        },
        open: {
            x: 0,
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-white font-sans overflow-x-hidden selection:bg-blue-500 selection:text-white">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl" />
                <LightningEffect />
            </div>

            <PublicHeader contactInfo={contactInfo} />

            {/* Hero Section */}
            <section className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="space-y-8"
                    >
                        <motion.div variants={fadeInUp} className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                            <span className="flex h-2 w-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                            The Future of Utility Management is Here
                        </motion.div>

                        <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-bold tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-200/50">
                            Power Supply
                            <br />
                            <span className="text-[#1ECF49]">Simplified.</span>
                        </motion.h1>

                        <motion.p variants={fadeInUp} className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 leading-relaxed">
                            Experience the next generation of property utility management. Automated readings, instant payments, and real-time analytics for landlords and tenants.
                        </motion.p>

                        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <button onClick={() => {
                                document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' });
                            }} className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center group shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                                Get Started Now <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button onClick={() => navigate('/apps')} className="w-full sm:w-auto px-8 py-4 bg-transparent text-white border border-white/20 rounded-full font-semibold hover:bg-white/5 transition-all duration-300 flex items-center justify-center group no-underline">
                                Download Tenant App <Download size={20} className="ml-2 group-hover:translate-y-1 transition-transform" />
                            </button>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Hero Visual Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 100, rotateX: 20 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 1.2, delay: 0.4 }}
                    className="mt-20 max-w-5xl mx-auto perspective-1000"
                >
                    <div className="relative rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-2 shadow-2xl shadow-blue-500/20">
                        <div className="aspect-[16/9] rounded-xl overflow-hidden bg-slate-800 relative">
                            {/* Abstract UI Representation */}
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800">
                                <div className="p-8 grid grid-cols-12 gap-6 h-full">
                                    {/* Sidebar */}
                                    <div className="col-span-2 hidden md:block bg-slate-800/50 rounded-lg animate-pulse"></div>
                                    {/* Main Content */}
                                    <div className="col-span-12 md:col-span-10 space-y-6">
                                        <div className="h-32 w-full bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-lg border border-white/5 flex items-center justify-center">
                                            <BarChart3 className="text-white/20 w-16 h-16" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="h-40 bg-slate-700/30 rounded-lg"></div>
                                            <div className="h-40 bg-slate-700/30 rounded-lg"></div>
                                            <div className="h-40 bg-slate-700/30 rounded-lg"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <Suspense fallback={<SectionPlaceholder />}>
                <FeaturesSection />
            </Suspense>

            {/* Marketplace Section */}
            <MarketplaceSection />

            {/* App Download Section */}
            <Suspense fallback={<SectionPlaceholder />}>
                <DownloadSection appUrls={appUrls} />
            </Suspense>


            <PublicFooter contactInfo={contactInfo} />

            {/* Getting Started Demo Modal */}
            <AnimatePresence>
                {showDemoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowDemoModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-3xl font-bold text-white">Getting Started with AquaVolt</h2>
                                <button
                                    onClick={() => setShowDemoModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X size={24} className="text-white" />
                                </button>
                            </div>

                            {/* Steps */}
                            <div className="space-y-6">
                                {/* Step 1 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                        1
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-white mb-2">Download the Tenant App</h3>
                                        <p className="text-slate-400 mb-3">
                                            Click "Get Started Now" below to scroll to the download section and get the AquaVolt Tenant app for Android.
                                        </p>
                                        <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
                                            <Download className="inline mr-2 text-[#1ECF49]" size={18} />
                                            <span className="text-sm text-slate-300">Available for Android devices</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                        2
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-white mb-2">Install & Launch</h3>
                                        <p className="text-slate-400">
                                            Install the APK on your Android device and open the AquaVolt Tenant app.
                                        </p>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#1ECF49] flex items-center justify-center text-white font-bold">
                                        3
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-white mb-2">Verify Your Tenancy</h3>
                                        <p className="text-slate-400 mb-3">
                                            Use the built-in verification system to confirm your tenancy. You'll need:
                                        </p>
                                        <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5 space-y-2">
                                            <div className="flex items-start gap-2">
                                                <ShieldCheck className="text-[#1ECF49] mt-0.5" size={18} />
                                                <span className="text-sm text-slate-300">Your unit/meter number</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <ShieldCheck className="text-[#1ECF49] mt-0.5" size={18} />
                                                <span className="text-sm text-slate-300">Phone number registered with your landlord</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <ShieldCheck className="text-[#1ECF49] mt-0.5" size={18} />
                                                <span className="text-sm text-slate-300">Email address (if provided to landlord)</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            The system will send a verification code to confirm your identity.
                                        </p>
                                    </div>
                                </div>

                                {/* Step 4 */}
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#1ECF49] flex items-center justify-center text-white font-bold">
                                        4
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-white mb-2">Start Managing Your Utilities</h3>
                                        <p className="text-slate-400 mb-3">
                                            Once verified, you can:
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                                                <Zap className="text-yellow-400 mb-2" size={20} />
                                                <p className="text-sm text-white font-medium">Buy tokens instantly</p>
                                            </div>
                                            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                                                <BarChart3 className="text-blue-400 mb-2" size={20} />
                                                <p className="text-sm text-white font-medium">Track usage</p>
                                            </div>
                                            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                                                <Building2 className="text-pink-400 mb-2" size={20} />
                                                <p className="text-sm text-white font-medium">View property info</p>
                                            </div>
                                            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                                                <Smartphone className="text-purple-400 mb-2" size={20} />
                                                <p className="text-sm text-white font-medium">M-Pesa payments</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <button
                                    onClick={() => {
                                        setShowDemoModal(false);
                                        setTimeout(() => {
                                            document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' });
                                        }, 300);
                                    }}
                                    className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-[#1ECF49] text-white rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center group"
                                >
                                    Download Tenant App Now <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default LandingPage1;
