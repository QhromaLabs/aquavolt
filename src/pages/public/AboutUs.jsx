import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Target, Eye, Users, Globe2, ShieldCheck, Zap } from 'lucide-react';
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

const AboutUs = () => {
    const navigate = useNavigate();

    const stats = [
        { label: 'Active Users', value: '10K+', icon: Users },
        { label: 'Properties', value: '500+', icon: Building2 },
        { label: 'Reliability', value: '99.9%', icon: ShieldCheck }
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

            <div className="pt-20 pb-20 px-6 max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-20"
                >
                    <div className="text-center space-y-6 max-w-3xl mx-auto">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
                        >
                            <Globe2 className="text-[#1ECF49] w-8 h-8" />
                        </motion.div>
                        <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Empowering Properties through Innovation.
                        </h1>
                        <p className="text-xl text-slate-400 leading-relaxed">
                            AquaVolt is a flagship utility management platform by Qhroma Labs, designed to seal revenue leakages and simplify utility consumption in Nairobi and beyond.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="bg-slate-900/50 p-8 rounded-[2rem] border border-white/5 text-center space-y-4">
                                <stat.icon className="mx-auto text-[#1ECF49] w-8 h-8" />
                                <div className="text-4xl font-bold">{stat.value}</div>
                                <div className="text-slate-500 uppercase tracking-widest text-xs font-semibold">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-[#1ECF49] font-bold uppercase tracking-widest text-sm">
                                    <Target size={18} /> Our Mission
                                </div>
                                <h2 className="text-3xl font-bold text-white">Sealing leakages, maximizing efficiency.</h2>
                                <p className="text-slate-400 leading-relaxed">
                                    Our mission is to provide landlords and property managers with the most reliable, automated system for utility management. We eliminate the guesswork and friction in billing, ensuring that every unit consumed is accounted for and paid for.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-blue-400 font-bold uppercase tracking-widest text-sm">
                                    <Eye size={18} /> Our Vision
                                </div>
                                <h2 className="text-3xl font-bold text-white">The standard for utility management.</h2>
                                <p className="text-slate-400 leading-relaxed">
                                    We envision a future where property utilities are managed with zero human intervention, powered by smart IoT hardware and the seamless AquaVolt software stack.
                                </p>
                            </div>
                        </div>
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#1ECF49] to-blue-600 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative bg-slate-900 rounded-[3rem] p-1 border border-white/10 overflow-hidden">
                                <img src="/logowhite.png" alt="AquaVolt" className="w-full opacity-20 p-20 grayscale" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <PublicFooter />
        </div>
    );
};

export default AboutUs;
