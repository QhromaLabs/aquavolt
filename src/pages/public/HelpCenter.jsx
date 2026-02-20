import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, MessageSquare, Phone, Zap, Smartphone, UserCheck, CreditCard } from 'lucide-react';
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

const HelpCenter = () => {
    const navigate = useNavigate();

    const faqs = [
        {
            q: "How do I buy utility tokens?",
            a: "Open the AquaVolt Tenant app, navigate to 'Buy Token', enter the amount, and follow the M-Pesa prompt. Your token will be generated instantly.",
            icon: Zap
        },
        {
            q: "How do I install the app?",
            a: "Go to the download section on our homepage or the /apps page, download the APK, and follow your phone's installation instructions.",
            icon: Smartphone
        },
        {
            q: "I am a landlord, how do I get started?",
            a: "Fill out the inquiry form in the download section. Our team will contact you to set up your account and hardware.",
            icon: UserCheck
        },
        {
            q: "My payment was successful but no token was generated.",
            a: "Please wait up to 5 minutes. If it still hasn't appeared, contact our WhatsApp support with your M-Pesa message details.",
            icon: CreditCard
        }
    ];

    return (
        <div className="min-h-screen bg-[#0F172A] text-white font-sans overflow-x-hidden pt-20">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-50" />
                <LightningEffect />
            </div>

            <PublicHeader />

            <div className="pt-20 pb-20 px-6 max-w-6xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-16"
                >
                    <div className="text-center space-y-4">
                        <div className="inline-flex p-3 rounded-2xl bg-[#1ECF49]/10 border border-[#1ECF49]/20">
                            <HelpCircle className="text-[#1ECF49] w-8 h-8" />
                        </div>
                        <h1 className="text-5xl font-bold">Help Center</h1>
                        <p className="text-slate-400 text-lg">Everything you need to know about AquaVolt.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {faqs.map((faq, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -5 }}
                                className="bg-slate-900/50 p-8 rounded-3xl border border-white/5 space-y-4"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-[#1ECF49]">
                                    <faq.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white">{faq.q}</h3>
                                <p className="text-slate-400 leading-relaxed">{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="bg-gradient-to-r from-blue-600/20 to-[#1ECF49]/20 p-12 rounded-[3rem] border border-white/10 text-center space-y-8">
                        <h2 className="text-3xl font-bold">Still need help?</h2>
                        <div className="flex flex-wrap justify-center gap-6">
                            <a href="https://wa.me/254115146212" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 px-8 py-4 rounded-full transition-all no-underline text-white">
                                <MessageSquare className="text-[#1ECF49]" /> WhatsApp Support
                            </a>
                            <a href="tel:254115146212" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 px-8 py-4 rounded-full transition-all no-underline text-white">
                                <Phone className="text-blue-400" /> +254 115 146 212
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>

            <PublicFooter />
        </div>
    );
};

export default HelpCenter;
