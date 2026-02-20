import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
                        <Zap className="text-blue-400 w-12 h-12 blur-[2px]" fill="currentColor" />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

const TermsOfService = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0F172A] text-white font-sans overflow-x-hidden pt-20">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-50" />
                <LightningEffect />
            </div>

            <PublicHeader />

            <div className="pt-20 pb-20 px-6 max-w-4xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                >
                    <div className="text-center space-y-4">
                        <div className="inline-flex p-3 rounded-2xl bg-[#1ECF49]/10 border border-[#1ECF49]/20">
                            <FileText className="text-[#1ECF49] w-8 h-8" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold">Terms of Service</h1>
                        <p className="text-slate-400">Last Updated: February 20, 2026</p>
                    </div>

                    <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-8 md:p-12 prose prose-invert max-w-none">
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-[#1ECF49]">1. Agreement to Terms</h2>
                            <p className="text-slate-300 leading-relaxed">
                                By accessing or using the AquaVolt platform, you agree to be bound by these Terms of Service. If you do not agree, please refrain from using our services.
                            </p>
                        </section>

                        <section className="space-y-6 mt-10">
                            <h2 className="text-2xl font-bold text-[#1ECF49]">2. Service Description</h2>
                            <p className="text-slate-300 leading-relaxed">
                                AquaVolt provides a digital interface for property utility management, including but not limited to automated meter reading, payment facilitation, and usage monitoring.
                            </p>
                        </section>

                        <section className="space-y-6 mt-10">
                            <h2 className="text-2xl font-bold text-[#1ECF49]">3. User Responsibilities</h2>
                            <p className="text-slate-300 leading-relaxed">
                                Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account. Tenants must ensure accurate payment of utility bills through the platform provided.
                            </p>
                        </section>

                        <section className="space-y-6 mt-10">
                            <h2 className="text-2xl font-bold text-[#1ECF49]">4. Payment & Refunds</h2>
                            <p className="text-slate-300 leading-relaxed">
                                All payments for utility tokens or services are final. Refund requests due to technical errors will be evaluated on a case-by-case basis by the property landlord or AquaVolt support.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>

            <PublicFooter />
        </div>
    );
};

export default TermsOfService;
