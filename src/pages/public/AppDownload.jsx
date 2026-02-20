import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download,
    Building2,
    Smartphone,
    CheckCircle2,
    ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import PublicHeader from '../../components/landing/PublicHeader';
import PublicFooter from '../../components/landing/PublicFooter';

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
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden text-blue-400">
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
                        <Download className="w-12 h-12 blur-[2px]" fill="currentColor" />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

const AppDownload = () => {
    const navigate = useNavigate();
    const [appUrls, setAppUrls] = useState({ tenant: '#', landlord: '#' });
    const [contactInfo, setContactInfo] = useState({ phone: '', email: 'support@aquavolt.com' });

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

    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-white font-sans overflow-x-hidden pt-20">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-50" />
                <LightningEffect />
            </div>

            <PublicHeader contactInfo={contactInfo} />

            <div className="py-20 px-6 relative z-10">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                    className="max-w-4xl w-full mx-auto text-center space-y-8"
                >
                    <div className="space-y-4">
                        <img src="/logowhite.png" alt="AquaVolt" className="h-12 w-auto mx-auto mb-8" />
                        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-300">
                            Ready to Manage<br />Your Utilities?
                        </h1>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto">
                            Download the official AquaVolt apps for Android and take control of your property management and energy usage.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 pt-8">
                        {/* Landlord Card */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center space-y-6 shadow-2xl"
                        >
                            <div className="p-5 bg-blue-500/10 rounded-3xl">
                                <Building2 className="w-12 h-12 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Landlord Edition</h3>
                                <p className="text-slate-400 text-sm">Monitor properties, view analytics, and manage tenant units from anywhere.</p>
                            </div>
                            <div className="flex-1 w-full space-y-3 py-4 text-left">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <CheckCircle2 size={14} className="text-emerald-500" /> Multi-property dashboard
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <CheckCircle2 size={14} className="text-emerald-500" /> Real-time meter monitoring
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <CheckCircle2 size={14} className="text-emerald-500" /> Automated billing logs
                                </div>
                            </div>
                            <a
                                href={appUrls.landlord}
                                download="AquaVolt_Landlord.apk"
                                className="w-full bg-[#1ECF49] hover:bg-[#1ab540] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#1ECF49]/20 no-underline"
                            >
                                <Download size={20} /> Download Landlord APK
                            </a>
                        </motion.div>

                        {/* Customer (Tenant) Card */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center space-y-6 shadow-2xl"
                        >
                            <div className="p-5 bg-emerald-500/10 rounded-3xl">
                                <Smartphone className="w-12 h-12 text-[#1ECF49]" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Customer Edition</h3>
                                <p className="text-slate-400 text-sm">Buy tokens instantly, track your daily energy usage, and get alerts.</p>
                            </div>
                            <div className="flex-1 w-full space-y-3 py-4 text-left">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <CheckCircle2 size={14} className="text-emerald-500" /> Instant M-Pesa top-ups
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <CheckCircle2 size={14} className="text-emerald-500" /> Usage history & trends
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <CheckCircle2 size={14} className="text-emerald-500" /> Low balance notifications
                                </div>
                            </div>
                            <a
                                href={appUrls.tenant}
                                download="AquaVolt_Tenant.apk"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 no-underline"
                            >
                                <Download size={20} /> Download Customer APK
                            </a>
                        </motion.div>
                    </div>

                    <div className="pt-12 flex items-center justify-center gap-8 opacity-50 grayscale">
                        <img src="/logowhite.png" alt="Trusted" className="h-6" />
                        <div className="h-6 w-px bg-white/20" />
                        <div className="flex items-center gap-2 text-sm">
                            <ShieldCheck size={18} /> Bank-Grade Security
                        </div>
                    </div>
                </motion.div>
            </div>

            <PublicFooter contactInfo={contactInfo} />
        </div>
    );
};

export default AppDownload;
