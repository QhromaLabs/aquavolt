import React, { useState, useEffect } from 'react';
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
    Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

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
                const { data, error } = await supabase
                    .from('admin_settings')
                    .select('value')
                    .eq('key', 'support_phone_whatsapp')
                    .single();

                if (data) {
                    setContactInfo(prev => ({ ...prev, phone: data.value }));
                }
            } catch (err) {
                console.error('Error fetching contact settings:', err);
            }

            // Fetch App Download Links from Google Drive
            try {
                const { data: tenantData } = await supabase
                    .from('admin_settings')
                    .select('value')
                    .eq('key', 'tenant_app_download_link')
                    .single();

                const { data: landlordData } = await supabase
                    .from('admin_settings')
                    .select('value')
                    .eq('key', 'landlord_app_download_link')
                    .single();

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
                    tenant: convertToDirectDownloadLink(tenantData?.value),
                    landlord: convertToDirectDownloadLink(landlordData?.value)
                });
            } catch (err) {
                console.error('Error fetching app URLs:', err);
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
            </div>

            {/* Navigation */}
            <motion.nav
                className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b border-white/10"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
                            <img src="/logowhite.png" alt="AquaVolt" className="h-10 w-auto" />
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-8">
                                {['Features', 'Solutions', 'About', 'Contact'].map((item) => (
                                    <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300">
                                        {item}
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="hidden md:block">
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-medium transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                            >
                                Sign In
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(true)}
                                className="text-[#1ECF49] hover:text-[#1ECF49]/80 transition-colors"
                                style={{
                                    background: 'none',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    padding: 0,
                                    margin: 0,
                                    boxShadow: 'none',
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none',
                                    appearance: 'none'
                                }}
                            >
                                <Menu size={32} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Full Screen Mobile Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={menuVariants}
                            className="fixed inset-0 z-[60] flex flex-col md:hidden"
                            style={{
                                backgroundColor: '#1e3a8a',
                                opacity: 1
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 h-20 border-b border-white/10" style={{ backgroundColor: '#1e3a8a', opacity: 1 }}>
                                <img src="/logowhite.png" alt="AquaVolt" className="h-8 w-auto" />
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <X size={24} className="text-white" />
                                </button>
                            </div>

                            {/* Menu Items */}
                            <div className="flex-1 flex flex-col justify-center items-center space-y-8 px-6">
                                {['Features', 'Solutions', 'About', 'Contact'].map((item) => (
                                    <motion.a
                                        key={item}
                                        href={`#${item.toLowerCase()}`}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-3xl font-bold text-white hover:text-[#1ECF49] transition-colors"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {item}
                                    </motion.a>
                                ))}
                                <button
                                    onClick={() => {
                                        navigate('/login');
                                        setIsMenuOpen(false);
                                    }}
                                    className="mt-8 bg-blue-600 text-white px-10 py-4 rounded-full text-lg font-semibold w-full max-w-xs shadow-lg shadow-blue-600/30"
                                >
                                    Sign In
                                </button>
                            </div>

                            {/* Footer / Contact Info */}
                            <div className="p-8 pb-12 bg-black/20 pb-safe">
                                <div className="flex flex-col items-center space-y-4 text-center">
                                    <img src="/logowhite.png" alt="AquaVolt" className="h-8 opacity-70 mb-2" />

                                    <div className="flex items-center justify-center space-x-6 w-full">
                                        {contactInfo.phone && (
                                            <a href={`tel:${contactInfo.phone}`} className="flex flex-col items-center gap-2 text-slate-400 hover:text-[#1ECF49] transition-colors">
                                                <div className="p-3 bg-white/5 rounded-full">
                                                    <Phone size={20} />
                                                </div>
                                                <span className="text-xs">Call Us</span>
                                            </a>
                                        )}

                                        <a href={`mailto:${contactInfo.email}`} className="flex flex-col items-center gap-2 text-slate-400 hover:text-[#1ECF49] transition-colors">
                                            <div className="p-3 bg-white/5 rounded-full">
                                                <Mail size={20} />
                                            </div>
                                            <span className="text-xs">Email</span>
                                        </a>
                                    </div>

                                    <div className="pt-4 text-xs text-slate-600 border-t border-white/5 w-full text-center mt-2">
                                        © 2026 AquaVolt Platform
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>

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
                            <button onClick={() => setShowDemoModal(true)} className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-semibold hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
                                View Demo
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
            <section id="features" className="py-24 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for Modern Living</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to manage utilities efficiently, packaged in a beautiful interface.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Zap className="w-8 h-8 text-yellow-400" />,
                                title: "Instant Tokens",
                                desc: "Purchase and receive utility tokens instantly via M-Pesa. No delays, 24/7 availability."
                            },
                            {
                                icon: <BarChart3 className="w-8 h-8 text-blue-400" />,
                                title: "Real-time Analytics",
                                desc: "Track consumption patterns, revenue, and expenses with detailed interactive charts."
                            },
                            {
                                icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
                                title: "Secure Payments",
                                desc: "Bank-grade security for all transactions. Your financial data is protected at all times."
                            },
                            {
                                icon: <Smartphone className="w-8 h-8 text-purple-400" />,
                                title: "Mobile First",
                                desc: "Native applications for both tenants and landlords. Manage everything on the go."
                            },
                            {
                                icon: <Building2 className="w-8 h-8 text-pink-400" />,
                                title: "Multi-Property",
                                desc: "Seamlessly manage multiple properties and units from a single dashboard."
                            },
                            {
                                icon: <Users className="w-8 h-8 text-orange-400" />,
                                title: "Tenant Management",
                                desc: "Digital tenant onboarding, automated invoicing, and communication tools."
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ y: -5 }}
                                className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 group"
                            >
                                <div className="mb-6 p-4 rounded-2xl bg-slate-900/50 w-fit group-hover:scale-110 transition-transform duration-300 border border-white/5">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* App Download Section */}
            <section id="download" className="py-32 relative z-10 overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/10 skew-y-3 transform origin-bottom-left" />

                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <h2 className="text-4xl md:text-6xl font-bold leading-tight">
                                Manage your world<br />
                                <span className="text-blue-500">from your pocket.</span>
                            </h2>
                            <p className="text-lg text-slate-300">
                                Download our dedicated mobile apps for a seamless experience. Whether you're a landlord managing properties or a tenant tracking usage, we've got you covered.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 pt-4">
                                {/* Tenant App Button */}
                                <motion.a
                                    href={appUrls.tenant}
                                    download="AquaVolt_Tenant.apk"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-4 bg-white text-slate-900 px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer"
                                >
                                    <Download className="w-8 h-8" />
                                    <div className="text-left">
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Download For</div>
                                        <div className="text-xl font-bold">Tenants</div>
                                    </div>
                                </motion.a>

                                {/* Landlord App Button */}
                                <motion.a
                                    href={appUrls.landlord}
                                    download="AquaVolt_Landlord.apk"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-4 bg-slate-800 text-white border border-slate-700 px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:bg-slate-700 transition-all cursor-pointer"
                                >
                                    <Download className="w-8 h-8" />
                                    <div className="text-left">
                                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Download For</div>
                                        <div className="text-xl font-bold">Landlords</div>
                                    </div>
                                </motion.a>
                            </div>

                            <div className="flex items-center justify-center gap-6 pt-8 text-sm text-slate-500 text-center sm:text-left flex-wrap">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> iOS & Android
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free Updates
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-[#1ECF49]" />
                                    <span className="text-[#1ECF49] font-semibold">Secure & Verified</span>
                                </div>
                            </div>

                            {/* Security Assurance */}
                            <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-white font-semibold mb-1">Bank-Grade Security</h4>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            Our apps are protected with end-to-end encryption and secure authentication.
                                            Your data and payments are always safe with industry-standard security protocols.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* App Screens Visual */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative lg:h-[600px] flex items-center justify-center p-10"
                        >
                            {/* Decorative Circles */}
                            <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-[60px] animate-spin-slow" />

                            {/* Phone Mockup 1 */}
                            <motion.div
                                initial={{ y: 50 }}
                                animate={{ y: [0, -20, 0] }}
                                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                                className="relative z-20 w-[280px] h-[580px] bg-slate-900 border-[8px] border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl"
                            >
                                <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl z-20 w-40 mx-auto" />
                                <div className="w-full h-full bg-slate-800 p-4 space-y-4 pt-12">
                                    {/* Fake UI */}
                                    <div className="flex justify-between items-center">
                                        <div className="w-8 h-8 bg-slate-700 rounded-full" />
                                        <div className="w-20 h-4 bg-slate-700 rounded-full" />
                                    </div>
                                    <div className="w-full h-40 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl" />
                                    <div className="space-y-3">
                                        <div className="w-full h-12 bg-slate-700/50 rounded-xl" />
                                        <div className="w-full h-12 bg-slate-700/50 rounded-xl" />
                                        <div className="w-full h-12 bg-slate-700/50 rounded-xl" />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Phone Mockup 2 (Behind) */}
                            <motion.div
                                initial={{ rotate: -10, x: -100 }}
                                className="absolute z-10 w-[260px] h-[540px] bg-slate-900/80 border-[8px] border-slate-800/80 rounded-[3rem] overflow-hidden blur-[1px] -translate-x-32"
                            >
                                <div className="w-full h-full bg-slate-800/80"></div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>


            {/* Footer */}
            <footer className="relative z-10 bg-gradient-to-b from-[#0F172A] to-[#020617] border-t border-white/5 overflow-hidden">
                {/* Gradient Orb Background */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-6 py-16">
                    {/* Main Footer Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                        {/* Brand Column */}
                        <div className="space-y-4">
                            <img src="/logowhite.png" alt="AquaVolt" className="h-10 w-auto" />
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Next-generation property utility management. Automated readings, instant payments, and real-time analytics.
                            </p>
                            <div className="flex gap-3">
                                <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#1ECF49] hover:border-[#1ECF49] transition-all group">
                                    <Globe className="w-4 h-4 text-slate-400 group-hover:text-white" />
                                </a>
                                <a href="https://wa.me/254115146212" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#1ECF49] hover:border-[#1ECF49] transition-all group">
                                    <Phone className="w-4 h-4 text-slate-400 group-hover:text-white" />
                                </a>
                                <a href={`mailto:${contactInfo.email}`} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#1ECF49] hover:border-[#1ECF49] transition-all group">
                                    <Mail className="w-4 h-4 text-slate-400 group-hover:text-white" />
                                </a>
                            </div>
                        </div>

                        {/* Product Column */}
                        <div className="space-y-4">
                            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Product</h3>
                            <ul className="space-y-3">
                                <li><a href="#features" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    Features
                                </a></li>
                                <li><a href="#download" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    Mobile Apps
                                </a></li>
                                <li><a href="#" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    Pricing
                                </a></li>
                                <li><a href="#" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    Updates
                                </a></li>
                            </ul>
                        </div>

                        {/* Company Column */}
                        <div className="space-y-4">
                            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Company</h3>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    About Us
                                </a></li>
                                <li><a href="#" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    Careers
                                </a></li>
                                <li><a href="#" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    Contact
                                </a></li>
                                <li><a href="#" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    Blog
                                </a></li>
                            </ul>
                        </div>

                        {/* Support Column */}
                        <div className="space-y-4">
                            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Support</h3>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    Help Center
                                </a></li>
                                <li><a href="#" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    Privacy Policy
                                </a></li>
                                <li><a href="#" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    Terms of Service
                                </a></li>
                                <li><a href="https://wa.me/254115146212" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#1ECF49] transition-colors text-sm flex items-center gap-2 group">
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    WhatsApp Support
                                </a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-white/5">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            {/* Copyright & Developer Credit */}
                            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-sm text-slate-500">
                                <span>© 2026 AquaVolt Platform. All rights reserved.</span>
                                <span className="hidden md:block text-slate-700">•</span>
                                <div className="flex items-center gap-2">
                                    <span>Built by</span>
                                    <span className="text-[#1ECF49] font-semibold">Qhroma Labs</span>
                                    <span className="text-slate-700">•</span>
                                    <span>Nairobi, Kenya</span>
                                </div>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Secure</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                                    <span>Fast</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Trusted</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

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
