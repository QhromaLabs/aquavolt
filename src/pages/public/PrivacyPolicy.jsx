import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap } from 'lucide-react';
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

const PrivacyPolicy = () => {
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
                            <Shield className="text-[#1ECF49] w-8 h-8" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
                        <p className="text-slate-400">Last Updated: February 20, 2026</p>
                    </div>

                    <div className="bg-slate-900/50 rounded-[2rem] border border-white/5 p-8 md:p-12 prose prose-invert max-w-none">
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-[#1ECF49]">1. Information We Collect</h2>
                            <p className="text-slate-300 leading-relaxed">
                                At AquaVolt, we collect information necessary to provide efficient utility management services. This includes personal identification (name, phone number, email), property details, and meter usage data.
                            </p>
                        </section>

                        <section className="space-y-6 mt-10">
                            <h2 className="text-2xl font-bold text-[#1ECF49]">2. How We Use Your Data</h2>
                            <div className="text-slate-300 leading-relaxed">
                                Your data is used exclusively for:
                                <ul className="list-disc pl-6 mt-4 space-y-2">
                                    <li>Automating utility billing and payment processing.</li>
                                    <li>Providing real-time usage analytics to tenants and landlords.</li>
                                    <li>Verifying tenancy and securing account access.</li>
                                    <li>Improving platform performance and security.</li>
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-6 mt-10">
                            <h2 className="text-2xl font-bold text-[#1ECF49]">3. Data Security</h2>
                            <p className="text-slate-300 leading-relaxed">
                                We implement industry-leading encryption and security protocols to protect your information. Your payment data (M-Pesa, etc.) is handled through secure, PCI-compliant gateways.
                            </p>
                        </section>

                        <section className="space-y-6 mt-10">
                            <h2 className="text-2xl font-bold text-[#1ECF49]">4. Your Rights</h2>
                            <p className="text-slate-300 leading-relaxed">
                                You have the right to access, correct, or request the deletion of your personal data stored on the AquaVolt platform. Contact our support team via WhatsApp for any data-related queries.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>

            <PublicFooter />
        </div>
    );
};

export default PrivacyPolicy;
